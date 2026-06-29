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

export default async function QuotesPage() {
  const user = await getCurrentUser();
  const quotes = await prisma.quote.findMany({
    where: { companyId: user!.companyId! },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes devis</h1>
        <Link href="/devis/nouveau" className="btn-accent">
          + Nouveau
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          Aucun devis. Créez votre premier devis dès maintenant.
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {quotes.map((q) => {
            const meta = STATUS_META[q.status];
            return (
              <Link
                key={q.id}
                href={`/devis/${q.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {q.clientName || "Client"}
                  </div>
                  <div className="text-sm text-slate-500 truncate">
                    {q.number} · {q.workLabel || q.tradeKey} ·{" "}
                    {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-bold">
                    {formatMoney(q.total, q.currency)}
                  </div>
                  <span className={`badge ${meta.cls}`}>{meta.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
