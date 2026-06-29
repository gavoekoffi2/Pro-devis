import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Génère (si besoin) et renvoie l'identifiant public du devis pour partage.
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
  const { id } = await params;
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote || quote.companyId !== user.companyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  let publicId = quote.publicId;
  if (!publicId) {
    publicId = randomUUID();
    await prisma.quote.update({
      where: { id: quote.id },
      data: { publicId },
    });
  }
  return NextResponse.json({ publicId });
}
