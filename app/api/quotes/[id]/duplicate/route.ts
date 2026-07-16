import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createQuoteWithNumber, checkPlanLimit } from "@/lib/quotes";

// Duplique un devis existant (nouveau numéro, statut brouillon).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const companyId = user.companyId!;

  // La duplication crée un devis : même limite que la création.
  const limitError = await checkPlanLimit(user.plan, companyId);
  if (limitError) {
    return NextResponse.json(
      { error: limitError, code: "PLAN_LIMIT" },
      { status: 402 }
    );
  }

  const { id } = await params;
  const src = await prisma.quote.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!src || src.companyId !== companyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const copy = await createQuoteWithNumber(companyId, (number) =>
    prisma.quote.create({
      data: {
        number,
        companyId,
        clientId: src.clientId,
        clientName: src.clientName,
        clientPhone: src.clientPhone,
        clientAddress: src.clientAddress,
        projectDescription: src.projectDescription,
        siteAddress: src.siteAddress,
        tradeKey: src.tradeKey,
        workLabel: src.workLabel,
        workTypeId: src.workTypeId,
        status: "DRAFT",
        currency: src.currency,
        paymentTerms: src.paymentTerms,
        validityDays: src.validityDays,
        notes: src.notes,
        specialInstructions: src.specialInstructions,
        templateId: src.templateId,
        paperSize: src.paperSize,
        subtotal: src.subtotal,
        laborTotal: src.laborTotal,
        transport: src.transport,
        discount: src.discount,
        taxRate: src.taxRate,
        taxAmount: src.taxAmount,
        total: src.total,
        items: {
          create: src.items.map((i) => ({
            designation: i.designation,
            unit: i.unit,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.total,
            kind: i.kind,
            section: i.section,
            order: i.order,
          })),
        },
      },
    })
  );
  return NextResponse.json({ id: copy.id, number: copy.number });
}
