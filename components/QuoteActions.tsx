"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
}: {
  id: string;
  status: string;
  whatsapp?: string | null;
  shareText: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState("");

  async function setStatus(s: string) {
    const previous = current;
    setBusy(true);
    setError("");
    setCurrent(s);
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      if (!res.ok) {
        // Le bouton passait au vert même quand l'appel échouait : on
        // rétablit l'état réel plutôt que d'afficher un statut faux.
        setCurrent(previous);
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Changement de statut impossible.");
        return;
      }
      router.refresh();
    } catch {
      setCurrent(previous);
      setError("Changement de statut impossible. Vérifiez votre connexion.");
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${id}/duplicate`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Duplication impossible.");
        return;
      }
      router.push(`/devis/${d.id}`);
    } catch {
      setError("Duplication impossible. Vérifiez votre connexion.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Supprimer ce devis ?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Suppression impossible.");
        return;
      }
      router.push("/devis");
      router.refresh();
    } catch {
      setError("Suppression impossible. Vérifiez votre connexion.");
    } finally {
      setBusy(false);
    }
  }

  const waNumber = (whatsapp || "").replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}
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

      <a href={`/devis/${id}/apercu`} className="btn-primary w-full">
        🎨 Choisir un modèle & Imprimer
      </a>

      <div className="card p-4 grid grid-cols-2 gap-2">
        <a href={`/devis/${id}/imprimer`} target="_blank" className="btn-ghost">
          🖨️ Impression rapide
        </a>
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="btn-accent"
        >
          📲 WhatsApp
        </a>
        <button onClick={duplicate} disabled={busy} className="btn-ghost">
          📑 Dupliquer
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="btn-ghost !text-red-600"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
}
