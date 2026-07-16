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
  if (typeof body.templateId === "string")
    data.templateId = body.templateId.slice(0, 40);
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
    if (typeof body[f] === "string") data[f] = body[f].slice(0, 2000);
  }
  if (body.validityDays != null) {
    data.validityDays = Math.max(1, Number(body.validityDays) || 30);
  }

  // Lignes éditées → on remplace les items et recalcule les totaux
  let recompute = false;
  let cleanLines: (ComputedLine & { order: number; section: string | null })[] = [];
  if (Array.isArray(body.lines)) {
    recompute = true;
    cleanLines = (body.lines as any[])
      .map((l, i) => {
        const quantity = Math.max(0, Number(l.quantity) || 0);
        const unitPrice = Math.max(0, Number(l.unitPrice) || 0);
        return {
          designation: String(l.designation ?? "").slice(0, 200),
          unit: String(l.unit ?? "pièce").slice(0, 30),
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
    if (cleanLines.length === 0) {
      return NextResponse.json(
        { error: "Le devis doit conserver au moins une ligne valide." },
        { status: 400 }
      );
    }
  }

  if (recompute) {
    const taxRate =
      body.taxRate != null ? Math.max(0, Number(body.taxRate) || 0) : quote.taxRate;
    const discount =
      body.discount != null ? Math.max(0, Number(body.discount) || 0) : quote.discount;
    const totals = computeTotals(cleanLines, { discount, taxRate });
    Object.assign(data, totals);

    // Le statut de paiement dépend du nouveau total.
    const paid =
      body.amountPaid != null
        ? Math.max(0, Number(body.amountPaid) || 0)
        : quote.amountPaid;
    data.amountPaid = paid;
    data.paymentStatus =
      paid <= 0 ? "UNPAID" : paid >= totals.total ? "PAID" : "PARTIAL";

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
