import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/calc";
import { PrintButton } from "@/components/PrintButton";

export default async function PrintQuote({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!quote || quote.companyId !== user.companyId) notFound();

  const company = user.company!;
  const cur = quote.currency;
  const docTitle = quote.isInvoice ? "FACTURE" : "DEVIS";

  const validUntil = new Date(quote.createdAt);
  validUntil.setDate(validUntil.getDate() + (quote.validityDays || 30));

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 print:p-0 print:bg-white">
      <div className="print-page mx-auto max-w-[800px] bg-white shadow-lg rounded-lg p-8 sm:p-10 print:shadow-none">
        {/* En-tête */}
        <div className="flex justify-between items-start gap-4 border-b-2 border-brand-600 pb-5">
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt="logo"
                className="h-16 w-16 object-contain rounded"
              />
            ) : (
              <div className="h-16 w-16 rounded bg-brand-600 text-white flex items-center justify-center text-2xl font-bold">
                {company.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="text-xl font-extrabold">{company.name}</div>
              <div className="text-xs text-slate-500 leading-relaxed">
                {company.address && <div>{company.address}</div>}
                {company.city && <div>{company.city}</div>}
                {company.phone && <div>Tél : {company.phone}</div>}
                {company.email && <div>{company.email}</div>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-brand-700">
              {docTitle}
            </div>
            <div className="text-sm font-semibold">{quote.number}</div>
            <div className="text-xs text-slate-500 mt-1">
              Date : {new Date(quote.createdAt).toLocaleDateString("fr-FR")}
            </div>
            <div className="text-xs text-slate-500">
              Valable jusqu'au {validUntil.toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>

        {/* Client & projet */}
        <div className="grid grid-cols-2 gap-6 mt-5 text-sm">
          <div>
            <div className="text-[11px] uppercase text-slate-400 font-semibold">
              Client
            </div>
            <div className="font-semibold">{quote.clientName || "—"}</div>
            {quote.clientPhone && <div>{quote.clientPhone}</div>}
            {quote.siteAddress && (
              <div className="text-slate-600">
                Chantier : {quote.siteAddress}
              </div>
            )}
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-400 font-semibold">
              Projet
            </div>
            <div className="font-medium">{quote.workLabel}</div>
            {quote.projectDescription && (
              <div className="text-slate-600">{quote.projectDescription}</div>
            )}
          </div>
        </div>

        {/* Tableau */}
        <table className="w-full mt-6 text-sm border-collapse">
          <thead>
            <tr className="bg-brand-600 text-white">
              <th className="text-left px-3 py-2 font-semibold">Désignation</th>
              <th className="text-center px-2 py-2 font-semibold">Unité</th>
              <th className="text-right px-2 py-2 font-semibold">Qté</th>
              <th className="text-right px-2 py-2 font-semibold">P.U.</th>
              <th className="text-right px-3 py-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((it, i) => (
              <tr
                key={it.id}
                className={i % 2 ? "bg-slate-50" : ""}
              >
                <td className="px-3 py-1.5 border-b border-slate-100">
                  {it.designation}
                </td>
                <td className="text-center px-2 py-1.5 border-b border-slate-100">
                  {it.unit}
                </td>
                <td className="text-right px-2 py-1.5 border-b border-slate-100">
                  {it.quantity}
                </td>
                <td className="text-right px-2 py-1.5 border-b border-slate-100">
                  {formatMoney(it.unitPrice, "")}
                </td>
                <td className="text-right px-3 py-1.5 border-b border-slate-100 font-medium">
                  {formatMoney(it.total, "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex justify-end mt-4">
          <div className="w-64 text-sm space-y-1">
            <Row label="Sous-total matières" value={formatMoney(quote.subtotal, cur)} />
            <Row label="Main-d'œuvre" value={formatMoney(quote.laborTotal, cur)} />
            <Row label="Transport" value={formatMoney(quote.transport, cur)} />
            {quote.discount > 0 && (
              <Row label="Remise" value={"- " + formatMoney(quote.discount, cur)} />
            )}
            {quote.taxAmount > 0 && (
              <Row
                label={`TVA (${quote.taxRate}%)`}
                value={formatMoney(quote.taxAmount, cur)}
              />
            )}
            <div className="flex justify-between border-t-2 border-brand-600 pt-2 mt-1 text-base font-extrabold text-brand-700">
              <span>TOTAL {quote.taxAmount > 0 ? "TTC" : ""}</span>
              <span>{formatMoney(quote.total, cur)}</span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="mt-8 grid grid-cols-2 gap-6 text-xs text-slate-600">
          <div>
            <div className="font-semibold text-slate-700 mb-1">
              Conditions de paiement
            </div>
            <p>{quote.paymentTerms || "À convenir."}</p>
            <p className="mt-2">
              Devis valable {quote.validityDays} jours.
            </p>
            {company.footerNote && <p className="mt-3 italic">{company.footerNote}</p>}
          </div>
          <div className="text-right">
            <div className="font-semibold text-slate-700 mb-1">
              Bon pour accord
            </div>
            <div className="mt-10 border-t border-slate-300 pt-1">
              Signature & cachet du client
            </div>
          </div>
        </div>
      </div>

      <PrintButton />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
