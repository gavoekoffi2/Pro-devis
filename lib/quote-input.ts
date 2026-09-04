/**
 * Validation des données de devis reçues du client (création et édition).
 *
 * Toutes les bornes sont volontairement explicites : sans plafond sur le
 * nombre de lignes, une seule requête pourrait insérer des dizaines de
 * milliers d'items et saturer la base.
 */
import { z } from "zod";
import type { ComputedLine } from "./calc";

export const MAX_LINES = 300;
export const KINDS = ["MATERIAL", "LABOR", "TRANSPORT", "OTHER"] as const;

/** Nombre fini et positif ; toute valeur illisible retombe sur 0. */
const positiveNumber = z.coerce
  .number()
  .refine((n) => Number.isFinite(n), { message: "Nombre invalide" })
  .transform((n) => Math.max(0, n))
  .catch(0);

export const lineSchema = z.object({
  designation: z.coerce.string().transform((s) => s.trim().slice(0, 200)),
  unit: z.coerce
    .string()
    .transform((s) => s.trim().slice(0, 30) || "pièce")
    .catch("pièce"),
  quantity: positiveNumber,
  unitPrice: positiveNumber,
  kind: z.enum(KINDS).catch("MATERIAL"),
  section: z.coerce
    .string()
    .transform((s) => s.trim().slice(0, 120) || null)
    .nullable()
    .catch(null),
});

export const linesSchema = z.array(lineSchema).max(
  MAX_LINES,
  `Un devis est limité à ${MAX_LINES} lignes.`
);

export type CleanLine = ComputedLine & { order: number; section: string | null };

/**
 * Normalise les lignes : totaux recalculés côté serveur (jamais ceux envoyés
 * par le client) et lignes vides écartées.
 */
export function normalizeLines(lines: z.infer<typeof linesSchema>): CleanLine[] {
  return lines
    .map((l, i) => ({
      designation: l.designation,
      unit: l.unit,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      total: Math.round(l.quantity * l.unitPrice),
      kind: l.kind as ComputedLine["kind"],
      section: l.section,
      order: i,
    }))
    .filter((l) => l.designation.length > 0 && l.quantity > 0);
}

/** Texte libre borné, `null` si vide. */
export const text = (max: number) =>
  z.coerce
    .string()
    .transform((s) => s.trim().slice(0, max) || null)
    .nullable()
    .optional();
