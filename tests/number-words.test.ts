import { test } from "node:test";
import assert from "node:assert/strict";
import { numberToFrenchWords, amountInWords } from "../lib/number-words";

test("unités et dizaines simples", () => {
  assert.equal(numberToFrenchWords(0), "zéro");
  assert.equal(numberToFrenchWords(7), "sept");
  assert.equal(numberToFrenchWords(16), "seize");
  assert.equal(numberToFrenchWords(21), "vingt et un");
  assert.equal(numberToFrenchWords(35), "trente-cinq");
});

test("septante et nonante à la française", () => {
  assert.equal(numberToFrenchWords(70), "soixante-dix");
  assert.equal(numberToFrenchWords(71), "soixante et onze");
  assert.equal(numberToFrenchWords(77), "soixante-dix-sept");
  assert.equal(numberToFrenchWords(80), "quatre-vingts");
  assert.equal(numberToFrenchWords(81), "quatre-vingt-un");
  assert.equal(numberToFrenchWords(90), "quatre-vingt-dix");
  assert.equal(numberToFrenchWords(91), "quatre-vingt-onze");
  assert.equal(numberToFrenchWords(99), "quatre-vingt-dix-neuf");
});

test("centaines : accord de « cent »", () => {
  assert.equal(numberToFrenchWords(100), "cent");
  assert.equal(numberToFrenchWords(200), "deux cents");
  assert.equal(numberToFrenchWords(201), "deux cent un");
  assert.equal(numberToFrenchWords(999), "neuf cent quatre-vingt-dix-neuf");
});

test("milliers : « mille » invariable et sans « un »", () => {
  assert.equal(numberToFrenchWords(1000), "mille");
  assert.equal(numberToFrenchWords(1500), "mille cinq cents");
  assert.equal(numberToFrenchWords(2000), "deux mille");
  assert.equal(numberToFrenchWords(200000), "deux cent mille");
});

test("millions et milliards", () => {
  assert.equal(numberToFrenchWords(1_000_000), "un million");
  assert.equal(numberToFrenchWords(2_000_000), "deux millions");
  assert.equal(numberToFrenchWords(1_000_000_000), "un milliard");
});

test("très grands nombres restent lisibles", () => {
  // Le compteur de milliards dépasse lui-même 999 : il doit être décrit
  // récursivement, pas produire « dix cents milliards ».
  assert.equal(numberToFrenchWords(1_000_000_000_000), "mille milliards");
});

test("montants arrondis et négatifs", () => {
  assert.equal(numberToFrenchWords(1500.4), "mille cinq cents");
  assert.equal(numberToFrenchWords(-42), "quarante-deux");
});

test("amountInWords ajoute la devise et une majuscule", () => {
  assert.equal(amountInWords(100000, "FCFA"), "Cent mille francs CFA");
  assert.equal(amountInWords(2, "EUR"), "Deux EUR");
});
