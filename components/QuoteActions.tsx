"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WhatsAppShare } from "./WhatsAppShare";

const STATUSES: { key: string; label: string }[] = [
  { key: "SENT", label: "En attente" },
  { key: "ACCEPTED", label: "Accepté" },
  { key: "REFUSED", label: "Refusé" },
];

export function QuoteActions({
  id,
  status,
  whatsapp,
  shareText,
  publicId,
  clientName,
  companyName,
  quoteNumber,
  totalLabel,
}: {
  id: string;
  status: string;
  whatsapp?: string | null;
  shareText: string;
  publicId: string | null;
  clientName?: string | null;
  companyName: string;
  quoteNumber: string;
  totalLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(status);

  async function setStatus(s: string) {
    setBusy(true);
    setCurrent(s);
    await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    setBusy(false);
    router.refresh();
  }

  async function duplicate() {
    setBusy(true);
    const res = await fetch(`/api/quotes/${id}/duplicate`, { method: "POST" });
    const d = await res.json();
    setBusy(false);
    if (res.ok) router.push(`/devis/${d.id}`);
  }

  async function remove() {
    if (!confirm("Supprimer ce devis ?")) return;
    setBusy(true);
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    router.push("/devis");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="text-sm font-medium text-slate-600">Statut du devis</div>
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              disabled={busy}
              onClick={() => setStatus(s.key)}
              className={`btn-sm rounded-lg border ${
                current === s.key
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action principale : envoyer au client sur WhatsApp, en 1 clic */}
      <WhatsAppShare
        quoteId={id}
        publicId={publicId}
        clientName={clientName}
        clientPhone={whatsapp}
        companyName={companyName}
        quoteNumber={quoteNumber}
        totalLabel={totalLabel}
        label="📲 Envoyer au client sur WhatsApp"
      />

      <a href={`/devis/${id}/apercu`} className="btn-primary w-full">
        🎨 Choisir un modèle & Imprimer
      </a>

      <div className="card p-4 grid grid-cols-2 gap-2">
        <a href={`/devis/${id}/imprimer`} target="_blank" className="btn-ghost">
          🖨️ Impression rapide
        </a>
        <button onClick={duplicate} disabled={busy} className="btn-ghost">
          📑 Dupliquer
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="btn-ghost !text-red-600 col-span-2"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
}
