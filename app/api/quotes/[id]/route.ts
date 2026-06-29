import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { computeTotals, type ComputedLine } from "@/lib/calc";

async function ownedQuote(id: string, companyId: string) {
  const q = await prisma.quote.findUnique({ where: { id } });
  if (!q || q.companyId !== companyId) return null;
  return q;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const quote = await ownedQuote(id, user.companyId!);
  if (!quote) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  // Statut / facture
  if (
    body.status &&
    ["DRAFT", "SENT", "ACCEPTED", "REFUSED"].includes(body.status)
  ) {
    data.status = body.status;
  }
  if (typeof body.isInvoice === "boolean") data.isInvoice = body.isInvoice;

  // Suivi de paiement
  if (body.amountPaid != null) {
    const paid = Math.max(0, Number(body.amountPaid) || 0);
    data.amountPaid = paid;
    data.paymentStatus =
      paid <= 0 ? "UNPAID" : paid >= quote.total ? "PAID" : "PARTIAL";
  }

  // Présentation
  if (typeof body.templateId === "string") data.templateId = body.templateId;
  if (body.paperSize === "A4" || body.paperSize === "A5")
    data.paperSize = body.paperSize;

  // Textes éditables
  for (const f of [
    "clientName",
    "clientPhone",
    "siteAddress",
    "projectDescription",
    "workLabel",
    "specialInstructions",
    "paymentTerms",
    "notes",
  ] as const) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  if (body.validityDays != null) data.validityDays = Number(body.validityDays);

  // Lignes éditées → on remplace les items et recalcule les totaux
  let recompute = false;
  let cleanLines: (ComputedLine & { order: number; section: string | null })[] = [];
  if (Array.isArray(body.lines)) {
    recompute = true;
    cleanLines = (body.lines as any[])
      .map((l, i) => {
        const quantity = Number(l.quantity) || 0;
        const unitPrice = Number(l.unitPrice) || 0;
        return {
          designation: String(l.designation ?? "").slice(0, 200),
          unit: String(l.unit ?? "pièce"),
          quantity,
          unitPrice,
          total: Math.round(quantity * unitPrice),
          kind: (["MATERIAL", "LABOR", "TRANSPORT", "OTHER"].includes(l.kind)
            ? l.kind
            : "MATERIAL") as ComputedLine["kind"],
          section: l.section ? String(l.section).slice(0, 120) : null,
          order: i,
        };
      })
      .filter((l) => l.designation && l.quantity > 0);
  }

  if (recompute) {
    const taxRate =
      body.taxRate != null ? Number(body.taxRate) : quote.taxRate;
    const discount =
      body.discount != null ? Number(body.discount) : quote.discount;
    const totals = computeTotals(cleanLines, { discount, taxRate });
    Object.assign(data, totals);

    await prisma.$transaction([
      prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } }),
      prisma.quoteItem.createMany({
        data: cleanLines.map((l) => ({
          quoteId: quote.id,
          designation: l.designation,
          unit: l.unit,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.total,
          kind: l.kind,
          section: l.section,
          order: l.order,
        })),
      }),
      prisma.quote.update({ where: { id: quote.id }, data }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.quote.update({
    where: { id: quote.id },
    data,
  });
  return NextResponse.json({ ok: true, quote: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const quote = await ownedQuote(id, user.companyId!);
  if (!quote) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await prisma.quote.delete({ where: { id: quote.id } });
  return NextResponse.json({ ok: true });
}
