import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sanitizeText, sanitizeString, sanitizeHexColor } from "@/lib/sanitize";

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
      name: body.name ? sanitizeText(body.name) : undefined,
      logoUrl: body.logoUrl ? sanitizeString(body.logoUrl, 500) : undefined,
      headerImageUrl: body.headerImageUrl ? sanitizeString(body.headerImageUrl, 500) : undefined,
      activity: body.activity ? sanitizeText(body.activity) : undefined,
      slogan: body.slogan ? sanitizeText(body.slogan) : undefined,
      brandColor: body.brandColor ? sanitizeHexColor(body.brandColor) : undefined,
      headerStyle: body.headerStyle ? sanitizeString(body.headerStyle, 50) : undefined,
      isRegistered:
        typeof body.isRegistered === "boolean" ? body.isRegistered : undefined,
      nif: body.nif ? sanitizeString(body.nif, 50) : undefined,
      rccm: body.rccm ? sanitizeString(body.rccm, 50) : undefined,
      bankInfo: body.bankInfo ? sanitizeText(body.bankInfo) : undefined,
      signatureUrl: body.signatureUrl ? sanitizeString(body.signatureUrl, 500) : undefined,
      phone: body.phone ? sanitizeString(body.phone, 20) : undefined,
      whatsapp: body.whatsapp ? sanitizeString(body.whatsapp, 20) : undefined,
      email: body.email ? sanitizeString(body.email, 255) : undefined,
      address: body.address ? sanitizeText(body.address) : undefined,
      city: body.city ? sanitizeText(body.city) : undefined,
      primaryTrade: body.primaryTrade ? sanitizeString(body.primaryTrade, 50) : undefined,
      paymentTerms: body.paymentTerms ? sanitizeText(body.paymentTerms) : undefined,
      validityDays:
        body.validityDays != null ? Number(body.validityDays) : undefined,
      taxRate: body.taxRate != null ? Number(body.taxRate) : undefined,
      currency: body.currency ? sanitizeString(body.currency, 10) : undefined,
      footerNote: body.footerNote ? sanitizeText(body.footerNote) : undefined,
    },
  });
  return NextResponse.json({ company });
}
