import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, canManageTeam } from "@/lib/auth";
import { canUseTeam, maxTeamMembers, type PlanKey } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";

// Liste les membres de l'entreprise + les invitations en attente.
export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!user.companyId) {
    return NextResponse.json({ error: "Aucune entreprise" }, { status: 400 });
  }

  const [members, invitations] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: user.companyId },
      select: { id: true, email: true, companyRole: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { companyId: user.companyId, acceptedAt: null },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    members,
    invitations,
    me: { id: user.id, companyRole: user.companyRole },
    canManage: canManageTeam(user.companyRole),
    plan: user.company?.plan,
  });
}

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

// Invite un collaborateur : crée une invitation et renvoie le lien à partager.
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const company = user.company;
  if (!company) {
    return NextResponse.json({ error: "Aucune entreprise" }, { status: 400 });
  }

  // Seuls OWNER/ADMIN peuvent inviter.
  if (!canManageTeam(user.companyRole)) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour inviter des collaborateurs." },
      { status: 403 }
    );
  }

  // Fonctionnalité réservée aux plans payants.
  if (!canUseTeam(company.plan as PlanKey)) {
    return NextResponse.json(
      {
        error:
          "L'accès multi-utilisateurs est réservé aux plans Pro et Entreprise.",
        code: "PLAN_LIMIT",
      },
      { status: 402 }
    );
  }

  // Limite de débit : évite le spam d'invitations.
  const rl = rateLimit(`invite:${company.id}`, 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop d'invitations envoyées. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }
  const email = parsed.data.email.toLowerCase().trim();
  const role = parsed.data.role;

  // Quota de membres selon le plan (membres actuels + invitations en attente).
  const [memberCount, pendingCount] = await Promise.all([
    prisma.user.count({ where: { companyId: company.id } }),
    prisma.invitation.count({
      where: { companyId: company.id, acceptedAt: null },
    }),
  ]);
  const max = maxTeamMembers(company.plan as PlanKey);
  if (memberCount + pendingCount >= max) {
    return NextResponse.json(
      {
        error: `Votre plan permet jusqu'à ${max} membres. Passez à un plan supérieur pour en ajouter davantage.`,
        code: "PLAN_LIMIT",
      },
      { status: 402 }
    );
  }

  // L'email est-il déjà membre de CETTE entreprise ?
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && existingUser.companyId === company.id) {
    return NextResponse.json(
      { error: "Cette personne fait déjà partie de votre équipe." },
      { status: 409 }
    );
  }

  // Remplace toute invitation en attente précédente pour cet email/entreprise.
  await prisma.invitation.deleteMany({
    where: { companyId: company.id, email, acceptedAt: null },
  });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
  await prisma.invitation.create({
    data: {
      email,
      token,
      role,
      companyId: company.id,
      invitedBy: user.id,
      expiresAt,
    },
  });

  return NextResponse.json({ ok: true, token });
}
