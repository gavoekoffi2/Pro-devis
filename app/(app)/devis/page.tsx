import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/calc";
import { statusMeta } from "@/lib/status";

const FILTERS = [
  { key: "", label: "Tous" },
  { key: "SENT", label: "En attente" },
  { key: "ACCEPTED", label: "Acceptés" },
  { key: "REFUSED", label: "Refusés" },
  { key: "INVOICE", label: "Factures" },
];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string; client?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const q = (params.q || "").trim();
  const f = params.f || "";
  const clientId = params.client || "";

  const where: any = { companyId: user!.companyId! };
  if (f === "INVOICE") where.isInvoice = true;
  else if (f) where.status = f;
  if (clientId) where.clientId = clientId;
  if (q) {
    where.OR = [
      { clientName: { contains: q, mode: "insensitive" } },
      { number: { contains: q, mode: "insensitive" } },
      { workLabel: { contains: q, mode: "insensitive" } },
      { siteAddress: { contains: q, mode: "insensitive" } },
    ];
  }

  const [quotes, filteredClient] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    clientId
      ? prisma.client.findFirst({
          where: { id: clientId, companyId: user!.companyId! },
        })
      : null,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes devis</h1>
        <Link href="/devis/nouveau" className="btn-accent">
          + Nouveau
        </Link>
      </div>

      {filteredClient && (
        <div className="flex items-center gap-2 text-sm">
          <span className="badge bg-brand-100 text-brand-700">
            Client : {filteredClient.name}
          </span>
          <Link href="/devis" className="text-slate-500 underline">
            Retirer le filtre
          </Link>
        </div>
      )}

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un client, un numéro…"
          className="input"
        />
        {f && <input type="hidden" name="f" value={f} />}
        {clientId && <input type="hidden" name="client" value={clientId} />}
        <button className="btn-ghost">🔍</button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((flt) => {
          const sp = new URLSearchParams();
          if (q) sp.set("q", q);
          if (clientId) sp.set("client", clientId);
          if (flt.key) sp.set("f", flt.key);
          const href = `/devis${sp.toString() ? `?${sp}` : ""}`;
          const active = f === flt.key;
          return (
            <Link
              key={flt.key}
              href={href}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm border ${
                active
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {flt.label}
            </Link>
          );
        })}
      </div>

      {quotes.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          {q ? "Aucun résultat." : "Aucun devis. Créez votre premier devis."}
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {quotes.map((qt) => {
            const meta = statusMeta(qt);
            return (
              <Link
                key={qt.id}
                href={`/devis/${qt.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate flex items-center gap-2">
                    {qt.clientName || "Client"}
                    {qt.isInvoice && (
                      <span className="badge bg-brand-100 text-brand-700 text-[10px]">
                        Facture
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 truncate">
                    {qt.number} · {qt.workLabel || qt.tradeKey} ·{" "}
                    {new Date(qt.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-bold">{formatMoney(qt.total, qt.currency)}</div>
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
