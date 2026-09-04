import { test } from "node:test";
import assert from "node:assert/strict";
import {
  expiryDate,
  isExpired,
  effectiveStatus,
  statusMeta,
  STATUS_META,
} from "../lib/status";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

test("expiryDate ajoute la durée de validité", () => {
  const created = new Date("2026-01-01T00:00:00Z");
  assert.equal(expiryDate(created, 30).toISOString().slice(0, 10), "2026-01-31");
});

test("expiryDate retombe sur 30 jours si la validité est absente", () => {
  const created = new Date("2026-01-01T00:00:00Z");
  assert.equal(expiryDate(created, 0).toISOString().slice(0, 10), "2026-01-31");
});

test("seul un devis en attente peut expirer", () => {
  const old = { createdAt: daysAgo(60), validityDays: 30 };
  assert.equal(isExpired({ ...old, status: "SENT" }), true);
  assert.equal(isExpired({ ...old, status: "ACCEPTED" }), false);
  assert.equal(isExpired({ ...old, status: "DRAFT" }), false);
  assert.equal(isExpired({ ...old, status: "REFUSED" }), false);
});

test("un devis récent n'est pas expiré", () => {
  assert.equal(
    isExpired({ status: "SENT", createdAt: daysAgo(5), validityDays: 30 }),
    false
  );
});

test("effectiveStatus bascule sur EXPIRED", () => {
  const q = { status: "SENT", createdAt: daysAgo(60), validityDays: 30 };
  assert.equal(effectiveStatus(q), "EXPIRED");
  assert.equal(statusMeta(q).label, "Expiré");
});

test("chaque statut a un badge avec une couleur", () => {
  for (const key of ["DRAFT", "SENT", "ACCEPTED", "REFUSED", "EXPIRED"]) {
    const meta = STATUS_META[key];
    assert.ok(meta, `statut ${key} sans métadonnées`);
    assert.match(meta.cls, /bg-\S+\s+text-\S+/, `classes incomplètes pour ${key}`);
  }
});
