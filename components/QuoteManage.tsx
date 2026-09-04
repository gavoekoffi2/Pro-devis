"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/calc";
import { PAY_META } from "@/lib/status";

export function QuoteManage({
  id,
  number,
  isInvoice,
  total,
  amountPaid,
  paymentStatus,
  currency,
  publicId,
  shareMessage,
  clientName,
  clientPhone,
  companyName,
}: {
  id: string;
  number: string;
  isInvoice: boolean;
  total: number;
  amountPaid: number;
  paymentStatus: string;
  currency: string;
  publicId: string | null;
  shareMessage: string;
  clientName?: string | null;
  clientPhone?: string | null;
  companyName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(amountPaid);
  // Le lien absolu dépend de window.location : on le calcule après montage
  // pour éviter tout écart serveur/client à l'hydratation.
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (publicId) setLink(`${window.location.origin}/d/${publicId}`);
  }, [publicId]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  async function getLink() {
    setBusy(true);
    const res = await fetch(`/api/quotes/${id}/share`, { method: "POST" });
    const d = await res.json();
    setBusy(false);
    if (res.ok) setLink(`${window.location.origin}/d/${d.publicId}`);
  }

  const balance = Math.max(0, total - paid);
  const meta = PAY_META[paymentStatus] ?? PAY_META.UNPAID;
  const waLink = link
    ? `https://wa.me/?text=${encodeURIComponent(shareMessage + " " + link)}`
    : "#";

  // Reçu de paiement à envoyer au client (preuve d'acompte / de solde).
  const receiptText = `🧾 REÇU DE PAIEMENT — ${companyName}
${isInvoice ? "Facture" : "Devis"} ${number}${clientName ? `\nClient : ${clientName}` : ""}
Montant reçu : ${formatMoney(amountPaid, currency)}
${balance > 0 ? `Reste à payer : ${formatMoney(balance, currency)}` : "Payé intégralement. Merci !"}
Date : ${new Date().toLocaleDateString("fr-FR")}`;
  const receiptNumber = (clientPhone || "").replace(/[^0-9]/g, "");
  const receiptLink = `https://wa.me/${receiptNumber}?text=${encodeURIComponent(receiptText)}`;

  return (
    <div className="space-y-4">
      {/* Facture & paiement */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">
            {isInvoice ? "Facture" : "Devis"} · paiement
          </div>
          <span className={`badge ${meta.cls}`}>{meta.label}</span>
        </div>

        {!isInvoice ? (
          <button
            onClick={() => patch({ isInvoice: true })}
            disabled={busy}
            className="btn-primary w-full"
          >
            🧾 Convertir en facture
          </button>
        ) : (
          <button
            onClick={() => patch({ isInvoice: false })}
            disabled={busy}
            className="btn-ghost w-full"
          >
            ↩︎ Repasser en devis
          </button>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label">Montant encaissé (acompte/total)</label>
            <input
              type="number"
              min={0}
              className="input"
              value={paid}
              onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
            />
          </div>
          <button
            onClick={() => patch({ amountPaid: paid })}
            disabled={busy}
            className="btn-accent"
          >
            Enregistrer
          </button>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Reste à payer</span>
          <span className="font-bold">{formatMoney(balance, currency)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setPaid(total);
              patch({ amountPaid: total });
            }}
            disabled={busy}
            className="btn-ghost btn-sm"
          >
            ✓ Marquer payé
          </button>
          <button
            onClick={() => {
              setPaid(0);
              patch({ amountPaid: 0 });
            }}
            disabled={busy}
            className="btn-ghost btn-sm"
          >
            Réinitialiser
          </button>
        </div>

        {amountPaid > 0 && (
          <a
            href={receiptLink}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full"
          >
            🧾 Envoyer le reçu de paiement (WhatsApp)
          </a>
        )}
      </div>

      {/* Lien client / acceptation en ligne */}
      <div className="card p-4 space-y-3">
        <div className="font-semibold">Lien client (acceptation en ligne)</div>
        {!link ? (
          <button onClick={getLink} disabled={busy} className="btn-primary w-full">
            🔗 Générer le lien à envoyer au client
          </button>
        ) : (
          <>
            <div className="flex gap-2">
              <input className="input text-xs" readOnly value={link} />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="btn-ghost btn-sm"
              >
                {copied ? "✓" : "Copier"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-accent">
                📲 Envoyer WhatsApp
              </a>
              <a href={link} target="_blank" rel="noreferrer" className="btn-ghost">
                👁️ Voir la page client
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              Le client peut consulter le devis et l'accepter en ligne, sans
              compte.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
