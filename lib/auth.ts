import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "pd_session";

// Évalué à la première utilisation (pas au chargement du module) pour ne pas
// casser `next build` quand la variable n'est fournie qu'au runtime.
let cachedSecret: Uint8Array | null = null;
function secret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) {
    cachedSecret = new TextEncoder().encode(s);
    return cachedSecret;
  }
  // En production, un secret fort est OBLIGATOIRE : on refuse de servir
  // des sessions signées avec un secret par défaut connu de tous.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET manquant ou trop court (min. 16 caractères). Définissez-le dans les variables d'environnement."
    );
  }
  cachedSecret = new TextEncoder().encode("dev-secret-change-me");
  return cachedSecret;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, "", { path: "/", maxAge: 0 });
}

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return (payload.uid as string) ?? null;
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

/** Comme getCurrentUser mais lève si non connecté (pour les API). */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
