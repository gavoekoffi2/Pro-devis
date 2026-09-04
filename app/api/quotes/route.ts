import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createQuoteWithNumber, checkPlanLimit } from "@/lib/quotes";
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
  const company = user.company;
  if (!company) {
    return NextResponse.json({ error: "Aucune entreprise" }, { status: 400 });
  }
  const companyId = company.id;

  // Limite plan gratuit : 3 devis / mois civil
  const limitError = await checkPlanLimit(user.plan, companyId);
  if (limitError) {
    return NextResponse.json(
      { error: limitError, code: "PLAN_LIMIT" },
      { status: 402 }
    );
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
    clientId: providedClientId,
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

  const cleanLines = (Array.isArray(lines) ? (lines as any[]) : [])
    .map((l, i) => ({
      designation: String(l.designation ?? "").slice(0, 200),
      unit: String(l.unit ?? "pièce").slice(0, 30),
      quantity: Math.max(0, Number(l.quantity) || 0),
      unitPrice: Math.max(0, Number(l.unitPrice) || 0),
      total: Math.round(
        Math.max(0, Number(l.quantity) || 0) * Math.max(0, Number(l.unitPrice) || 0)
      ),
      kind: (["MATERIAL", "LABOR", "TRANSPORT", "OTHER"].includes(l.kind)
        ? l.kind
        : "MATERIAL") as ComputedLine["kind"],
      section: l.section ? String(l.section).slice(0, 120) : null,
      order: i,
    }))
    .filter((l) => l.designation && l.quantity > 0);

  if (cleanLines.length === 0) {
    return NextResponse.json(
      { error: "Le devis doit contenir au moins une ligne." },
      { status: 400 }
    );
  }

  const effectiveTax = taxRate != null ? Number(taxRate) || 0 : company.taxRate;
  const totals = computeTotals(cleanLines, {
    discount: Number(discount) || 0,
    taxRate: effectiveTax,
  });

  // Lier un client existant, ou créer une fiche si demandé.
  let clientId: string | null = null;
  if (providedClientId) {
    const existing = await prisma.client.findUnique({
      where: { id: String(providedClientId) },
    });
    if (existing && existing.companyId === companyId) clientId = existing.id;
  }
  if (!clientId && saveClient && clientName) {
    const client = await prisma.client.create({
      data: {
        companyId,
        name: String(clientName).slice(0, 120),
        phone: clientPhone || null,
        whatsapp: clientPhone || null,
        address: clientAddress || null,
      },
    });
    clientId = client.id;
  }

  const quote = await createQuoteWithNumber(companyId, (number) =>
    prisma.quote.create({
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
        validityDays: Math.max(1, Number(validityDays) || company.validityDays),
        notes: notes || null,
        specialInstructions: specialInstructions || null,
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
    })
  );

  return NextResponse.json({ id: quote.id, number: quote.number });
}
