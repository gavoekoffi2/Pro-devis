import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { aiEnabled, aiEstimatePrices } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!aiEnabled()) {
    return NextResponse.json({ error: "IA non configurée" }, { status: 503 });
  }

  // Anti-abus / maîtrise des coûts IA : max 15 requêtes / 10 min par utilisateur.
  const rl = rateLimit(`ai-price:${user.id}`, 15, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes IA. Patientez un instant." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  if (!items.length) {
    return NextResponse.json({ error: "Aucun matériau fourni" }, { status: 400 });
  }

  try {
    const prices = await aiEstimatePrices(
      items.map((i: any) => ({
        key: String(i.key),
        name: String(i.name),
        unit: String(i.unit || "pièce"),
      })),
      {
        city: user.company?.city || undefined,
        currency: user.company?.currency || "FCFA",
      }
    );
    return NextResponse.json({ prices });
  } catch (e: any) {
    console.error("[ai/estimate-prices] échec:", e?.message || e);
    return NextResponse.json(
      { error: "Service IA indisponible." },
      { status: 502 }
    );
  }
}
