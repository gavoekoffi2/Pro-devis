"use client";

export function PrintButton() {
  return (
    <div className="no-print fixed bottom-4 inset-x-0 flex justify-center gap-3 z-30">
      <button onClick={() => window.print()} className="btn-primary shadow-lg">
        🖨️ Télécharger / Imprimer en PDF
      </button>
      <button onClick={() => window.history.back()} className="btn-ghost shadow">
        Retour
      </button>
    </div>
  );
}
