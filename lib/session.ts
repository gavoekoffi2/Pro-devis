/** Helpers de session pour les *pages* (Server Components). */
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./auth";

export type PageUser = CurrentUser & {
  companyId: string;
  company: NonNullable<CurrentUser["company"]>;
};

/**
 * Utilisateur connecté **et** rattaché à une entreprise.
 *
 * Remplace les `user!.company!` disséminés dans les pages : une entreprise
 * manquante provoquait un plantage du rendu serveur (page blanche 500) au
 * lieu d'une redirection propre.
 */
export async function requirePageUser(): Promise<PageUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.companyId || !user.company) redirect("/login");
  return user as PageUser;
}
