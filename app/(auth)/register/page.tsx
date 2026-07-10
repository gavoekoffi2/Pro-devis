"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Monogram } from "@/components/Monogram";
import { BRAND_COLORS } from "@/lib/brand";

function PwHint({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={ok ? "text-green-600" : "text-slate-400"}>
      {ok ? "✓" : "○"} {children}
    </li>
  );
}

const TRADES = [
  { key: "maconnerie", name: "Maçonnerie", icon: "🧱" },
  { key: "menuiserie-alu", name: "Menuiserie alu", icon: "🪟" },
  { key: "menuiserie-bois", name: "Menuiserie bois", icon: "🪵" },
  { key: "peinture", name: "Peinture", icon: "🎨" },
  { key: "electricite", name: "Électricité", icon: "💡" },
  { key: "plomberie", name: "Plomberie", icon: "🚰" },
  { key: "carrelage", name: "Carrelage", icon: "◻️" },
  { key: "architecture", name: "Architecture", icon: "📐" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    password: "",
    trade: "maconnerie",
    activity: "",
    slogan: "",
    city: "Lomé",
    brandColor: "#1c6df5",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Critères du mot de passe (miroir des règles serveur)
  const pw = form.password;
  const pwChecks = {
    length: pw.length >= 12,
    upper: /[A-Z]/.test(pw),
    digit: /\d/.test(pw),
  };
  const pwValid = pwChecks.length && pwChecks.upper && pwChecks.digit;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwValid) {
      setError("Le mot de passe ne respecte pas les critères de sécurité.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Inscription impossible.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl font-extrabold text-brand-600">
            Pro<span className="text-accent-500">Devis</span>
          </div>
          <p className="text-slate-500 mt-2">Créez votre compte artisan.</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Aperçu en direct du logo / en-tête généré */}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <Monogram
              name={form.companyName || "Pro Devis"}
              color={form.brandColor}
              style="modern"
              size={56}
            />
            <div className="min-w-0">
              <div className="font-bold truncate">
                {form.companyName || "Votre entreprise"}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {form.activity || "Votre activité"}
              </div>
              {form.slogan && (
                <div className="text-xs italic text-brand-600 truncate">
                  « {form.slogan} »
                </div>
              )}
            </div>
            <span className="ml-auto text-[10px] text-slate-400 text-right leading-tight">
              Logo généré<br />automatiquement
            </span>
          </div>

          <div>
            <label className="label">Nom de l'entreprise / artisan</label>
            <input
              className="input"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="Ets Kossi Bâtiment"
              required
            />
          </div>

          <div>
            <label className="label">Métier principal</label>
            <div className="grid grid-cols-4 gap-2">
              {TRADES.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => set("trade", t.key)}
                  className={`rounded-xl border p-2 text-center text-xs ${
                    form.trade === t.key
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <div className="text-xl">{t.icon}</div>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Description courte de l'activité</label>
            <input
              className="input"
              value={form.activity}
              onChange={(e) => set("activity", e.target.value)}
              placeholder="Construction, rénovation, dallage…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Slogan (optionnel)</label>
              <input
                className="input"
                value={form.slogan}
                onChange={(e) => set("slogan", e.target.value)}
                placeholder="Le bâti de confiance"
              />
            </div>
            <div>
              <label className="label">Ville</label>
              <input
                className="input"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
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
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    form.brandColor === c.value
                      ? "border-slate-800 scale-110"
                      : "border-white shadow"
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Téléphone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+228 …"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Mot de passe</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={12}
              autoComplete="new-password"
            />
            {form.password.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <PwHint ok={pwChecks.length}>12 caractères</PwHint>
                <PwHint ok={pwChecks.upper}>1 majuscule</PwHint>
                <PwHint ok={pwChecks.digit}>1 chiffre</PwHint>
              </ul>
            )}
          </div>

          <button
            className="btn-primary w-full"
            disabled={loading || !pwValid}
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-brand-600 font-semibold">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
