import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCompanyUser, guard, jsonError, readJson, zodMessage } from "@/lib/api";
import { createQuoteWithNumber, checkPlanLimit } from "@/lib/quotes";
import { computeTotals } from "@/lib/calc";
import { linesSchema, normalizeLines, text } from "@/lib/quote-input";

const amount = z.coerce.number().catch(0).transform((n) => (Number.isFinite(n) ? Math.max(0, n) : 0));

const createSchema = z.object({
  clientId: z.string().max(60).optional().nullable(),
  saveClient: z.boolean().optional(),
  clientName: text(120),
  clientPhone: text(40),
  clientAddress: text(300),
  projectDescription: text(2000),
  siteAddress: text(300),
  tradeKey: text(60),
  workLabel: text(200),
  workTypeId: z.string().max(60).optional().nullable(),
  lines: linesSchema.default([]),
  discount: amount.optional(),
  taxRate: amount.optional(),
  paymentTerms: text(500),
  validityDays: z.coerce.number().optional(),
  notes: text(2000),
  specialInstructions: text(2000),
});

export async function GET() {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;
    const quotes = await prisma.quote.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json({ quotes });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;
    const company = user.company;
    const companyId = user.companyId;

    // Limite plan gratuit : 3 devis / mois civil
    const limitError = await checkPlanLimit(user.plan, companyId);
    if (limitError) return jsonError(limitError, 402, { code: "PLAN_LIMIT" });

    const parsed = createSchema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
    const body = parsed.data;

    const cleanLines = normalizeLines(body.lines);
    if (cleanLines.length === 0) {
      return jsonError("Le devis doit contenir au moins une ligne.", 400);
    }

    const effectiveTax = body.taxRate != null ? body.taxRate : company.taxRate;
    const totals = computeTotals(cleanLines, {
      discount: body.discount ?? 0,
      taxRate: effectiveTax,
    });

    // Lier un client existant, ou créer une fiche si demandé.
    let clientId: string | null = null;
    if (body.clientId) {
      const existing = await prisma.client.findFirst({
        where: { id: body.clientId, companyId },
        select: { id: true },
      });
      if (existing) clientId = existing.id;
    }
    if (!clientId && body.saveClient && body.clientName) {
      const client = await prisma.client.create({
        data: {
          companyId,
          name: body.clientName,
          phone: body.clientPhone,
          whatsapp: body.clientPhone,
          address: body.clientAddress,
        },
      });
      clientId = client.id;
    }

    // Le type de travail doit exister : sinon la clé étrangère échoue en base
    // avec une erreur Prisma brute (500) au lieu d'un message clair.
    let workTypeId: string | null = null;
    if (body.workTypeId) {
      const wt = await prisma.workType.findUnique({
        where: { id: body.workTypeId },
        select: { id: true },
      });
      workTypeId = wt?.id ?? null;
    }

    const quote = await createQuoteWithNumber(companyId, (number) =>
      prisma.quote.create({
        data: {
          number,
          companyId,
          clientId,
          clientName: body.clientName,
          clientPhone: body.clientPhone,
          clientAddress: body.clientAddress,
          projectDescription: body.projectDescription,
          siteAddress: body.siteAddress,
          tradeKey: body.tradeKey,
          workLabel: body.workLabel,
          workTypeId,
          status: "SENT",
          currency: company.currency,
          paymentTerms: body.paymentTerms ?? company.paymentTerms,
          validityDays: clampValidity(body.validityDays, company.validityDays),
          notes: body.notes,
          specialInstructions: body.specialInstructions,
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
  });
}

/** Validité bornée à 1…3650 jours (une date d'expiration absurde casse l'affichage). */
function clampValidity(value: number | undefined, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(3650, Math.round(n));
}
