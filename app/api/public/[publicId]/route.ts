import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Acceptation / refus d'un devis par le client via le lien public (sans compte).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
  const quote = await prisma.quote.findUnique({
    where: { publicId },
  });
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const signerName = String(body.signerName ?? "").slice(0, 120) || null;

  if (action !== "accept" && action !== "refuse") {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }
  if (action === "accept" && !signerName) {
    return NextResponse.json(
      { error: "Veuillez indiquer votre nom pour accepter." },
      { status: 400 }
    );
  }

  await prisma.quote.update({
    where: { id: quote.id },
    data:
      action === "accept"
        ? { status: "ACCEPTED", acceptedAt: new Date(), signerName }
        : { status: "REFUSED", signerName },
  });

  return NextResponse.json({ ok: true });
}
