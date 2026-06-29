import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { aiEnabled, aiDraftQuote } from "@/lib/ai";

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
    return NextResponse.json(
      { error: "Service IA indisponible pour le moment.", detail: String(e?.message || e).slice(0, 120) },
      { status: 502 }
    );
  }
}
