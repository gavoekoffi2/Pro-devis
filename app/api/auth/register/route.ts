import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { guard, jsonError, readJson, zodMessage } from "@/lib/api";
import { hexColor } from "@/lib/validation";

const schema = z.object({
  email: z.string().trim().email("Email invalide").max(160),
  // 8 caractères minimum : 6 laisse passer des mots de passe cassables
  // hors ligne en quelques minutes.
  password: z.string().min(8, "Mot de passe trop court (min. 8 caractères)").max(200),
  companyName: z.string().trim().min(2, "Nom de l'entreprise requis").max(120),
  phone: z.string().trim().max(40).optional(),
  trade: z.string().trim().max(60).optional(),
  activity: z.string().trim().max(200).optional(),
  slogan: z.string().trim().max(160).optional(),
  brandColor: hexColor.optional(),
  city: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  return guard(async () => {
    const limited = rateLimit(`register:${clientIp(req)}`, {
      max: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);

    const { password, companyName, phone, trade, activity, slogan, brandColor, city } =
      parsed.data;
    const normalizedEmail = parsed.data.email.toLowerCase();

    const passwordHash = await hashPassword(password);

    let user;
    try {
      // Transaction : jamais d'entreprise orpheline si la création de
      // l'utilisateur échoue (email pris entre-temps, etc.).
      user = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: companyName,
            phone: phone || null,
            whatsapp: phone || null,
            primaryTrade: trade || null,
            activity: activity || null,
            slogan: slogan || null,
            brandColor: brandColor || "#1c6df5",
            city: city || "Lomé",
          },
        });
        return tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            companyId: company.id,
          },
        });
      });
    } catch (e) {
      // P2002 = email déjà pris. La contrainte unique est la seule source de
      // vérité : un pré-contrôle laissait passer deux inscriptions simultanées.
      if ((e as { code?: string })?.code === "P2002") {
        return jsonError("Un compte existe déjà avec cet email.", 409);
      }
      throw e;
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  });
}
