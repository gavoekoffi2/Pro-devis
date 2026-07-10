import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";

// Format UUID v4 attendu pour un publicId (généré par randomUUID()).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Acceptation / refus d'un devis par le client via le lien public (sans compte).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;

  // Valider le format avant de toucher la base : évite les requêtes inutiles.
  if (!UUID_RE.test(publicId)) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({
    where: { publicId },
  });
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  // Idempotence : un devis déjà tranché ne peut plus être re-basculé.
  if (quote.status === "ACCEPTED" || quote.status === "REFUSED") {
    return NextResponse.json(
      {
        error:
          quote.status === "ACCEPTED"
            ? "Ce devis a déjà été accepté."
            : "Ce devis a déjà été refusé.",
        status: quote.status,
      },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const signerName = sanitizeText(String(body.signerName ?? "")).slice(0, 120) || null;

  if (action !== "accept" && action !== "refuse") {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }
  if (action === "accept" && !signerName) {
    return NextResponse.json(
      { error: "Veuillez indiquer votre nom pour accepter." },
      { status: 400 }
    );
  }

  // Mise à jour conditionnelle : la clause `status` garantit qu'on ne bascule
  // que si le devis est toujours en attente (évite une course entre 2 clics).
  const result = await prisma.quote.updateMany({
    where: {
      id: quote.id,
      status: { in: ["DRAFT", "SENT"] },
    },
    data:
      action === "accept"
        ? { status: "ACCEPTED", acceptedAt: new Date(), signerName }
        : { status: "REFUSED", signerName },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Ce devis a déjà été traité." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
