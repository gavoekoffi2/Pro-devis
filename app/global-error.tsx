"use client";

/**
 * Dernier filet : erreur survenue dans la mise en page racine elle-même.
 * Ce composant remplace tout le document, il doit donc rendre `<html>`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: 24,
          textAlign: "center",
          background: "#f4f6fb",
          color: "#0f172a",
        }}
      >
        <div style={{ maxWidth: 380 }}>
          <div style={{ fontSize: 44 }}>⚠️</div>
          <h1 style={{ fontSize: 22 }}>Application indisponible</h1>
          <p style={{ color: "#475569" }}>
            Une erreur inattendue est survenue. Réessayez dans un instant.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#94a3b8" }}>
              Référence : {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 12,
              padding: "12px 20px",
              borderRadius: 12,
              border: 0,
              background: "#1c6df5",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
