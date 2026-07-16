/**
 * Moteur de calcul Pro Devis.
 *
 * À partir d'un type de travail (recette) et des dimensions saisies, calcule
 * les quantités de matériaux, la main-d'œuvre et le transport, puis les
 * lignes du devis. Entièrement piloté par les données (recette en BDD).
 */

export type RecipeComponent = {
  materialKey: string;
  metric: string; // unite | surface | surfaceSol | volume | perimetre | longueur
  coef: number;
  waste?: number;
};

export type WorkInput = {
  key: string;
  label: string;
  unit?: string;
  default?: number;
};

export type MaterialInfo = {
  key: string;
  name: string;
  unit: string;
  unitPrice: number;
  margin: number; // %
  kind: "MATERIAL" | "LABOR" | "TRANSPORT" | "OTHER";
};

export type ComputedLine = {
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  kind: "MATERIAL" | "LABOR" | "TRANSPORT" | "OTHER";
};

const DISCRETE_UNITS = new Set([
  "pièce",
  "sac",
  "barre",
  "tube",
  "pot",
  "forfait",
  "point",
]);

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

/** Calcule les métriques géométriques à partir des saisies. */
export function computeMetrics(values: Record<string, unknown>) {
  const n = num(values.nombre ?? values.points ?? 1) || 1;
  const L = num(values.longueur);
  const l = num(values.largeur);
  const H = num(values.hauteur);
  const E = num(values.epaisseur);
  const directSurface = num(values.surface);

  // Surface "verticale" (mur, fenêtre…) : L×H, sinon l×H, sinon surface directe
  const unitVerticalSurface =
    L > 0 && H > 0 ? L * H : l > 0 && H > 0 ? l * H : directSurface;
  // Surface "au sol" : L×l, sinon surface directe
  const unitFloorSurface = L > 0 && l > 0 ? L * l : directSurface;

  const heightOrThickness = H > 0 ? H : E > 0 ? E : 1;
  const widthOrOne = l > 0 ? l : 1;
  const unitVolume = L > 0 ? L * widthOrOne * heightOrThickness : 0;

  const unitPerimeter =
    L > 0 && H > 0
      ? 2 * (L + H)
      : L > 0 && l > 0
        ? 2 * (L + l)
        : L > 0
          ? L
          : 0;

  return {
    unite: n,
    surface: round2(unitVerticalSurface * n),
    surfaceSol: round2(unitFloorSurface * n),
    volume: round2(unitVolume * n),
    perimetre: round2(unitPerimeter * n),
    longueur: round2(L * n),
  } as Record<string, number>;
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

function roundQty(qty: number, unit: string) {
  return DISCRETE_UNITS.has(unit) ? Math.ceil(qty) : round2(qty);
}

/** Prix unitaire effectif (marge incluse). */
export function effectivePrice(m: MaterialInfo) {
  return Math.round(m.unitPrice * (1 + (m.margin || 0) / 100));
}

/**
 * Génère les lignes du devis pour un type de travail donné.
 * @param recipe   recette du type de travail
 * @param values   dimensions / quantités saisies
 * @param materials index des matériaux (par clé), prix entreprise déjà résolus
 */
export function computeLines(
  recipe: RecipeComponent[],
  values: Record<string, unknown>,
  materials: Record<string, MaterialInfo>
): ComputedLine[] {
  const metrics = computeMetrics(values);
  const lines: ComputedLine[] = [];

  for (const c of recipe) {
    const mat = materials[c.materialKey];
    if (!mat) continue; // matériau absent du catalogue : ignoré
    const base = metrics[c.metric] ?? 0;
    const raw = base * c.coef * (1 + (c.waste || 0));
    const quantity = roundQty(raw, mat.unit);
    if (quantity <= 0) continue;
    const unitPrice = effectivePrice(mat);
    lines.push({
      designation: mat.name,
      unit: mat.unit,
      quantity,
      unitPrice,
      total: Math.round(quantity * unitPrice),
      kind: mat.kind,
    });
  }
  return lines;
}

export type QuoteTotals = {
  subtotal: number; // matières + autres
  laborTotal: number;
  transport: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
};

/** Agrège les lignes en totaux, applique remise et TVA. */
export function computeTotals(
  lines: { total: number; kind: ComputedLine["kind"] }[],
  opts: { discount?: number; taxRate?: number } = {}
): QuoteTotals {
  let subtotal = 0;
  let laborTotal = 0;
  let transport = 0;

  for (const l of lines) {
    if (l.kind === "LABOR") laborTotal += l.total;
    else if (l.kind === "TRANSPORT") transport += l.total;
    else subtotal += l.total; // MATERIAL + OTHER
  }

  const discount = Math.max(0, opts.discount || 0);
  const taxRate = Math.max(0, opts.taxRate || 0);
  const baseHT = Math.max(0, subtotal + laborTotal + transport - discount);
  const taxAmount = Math.round((baseHT * taxRate) / 100);
  const total = baseHT + taxAmount;

  return {
    subtotal,
    laborTotal,
    transport,
    discount,
    taxRate,
    taxAmount,
    total,
  };
}

/** Formatage monétaire (FCFA par défaut). */
export function formatMoney(value: number, currency = "FCFA") {
  const n = Math.round(value || 0);
  // fr-FR utilise l'espace fine insécable (U+202F) comme séparateur de
  // milliers ; on la remplace par une espace classique pour un rendu fiable
  // sur toutes les polices (PDF, WhatsApp, impression).
  const formatted = n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ");
  return `${formatted} ${currency}`.trim();
}
