import type { QuoteView } from "./quote-view";

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
  items: {
    designation: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
    kind?: string;
  }[];
};

const fmt = (d: Date) => new Date(d).toLocaleDateString("fr-FR");

/** Construit les données d'affichage d'un devis pour les modèles PDF. */
export function buildQuoteView(quote: AnyQuote, company: AnyCompany): QuoteView {
  const validUntil = new Date(quote.createdAt);
  validUntil.setDate(validUntil.getDate() + (quote.validityDays || 30));

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
    },
    docTitle: quote.isInvoice ? "FACTURE" : "DEVIS",
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
  };
}
