import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const TOKEN_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valide un jeton d'invitation et renvoie les infos d'affichage.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { company: { select: { name: true } } },
  });
  if (!invitation || invitation.acceptedAt) {
    return NextResponse.json(
      { error: "Cette invitation n'est plus valide." },
      { status: 404 }
    );
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Cette invitation a expiré." },
      { status: 410 }
    );
  }

  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    companyName: invitation.company.name,
  });
}

const joinSchema = z.object({
  token: z.string().regex(TOKEN_RE, "Lien invalide"),
  password: z
    .string()
    .min(12, "Mot de passe: minimum 12 caractères")
    .regex(/^(?=.*[A-Z])(?=.*\d)/, "Au moins 1 majuscule + 1 chiffre"),
});

// Accepte une invitation : crée le compte du collaborateur et le rattache.
export async function POST(req: Request) {
  const rl = rateLimit(`join:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.acceptedAt) {
    return NextResponse.json(
      { error: "Cette invitation n'est plus valide." },
      { status: 404 }
    );
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Cette invitation a expiré." },
      { status: 410 }
    );
  }

  const email = invitation.email.toLowerCase().trim();

  // Un compte existe déjà avec cet email : on ne l'écrase pas.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "Un compte existe déjà avec cet email. Connectez-vous avant d'accepter l'invitation.",
      },
      { status: 409 }
    );
  }

  // Crée le compte membre + marque l'invitation acceptée (transaction).
  const passwordHash = await hashPassword(password);
  const [userCreated] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email,
        passwordHash,
        companyId: invitation.companyId,
        companyRole: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await createSession(userCreated.id);
  return NextResponse.json({ ok: true });
}
