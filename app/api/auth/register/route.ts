import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,128}$/;

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(12, "Mot de passe: minimum 12 caractères")
    .regex(
      /^(?=.*[A-Z])(?=.*\d)/,
      "Mot de passe: au moins 1 majuscule + 1 chiffre requis"
    ),
  companyName: z.string().min(2, "Nom de l'entreprise requis").max(100),
  phone: z.string().optional(),
  trade: z.string().optional(),
  activity: z.string().optional(),
  slogan: z.string().optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur: format hexadécimal (#RRGGBB)")
    .optional(),
  city: z.string().optional(),
});

export async function POST(req: Request) {
  // Anti-spam de comptes : max 5 inscriptions / heure par IP.
  const rl = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 }
    );
  }

  const company = await prisma.company.create({
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

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      companyId: company.id,
    },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
