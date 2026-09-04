"use client";

/**
 * Bouton de relance WhatsApp en 1 clic.
 *
 * Construit le message au clic (côté client, pour connaître l'origine du
 * site et générer le lien public du devis), puis ouvre WhatsApp.
 */
export function FollowUpButton({
  phone,
  message,
  publicId,
  label = "📲 Relancer",
}: {
  phone?: string | null;
  message: string;
  publicId?: string | null;
  label?: string;
}) {
  function open() {
    const link = publicId ? `${window.location.origin}/d/${publicId}` : "";
    const text = link ? `${message}\n${link}` : message;
    const number = (phone || "").replace(/[^0-9]/g, "");
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <button onClick={open} className="btn-accent btn-sm whitespace-nowrap">
      {label}
    </button>
  );
}
