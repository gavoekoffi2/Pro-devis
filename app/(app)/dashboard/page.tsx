import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/calc";
import { FREE_MONTHLY_LIMIT } from "@/lib/plans";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Brouillon", cls: "bg-slate-100 text-slate-600" },
  SENT: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "Accepté", cls: "bg-green-100 text-green-700" },
  REFUSED: { label: "Refusé", cls: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const company = user!.company!;
  const companyId = company.id;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [quotes, totalAgg, accepted, refusedCount, pending, monthCount] =
    await Promise.all([
      prisma.quote.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.quote.aggregate({
        where: { companyId },
        _sum: { total: true },
        _count: true,
      }),
      prisma.quote.aggregate({
        where: { companyId, status: "ACCEPTED" },
        _sum: { total: true },
        _count: true,
      }),
      prisma.quote.count({ where: { companyId, status: "REFUSED" } }),
      prisma.quote.count({ where: { companyId, status: "SENT" } }),
      prisma.quote.count({
        where: { companyId, createdAt: { gte: startOfMonth } },
      }),
    ]);

  const cur = company.currency;

  // Taux d'acceptation : sur les devis effectivement tranchés (acceptés + refusés).
  const decided = accepted._count + refusedCount;
  const acceptanceRate =
    decided > 0 ? Math.round((accepted._count / decided) * 100) : null;

  const stats = [
    { label: "Devis créés", value: totalAgg._count, icon: "📄" },
    {
      label: "Chiffre gagné",
      value: formatMoney(accepted._sum.total ?? 0, cur),
      icon: "💰",
      hint: "Montant des devis acceptés",
    },
    {
      label: "Taux d'acceptation",
      value: acceptanceRate != null ? `${acceptanceRate}%` : "—",
      icon: "📈",
      hint: decided > 0 ? `${accepted._count}/${decided} tranchés` : undefined,
    },
    { label: "En attente", value: pending, icon: "⏳" },
  ];

  const isFree = user!.plan === "FREE";
  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - monthCount);
  const quotaPct = Math.min(100, (monthCount / FREE_MONTHLY_LIMIT) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bonjour 👋</h1>
          <p className="text-slate-500">{company.name}</p>
        </div>
        <Link href="/devis/nouveau" className="btn-accent">
          + Nouveau devis
        </Link>
      </div>

      {/* Quota plan gratuit */}
      {isFree && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Devis ce mois-ci
            </span>
            <span className="text-slate-500">
              {monthCount} / {FREE_MONTHLY_LIMIT} (plan gratuit)
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                remaining === 0 ? "bg-red-500" : "bg-brand-600"
              }`}
              style={{ width: `${quotaPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {remaining > 0
                ? `Il vous reste ${remaining} devis gratuit${remaining > 1 ? "s" : ""} ce mois-ci.`
                : "Limite atteinte. Passez au Pro pour des devis illimités."}
            </span>
            <Link
              href="/parametres"
              className="text-xs font-semibold text-brand-600"
            >
              Passer au Pro →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 text-xl font-bold">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
            {s.hint && (
              <div className="text-[11px] text-slate-400 mt-0.5">{s.hint}</div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold">Derniers devis</h2>
          <Link href="/devis" className="text-sm text-brand-600 font-medium">
            Tout voir
          </Link>
        </div>
        {quotes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>Aucun devis pour l'instant.</p>
            <Link href="/devis/nouveau" className="btn-primary mt-4">
              Créer mon premier devis
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {quotes.map((q) => {
              const meta = STATUS_META[q.status];
              return (
                <li key={q.id}>
                  <Link
                    href={`/devis/${q.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {q.clientName || "Client"} · {q.number}
                      </div>
                      <div className="text-sm text-slate-500 truncate">
                        {q.workLabel || q.tradeKey}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="font-semibold">
                        {formatMoney(q.total, q.currency)}
                      </div>
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
