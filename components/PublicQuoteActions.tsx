"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublicQuoteActions({
  publicId,
  status,
}: {
  publicId: string;
  status: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"ACCEPTED" | "REFUSED" | null>(null);

  if (status === "ACCEPTED" || done === "ACCEPTED") {
    return (
      <div className="no-print rounded-2xl bg-green-50 text-green-800 p-5 text-center">
        <div className="text-3xl">✅</div>
        <div className="font-bold mt-1">Devis accepté. Merci !</div>
        <p className="text-sm">L'artisan a été informé de votre accord.</p>
      </div>
    );
  }
  if (status === "REFUSED" || done === "REFUSED") {
    return (
      <div className="no-print rounded-2xl bg-slate-100 text-slate-600 p-5 text-center">
        Devis refusé. Vous pouvez contacter l'artisan pour en discuter.
      </div>
    );
  }

  async function respond(action: "accept" | "refuse") {
    setError("");
    if (action === "accept" && !name.trim()) {
      setError("Indiquez votre nom pour valider votre accord.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/public/${publicId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, signerName: name }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(action === "accept" ? "ACCEPTED" : "REFUSED");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Une erreur est survenue.");
    }
  }

  return (
    <div className="no-print rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="text-center">
        <div className="font-semibold text-slate-900">
          Vous validez ce devis ?
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Indiquez votre nom, puis validez votre accord. C'est simple, gratuit et
          sans engagement de compte.
        </p>
      </div>
      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}
      <input
        className="input"
        placeholder="Votre nom (pour signer votre accord)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        onClick={() => respond("accept")}
        disabled={busy}
        className="btn-accent w-full text-lg"
      >
        {busy ? "Validation…" : "✓ J'accepte ce devis"}
      </button>
      <button
        onClick={() => respond("refuse")}
        disabled={busy}
        className="w-full text-sm text-slate-400 hover:text-slate-600 py-1"
      >
        Je ne suis pas intéressé
      </button>
      <p className="text-center text-[11px] text-slate-400">
        🔒 Votre accord est horodaté et transmis directement à l'artisan.
      </p>
    </div>
  );
}
