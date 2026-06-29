import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { nextQuoteNumber } from "@/lib/materials";
import { computeTotals, type ComputedLine } from "@/lib/calc";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const quotes = await prisma.quote.findMany({
    where: { companyId: user.companyId! },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ quotes });
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const company = user.company!;
  const companyId = company.id;

  // Limite plan gratuit : 3 devis / mois civil
  if (user.plan === "FREE") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const used = await prisma.quote.count({
      where: { companyId, createdAt: { gte: startOfMonth } },
    });
    if (used >= 3) {
      return NextResponse.json(
        {
          error:
            "Limite du plan gratuit atteinte (3 devis/mois). Passez au plan Pro pour des devis illimités.",
          code: "PLAN_LIMIT",
        },
        { status: 402 }
      );
    }
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const {
    clientName,
    clientPhone,
    clientAddress,
    saveClient,
    projectDescription,
    siteAddress,
    tradeKey,
    workLabel,
    workTypeId,
    lines = [],
    discount = 0,
    taxRate,
    paymentTerms,
    validityDays,
    notes,
    specialInstructions,
  } = body;

  const cleanLines: ComputedLine[] = (lines as any[])
    .map((l, i) => ({
      designation: String(l.designation ?? "").slice(0, 200),
      unit: String(l.unit ?? "pièce"),
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
      total: Math.round((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)),
      kind: (["MATERIAL", "LABOR", "TRANSPORT", "OTHER"].includes(l.kind)
        ? l.kind
        : "MATERIAL") as ComputedLine["kind"],
      order: i,
    }))
    .filter((l) => l.designation && l.quantity > 0);

  const effectiveTax = taxRate != null ? Number(taxRate) : company.taxRate;
  const totals = computeTotals(cleanLines, {
    discount: Number(discount) || 0,
    taxRate: effectiveTax,
  });

  // Lier / créer le client si demandé
  let clientId: string | null = null;
  if (saveClient && clientName) {
    const client = await prisma.client.create({
      data: {
        companyId,
        name: clientName,
        phone: clientPhone || null,
        whatsapp: clientPhone || null,
        address: clientAddress || null,
      },
    });
    clientId = client.id;
  }

  const number = await nextQuoteNumber(companyId);

  const quote = await prisma.quote.create({
    data: {
      number,
      companyId,
      clientId,
      clientName: clientName || null,
      clientPhone: clientPhone || null,
      clientAddress: clientAddress || null,
      projectDescription: projectDescription || null,
      siteAddress: siteAddress || null,
      tradeKey: tradeKey || null,
      workLabel: workLabel || null,
      workTypeId: workTypeId || null,
      status: "SENT",
      currency: company.currency,
      paymentTerms: paymentTerms ?? company.paymentTerms,
      validityDays: validityDays ?? company.validityDays,
      notes: notes || null,
      specialInstructions: specialInstructions || null,
      ...totals,
      items: {
        create: cleanLines.map((l) => ({
          designation: l.designation,
          unit: l.unit,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.total,
          kind: l.kind,
          order: (l as any).order ?? 0,
        })),
      },
    },
  });

  return NextResponse.json({ id: quote.id, number: quote.number });
}
