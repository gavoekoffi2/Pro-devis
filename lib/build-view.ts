import type { QuoteView } from "./quote-view";
import { amountInWords } from "./number-words";

type AnyCompany = {
  name: string;
  logoUrl?: string | null;
  headerImageUrl?: string | null;
  activity?: string | null;
  slogan?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  brandColor?: string | null;
  headerStyle?: string | null;
  footerNote?: string | null;
  isRegistered?: boolean;
  nif?: string | null;
  rccm?: string | null;
  bankInfo?: string | null;
  signatureUrl?: string | null;
};

type AnyQuote = {
  number: string;
  createdAt: Date;
  validityDays: number;
  isInvoice: boolean;
  clientName?: string | null;
  clientPhone?: string | null;
  siteAddress?: string | null;
  projectDescription?: string | null;
  workLabel?: string | null;
  subtotal: number;
  laborTotal: number;
  transport: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentTerms?: string | null;
  specialInstructions?: string | null;
  amountPaid?: number;
  paymentStatus?: string;
  acceptedAt?: Date | null;
  signerName?: string | null;
  items: {
    designation: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
    kind?: string;
    section?: string | null;
  }[];
};

const fmt = (d: Date) => new Date(d).toLocaleDateString("fr-FR");

/** Construit les données d'affichage d'un devis pour les modèles PDF. */
export function buildQuoteView(quote: AnyQuote, company: AnyCompany): QuoteView {
  const validUntil = new Date(quote.createdAt);
  validUntil.setDate(validUntil.getDate() + (quote.validityDays || 30));

  // Champs légaux affichés UNIQUEMENT si l'entreprise est formalisée.
  const formal = !!company.isRegistered;
  const amountPaid = quote.amountPaid ?? 0;

  return {
    company: {
      name: company.name,
      logoUrl: company.logoUrl,
      headerImageUrl: company.headerImageUrl,
      activity: company.activity,
      slogan: company.slogan,
      phone: company.phone,
      whatsapp: company.whatsapp,
      email: company.email,
      address: company.address,
      city: company.city,
      brandColor: company.brandColor || "#1c6df5",
      headerStyle: company.headerStyle || "modern",
      footerNote: company.footerNote,
      nif: formal ? company.nif : null,
      rccm: formal ? company.rccm : null,
      bankInfo: company.bankInfo,
      signatureUrl: company.signatureUrl,
    },
    docTitle: quote.isInvoice ? "FACTURE" : "DEVIS",
    isInvoice: quote.isInvoice,
    number: quote.number,
    date: fmt(quote.createdAt),
    validUntil: fmt(validUntil),
    clientName: quote.clientName,
    clientPhone: quote.clientPhone,
    siteAddress: quote.siteAddress,
    projectDescription: quote.projectDescription,
    workLabel: quote.workLabel,
    items: quote.items.map((i) => ({
      designation: i.designation,
      unit: i.unit,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
      kind: i.kind,
      section: i.section,
    })),
    subtotal: quote.subtotal,
    laborTotal: quote.laborTotal,
    transport: quote.transport,
    discount: quote.discount,
    taxRate: quote.taxRate,
    taxAmount: quote.taxAmount,
    total: quote.total,
    currency: quote.currency,
    paymentTerms: quote.paymentTerms,
    validityDays: quote.validityDays,
    specialInstructions: quote.specialInstructions,
    amountInWords: amountInWords(quote.total, quote.currency),
    amountPaid,
    balance: Math.max(0, (quote.total ?? 0) - amountPaid),
    paymentStatus: quote.paymentStatus ?? "UNPAID",
    acceptedAt: quote.acceptedAt ? fmt(quote.acceptedAt) : null,
    signerName: quote.signerName ?? null,
  };
}
