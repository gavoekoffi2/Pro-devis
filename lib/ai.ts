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
 *   OPENROUTER_MODEL         (défaut: google/gemini-2.5-flash-lite) — rédaction/structuration
 *   OPENROUTER_SEARCH_MODEL  (défaut: <model>:online)              — estimation de prix avec recherche web
 *
 * En environnement de test derrière proxy, définir HTTPS_PROXY/HTTP_PROXY.
 * En production Netlify normale, le fetch natif est utilisé sans proxy.
 */

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export function aiEnabled(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite";
const SEARCH_MODEL =
  process.env.OPENROUTER_SEARCH_MODEL || `${DEFAULT_MODEL}:online`;

type Msg = { role: "system" | "user" | "assistant"; content: string };

type FetchLike = typeof fetch;

let proxiedFetchPromise: Promise<FetchLike> | null = null;

function proxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy
  );
}

async function getFetch(): Promise<FetchLike> {
  const proxy = proxyUrl();
  if (!proxy) return fetch;

  proxiedFetchPromise ??= (async () => {
    // Runtime import volontaire : évite de forcer le chemin proxy dans le bundle Netlify.
    const undici = (await import("undici")) as typeof import("undici");
    const dispatcher = new undici.ProxyAgent(proxy);
    return ((input: Parameters<FetchLike>[0], init?: Parameters<FetchLike>[1]) =>
      undici.fetch(input as any, { ...(init as any), dispatcher }) as any) as FetchLike;
  })();

  return proxiedFetchPromise;
}

async function chat(
  messages: Msg[],
  opts: { model?: string; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("AI_DISABLED");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const request = await getFetch();
    const res = await request(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pro-devis.app",
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
  const normalizedEntries = Object.entries(obj).map(([key, value]) => ({
    key,
    normalizedKey: normalizeAiKey(key),
    value: Number(value),
  }));
  const out: Record<string, number> = {};
  for (const it of items) {
    const normalizedWanted = normalizeAiKey(it.key);
    const candidates = [
      obj[it.key],
      normalizedEntries.find((e) => e.normalizedKey === normalizedWanted)?.value,
      normalizedEntries.find(
        (e) =>
          e.normalizedKey.includes(normalizedWanted) ||
          normalizedWanted.includes(e.normalizedKey)
      )?.value,
    ];
    const v = candidates.map(Number).find((n) => Number.isFinite(n) && n > 0);
    if (v) out[it.key] = Math.round(v);
  }
  return out;
}

function normalizeAiKey(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}
