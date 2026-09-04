import { NextResponse } from "next/server";
import { z } from "zod";
import { aiEnabled, aiEstimatePrices } from "@/lib/ai";
import { getCompanyUser, guard, jsonError, readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  items: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(80),
        name: z.string().trim().min(1).max(120),
        unit: z.string().trim().max(30).default("pièce"),
      })
    )
    .min(1, "Aucun matériau fourni")
    .max(40, "40 matériaux au maximum par estimation."),
});

export async function POST(req: Request) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;
    if (!aiEnabled()) return jsonError("IA non configurée", 503);

    // L'estimation utilise un modèle avec recherche web : encore plus coûteux
    // que la rédaction, donc plafonné plus bas.
    const limited = rateLimit(`ai:prices:${user.id}:${clientIp(req)}`, {
      max: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Trop d'estimations. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Données invalides", 400);
    }

    try {
      const prices = await aiEstimatePrices(parsed.data.items, {
        city: user.company.city || undefined,
        currency: user.company.currency || "FCFA",
      });
      return NextResponse.json({ prices });
    } catch (e) {
      console.error("[ai/estimate-prices]", e);
      return jsonError("Service IA indisponible.", 502);
    }
  });
}
