"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  paymentTerms?: string | null;
  validityDays: number;
  taxRate: number;
  currency: string;
  footerNote?: string | null;
};

export function SettingsForm({
  company,
  email,
  plan,
}: {
  company: Company;
  email: string;
  plan: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(company);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof Company, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="card p-5 space-y-4">
        <h2 className="font-bold">Profil de l'entreprise</h2>
        <div>
          <label className="label">Nom de l'entreprise</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Logo (URL de l'image)</label>
          <input
            className="input"
            value={form.logoUrl ?? ""}
            onChange={(e) => set("logoUrl", e.target.value)}
            placeholder="https://…/logo.png"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Téléphone</label>
            <input
              className="input"
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input
              className="input"
              value={form.whatsapp ?? ""}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Ville</label>
            <input
              className="input"
              value={form.city ?? ""}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Adresse</label>
          <input
            className="input"
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-bold">Réglages des devis</h2>
        <div>
          <label className="label">Conditions de paiement par défaut</label>
          <input
            className="input"
            value={form.paymentTerms ?? ""}
            onChange={(e) => set("paymentTerms", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Validité (jours)</label>
            <input
              type="number"
              className="input"
              value={form.validityDays}
              onChange={(e) => set("validityDays", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">TVA (%)</label>
            <input
              type="number"
              className="input"
              value={form.taxRate}
              onChange={(e) => set("taxRate", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">Devise</label>
            <input
              className="input"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Mention de bas de page</label>
          <input
            className="input"
            value={form.footerNote ?? ""}
            onChange={(e) => set("footerNote", e.target.value)}
          />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold mb-2">Compte & abonnement</h2>
        <p className="text-sm text-slate-600">
          Email : <span className="font-medium">{email}</span>
        </p>
        <p className="text-sm text-slate-600">
          Plan actuel :{" "}
          <span className="badge bg-brand-100 text-brand-700">{plan}</span>
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Plan gratuit : 3 devis/mois. Passez au plan Pro pour des devis
          illimités (paiement Mobile Money / Flooz / TMoney bientôt disponible).
        </p>
      </div>

      <div className="sticky bottom-20 sm:bottom-4 flex justify-end gap-3">
        {saved && (
          <span className="self-center text-sm text-accent-600">
            ✓ Enregistré
          </span>
        )}
        <button className="btn-primary shadow-lg" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
