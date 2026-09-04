import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCompanyUser, guard, jsonError, readJson, zodMessage } from "@/lib/api";
import { boundedText, hexColor, imageUrl } from "@/lib/validation";

const HEADER_STYLES = ["modern", "rounded", "square", "circle", "badge"] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Nom de l'entreprise requis").max(120).optional(),
  logoUrl: imageUrl.optional(),
  headerImageUrl: imageUrl.optional(),
  signatureUrl: imageUrl.optional(),
  activity: boundedText(200).optional(),
  slogan: boundedText(160).optional(),
  brandColor: hexColor.optional(),
  headerStyle: z.enum(HEADER_STYLES).optional(),
  isRegistered: z.boolean().optional(),
  nif: boundedText(60).optional(),
  rccm: boundedText(60).optional(),
  bankInfo: boundedText(300).optional(),
  phone: boundedText(40).optional(),
  whatsapp: boundedText(40).optional(),
  email: z.union([z.literal(""), z.string().trim().email("Email invalide").max(160)])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  address: boundedText(300).optional(),
  city: boundedText(120).optional(),
  primaryTrade: boundedText(60).optional(),
  paymentTerms: boundedText(500).optional(),
  footerNote: boundedText(300).optional(),
  // Bornes explicites : `Number(body.x)` produisait `NaN` sur une saisie
  // fantaisiste, et Prisma répondait par une erreur 500 illisible.
  validityDays: z.coerce.number().int().min(1).max(3650).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  currency: z.string().trim().min(1).max(10).optional(),
});

// Met à jour le profil de l'entreprise.
export async function PATCH(req: Request) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);

    // Seules les clés réellement transmises sont écrites : un champ absent
    // du formulaire ne doit jamais écraser la valeur existante.
    const data = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    );

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data,
    });
    return NextResponse.json({ company });
  });
}
