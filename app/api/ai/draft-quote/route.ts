import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { aiEnabled, aiDraftQuote } from "@/lib/ai";
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
  const rl = rateLimit(`ai-draft:${user.id}`, 15, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes IA. Patientez un instant." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const description = String(body.description ?? "").trim();
  if (description.length < 5) {
    return NextResponse.json(
      { error: "Décrivez le chantier (quelques mots minimum)." },
      { status: 400 }
    );
  }

  try {
    const lines = await aiDraftQuote(description, {
      trade: user.company?.primaryTrade || undefined,
      city: user.company?.city || undefined,
      currency: user.company?.currency || "FCFA",
    });
    if (!lines.length) {
      return NextResponse.json(
        { error: "L'IA n'a pas pu proposer de lignes. Reformulez la description." },
        { status: 422 }
      );
    }
    return NextResponse.json({ lines });
  } catch (e: any) {
    // On journalise le détail côté serveur, mais on ne l'expose jamais au client
    // (évite de divulguer l'infrastructure IA / des messages d'erreur internes).
    console.error("[ai/draft-quote] échec:", e?.message || e);
    return NextResponse.json(
      { error: "Service IA indisponible pour le moment." },
      { status: 502 }
    );
  }
}
