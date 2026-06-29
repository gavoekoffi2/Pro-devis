"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Monogram } from "@/components/Monogram";
import { BRAND_COLORS } from "@/lib/brand";

type Company = {
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  headerImageUrl?: string | null;
  activity?: string | null;
  slogan?: string | null;
  brandColor: string;
  headerStyle: string;
  isRegistered: boolean;
  nif?: string | null;
  rccm?: string | null;
  bankInfo?: string | null;
  signatureUrl?: string | null;
  paymentTerms?: string | null;
  validityDays: number;
  taxRate: number;
  currency: string;
  footerNote?: string | null;
};

const HEADER_STYLES = [
  { key: "modern", label: "Moderne" },
  { key: "rounded", label: "Arrondi" },
  { key: "square", label: "Carré" },
  { key: "circle", label: "Rond" },
  { key: "badge", label: "Badge" },
];

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
          <label className="label">Description courte de l'activité</label>
          <input
            className="input"
            value={form.activity ?? ""}
            onChange={(e) => set("activity", e.target.value)}
            placeholder="Construction, rénovation, dallage…"
          />
        </div>
        <div>
          <label className="label">Slogan</label>
          <input
            className="input"
            value={form.slogan ?? ""}
            onChange={(e) => set("slogan", e.target.value)}
            placeholder="Le bâti de confiance"
          />
        </div>

        {/* En-tête / logo */}
        <div className="rounded-2xl bg-slate-50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logoUrl}
                alt="logo"
                className="h-14 w-14 object-contain rounded-lg bg-white"
              />
            ) : (
              <Monogram
                name={form.name || "Pro"}
                color={form.brandColor}
                style={form.headerStyle}
                size={56}
              />
            )}
            <div className="text-xs text-slate-500">
              {form.logoUrl
                ? "Logo importé."
                : "Logo généré automatiquement à partir de votre nom et couleur."}
            </div>
          </div>

          <div>
            <label className="label">Logo (URL de l'image, optionnel)</label>
            <input
              className="input"
              value={form.logoUrl ?? ""}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder="https://…/logo.png"
            />
          </div>
          <div>
            <label className="label">
              En-tête déjà prêt à importer (URL d'image, optionnel)
            </label>
            <input
              className="input"
              value={form.headerImageUrl ?? ""}
              onChange={(e) => set("headerImageUrl", e.target.value)}
              placeholder="https://…/entete.png"
            />
          </div>
          <div>
            <label className="label">Couleur de marque</label>
            <div className="flex flex-wrap gap-2">
              {BRAND_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => set("brandColor", c.value)}
                  aria-label={c.name}
                  className={`h-8 w-8 rounded-full border-2 ${
                    form.brandColor === c.value
                      ? "border-slate-800 scale-110"
                      : "border-white shadow"
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Forme du logo généré</label>
            <div className="flex flex-wrap gap-2">
              {HEADER_STYLES.map((s) => (
                <button
                  type="button"
                  key={s.key}
                  onClick={() => set("headerStyle", s.key)}
                  className={`btn-sm rounded-lg border ${
                    form.headerStyle === s.key
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
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
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.isRegistered}
            onChange={(e) => set("isRegistered" as keyof Company, e.target.checked as any)}
          />
          <span>
            <span className="font-bold">J'ai une entreprise formalisée</span>
            <span className="block text-sm text-slate-500">
              Cochez seulement si vous avez un NIF / RCCM. Sinon, laissez décoché —
              vos devis resteront simples et professionnels, sans mentions
              fiscales.
            </span>
          </span>
        </label>

        {form.isRegistered && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">NIF (n° fiscal)</label>
              <input
                className="input"
                value={form.nif ?? ""}
                onChange={(e) => set("nif", e.target.value)}
              />
            </div>
            <div>
              <label className="label">RCCM</label>
              <input
                className="input"
                value={form.rccm ?? ""}
                onChange={(e) => set("rccm", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-bold">Réglages des devis</h2>
        <div>
          <label className="label">Coordonnées de paiement (Mobile Money / banque)</label>
          <input
            className="input"
            value={form.bankInfo ?? ""}
            onChange={(e) => set("bankInfo", e.target.value)}
            placeholder="Flooz / TMoney : +228 …"
          />
        </div>
        <div>
          <label className="label">Signature / cachet (URL d'image, optionnel)</label>
          <input
            className="input"
            value={form.signatureUrl ?? ""}
            onChange={(e) => set("signatureUrl", e.target.value)}
            placeholder="https://…/cachet.png"
          />
        </div>
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
