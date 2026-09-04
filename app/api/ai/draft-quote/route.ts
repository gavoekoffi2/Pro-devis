import { NextResponse } from "next/server";
import { z } from "zod";
import { aiEnabled, aiDraftQuote } from "@/lib/ai";
import { getCompanyUser, guard, jsonError, readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  description: z
    .string()
    .trim()
    .min(5, "Décrivez le chantier (quelques mots minimum).")
    .max(4000, "Description trop longue (max. 4000 caractères)."),
});

export async function POST(req: Request) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;
    if (!aiEnabled()) return jsonError("IA non configurée", 503);

    // Chaque appel coûte des jetons chez le fournisseur : sans limite, un
    // compte compromis suffit à faire exploser la facture.
    const limited = rateLimit(`ai:draft:${user.id}:${clientIp(req)}`, {
      max: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Trop de générations. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Données invalides", 400);
    }

    try {
      const lines = await aiDraftQuote(parsed.data.description, {
        trade: user.company.primaryTrade || undefined,
        city: user.company.city || undefined,
        currency: user.company.currency || "FCFA",
      });
      if (!lines.length) {
        return jsonError(
          "L'IA n'a pas pu proposer de lignes. Reformulez la description.",
          422
        );
      }
      return NextResponse.json({ lines });
    } catch (e) {
      // La cause exacte (clé, quota, modèle) reste dans les logs serveur :
      // la renvoyer au client exposerait la configuration du fournisseur.
      console.error("[ai/draft-quote]", e);
      return jsonError("Service IA indisponible pour le moment.", 502);
    }
  });
}
