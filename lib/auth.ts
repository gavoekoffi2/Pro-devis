import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "pd_session";

let cachedSecret: Uint8Array | null = null;

/**
 * Résout le secret de signature JWT — évalué paresseusement (au premier usage,
 * pas à l'import) pour ne pas casser le build Next.js quand la variable n'est
 * pas encore disponible. En production, un secret fort est obligatoire.
 */
function getAuthSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;

  const secret = process.env.AUTH_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd) {
      throw new Error(
        "FATAL: AUTH_SECRET must be set in production. Set a strong 32+ character secret."
      );
    }
    console.warn(
      "⚠️  Using development-only AUTH_SECRET. Set AUTH_SECRET in .env for security."
    );
    cachedSecret = new TextEncoder().encode("dev-secret-insecure-do-not-use");
    return cachedSecret;
  }

  if (isProd && secret.length < 32) {
    throw new Error(
      "FATAL: AUTH_SECRET must be at least 32 characters for production security."
    );
  }

  cachedSecret = new TextEncoder().encode(secret);
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
    .sign(getAuthSecret());

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
    const { payload } = await jwtVerify(token, getAuthSecret());
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

/** Vrai si le rôle d'entreprise permet de gérer l'équipe (OWNER ou ADMIN). */
export function canManageTeam(companyRole: string): boolean {
  return companyRole === "OWNER" || companyRole === "ADMIN";
}
