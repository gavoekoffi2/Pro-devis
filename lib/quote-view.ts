/** Données normalisées d'un devis pour l'affichage dans un modèle. */

export type ViewItem = {
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  kind?: string;
};

export type QuoteView = {
  company: {
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
    brandColor: string;
    headerStyle: string;
    footerNote?: string | null;
  };
  docTitle: string;
  number: string;
  date: string;
  validUntil: string;
  clientName?: string | null;
  clientPhone?: string | null;
  siteAddress?: string | null;
  projectDescription?: string | null;
  workLabel?: string | null;
  items: ViewItem[];
  subtotal: number;
  laborTotal: number;
  transport: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentTerms?: string | null;
  validityDays: number;
  specialInstructions?: string | null;
};

export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  badge?: string; // ex: "Premium"
  swatch: [string, string]; // aperçu couleurs
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "simple",
    name: "Simple Pro",
    description: "Épuré et professionnel",
    swatch: ["#1c6df5", "#eef7ff"],
  },
  {
    id: "modern",
    name: "Moderne Premium",
    description: "Bandeau dégradé, élégant",
    badge: "Premium",
    swatch: ["#1c6df5", "#1a3f8f"],
  },
  {
    id: "btp",
    name: "Bâtiment / BTP",
    description: "Robuste, style chantier",
    swatch: ["#0f172a", "#f59e0b"],
  },
  {
    id: "architecte",
    name: "Architecte",
    description: "Minimaliste, lignes fines",
    badge: "Premium",
    swatch: ["#111827", "#9ca3af"],
  },
  {
    id: "artisan",
    name: "Artisan",
    description: "Chaleureux et convivial",
    swatch: ["#15803d", "#92400e"],
  },
  {
    id: "luxe",
    name: "Luxe",
    description: "Noir & or, haut de gamme",
    badge: "Premium",
    swatch: ["#111111", "#c9a227"],
  },
  {
    id: "eco",
    name: "Économique A5",
    description: "Compact, économise l'encre",
    swatch: ["#374151", "#e5e7eb"],
  },
  {
    id: "identite",
    name: "Identité forte",
    description: "Couleur de marque dominante",
    badge: "Premium",
    swatch: ["#7c3aed", "#ede9fe"],
  },
];

export function money(value: number, currency = "FCFA") {
  const n = Math.round(value || 0);
  return `${n.toLocaleString("fr-FR")} ${currency}`.trim();
}
