import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "pd_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 jours

// Secrets d'exemple / de démonstration : les refuser explicitement en
// production, sinon un déploiement qui copie `.env.example` tourne avec un
// secret public — n'importe qui peut alors forger une session.
const FORBIDDEN_SECRETS = new Set([
  "dev-secret-change-me",
  "change-me-in-production-please-use-a-long-random-string",
  "changeme",
  "secret",
]);

// Évalué à la première utilisation (pas au chargement du module) pour ne pas
// casser `next build` quand la variable n'est fournie qu'au runtime.
let cachedSecret: Uint8Array | null = null;
function secret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const s = process.env.AUTH_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (s && s.length >= 16 && !FORBIDDEN_SECRETS.has(s)) {
    cachedSecret = new TextEncoder().encode(s);
    return cachedSecret;
  }
  // En production, un secret fort est OBLIGATOIRE : on refuse de servir
  // des sessions signées avec un secret par défaut connu de tous.
  if (isProd) {
    throw new Error(
      "AUTH_SECRET manquant, trop court (min. 16 caractères) ou identique à la " +
        "valeur d'exemple. Générez-en un avec : openssl rand -base64 32"
    );
  }
  cachedSecret = new TextEncoder().encode("dev-secret-change-me");
  return cachedSecret;
}

/** Options communes au cookie de session (dépôt et suppression). */
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

/**
 * Compare le mot de passe fourni à un hash factice.
 *
 * Utilisé quand l'email est inconnu : sans cela, une réponse instantanée
 * révèle qu'aucun compte n'existe pour cet email (énumération de comptes).
 */
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8f0Z8pQ0Yl0kQ0X0lVbYVQ7q9J1jQe";
export async function fakeVerifyPassword(pw: string) {
  try {
    await bcrypt.compare(pw, DUMMY_HASH);
  } catch {
    /* le hash factice ne doit jamais faire échouer la requête */
  }
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, { ...cookieOptions(), maxAge: MAX_AGE_SEC });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const uid = payload.uid;
    return typeof uid === "string" && uid.length > 0 ? uid : null;
  } catch {
    return null;
  }
}

/** Retourne l'utilisateur courant + son entreprise, ou null. */
export async function getCurrentUser() {
  const uid = await getUserId();
  if (!uid) return null;
  return prisma.user.findUnique({
    where: { id: uid },
    include: { company: true },
  });
}

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

/** Comme getCurrentUser mais lève si non connecté (pour les API). */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/**
 * Utilisateur courant **rattaché à une entreprise**.
 *
 * Toutes les données métier (devis, clients, matériaux) sont cloisonnées par
 * `companyId`. Utiliser `user.companyId!` était dangereux : pour un compte sans
 * entreprise, `companyId` valait `null` — ce qui désigne le **catalogue global**
 * côté matériaux (lecture, écriture et suppression du référentiel partagé).
 * On exige donc explicitement une entreprise.
 */
export async function requireCompanyUser(): Promise<
  CurrentUser & { companyId: string; company: NonNullable<CurrentUser["company"]> }
> {
  const user = await requireUser();
  if (!user.companyId || !user.company) throw new Error("NO_COMPANY");
  return user as CurrentUser & {
    companyId: string;
    company: NonNullable<CurrentUser["company"]>;
  };
}
