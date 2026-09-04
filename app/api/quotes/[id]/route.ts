import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCompanyUser, guard, jsonError, readJson, zodMessage } from "@/lib/api";
import { computeTotals } from "@/lib/calc";
import { linesSchema, normalizeLines } from "@/lib/quote-input";
import { TEMPLATES } from "@/lib/quote-view";

const TEMPLATE_IDS = TEMPLATES.map((t) => t.id) as [string, ...string[]];
const amount = z.coerce.number().refine(Number.isFinite).transform((n) => Math.max(0, n));
const editableText = z.coerce.string().transform((s) => s.slice(0, 2000));

const patchSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REFUSED"]).optional(),
  isInvoice: z.boolean().optional(),
  amountPaid: amount.optional(),
  // Un modèle inconnu retomberait sur "simple" à l'affichage : autant refuser
  // la valeur tout de suite plutôt que de stocker une donnée morte.
  templateId: z.enum(TEMPLATE_IDS).optional(),
  paperSize: z.enum(["A4", "A5"]).optional(),
  clientName: editableText.optional(),
  clientPhone: editableText.optional(),
  siteAddress: editableText.optional(),
  projectDescription: editableText.optional(),
  workLabel: editableText.optional(),
  specialInstructions: editableText.optional(),
  paymentTerms: editableText.optional(),
  notes: editableText.optional(),
  validityDays: z.coerce.number().optional(),
  lines: linesSchema.optional(),
  discount: amount.optional(),
  taxRate: amount.optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const { id } = await params;
    const quote = await prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!quote) return jsonError("Introuvable", 404);

    const parsed = patchSchema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
    const body = parsed.data;

    const data: Record<string, unknown> = {};

    if (body.status) data.status = body.status;
    if (body.isInvoice != null) data.isInvoice = body.isInvoice;
    if (body.templateId) data.templateId = body.templateId;
    if (body.paperSize) data.paperSize = body.paperSize;

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
      if (body[f] != null) data[f] = body[f];
    }
    if (body.validityDays != null) {
      const n = Math.round(body.validityDays);
      data.validityDays = Math.min(3650, Math.max(1, Number.isFinite(n) ? n : 30));
    }

    // Suivi de paiement (le total de référence dépend d'un éventuel recalcul).
    const recompute = body.lines != null;
    const cleanLines = recompute ? normalizeLines(body.lines!) : [];
    if (recompute && cleanLines.length === 0) {
      return jsonError("Le devis doit conserver au moins une ligne valide.", 400);
    }

    if (recompute) {
      const totals = computeTotals(cleanLines, {
        discount: body.discount ?? quote.discount,
        taxRate: body.taxRate ?? quote.taxRate,
      });
      Object.assign(data, totals);
      Object.assign(data, paymentFields(body.amountPaid ?? quote.amountPaid, totals.total));

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

    if (body.amountPaid != null) {
      Object.assign(data, paymentFields(body.amountPaid, quote.total));
    }

    const updated = await prisma.quote.update({ where: { id: quote.id }, data });
    return NextResponse.json({ ok: true, quote: updated });
  });
}

/** Montant encaissé + statut de paiement déduit du total en vigueur. */
function paymentFields(paid: number, total: number) {
  return {
    amountPaid: paid,
    paymentStatus: paid <= 0 ? "UNPAID" : paid >= total ? "PAID" : "PARTIAL",
  } as const;
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const { id } = await params;
    const quote = await prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true },
    });
    if (!quote) return jsonError("Introuvable", 404);

    await prisma.quote.delete({ where: { id: quote.id } });
    return NextResponse.json({ ok: true });
  });
}
