import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

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
