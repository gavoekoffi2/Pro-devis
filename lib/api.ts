/**
 * Petits utilitaires partagés par les routes API.
 *
 * Objectif : une gestion d'erreurs homogène (pas de 500 avec trace pour une
 * simple saisie invalide) et un cloisonnement par entreprise systématique.
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireCompanyUser, type CurrentUser } from "./auth";

export type CompanyUser = CurrentUser & {
  companyId: string;
  company: NonNullable<CurrentUser["company"]>;
};

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Résout l'utilisateur + son entreprise, ou renvoie la réponse d'erreur
 * adaptée (401 non connecté, 400 compte sans entreprise).
 */
export async function getCompanyUser(): Promise<
  { user: CompanyUser; error: null } | { user: null; error: NextResponse }
> {
  try {
    const user = await requireCompanyUser();
    return { user, error: null };
  } catch (e) {
    if ((e as Error)?.message === "NO_COMPANY") {
      return {
        user: null,
        error: jsonError(
          "Aucune entreprise rattachée à ce compte.",
          400
        ),
      };
    }
    return { user: null, error: jsonError("Non autorisé", 401) };
  }
}

/** Corps JSON de la requête, ou `null` si absent/illisible. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** Premier message d'erreur lisible d'un `ZodError`. */
export function zodMessage(error: ZodError): string {
  return error.errors[0]?.message ?? "Données invalides";
}

/**
 * Enveloppe une route : toute exception non prévue devient un 500 propre
 * (et reste tracée dans les logs serveur, jamais renvoyée au client).
 */
export async function guard(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (e) {
    console.error("[api]", e);
    return jsonError("Une erreur interne est survenue.", 500);
  }
}
