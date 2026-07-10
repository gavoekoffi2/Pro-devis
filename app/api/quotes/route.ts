import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { nextQuoteNumber } from "@/lib/materials";
import { computeTotals, type ComputedLine } from "@/lib/calc";
import { sanitizeText, sanitizeRichText, sanitizeString } from "@/lib/sanitize";
import { canCreateQuote, FREE_MONTHLY_LIMIT, type PlanKey } from "@/lib/plans";

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

  // Limite selon le plan (source unique : lib/plans.ts)
  {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const used = await prisma.quote.count({
      where: { companyId, createdAt: { gte: startOfMonth } },
    });
    if (!canCreateQuote(user.plan as PlanKey, used)) {
      return NextResponse.json(
        {
          error: `Limite du plan gratuit atteinte (${FREE_MONTHLY_LIMIT} devis/mois). Passez au plan Pro pour des devis illimités.`,
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

  const cleanLines = (lines as any[])
    .map((l, i) => ({
      designation: sanitizeText(String(l.designation ?? "")),
      unit: sanitizeString(String(l.unit ?? "pièce"), 50),
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
      total: Math.round((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)),
      kind: (["MATERIAL", "LABOR", "TRANSPORT", "OTHER"].includes(l.kind)
        ? l.kind
        : "MATERIAL") as ComputedLine["kind"],
      section: l.section ? sanitizeText(String(l.section)) : null,
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
      clientName: sanitizeText(clientName) || null,
      clientPhone: sanitizeString(clientPhone, 20) || null,
      clientAddress: sanitizeText(clientAddress) || null,
      projectDescription: sanitizeRichText(projectDescription) || null,
      siteAddress: sanitizeText(siteAddress) || null,
      tradeKey: sanitizeString(tradeKey, 50) || null,
      workLabel: sanitizeText(workLabel) || null,
      workTypeId: workTypeId || null,
      status: "SENT",
      currency: company.currency,
      paymentTerms: sanitizeRichText(paymentTerms ?? company.paymentTerms) || null,
      validityDays: validityDays ?? company.validityDays,
      notes: sanitizeRichText(notes) || null,
      specialInstructions: sanitizeRichText(specialInstructions) || null,
      publicId: randomUUID(),
      ...totals,
      items: {
        create: cleanLines.map((l) => ({
          designation: l.designation,
          unit: l.unit,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.total,
          kind: l.kind,
          section: l.section,
          order: l.order,
        })),
      },
    },
  });

  return NextResponse.json({ id: quote.id, number: quote.number });
}
