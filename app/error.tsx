"use client";

import { useEffect } from "react";

/**
 * Frontière d'erreur de l'application.
 *
 * Sans elle, une exception de rendu affichait la page d'erreur brute de
 * Next.js — illisible pour un artisan, et sans moyen de repartir.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="card p-8 max-w-md text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
        <p className="text-slate-600">
          Nous n'avons pas pu afficher cette page. Réessayez dans un instant.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400">Référence : {error.digest}</p>
        )}
        <div className="flex justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            Réessayer
          </button>
          <a href="/dashboard" className="btn-ghost">
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}
