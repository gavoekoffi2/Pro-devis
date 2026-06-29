import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/calc";

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

  const [quotes, totalAgg, accepted, pending] = await Promise.all([
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
    prisma.quote.count({ where: { companyId, status: "SENT" } }),
  ]);

  const cur = company.currency;
  const stats = [
    { label: "Devis créés", value: totalAgg._count, icon: "📄" },
    {
      label: "Montant total",
      value: formatMoney(totalAgg._sum.total ?? 0, cur),
      icon: "💰",
    },
    { label: "Acceptés", value: accepted._count, icon: "✅" },
    { label: "En attente", value: pending, icon: "⏳" },
  ];

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 text-xl font-bold">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
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
