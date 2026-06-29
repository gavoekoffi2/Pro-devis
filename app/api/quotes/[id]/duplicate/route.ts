import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { nextQuoteNumber } from "@/lib/materials";

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
  const { id } = await params;
  const src = await prisma.quote.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!src || src.companyId !== companyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const number = await nextQuoteNumber(companyId);
  const copy = await prisma.quote.create({
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
          order: i.order,
        })),
      },
    },
  });
  return NextResponse.json({ id: copy.id, number: copy.number });
}
