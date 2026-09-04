import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCompanyUser, guard, jsonError } from "@/lib/api";

// Génère (si besoin) et renvoie l'identifiant public du devis pour partage.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const { id } = await params;
    const quote = await prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, publicId: true },
    });
    if (!quote) return jsonError("Introuvable", 404);

    let publicId = quote.publicId;
    if (!publicId) {
      publicId = randomUUID();
      await prisma.quote.update({ where: { id: quote.id }, data: { publicId } });
    }
    return NextResponse.json({ publicId });
  });
}
