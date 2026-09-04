import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/calc";
import { statusMeta, expiryDate } from "@/lib/status";
import { FREE_PLAN_MONTHLY_QUOTES, quotesUsedThisMonth } from "@/lib/quotes";
import { FollowUpButton } from "@/components/FollowUpButton";

const DAY = 24 * 60 * 60 * 1000;
const FOLLOW_UP_AFTER_DAYS = 3;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const company = user!.company!;
  const companyId = company.id;
  const cur = company.currency;

  const followUpBefore = new Date(Date.now() - FOLLOW_UP_AFTER_DAYS * DAY);

  const [recent, accepted, refusedCount, pendingCount, paidAgg, usedThisMonth, toFollowUp, toCollect] =
    await Promise.all([
      prisma.quote.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.quote.aggregate({
        where: { companyId, status: "ACCEPTED" },
        _sum: { total: true },
        _count: true,
      }),
      prisma.quote.count({ where: { companyId, status: "REFUSED" } }),
      prisma.quote.count({ where: { companyId, status: "SENT" } }),
      prisma.quote.aggregate({
        where: { companyId },
        _sum: { amountPaid: true },
      }),
      quotesUsedThisMonth(companyId),
      // Devis envoyés il y a plus de N jours, sans réponse → à relancer.
      prisma.quote.findMany({
        where: {
          companyId,
          status: "SENT",
          createdAt: { lt: followUpBefore },
        },
        orderBy: { createdAt: "asc" },
        take: 5,
      }),
      // Travaux acceptés / factures avec un reste à payer → à encaisser.
      prisma.quote.findMany({
        where: {
          companyId,
          paymentStatus: { not: "PAID" },
          total: { gt: 0 },
          OR: [{ isInvoice: true }, { status: "ACCEPTED" }],
        },
        orderBy: { updatedAt: "asc" },
        take: 5,
      }),
    ]);

  const encaisse = paidAgg._sum.amountPaid ?? 0;
  const decided = accepted._count + refusedCount;
  const acceptRate =
    decided > 0 ? Math.round((accepted._count / decided) * 100) : null;

  const stats = [
    {
      label: "Montant accepté",
      value: formatMoney(accepted._sum.total ?? 0, cur),
      icon: "🤝",
    },
    { label: "Encaissé", value: formatMoney(encaisse, cur), icon: "💰" },
    {
      label: "Taux d'acceptation",
      value: acceptRate != null ? `${acceptRate} %` : "—",
      icon: "📈",
    },
    { label: "En attente", value: pendingCount, icon: "⏳" },
  ];

  const isFree = user!.plan === "FREE";

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

      {isFree && (
        <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-brand-800 flex items-center justify-between gap-3">
          <span>
            Plan gratuit : {Math.min(usedThisMonth, FREE_PLAN_MONTHLY_QUOTES)}/
            {FREE_PLAN_MONTHLY_QUOTES} devis utilisés ce mois-ci.
          </span>
          <Link href="/parametres" className="font-semibold whitespace-nowrap">
            Passer Pro →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 text-xl font-bold">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* À RELANCER — les devis sans réponse, c'est de l'argent qui dort. */}
      {toFollowUp.length > 0 && (
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="font-semibold">🔔 Devis à relancer</h2>
            <p className="text-xs text-slate-500">
              Sans réponse depuis plus de {FOLLOW_UP_AFTER_DAYS} jours. Un
              rappel poli multiplie vos chances de signer.
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {toFollowUp.map((q) => {
              const days = Math.floor(
                (Date.now() - new Date(q.createdAt).getTime()) / DAY
              );
              const expired = expiryDate(q.createdAt, q.validityDays) < new Date();
              const msg = `Bonjour${q.clientName ? ` ${q.clientName}` : ""}, avez-vous pu consulter le devis ${q.number} de ${company.name} d'un montant de ${formatMoney(q.total, q.currency)} ? Vous pouvez le consulter et l'accepter en ligne ici :`;
              return (
                <li
                  key={q.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <Link href={`/devis/${q.id}`} className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {q.clientName || "Client"} · {q.number}
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatMoney(q.total, q.currency)} · envoyé il y a {days} j
                      {expired && (
                        <span className="ml-2 badge bg-slate-200 text-slate-500">
                          Expiré
                        </span>
                      )}
                    </div>
                  </Link>
                  <FollowUpButton
                    phone={q.clientPhone}
                    message={msg}
                    publicId={q.publicId}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* À ENCAISSER — suivre l'argent, pas seulement les papiers. */}
      {toCollect.length > 0 && (
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="font-semibold">💵 Paiements à encaisser</h2>
            <p className="text-xs text-slate-500">
              Travaux acceptés ou facturés avec un reste à payer.
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {toCollect.map((q) => {
              const balance = Math.max(0, q.total - q.amountPaid);
              const msg = `Bonjour${q.clientName ? ` ${q.clientName}` : ""}, petit rappel concernant ${q.isInvoice ? "la facture" : "le devis accepté"} ${q.number} de ${company.name} : reste à payer ${formatMoney(balance, q.currency)}. Merci de votre confiance !`;
              return (
                <li
                  key={q.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <Link href={`/devis/${q.id}`} className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {q.clientName || "Client"} · {q.number}
                    </div>
                    <div className="text-sm text-slate-500">
                      Reste :{" "}
                      <span className="font-semibold text-slate-700">
                        {formatMoney(balance, q.currency)}
                      </span>
                      {q.amountPaid > 0 && (
                        <> · déjà reçu {formatMoney(q.amountPaid, q.currency)}</>
                      )}
                    </div>
                  </Link>
                  <FollowUpButton
                    phone={q.clientPhone}
                    message={msg}
                    label="📲 Rappeler"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold">Derniers devis</h2>
          <Link href="/devis" className="text-sm text-brand-600 font-medium">
            Tout voir
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>Aucun devis pour l'instant.</p>
            <Link href="/devis/nouveau" className="btn-primary mt-4">
              Créer mon premier devis
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((q) => {
              const meta = statusMeta(q);
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
