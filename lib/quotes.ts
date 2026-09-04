import { prisma } from "./prisma";

/**
 * Génère le prochain numéro de devis : DEV-AAAA-NNNN.
 *
 * On repart du dernier numéro réellement attribué pour l'année en cours
 * (et non d'un simple comptage) : ainsi la suppression d'un devis ne
 * provoque jamais de numéro en double.
 */
export async function nextQuoteNumber(companyId: string) {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;
  // Les séquences sont zéro-paddées : l'ordre lexicographique = ordre numérique.
  const last = await prisma.quote.findFirst({
    where: { companyId, number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastSeq = last
    ? parseInt(last.number.slice(prefix.length), 10) || 0
    : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

/**
 * Crée un devis avec un numéro unique, en réessayant si deux créations
 * simultanées entrent en collision (contrainte unique companyId+number).
 */
export async function createQuoteWithNumber<T>(
  companyId: string,
  create: (number: string) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextQuoteNumber(companyId);
    try {
      return await create(number);
    } catch (e) {
      // P2002 = violation de contrainte unique → on régénère le numéro.
      if ((e as { code?: string })?.code === "P2002") {
        lastError = e;
        continue;
      }
      throw e;
    }
  }
  throw lastError ?? new Error("QUOTE_NUMBER_CONFLICT");
}

/** Nombre de devis créés ce mois-ci (limite du plan gratuit). */
export const FREE_PLAN_MONTHLY_QUOTES = 3;

export async function quotesUsedThisMonth(companyId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return prisma.quote.count({
    where: { companyId, createdAt: { gte: startOfMonth } },
  });
}

/**
 * Vérifie la limite du plan gratuit. Retourne un message d'erreur si la
 * limite est atteinte, sinon null.
 */
export async function checkPlanLimit(
  plan: string,
  companyId: string
): Promise<string | null> {
  if (plan !== "FREE") return null;
  const used = await quotesUsedThisMonth(companyId);
  if (used >= FREE_PLAN_MONTHLY_QUOTES) {
    return `Limite du plan gratuit atteinte (${FREE_PLAN_MONTHLY_QUOTES} devis/mois). Passez au plan Pro pour des devis illimités.`;
  }
  return null;
}
