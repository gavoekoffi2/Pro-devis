import { prisma } from "./prisma";
import type { MaterialInfo } from "./calc";

/**
 * Construit l'index des matériaux utilisables par une entreprise pour un
 * métier : les prix propres à l'entreprise écrasent ceux du catalogue global.
 */
export async function resolveMaterials(
  companyId: string | null,
  tradeId?: string
): Promise<Record<string, MaterialInfo>> {
  const globals = await prisma.material.findMany({
    where: { companyId: null, ...(tradeId ? { tradeId } : {}) },
  });
  const owned = companyId
    ? await prisma.material.findMany({
        where: { companyId, ...(tradeId ? { tradeId } : {}) },
      })
    : [];

  const index: Record<string, MaterialInfo> = {};
  for (const m of [...globals, ...owned]) {
    index[m.key] = {
      key: m.key,
      name: m.name,
      unit: m.unit,
      unitPrice: m.unitPrice,
      margin: m.margin,
      kind: m.kind,
    };
  }
  return index;
}

/** Génère le prochain numéro de devis : DEV-AAAA-NNNN. */
export async function nextQuoteNumber(companyId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({ where: { companyId } });
  const seq = String(count + 1).padStart(4, "0");
  return `DEV-${year}-${seq}`;
}
