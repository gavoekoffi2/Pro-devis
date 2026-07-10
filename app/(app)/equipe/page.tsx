import Link from "next/link";
import { getCurrentUser, canManageTeam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseTeam, maxTeamMembers, type PlanKey } from "@/lib/plans";
import { TeamManager } from "@/components/TeamManager";

export default async function TeamPage() {
  const user = await getCurrentUser();
  const company = user!.company!;

  const [members, invitations] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: company.id },
      select: { id: true, email: true, companyRole: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { companyId: company.id, acceptedAt: null },
      select: { id: true, email: true, role: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const plan = company.plan as PlanKey;
  const teamEnabled = canUseTeam(plan);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Équipe</h1>
          <p className="text-slate-500 text-sm">
            Invitez vos collaborateurs à gérer les devis de {company.name}.
          </p>
        </div>
        <Link href="/parametres" className="text-sm text-slate-500">
          ← Paramètres
        </Link>
      </div>

      {!teamEnabled ? (
        <div className="card p-6 text-center space-y-3">
          <div className="text-3xl">👥</div>
          <h2 className="font-bold text-slate-900">
            Travaillez à plusieurs sur vos devis
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            L'accès multi-utilisateurs permet à vos employés de créer et suivre
            les devis avec vous. Cette fonctionnalité est incluse dans les plans
            Pro et Entreprise.
          </p>
          <Link href="/parametres" className="btn-primary inline-flex">
            Passer au Pro
          </Link>
        </div>
      ) : (
        <TeamManager
          initialMembers={members.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          }))}
          initialInvitations={invitations.map((i) => ({
            ...i,
            expiresAt: i.expiresAt.toISOString(),
          }))}
          me={{ id: user!.id, companyRole: user!.companyRole }}
          canManage={canManageTeam(user!.companyRole)}
          maxMembers={maxTeamMembers(plan)}
        />
      )}
    </div>
  );
}
