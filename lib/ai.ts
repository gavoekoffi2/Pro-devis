/**
 * Couche d'intelligence artificielle de Pro Devis.
 *
 * Fournisseur : OpenRouter (https://openrouter.ai) — une seule clé donne accès
 * à de nombreux modèles (Gemini, Claude, GPT, modèles gratuits…) et à la
 * recherche web pour estimer les prix réels des matériaux.
 *
 * Activation : définir la variable d'environnement OPENROUTER_API_KEY.
 * Sans clé, les fonctionnalités IA sont simplement masquées (dégradation propre).
 *
 * Modèles (configurables) :
 *   OPENROUTER_MODEL         (défaut: google/gemini-2.0-flash-001) — rédaction/structuration
 *   OPENROUTER_SEARCH_MODEL  (défaut: <model>:online)             — estimation de prix avec recherche web
 */

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export function aiEnabled(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
const SEARCH_MODEL =
  process.env.OPENROUTER_SEARCH_MODEL || `${DEFAULT_MODEL}:online`;

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function chat(
  messages: Msg[],
  opts: { model?: string; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("AI_DISABLED");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pro-devis.app",
        "X-Title": "Pro Devis",
      },
      body: JSON.stringify({
        model: opts.model || DEFAULT_MODEL,
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1500,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`AI_HTTP_${res.status}:${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

/** Extrait le premier objet/tableau JSON d'une réponse (robuste au texte autour). */
function extractJson<T>(text: string): T {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error("AI_NO_JSON");
  // tente de parser à partir du premier crochet/accolade
  for (let end = cleaned.length; end > start; end--) {
    const slice = cleaned.slice(start, end);
    try {
      return JSON.parse(slice) as T;
    } catch {
      /* continue */
    }
  }
  throw new Error("AI_BAD_JSON");
}

export type AiLine = {
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  kind: "MATERIAL" | "LABOR" | "TRANSPORT" | "OTHER";
  section?: string;
};

/**
 * Génère un brouillon de devis à partir d'une description en langage naturel.
 * @param description ce que l'artisan veut chiffrer (texte libre)
 * @param ctx contexte entreprise (métier, ville, devise)
 */
export async function aiDraftQuote(
  description: string,
  ctx: { trade?: string; city?: string; currency?: string }
): Promise<AiLine[]> {
  const currency = ctx.currency || "FCFA";
  const system = `Tu es un expert métreur du bâtiment en Afrique de l'Ouest (Togo).
À partir de la description d'un chantier, tu produis les lignes détaillées d'un devis réaliste.
Règles:
- Réponds UNIQUEMENT en JSON: un tableau d'objets {"designation","unit","quantity","unitPrice","kind","section"}.
- "kind" ∈ "MATERIAL" | "LABOR" | "TRANSPORT" | "OTHER".
- "section" = nom du poste (ex: "Mur en parpaings", "Peinture").
- "unit" parmi: m², m³, ml, kg, sac, tonne, pièce, litre, forfait, point.
- "unitPrice" est un nombre entier en ${currency}, prix réalistes du marché togolais.
- Inclure la main-d'œuvre (kind LABOR) et le transport si pertinent.
- Quantités cohérentes avec les dimensions données, avec une marge de perte raisonnable.
- N'invente pas de texte hors JSON.`;
  const user = `Métier principal: ${ctx.trade || "bâtiment"}. Ville: ${ctx.city || "Lomé"}.
Description du chantier: """${description}"""`;

  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { maxTokens: 1800 }
  );
  const arr = extractJson<AiLine[]>(raw);
  if (!Array.isArray(arr)) throw new Error("AI_BAD_SHAPE");
  return arr
    .map((l) => ({
      designation: String(l.designation ?? "").slice(0, 200),
      unit: String(l.unit ?? "pièce"),
      quantity: Number(l.quantity) || 0,
      unitPrice: Math.max(0, Math.round(Number(l.unitPrice) || 0)),
      kind: (["MATERIAL", "LABOR", "TRANSPORT", "OTHER"].includes(l.kind as string)
        ? l.kind
        : "MATERIAL") as AiLine["kind"],
      section: l.section ? String(l.section).slice(0, 120) : undefined,
    }))
    .filter((l) => l.designation && l.quantity > 0);
}

/**
 * Estime le prix unitaire de matériaux via recherche web (marché local).
 * @returns map { key: prixEstimé }
 */
export async function aiEstimatePrices(
  items: { key: string; name: string; unit: string }[],
  ctx: { city?: string; currency?: string }
): Promise<Record<string, number>> {
  const currency = ctx.currency || "FCFA";
  const city = ctx.city || "Lomé, Togo";
  const list = items.map((i) => `- ${i.key}: ${i.name} (par ${i.unit})`).join("\n");
  const system = `Tu es un acheteur professionnel de matériaux de construction à ${city}.
Estime le prix unitaire actuel du marché pour chaque matériau, en ${currency}.
Utilise des sources récentes si disponibles. Réponds UNIQUEMENT en JSON:
un objet {"<key>": <prix_entier>} sans texte autour.`;
  const user = `Matériaux:\n${list}`;

  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { model: SEARCH_MODEL, maxTokens: 800 }
  );
  const obj = extractJson<Record<string, number>>(raw);
  const out: Record<string, number> = {};
  for (const it of items) {
    const v = Number((obj as any)[it.key]);
    if (Number.isFinite(v) && v > 0) out[it.key] = Math.round(v);
  }
  return out;
}
