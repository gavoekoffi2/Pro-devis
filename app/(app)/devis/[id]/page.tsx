import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/calc";
import { QuoteActions } from "@/components/QuoteActions";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Brouillon", cls: "bg-slate-100 text-slate-600" },
  SENT: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "Accepté", cls: "bg-green-100 text-green-700" },
  REFUSED: { label: "Refusé", cls: "bg-red-100 text-red-700" },
};

export default async function QuoteDetail({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!quote || quote.companyId !== user!.companyId) notFound();

  const company = user!.company!;
  const meta = STATUS_META[quote.status];

  const shareText = `Bonjour, voici votre devis ${quote.number} de ${company.name} d'un montant de ${formatMoney(
    quote.total,
    quote.currency
  )}.`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/devis" className="text-sm text-slate-500">
          ← Mes devis
        </Link>
        <span className={`badge ${meta.cls}`}>{meta.label}</span>
      </div>

      <div className="card p-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">{quote.number}</h1>
            <p className="text-slate-500">
              {new Date(quote.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-brand-700">
              {formatMoney(quote.total, quote.currency)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400">Client</div>
            <div className="font-medium">{quote.clientName || "—"}</div>
            <div className="text-slate-500">{quote.clientPhone}</div>
            <div className="text-slate-500">{quote.siteAddress}</div>
          </div>
          <div>
            <div className="text-slate-400">Travaux</div>
            <div className="font-medium">{quote.workLabel || quote.tradeKey}</div>
            <div className="text-slate-500">{quote.projectDescription}</div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Désignation</th>
              <th className="text-right px-2 py-2 font-medium">Qté</th>
              <th className="text-right px-2 py-2 font-medium hidden sm:table-cell">
                P.U.
              </th>
              <th className="text-right px-4 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quote.items.map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-2">{it.designation}</td>
                <td className="text-right px-2 py-2 whitespace-nowrap">
                  {it.quantity} {it.unit}
                </td>
                <td className="text-right px-2 py-2 hidden sm:table-cell">
                  {formatMoney(it.unitPrice, "")}
                </td>
                <td className="text-right px-4 py-2 font-medium">
                  {formatMoney(it.total, "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <QuoteActions
        id={quote.id}
        status={quote.status}
        whatsapp={quote.clientPhone || company.whatsapp}
        shareText={shareText}
      />
    </div>
  );
}
