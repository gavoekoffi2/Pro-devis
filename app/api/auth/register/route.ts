import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court (min. 6)"),
  companyName: z.string().min(2, "Nom de l'entreprise requis"),
  phone: z.string().optional(),
  trade: z.string().optional(),
  activity: z.string().optional(),
  slogan: z.string().optional(),
  brandColor: z.string().optional(),
  city: z.string().optional(),
});

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }
  const { email, password, companyName, phone, trade, activity, slogan, brandColor, city } =
    parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 }
    );
  }

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
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 }
      );
    }
    throw e;
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
