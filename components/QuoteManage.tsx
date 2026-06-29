"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/calc";

const PAY_META: Record<string, { label: string; cls: string }> = {
  UNPAID: { label: "Impayé", cls: "bg-red-100 text-red-700" },
  PARTIAL: { label: "Acompte versé", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Payé", cls: "bg-green-100 text-green-700" },
};

export function QuoteManage({
  id,
  isInvoice,
  total,
  amountPaid,
  paymentStatus,
  currency,
  publicId,
  shareMessage,
}: {
  id: string;
  isInvoice: boolean;
  total: number;
  amountPaid: number;
  paymentStatus: string;
  currency: string;
  publicId: string | null;
  shareMessage: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(amountPaid);
  const [link, setLink] = useState<string | null>(
    publicId ? buildLink(publicId) : null
  );
  const [copied, setCopied] = useState(false);

  function buildLink(pid: string) {
    if (typeof window === "undefined") return `/d/${pid}`;
    return `${window.location.origin}/d/${pid}`;
  }

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
    if (res.ok) setLink(buildLink(d.publicId));
  }

  const balance = Math.max(0, total - paid);
  const meta = PAY_META[paymentStatus] ?? PAY_META.UNPAID;
  const waLink = link
    ? `https://wa.me/?text=${encodeURIComponent(shareMessage + " " + link)}`
    : "#";

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
