import { Monogram } from "@/components/Monogram";
import { contrastText, shade } from "@/lib/brand";
import { money, type QuoteView } from "@/lib/quote-view";

export function Logo({
  view,
  size = 64,
  styleOverride,
}: {
  view: QuoteView;
  size?: number;
  styleOverride?: string;
}) {
  const c = view.company;
  if (c.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={c.logoUrl}
        alt={`Logo ${c.name}`}
        style={{ width: size, height: size }}
        className="object-contain rounded-lg"
      />
    );
  }
  return (
    <Monogram
      name={c.name}
      color={c.brandColor}
      style={styleOverride || c.headerStyle}
      size={size}
    />
  );
}

export function Contacts({
  view,
  className = "",
}: {
  view: QuoteView;
  className?: string;
}) {
  const c = view.company;
  return (
    <div className={`leading-snug ${className}`}>
      {c.address && <div>{c.address}</div>}
      {c.city && <div>{c.city}</div>}
      {c.phone && <div>Tél : {c.phone}</div>}
      {c.whatsapp && c.whatsapp !== c.phone && <div>WhatsApp : {c.whatsapp}</div>}
      {c.email && <div>{c.email}</div>}
    </div>
  );
}

export function ItemsTable({
  view,
  headBg,
  headFg,
  stripe = "#f8fafc",
  border = "#e2e8f0",
  compact,
}: {
  view: QuoteView;
  headBg: string;
  headFg: string;
  stripe?: string;
  border?: string;
  compact?: boolean;
}) {
  const pad = compact ? "px-2 py-1" : "px-3 py-1.5";
  return (
    <table className="w-full border-collapse" style={{ fontSize: compact ? 10 : 12 }}>
      <thead>
        <tr style={{ background: headBg, color: headFg }}>
          <th className={`text-left ${pad} font-semibold`}>Désignation</th>
          <th className={`text-center ${pad} font-semibold`}>Unité</th>
          <th className={`text-right ${pad} font-semibold`}>Qté</th>
          <th className={`text-right ${pad} font-semibold`}>P.U.</th>
          <th className={`text-right ${pad} font-semibold`}>Total</th>
        </tr>
      </thead>
      <tbody>
        {view.items.map((it, i) => (
          <tr key={i} style={{ background: i % 2 ? stripe : "transparent" }}>
            <td className={pad} style={{ borderBottom: `1px solid ${border}` }}>
              {it.designation}
            </td>
            <td
              className={`text-center ${pad}`}
              style={{ borderBottom: `1px solid ${border}` }}
            >
              {it.unit}
            </td>
            <td
              className={`text-right ${pad}`}
              style={{ borderBottom: `1px solid ${border}` }}
            >
              {it.quantity}
            </td>
            <td
              className={`text-right ${pad}`}
              style={{ borderBottom: `1px solid ${border}` }}
            >
              {money(it.unitPrice, "")}
            </td>
            <td
              className={`text-right ${pad} font-medium`}
              style={{ borderBottom: `1px solid ${border}` }}
            >
              {money(it.total, "")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Totals({
  view,
  accent,
  compact,
}: {
  view: QuoteView;
  accent: string;
  compact?: boolean;
}) {
  const cur = view.currency;
  const fs = compact ? 11 : 13;
  return (
    <div className="flex justify-end" style={{ fontSize: fs }}>
      <div style={{ width: compact ? 200 : 256 }} className="space-y-1">
        <Row label="Sous-total matières" value={money(view.subtotal, cur)} />
        {view.laborTotal > 0 && (
          <Row label="Main-d'œuvre" value={money(view.laborTotal, cur)} />
        )}
        {view.transport > 0 && (
          <Row label="Transport" value={money(view.transport, cur)} />
        )}
        {view.discount > 0 && (
          <Row label="Remise" value={"- " + money(view.discount, cur)} />
        )}
        {view.taxAmount > 0 && (
          <Row label={`TVA (${view.taxRate}%)`} value={money(view.taxAmount, cur)} />
        )}
        <div
          className="flex justify-between pt-2 mt-1 font-extrabold"
          style={{
            borderTop: `2px solid ${accent}`,
            color: accent,
            fontSize: compact ? 13 : 16,
          }}
        >
          <span>TOTAL {view.taxAmount > 0 ? "TTC" : ""}</span>
          <span>{money(view.total, cur)}</span>
        </div>
      </div>
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

export function Conditions({
  view,
  accent,
  compact,
}: {
  view: QuoteView;
  accent: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-6 ${compact ? "mt-4" : "mt-8"}`}
      style={{ fontSize: compact ? 9 : 11, color: "#475569" }}
    >
      <div>
        {view.specialInstructions && (
          <div className="mb-3">
            <div className="font-semibold text-slate-700 mb-1">
              Instructions spéciales
            </div>
            <p className="whitespace-pre-wrap">{view.specialInstructions}</p>
          </div>
        )}
        <div className="font-semibold text-slate-700 mb-1">
          Conditions de paiement
        </div>
        <p>{view.paymentTerms || "À convenir."}</p>
        <p className="mt-1">Devis valable {view.validityDays} jours.</p>
        {view.company.footerNote && (
          <p className="mt-2 italic">{view.company.footerNote}</p>
        )}
      </div>
      <div className="text-right">
        <div className="font-semibold text-slate-700 mb-1">Bon pour accord</div>
        <div
          className="mt-8 pt-1 inline-block"
          style={{ borderTop: "1px solid #cbd5e1", minWidth: 140 }}
        >
          Signature & cachet du client
        </div>
      </div>
    </div>
  );
}

/** Si l'entreprise a importé un en-tête prêt, on l'utilise tel quel. */
export function ImportedHeader({ view }: { view: QuoteView }) {
  if (!view.company.headerImageUrl) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={view.company.headerImageUrl}
      alt="En-tête"
      className="w-full object-contain mb-4"
    />
  );
}

export { money, contrastText, shade };
