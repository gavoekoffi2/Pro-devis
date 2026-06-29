import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Met à jour le profil de l'entreprise.
export async function PATCH(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!user.companyId) {
    return NextResponse.json({ error: "Aucune entreprise" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));

  const company = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      name: body.name ?? undefined,
      logoUrl: body.logoUrl ?? undefined,
      phone: body.phone ?? undefined,
      whatsapp: body.whatsapp ?? undefined,
      email: body.email ?? undefined,
      address: body.address ?? undefined,
      city: body.city ?? undefined,
      primaryTrade: body.primaryTrade ?? undefined,
      paymentTerms: body.paymentTerms ?? undefined,
      validityDays:
        body.validityDays != null ? Number(body.validityDays) : undefined,
      taxRate: body.taxRate != null ? Number(body.taxRate) : undefined,
      currency: body.currency ?? undefined,
      footerNote: body.footerNote ?? undefined,
    },
  });
  return NextResponse.json({ company });
}
