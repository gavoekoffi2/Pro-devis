"use client";

import Link from "next/link";
import { useState } from "react";

type Step = {
  key: string;
  done: boolean;
  title: string;
  desc: string;
  href: string;
  cta: string;
};

/**
 * Checklist d'accueil pour guider le nouvel artisan de l'inscription à son
 * premier devis envoyé. Se masque automatiquement une fois tout complété, et
 * peut être fermée manuellement (mémorisé dans le navigateur).
 */
export function OnboardingChecklist({
  hasProfile,
  hasQuote,
  hasShared,
}: {
  hasProfile: boolean;
  hasQuote: boolean;
  hasShared: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);

  const steps: Step[] = [
    {
      key: "profile",
      done: hasProfile,
      title: "Complétez votre profil",
      desc: "Ajoutez votre logo, téléphone et WhatsApp — ils apparaîtront sur vos devis.",
      href: "/parametres",
      cta: "Compléter",
    },
    {
      key: "quote",
      done: hasQuote,
      title: "Créez votre premier devis",
      desc: "Choisissez un métier, entrez les mesures, l'app calcule tout pour vous.",
      href: "/devis/nouveau",
      cta: "Créer un devis",
    },
    {
      key: "share",
      done: hasShared,
      title: "Envoyez-le à un client",
      desc: "Partagez le devis sur WhatsApp ; votre client peut l'accepter en ligne.",
      href: "/devis",
      cta: "Voir mes devis",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);

  // Masqué si tout est fait, ou fermé manuellement.
  if (allDone || dismissed) return null;

  // Prochaine étape à mettre en avant (première non faite).
  const nextKey = steps.find((s) => !s.done)?.key;

  return (
    <div className="card p-5 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-brand-100/50 blur-2xl" />
      <button
        onClick={() => setDismissed(true)}
        aria-label="Masquer le guide"
        className="absolute top-3 right-3 text-slate-300 hover:text-slate-500"
      >
        ✕
      </button>

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <h2 className="font-bold text-slate-900">Bien démarrer sur Pro Devis</h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {doneCount} étape{doneCount > 1 ? "s" : ""} sur {steps.length} — encore
          un petit effort !
        </p>

        {/* Barre de progression */}
        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2">
          {steps.map((s) => {
            const isNext = s.key === nextKey;
            return (
              <li
                key={s.key}
                className={`flex items-start gap-3 rounded-xl p-3 transition ${
                  s.done
                    ? "bg-green-50/60"
                    : isNext
                      ? "bg-brand-50 ring-1 ring-brand-200"
                      : "bg-slate-50"
                }`}
              >
                <span
                  className={`mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                    s.done
                      ? "bg-accent-500 text-white"
                      : "bg-white border border-slate-300 text-slate-400"
                  }`}
                >
                  {s.done ? "✓" : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-medium text-sm ${
                      s.done ? "text-slate-500 line-through" : "text-slate-900"
                    }`}
                  >
                    {s.title}
                  </div>
                  {!s.done && (
                    <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                  )}
                </div>
                {!s.done && (
                  <Link
                    href={s.href}
                    className={`btn-sm shrink-0 ${
                      isNext ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    {s.cta}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
