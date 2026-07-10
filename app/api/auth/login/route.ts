import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  // Anti brute-force : max 8 tentatives / 5 min par IP.
  const rl = rateLimit(`login:${clientIp(req)}`, 8, 5 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Anti-timing / anti-énumération : on exécute TOUJOURS une comparaison bcrypt,
  // même si l'utilisateur n'existe pas, pour que le temps de réponse ne révèle
  // pas l'existence d'un email. Le hash factice a le même coût qu'un vrai.
  const DUMMY_HASH =
    "$2a$10$C6UzMDM.H6dfI/f/IKcEeO3lJc5Y1Uu0j0Xh7Q0uKf7q1M8kD8pW";
  const valid = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_HASH
  );

  if (!user || !valid) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect." },
      { status: 401 }
    );
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
