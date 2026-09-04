import { test } from "node:test";
import assert from "node:assert/strict";
import { initials, contrastText, shade } from "../lib/brand";

test("initials retire les formes juridiques", () => {
  assert.equal(initials("Ets Kossi Bâtiment"), "KB");
  assert.equal(initials("SARL Adjo"), "A");
  assert.equal(initials("Menuiserie Moderne"), "MM");
});

test("initials reste robuste sur les entrées vides", () => {
  assert.equal(initials(""), "P");
  assert.equal(initials("   "), "P");
  // Un nom entièrement composé de mots filtrés ne doit pas renvoyer "".
  assert.equal(initials("Ets"), "E");
});

test("contrastText choisit un texte lisible", () => {
  assert.equal(contrastText("#111111"), "#ffffff");
  assert.equal(contrastText("#ffffff"), "#0f172a");
});

test("shade éclaircit et assombrit sans sortir des bornes", () => {
  assert.equal(shade("#000000", -1), "#000000");
  assert.equal(shade("#ffffff", 1), "#ffffff");
  assert.match(shade("#1c6df5", -0.2), /^#[0-9a-f]{6}$/);
});

test("shade accepte les couleurs à 3 caractères", () => {
  assert.equal(shade("#fff", 0), "#ffffff");
});
