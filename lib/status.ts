/** Métadonnées de statut partagées (badges) + expiration des devis. */

export type StatusMeta = { label: string; cls: string };

export const STATUS_META: Record<string, StatusMeta> = {
  DRAFT: { label: "Brouillon", cls: "bg-slate-100 text-slate-600" },
  SENT: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "Accepté", cls: "bg-green-100 text-green-700" },
  REFUSED: { label: "Refusé", cls: "bg-red-100 text-red-700" },
  EXPIRED: { label: "Expiré", cls: "bg-slate-200 text-slate-500" },
};

export const PAY_META: Record<string, StatusMeta> = {
  UNPAID: { label: "Impayé", cls: "bg-red-100 text-red-700" },
  PARTIAL: { label: "Acompte versé", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Payé", cls: "bg-green-100 text-green-700" },
};

/** Date limite de validité d'un devis. */
export function expiryDate(createdAt: Date, validityDays: number) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + (validityDays || 30));
  return d;
}

/** Un devis "en attente" dont la validité est dépassée est considéré expiré. */
export function isExpired(quote: {
  status: string;
  createdAt: Date;
  validityDays: number;
}) {
  return (
    quote.status === "SENT" &&
    expiryDate(quote.createdAt, quote.validityDays) < new Date()
  );
}

/** Statut effectif à afficher (tient compte de l'expiration). */
export function effectiveStatus(quote: {
  status: string;
  createdAt: Date;
  validityDays: number;
}) {
  return isExpired(quote) ? "EXPIRED" : quote.status;
}

/** Badge à afficher pour un devis. */
export function statusMeta(quote: {
  status: string;
  createdAt: Date;
  validityDays: number;
}): StatusMeta {
  return STATUS_META[effectiveStatus(quote)] ?? STATUS_META.DRAFT;
}
