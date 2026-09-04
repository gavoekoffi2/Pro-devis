import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/calc";
import { statusMeta, expiryDate, isExpired } from "@/lib/status";
import { QuoteActions } from "@/components/QuoteActions";
import { QuoteManage } from "@/components/QuoteManage";

export default async function QuoteDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePageUser();
  // Le cloisonnement est dans la requête : un identifiant deviné ne peut pas
  // ramener le devis d'une autre entreprise.
  const quote = await prisma.quote.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!quote) notFound();

  const company = user.company;
  const meta = statusMeta(quote);
  const expired = isExpired(quote);
  const validUntil = expiryDate(quote.createdAt, quote.validityDays);

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

      {expired && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          ⚠️ Ce devis a dépassé sa date de validité (
          {validUntil.toLocaleDateString("fr-FR")}). Dupliquez-le pour en
          proposer une version à jour au client.
        </div>
      )}

      <div className="card p-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">{quote.number}</h1>
            <p className="text-slate-500">
              {new Date(quote.createdAt).toLocaleDateString("fr-FR")} · valable
              jusqu'au {validUntil.toLocaleDateString("fr-FR")}
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

        {quote.acceptedAt && (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-800">
            ✅ Accepté en ligne le{" "}
            {new Date(quote.acceptedAt).toLocaleDateString("fr-FR")}
            {quote.signerName ? ` par ${quote.signerName}` : ""}
          </div>
        )}
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

      <QuoteManage
        id={quote.id}
        number={quote.number}
        isInvoice={quote.isInvoice}
        total={quote.total}
        amountPaid={quote.amountPaid}
        paymentStatus={quote.paymentStatus}
        currency={quote.currency}
        publicId={quote.publicId}
        shareMessage={shareText}
        clientName={quote.clientName}
        clientPhone={quote.clientPhone}
        companyName={company.name}
      />
    </div>
  );
}
