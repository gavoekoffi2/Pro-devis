"use client";

import { useState } from "react";

/**
 * Partage WhatsApp en 1 clic.
 *
 * Au clic : s'assure qu'un lien public existe (le génère si besoin), compose un
 * message professionnel incluant le lien d'acceptation en ligne, puis ouvre
 * WhatsApp directement sur le numéro du client. Aucune étape manuelle.
 */
export function WhatsAppShare({
  quoteId,
  publicId: initialPublicId,
  clientName,
  clientPhone,
  companyName,
  quoteNumber,
  totalLabel,
  className = "btn-accent w-full",
  label = "📲 Envoyer sur WhatsApp",
}: {
  quoteId: string;
  publicId: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  companyName: string;
  quoteNumber: string;
  totalLabel: string;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildMessage(link: string | null) {
    const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
    const lines = [
      greeting,
      "",
      `Voici votre devis *${quoteNumber}* de *${companyName}*.`,
      `Montant total : *${totalLabel}*`,
    ];
    if (link) {
      lines.push(
        "",
        "👉 Consultez et validez votre devis en ligne :",
        link
      );
    }
    lines.push("", "Merci de votre confiance.");
    return lines.join("\n");
  }

  async function ensurePublicId(): Promise<string | null> {
    if (initialPublicId) return initialPublicId;
    try {
      const res = await fetch(`/api/quotes/${quoteId}/share`, { method: "POST" });
      if (!res.ok) return null;
      const d = await res.json();
      return d.publicId ?? null;
    } catch {
      return null;
    }
  }

  async function share() {
    setBusy(true);
    setError(null);

    const pid = await ensurePublicId();
    const link = pid
      ? `${window.location.origin}/d/${pid}`
      : null;

    const message = buildMessage(link);
    const number = (clientPhone || "").replace(/[^0-9]/g, "");
    // Avec numéro → conversation directe ; sinon → WhatsApp ouvre le sélecteur.
    const waLink = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    setBusy(false);
    window.open(waLink, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <button onClick={share} disabled={busy} className={className}>
        {busy ? "Préparation…" : label}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
