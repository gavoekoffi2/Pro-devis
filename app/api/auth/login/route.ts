import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSession,
  fakeVerifyPassword,
} from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { guard, jsonError, readJson } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  return guard(async () => {
    const ipLimit = rateLimit(`login:ip:${clientIp(req)}`, {
      max: 15,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipLimit.ok) return tooMany(ipLimit.retryAfterSec);

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError("Données invalides", 400);
    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    // Limite aussi par compte visé : sans cela, un attaquant réparti sur
    // plusieurs adresses IP dispose d'un nombre d'essais illimité sur un
    // même email.
    const emailLimit = rateLimit(`login:email:${email}`, {
      max: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!emailLimit.ok) return tooMany(emailLimit.retryAfterSec);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Comparaison factice : la réponse met le même temps que pour un
      // compte existant, sinon la durée révèle les emails inscrits.
      await fakeVerifyPassword(password);
      return jsonError("Email ou mot de passe incorrect.", 401);
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return jsonError("Email ou mot de passe incorrect.", 401);
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  });
}

function tooMany(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Trop de tentatives. Réessayez dans quelques minutes." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}
