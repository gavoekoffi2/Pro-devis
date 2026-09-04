import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { guard, jsonError, readJson } from "@/lib/api";
import { isExpired } from "@/lib/status";

const schema = z.object({
  action: z.enum(["accept", "refuse"], { errorMap: () => ({ message: "Action invalide" }) }),
  signerName: z.string().trim().max(120).optional().default(""),
});

// Acceptation / refus d'un devis par le client via le lien public (sans compte).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  return guard(async () => {
    const limited = rateLimit(`public:${clientIp(req)}`, {
      max: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const { publicId } = await params;
    const quote = await prisma.quote.findUnique({ where: { publicId } });
    if (!quote) return jsonError("Devis introuvable", 404);

    // Un devis déjà accepté (signé) est verrouillé : la décision ne peut plus
    // être modifiée depuis le lien public. Contactez l'artisan pour changer.
    if (quote.status === "ACCEPTED") {
      return jsonError("Ce devis a déjà été accepté.", 409);
    }

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError("Action invalide", 400);
    const { action } = parsed.data;
    const signerName = parsed.data.signerName || null;

    if (action === "accept" && !signerName) {
      return jsonError("Veuillez indiquer votre nom pour accepter.", 400);
    }
    // Un devis périmé annonce un prix qui n'engage plus l'artisan : on refuse
    // l'acceptation en ligne plutôt que de créer un accord sur un tarif obsolète.
    if (action === "accept" && isExpired(quote)) {
      return jsonError(
        "Ce devis a dépassé sa date de validité. Contactez l'artisan pour une version à jour.",
        409
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
  });
}
