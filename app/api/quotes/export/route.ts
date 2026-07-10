import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "En attente",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
};

const PAY_LABEL: Record<string, string> = {
  UNPAID: "Impayé",
  PARTIAL: "Acompte",
  PAID: "Payé",
};

/** Échappe une valeur pour un CSV (séparateur ';'). */
function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[";\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Export comptable des devis/factures au format CSV (Excel-compatible).
 * Respecte les mêmes filtres que la liste (q = recherche, f = statut/facture).
 */
export async function GET(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return new Response("Non autorisé", { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const f = url.searchParams.get("f") || "";

  const where: any = { companyId: user.companyId! };
  if (f === "INVOICE") where.isInvoice = true;
  else if (f) where.status = f;
  if (q) {
    where.OR = [
      { clientName: { contains: q, mode: "insensitive" } },
      { number: { contains: q, mode: "insensitive" } },
      { workLabel: { contains: q, mode: "insensitive" } },
      { siteAddress: { contains: q, mode: "insensitive" } },
    ];
  }

  const quotes = await prisma.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Numéro",
    "Date",
    "Type",
    "Client",
    "Téléphone",
    "Travaux",
    "Statut",
    "Sous-total",
    "Main d'œuvre",
    "Transport",
    "Remise",
    "TVA",
    "Total",
    "Devise",
    "Payé",
    "Reste à payer",
    "Paiement",
  ];

  const rows = quotes.map((qt) =>
    [
      qt.number,
      new Date(qt.createdAt).toLocaleDateString("fr-FR"),
      qt.isInvoice ? "Facture" : "Devis",
      qt.clientName || "",
      qt.clientPhone || "",
      qt.workLabel || qt.tradeKey || "",
      STATUS_LABEL[qt.status] || qt.status,
      qt.subtotal,
      qt.laborTotal,
      qt.transport,
      qt.discount,
      qt.taxAmount,
      qt.total,
      qt.currency,
      qt.amountPaid,
      Math.max(0, qt.total - qt.amountPaid),
      PAY_LABEL[qt.paymentStatus] || qt.paymentStatus,
    ]
      .map(csvCell)
      .join(";")
  );

  // BOM UTF-8 pour qu'Excel affiche correctement les accents.
  const csv = "﻿" + [headers.join(";"), ...rows].join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pro-devis-export-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
