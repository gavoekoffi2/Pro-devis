/**
 * Définition centralisée des plans SaaS et de leurs limites.
 * Source unique de vérité : évite les divergences entre l'affichage (dashboard)
 * et l'application des règles (création de devis).
 */

export type PlanKey = "FREE" | "PRO" | "ENTERPRISE";

export const PLAN_LIMITS: Record<
  PlanKey,
  { monthlyQuotes: number | null; label: string }
> = {
  FREE: { monthlyQuotes: 3, label: "Gratuit" },
  PRO: { monthlyQuotes: null, label: "Pro" }, // null = illimité
  ENTERPRISE: { monthlyQuotes: null, label: "Entreprise" },
};

export const FREE_MONTHLY_LIMIT = PLAN_LIMITS.FREE.monthlyQuotes as number;

/** Retourne le nombre de devis restants ce mois, ou null si illimité. */
export function remainingQuotes(
  plan: PlanKey,
  usedThisMonth: number
): number | null {
  const limit = PLAN_LIMITS[plan]?.monthlyQuotes ?? null;
  if (limit == null) return null;
  return Math.max(0, limit - usedThisMonth);
}

/** Indique si l'entreprise peut encore créer un devis ce mois. */
export function canCreateQuote(plan: PlanKey, usedThisMonth: number): boolean {
  const remaining = remainingQuotes(plan, usedThisMonth);
  return remaining == null || remaining > 0;
}
