import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeMetrics,
  computeLines,
  computeTotals,
  effectivePrice,
  formatMoney,
  type MaterialInfo,
} from "../lib/calc";

const mat = (over: Partial<MaterialInfo> = {}): MaterialInfo => ({
  key: "parpaing",
  name: "Parpaing 15x20x40",
  unit: "pièce",
  unitPrice: 350,
  margin: 0,
  kind: "MATERIAL",
  ...over,
});

test("computeMetrics : surface verticale = longueur × hauteur × nombre", () => {
  const m = computeMetrics({ longueur: 5, hauteur: 3, nombre: 2 });
  assert.equal(m.surface, 30);
  assert.equal(m.longueur, 10);
  assert.equal(m.perimetre, 32); // 2 × (5 + 3) × 2
});

test("computeMetrics : surface au sol = longueur × largeur", () => {
  const m = computeMetrics({ longueur: 4, largeur: 3 });
  assert.equal(m.surfaceSol, 12);
});

test("computeMetrics : `nombre` absent vaut 1, pas 0", () => {
  assert.equal(computeMetrics({ longueur: 2, hauteur: 2 }).surface, 4);
  assert.equal(computeMetrics({ longueur: 2, hauteur: 2, nombre: 0 }).surface, 4);
});

test("computeMetrics : volume utilise l'épaisseur quand il n'y a pas de hauteur", () => {
  const m = computeMetrics({ longueur: 10, largeur: 2, epaisseur: 0.1 });
  assert.equal(m.volume, 2);
});

test("effectivePrice applique la marge en pourcentage", () => {
  assert.equal(effectivePrice(mat({ unitPrice: 1000, margin: 20 })), 1200);
  assert.equal(effectivePrice(mat({ unitPrice: 1000, margin: 0 })), 1000);
});

test("computeLines : quantités arrondies au supérieur pour les unités indivisibles", () => {
  const lines = computeLines(
    [{ materialKey: "parpaing", metric: "surface", coef: 12.5, waste: 0.05 }],
    { longueur: 1, hauteur: 1 },
    { parpaing: mat() }
  );
  assert.equal(lines.length, 1);
  // 1 m² × 12,5 × 1,05 = 13,125 → 14 parpaings (on n'achète pas un demi-parpaing)
  assert.equal(lines[0].quantity, 14);
  assert.equal(lines[0].total, 14 * 350);
});

test("computeLines : matériau absent du catalogue ignoré, pas de plantage", () => {
  const lines = computeLines(
    [{ materialKey: "inconnu", metric: "surface", coef: 1 }],
    { longueur: 2, hauteur: 2 },
    { parpaing: mat() }
  );
  assert.deepEqual(lines, []);
});

test("computeLines : quantité nulle → aucune ligne", () => {
  const lines = computeLines(
    [{ materialKey: "parpaing", metric: "surface", coef: 1 }],
    {},
    { parpaing: mat() }
  );
  assert.deepEqual(lines, []);
});

test("computeTotals ventile matières, main-d'œuvre et transport", () => {
  const t = computeTotals([
    { total: 1000, kind: "MATERIAL" },
    { total: 500, kind: "OTHER" },
    { total: 2000, kind: "LABOR" },
    { total: 300, kind: "TRANSPORT" },
  ]);
  assert.equal(t.subtotal, 1500); // MATERIAL + OTHER
  assert.equal(t.laborTotal, 2000);
  assert.equal(t.transport, 300);
  assert.equal(t.total, 3800);
});

test("computeTotals : la TVA s'applique après la remise", () => {
  const t = computeTotals([{ total: 10000, kind: "MATERIAL" }], {
    discount: 2000,
    taxRate: 18,
  });
  assert.equal(t.taxAmount, 1440); // 8000 × 18 %
  assert.equal(t.total, 9440);
});

test("computeTotals : une remise supérieure au sous-total ne rend jamais un total négatif", () => {
  const t = computeTotals([{ total: 1000, kind: "MATERIAL" }], {
    discount: 5000,
    taxRate: 18,
  });
  assert.equal(t.total, 0);
  assert.equal(t.taxAmount, 0);
});

test("computeTotals ignore une TVA ou une remise négatives", () => {
  const t = computeTotals([{ total: 1000, kind: "MATERIAL" }], {
    discount: -500,
    taxRate: -10,
  });
  assert.equal(t.total, 1000);
});

test("formatMoney : séparateur de milliers en espace simple (rendu PDF/WhatsApp)", () => {
  const s = formatMoney(1234567, "FCFA");
  assert.equal(s, "1 234 567 FCFA");
  assert.ok(!/[  ]/.test(s), "aucune espace insécable ne doit subsister");
  assert.equal(formatMoney(1000, ""), "1 000");
});
