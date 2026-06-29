/**
 * Seed Pro Devis — référentiel métiers, matériaux (catalogue global) et
 * types de travaux avec leurs "recettes" de calcul.
 *
 * Tous les prix sont indicatifs, en FCFA, pour le marché togolais.
 * Chaque entreprise pourra ensuite surcharger ses propres prix.
 *
 * Une "recette" est une liste de composants :
 *   { materialKey, metric, coef, waste }
 *   quantité = metric(saisies) × coef × (1 + waste)
 * où metric ∈ { unite, surface, surfaceSol, volume, perimetre, longueur }.
 */
import { PrismaClient, MaterialKind } from "@prisma/client";

const prisma = new PrismaClient();

type Mat = {
  key: string;
  name: string;
  category?: string;
  kind?: MaterialKind;
  unit: string;
  unitPrice: number;
  margin?: number;
};

type Recipe = { materialKey: string; metric: string; coef: number; waste?: number };

type WorkInput = { key: string; label: string; unit?: string; default?: number };

type Work = {
  key: string;
  name: string;
  inputs: WorkInput[];
  recipe: Recipe[];
};

type TradeDef = {
  key: string;
  name: string;
  icon: string;
  materials: Mat[];
  works: Work[];
};

const M = MaterialKind;

const TRADES: TradeDef[] = [
  // ───────────────────────── MAÇONNERIE ─────────────────────────
  {
    key: "maconnerie",
    name: "Maçonnerie",
    icon: "🧱",
    materials: [
      { key: "ciment", name: "Ciment (sac 50 kg)", category: "Liant", unit: "sac", unitPrice: 4500 },
      { key: "sable", name: "Sable", category: "Granulat", unit: "m³", unitPrice: 12000 },
      { key: "gravier", name: "Gravier", category: "Granulat", unit: "m³", unitPrice: 18000 },
      { key: "fer_beton", name: "Fer à béton (barre 12mm)", category: "Acier", unit: "barre", unitPrice: 4000 },
      { key: "parpaing", name: "Parpaing 15x20x40", category: "Aggloméré", unit: "pièce", unitPrice: 350 },
      { key: "brique", name: "Brique", category: "Aggloméré", unit: "pièce", unitPrice: 200 },
      { key: "bois_coffrage", name: "Bois de coffrage", category: "Bois", unit: "m²", unitPrice: 2500 },
      { key: "clou", name: "Clous", category: "Quincaillerie", unit: "kg", unitPrice: 800 },
      { key: "fil_attache", name: "Fil d'attache", category: "Quincaillerie", unit: "kg", unitPrice: 1000 },
      { key: "mo_macon", name: "Main-d'œuvre maçon", kind: M.LABOR, unit: "m²", unitPrice: 2500 },
      { key: "mo_macon_m3", name: "Main-d'œuvre maçon (béton)", kind: M.LABOR, unit: "m³", unitPrice: 15000 },
      { key: "transport", name: "Transport / Livraison", kind: M.TRANSPORT, unit: "forfait", unitPrice: 15000 },
    ],
    works: [
      {
        key: "mur_parpaing",
        name: "Mur en parpaings",
        inputs: [
          { key: "longueur", label: "Longueur du mur", unit: "m", default: 5 },
          { key: "hauteur", label: "Hauteur du mur", unit: "m", default: 3 },
          { key: "nombre", label: "Nombre de murs", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "parpaing", metric: "surface", coef: 12.5, waste: 0.05 },
          { materialKey: "ciment", metric: "surface", coef: 0.5, waste: 0.05 },
          { materialKey: "sable", metric: "surface", coef: 0.03, waste: 0.05 },
          { materialKey: "mo_macon", metric: "surface", coef: 1 },
          { materialKey: "transport", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "fondation_semelle",
        name: "Fondation / Semelle béton",
        inputs: [
          { key: "longueur", label: "Longueur", unit: "m", default: 20 },
          { key: "largeur", label: "Largeur", unit: "m", default: 0.4 },
          { key: "hauteur", label: "Hauteur / Épaisseur", unit: "m", default: 0.3 },
        ],
        recipe: [
          { materialKey: "ciment", metric: "volume", coef: 7, waste: 0.05 },
          { materialKey: "sable", metric: "volume", coef: 0.45, waste: 0.05 },
          { materialKey: "gravier", metric: "volume", coef: 0.85, waste: 0.05 },
          { materialKey: "fer_beton", metric: "volume", coef: 6, waste: 0.05 },
          { materialKey: "fil_attache", metric: "volume", coef: 1 },
          { materialKey: "mo_macon_m3", metric: "volume", coef: 1 },
          { materialKey: "transport", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "dalle_chape",
        name: "Dalle / Chape",
        inputs: [
          { key: "longueur", label: "Longueur", unit: "m", default: 5 },
          { key: "largeur", label: "Largeur", unit: "m", default: 4 },
          { key: "epaisseur", label: "Épaisseur", unit: "m", default: 0.1 },
        ],
        recipe: [
          { materialKey: "ciment", metric: "volume", coef: 7, waste: 0.05 },
          { materialKey: "sable", metric: "volume", coef: 0.45, waste: 0.05 },
          { materialKey: "gravier", metric: "volume", coef: 0.85, waste: 0.05 },
          { materialKey: "fer_beton", metric: "surfaceSol", coef: 2, waste: 0.05 },
          { materialKey: "mo_macon", metric: "surfaceSol", coef: 1 },
          { materialKey: "transport", metric: "unite", coef: 1 },
        ],
      },
    ],
  },

  // ───────────────────── MENUISERIE ALUMINIUM ─────────────────────
  {
    key: "menuiserie-alu",
    name: "Menuiserie aluminium",
    icon: "🪟",
    materials: [
      { key: "profil_alu", name: "Profilé aluminium", category: "Profilé", unit: "ml", unitPrice: 3500 },
      { key: "vitre", name: "Vitre", category: "Vitrage", unit: "m²", unitPrice: 8000 },
      { key: "joint", name: "Joint", category: "Étanchéité", unit: "ml", unitPrice: 300 },
      { key: "serrure_alu", name: "Serrure", category: "Quincaillerie", unit: "pièce", unitPrice: 7500 },
      { key: "vis", name: "Vis", category: "Quincaillerie", unit: "pièce", unitPrice: 25 },
      { key: "roulette", name: "Roulette", category: "Quincaillerie", unit: "pièce", unitPrice: 1500 },
      { key: "rail", name: "Rail", category: "Profilé", unit: "ml", unitPrice: 2000 },
      { key: "poignee", name: "Poignée", category: "Quincaillerie", unit: "pièce", unitPrice: 3000 },
      { key: "silicone", name: "Silicone (tube)", category: "Étanchéité", unit: "tube", unitPrice: 2500 },
      { key: "mo_alu", name: "Main-d'œuvre + pose", kind: M.LABOR, unit: "m²", unitPrice: 6000 },
      { key: "transport_alu", name: "Transport", kind: M.TRANSPORT, unit: "forfait", unitPrice: 10000 },
    ],
    works: [
      {
        key: "fenetre_alu",
        name: "Fenêtre aluminium coulissante",
        inputs: [
          { key: "largeur", label: "Largeur", unit: "m", default: 1.2 },
          { key: "hauteur", label: "Hauteur", unit: "m", default: 1.2 },
          { key: "nombre", label: "Nombre de fenêtres", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "profil_alu", metric: "perimetre", coef: 1.3, waste: 0.1 },
          { materialKey: "rail", metric: "longueur", coef: 2 },
          { materialKey: "vitre", metric: "surface", coef: 1, waste: 0.05 },
          { materialKey: "joint", metric: "perimetre", coef: 2 },
          { materialKey: "roulette", metric: "unite", coef: 4 },
          { materialKey: "poignee", metric: "unite", coef: 1 },
          { materialKey: "vis", metric: "unite", coef: 16 },
          { materialKey: "silicone", metric: "unite", coef: 1 },
          { materialKey: "mo_alu", metric: "surface", coef: 1 },
          { materialKey: "transport_alu", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "porte_alu",
        name: "Porte aluminium",
        inputs: [
          { key: "largeur", label: "Largeur", unit: "m", default: 0.9 },
          { key: "hauteur", label: "Hauteur", unit: "m", default: 2.1 },
          { key: "nombre", label: "Nombre de portes", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "profil_alu", metric: "perimetre", coef: 1.4, waste: 0.1 },
          { materialKey: "vitre", metric: "surface", coef: 0.6, waste: 0.05 },
          { materialKey: "joint", metric: "perimetre", coef: 2 },
          { materialKey: "serrure_alu", metric: "unite", coef: 1 },
          { materialKey: "poignee", metric: "unite", coef: 1 },
          { materialKey: "vis", metric: "unite", coef: 24 },
          { materialKey: "silicone", metric: "unite", coef: 1 },
          { materialKey: "mo_alu", metric: "surface", coef: 1 },
          { materialKey: "transport_alu", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "baie_vitree",
        name: "Baie vitrée",
        inputs: [
          { key: "largeur", label: "Largeur", unit: "m", default: 2.4 },
          { key: "hauteur", label: "Hauteur", unit: "m", default: 2.1 },
          { key: "nombre", label: "Nombre", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "profil_alu", metric: "perimetre", coef: 1.5, waste: 0.1 },
          { materialKey: "rail", metric: "longueur", coef: 2 },
          { materialKey: "vitre", metric: "surface", coef: 1, waste: 0.05 },
          { materialKey: "joint", metric: "perimetre", coef: 2.5 },
          { materialKey: "roulette", metric: "unite", coef: 4 },
          { materialKey: "poignee", metric: "unite", coef: 2 },
          { materialKey: "serrure_alu", metric: "unite", coef: 1 },
          { materialKey: "silicone", metric: "unite", coef: 2 },
          { materialKey: "mo_alu", metric: "surface", coef: 1 },
          { materialKey: "transport_alu", metric: "unite", coef: 1 },
        ],
      },
    ],
  },

  // ───────────────────── MENUISERIE BOIS ─────────────────────
  {
    key: "menuiserie-bois",
    name: "Menuiserie bois",
    icon: "🪵",
    materials: [
      { key: "planche", name: "Planche de bois", category: "Bois", unit: "ml", unitPrice: 1800 },
      { key: "contreplaque", name: "Contreplaqué", category: "Bois", unit: "m²", unitPrice: 6000 },
      { key: "colle_bois", name: "Colle à bois", category: "Quincaillerie", unit: "litre", unitPrice: 3000 },
      { key: "vis_bois", name: "Vis à bois", category: "Quincaillerie", unit: "pièce", unitPrice: 30 },
      { key: "charniere", name: "Charnière", category: "Quincaillerie", unit: "pièce", unitPrice: 1200 },
      { key: "serrure_bois", name: "Serrure", category: "Quincaillerie", unit: "pièce", unitPrice: 6000 },
      { key: "vernis", name: "Vernis", category: "Finition", unit: "litre", unitPrice: 4500 },
      { key: "mo_menuisier", name: "Main-d'œuvre menuisier", kind: M.LABOR, unit: "m²", unitPrice: 5000 },
      { key: "transport_bois", name: "Transport", kind: M.TRANSPORT, unit: "forfait", unitPrice: 8000 },
    ],
    works: [
      {
        key: "porte_bois",
        name: "Porte en bois",
        inputs: [
          { key: "largeur", label: "Largeur", unit: "m", default: 0.9 },
          { key: "hauteur", label: "Hauteur", unit: "m", default: 2.1 },
          { key: "nombre", label: "Nombre de portes", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "contreplaque", metric: "surface", coef: 2, waste: 0.1 },
          { materialKey: "planche", metric: "perimetre", coef: 1.2 },
          { materialKey: "charniere", metric: "unite", coef: 3 },
          { materialKey: "serrure_bois", metric: "unite", coef: 1 },
          { materialKey: "vis_bois", metric: "unite", coef: 30 },
          { materialKey: "colle_bois", metric: "surface", coef: 0.2 },
          { materialKey: "vernis", metric: "surface", coef: 0.3 },
          { materialKey: "mo_menuisier", metric: "surface", coef: 1 },
          { materialKey: "transport_bois", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "placard_bois",
        name: "Placard / Meuble",
        inputs: [
          { key: "largeur", label: "Largeur", unit: "m", default: 2 },
          { key: "hauteur", label: "Hauteur", unit: "m", default: 2.4 },
          { key: "nombre", label: "Nombre", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "contreplaque", metric: "surface", coef: 3, waste: 0.12 },
          { materialKey: "planche", metric: "surface", coef: 2 },
          { materialKey: "charniere", metric: "unite", coef: 6 },
          { materialKey: "vis_bois", metric: "unite", coef: 60 },
          { materialKey: "colle_bois", metric: "surface", coef: 0.3 },
          { materialKey: "vernis", metric: "surface", coef: 0.4 },
          { materialKey: "mo_menuisier", metric: "surface", coef: 1.2 },
          { materialKey: "transport_bois", metric: "unite", coef: 1 },
        ],
      },
    ],
  },

  // ───────────────────────── PEINTURE ─────────────────────────
  {
    key: "peinture",
    name: "Peinture",
    icon: "🎨",
    materials: [
      { key: "peinture", name: "Peinture", category: "Peinture", unit: "litre", unitPrice: 2500 },
      { key: "enduit", name: "Enduit", category: "Préparation", unit: "kg", unitPrice: 400 },
      { key: "primaire", name: "Primaire / Sous-couche", category: "Préparation", unit: "litre", unitPrice: 2000 },
      { key: "papier_abrasif", name: "Papier abrasif", category: "Préparation", unit: "pièce", unitPrice: 500 },
      { key: "rouleau", name: "Rouleau", category: "Outillage", unit: "pièce", unitPrice: 1500 },
      { key: "pinceau", name: "Pinceau", category: "Outillage", unit: "pièce", unitPrice: 1000 },
      { key: "mo_peintre", name: "Main-d'œuvre peintre", kind: M.LABOR, unit: "m²", unitPrice: 1500 },
      { key: "transport_peint", name: "Transport", kind: M.TRANSPORT, unit: "forfait", unitPrice: 5000 },
    ],
    works: [
      {
        key: "peinture_interieure",
        name: "Peinture intérieure (murs)",
        inputs: [
          { key: "surface", label: "Surface à peindre", unit: "m²", default: 50 },
          { key: "nombre", label: "Nombre de pièces", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "peinture", metric: "surface", coef: 0.3, waste: 0.05 },
          { materialKey: "primaire", metric: "surface", coef: 0.1 },
          { materialKey: "enduit", metric: "surface", coef: 1.2 },
          { materialKey: "papier_abrasif", metric: "surface", coef: 0.1 },
          { materialKey: "rouleau", metric: "unite", coef: 2 },
          { materialKey: "pinceau", metric: "unite", coef: 2 },
          { materialKey: "mo_peintre", metric: "surface", coef: 1 },
          { materialKey: "transport_peint", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "peinture_facade",
        name: "Peinture façade extérieure",
        inputs: [
          { key: "longueur", label: "Longueur", unit: "m", default: 10 },
          { key: "hauteur", label: "Hauteur", unit: "m", default: 3 },
          { key: "nombre", label: "Nombre de façades", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "peinture", metric: "surface", coef: 0.35, waste: 0.08 },
          { materialKey: "primaire", metric: "surface", coef: 0.12 },
          { materialKey: "enduit", metric: "surface", coef: 1 },
          { materialKey: "rouleau", metric: "unite", coef: 3 },
          { materialKey: "pinceau", metric: "unite", coef: 2 },
          { materialKey: "mo_peintre", metric: "surface", coef: 1 },
          { materialKey: "transport_peint", metric: "unite", coef: 1 },
        ],
      },
    ],
  },

  // ───────────────────────── ÉLECTRICITÉ ─────────────────────────
  {
    key: "electricite",
    name: "Électricité",
    icon: "💡",
    materials: [
      { key: "cable", name: "Câble électrique", category: "Câblage", unit: "ml", unitPrice: 500 },
      { key: "gaine", name: "Gaine", category: "Câblage", unit: "ml", unitPrice: 250 },
      { key: "interrupteur", name: "Interrupteur", category: "Appareillage", unit: "pièce", unitPrice: 1500 },
      { key: "prise", name: "Prise de courant", category: "Appareillage", unit: "pièce", unitPrice: 1800 },
      { key: "disjoncteur", name: "Disjoncteur", category: "Protection", unit: "pièce", unitPrice: 5000 },
      { key: "tableau", name: "Tableau électrique", category: "Protection", unit: "pièce", unitPrice: 25000 },
      { key: "boite", name: "Boîte d'encastrement", category: "Appareillage", unit: "pièce", unitPrice: 400 },
      { key: "ampoule", name: "Point lumineux / Ampoule", category: "Éclairage", unit: "pièce", unitPrice: 2000 },
      { key: "mo_electricien", name: "Main-d'œuvre électricien", kind: M.LABOR, unit: "point", unitPrice: 3500 },
      { key: "transport_elec", name: "Transport", kind: M.TRANSPORT, unit: "forfait", unitPrice: 5000 },
    ],
    works: [
      {
        key: "installation_elec",
        name: "Installation électrique (par points)",
        inputs: [
          { key: "nombre", label: "Nombre de points (prises/interrupteurs)", unit: "", default: 10 },
        ],
        recipe: [
          { materialKey: "cable", metric: "unite", coef: 10 },
          { materialKey: "gaine", metric: "unite", coef: 8 },
          { materialKey: "boite", metric: "unite", coef: 1 },
          { materialKey: "interrupteur", metric: "unite", coef: 0.5 },
          { materialKey: "prise", metric: "unite", coef: 0.5 },
          { materialKey: "ampoule", metric: "unite", coef: 0.4 },
          { materialKey: "mo_electricien", metric: "unite", coef: 1 },
          { materialKey: "transport_elec", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "tableau_elec",
        name: "Tableau électrique + protections",
        inputs: [
          { key: "nombre", label: "Nombre de circuits", unit: "", default: 6 },
        ],
        recipe: [
          { materialKey: "tableau", metric: "unite", coef: 0.16 },
          { materialKey: "disjoncteur", metric: "unite", coef: 1 },
          { materialKey: "cable", metric: "unite", coef: 5 },
          { materialKey: "mo_electricien", metric: "unite", coef: 1 },
          { materialKey: "transport_elec", metric: "unite", coef: 1 },
        ],
      },
    ],
  },

  // ───────────────────────── PLOMBERIE ─────────────────────────
  {
    key: "plomberie",
    name: "Plomberie",
    icon: "🚰",
    materials: [
      { key: "tuyau_pvc", name: "Tuyau PVC", category: "Tuyauterie", unit: "ml", unitPrice: 1200 },
      { key: "coude", name: "Coude / Raccord", category: "Raccord", unit: "pièce", unitPrice: 500 },
      { key: "robinet", name: "Robinet", category: "Robinetterie", unit: "pièce", unitPrice: 4500 },
      { key: "wc", name: "WC complet", category: "Sanitaire", unit: "pièce", unitPrice: 45000 },
      { key: "lavabo", name: "Lavabo", category: "Sanitaire", unit: "pièce", unitPrice: 25000 },
      { key: "colle_pvc", name: "Colle PVC", category: "Raccord", unit: "tube", unitPrice: 2500 },
      { key: "teflon", name: "Téflon", category: "Étanchéité", unit: "pièce", unitPrice: 300 },
      { key: "mo_plombier", name: "Main-d'œuvre plombier", kind: M.LABOR, unit: "point", unitPrice: 4000 },
      { key: "transport_plomb", name: "Transport", kind: M.TRANSPORT, unit: "forfait", unitPrice: 6000 },
    ],
    works: [
      {
        key: "point_eau",
        name: "Installation point d'eau",
        inputs: [
          { key: "nombre", label: "Nombre de points d'eau", unit: "", default: 3 },
        ],
        recipe: [
          { materialKey: "tuyau_pvc", metric: "unite", coef: 6 },
          { materialKey: "coude", metric: "unite", coef: 4 },
          { materialKey: "robinet", metric: "unite", coef: 1 },
          { materialKey: "colle_pvc", metric: "unite", coef: 0.3 },
          { materialKey: "teflon", metric: "unite", coef: 1 },
          { materialKey: "mo_plombier", metric: "unite", coef: 1 },
          { materialKey: "transport_plomb", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "salle_de_bain",
        name: "Salle de bain complète",
        inputs: [
          { key: "nombre", label: "Nombre de salles de bain", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "wc", metric: "unite", coef: 1 },
          { materialKey: "lavabo", metric: "unite", coef: 1 },
          { materialKey: "robinet", metric: "unite", coef: 2 },
          { materialKey: "tuyau_pvc", metric: "unite", coef: 20 },
          { materialKey: "coude", metric: "unite", coef: 12 },
          { materialKey: "colle_pvc", metric: "unite", coef: 1 },
          { materialKey: "mo_plombier", metric: "unite", coef: 4 },
          { materialKey: "transport_plomb", metric: "unite", coef: 1 },
        ],
      },
    ],
  },

  // ───────────────────────── CARRELAGE ─────────────────────────
  {
    key: "carrelage",
    name: "Carrelage",
    icon: "◻️",
    materials: [
      { key: "carreau", name: "Carreaux", category: "Revêtement", unit: "m²", unitPrice: 6000 },
      { key: "colle_carreau", name: "Colle à carreaux (sac)", category: "Pose", unit: "sac", unitPrice: 5000 },
      { key: "joint_carreau", name: "Joint à carreaux", category: "Finition", unit: "kg", unitPrice: 800 },
      { key: "croisillon", name: "Croisillons (paquet)", category: "Pose", unit: "pièce", unitPrice: 1500 },
      { key: "mo_carreleur", name: "Main-d'œuvre carreleur", kind: M.LABOR, unit: "m²", unitPrice: 3000 },
      { key: "transport_carr", name: "Transport", kind: M.TRANSPORT, unit: "forfait", unitPrice: 7000 },
    ],
    works: [
      {
        key: "carrelage_sol",
        name: "Pose carrelage au sol",
        inputs: [
          { key: "longueur", label: "Longueur", unit: "m", default: 5 },
          { key: "largeur", label: "Largeur", unit: "m", default: 4 },
          { key: "nombre", label: "Nombre de pièces", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "carreau", metric: "surfaceSol", coef: 1, waste: 0.1 },
          { materialKey: "colle_carreau", metric: "surfaceSol", coef: 0.25 },
          { materialKey: "joint_carreau", metric: "surfaceSol", coef: 0.5 },
          { materialKey: "croisillon", metric: "surfaceSol", coef: 0.1 },
          { materialKey: "mo_carreleur", metric: "surfaceSol", coef: 1 },
          { materialKey: "transport_carr", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "carrelage_mur",
        name: "Carrelage mural (faïence)",
        inputs: [
          { key: "longueur", label: "Longueur", unit: "m", default: 4 },
          { key: "hauteur", label: "Hauteur", unit: "m", default: 2 },
          { key: "nombre", label: "Nombre de murs", unit: "", default: 1 },
        ],
        recipe: [
          { materialKey: "carreau", metric: "surface", coef: 1, waste: 0.12 },
          { materialKey: "colle_carreau", metric: "surface", coef: 0.3 },
          { materialKey: "joint_carreau", metric: "surface", coef: 0.5 },
          { materialKey: "croisillon", metric: "surface", coef: 0.1 },
          { materialKey: "mo_carreleur", metric: "surface", coef: 1.2 },
          { materialKey: "transport_carr", metric: "unite", coef: 1 },
        ],
      },
    ],
  },

  // ───────────────────────── ARCHITECTURE ─────────────────────────
  {
    key: "architecture",
    name: "Architecture",
    icon: "📐",
    materials: [
      { key: "honoraire_plan", name: "Honoraires plan architectural", kind: M.OTHER, unit: "m²", unitPrice: 3000 },
      { key: "honoraire_suivi", name: "Suivi de chantier", kind: M.OTHER, unit: "m²", unitPrice: 2000 },
      { key: "plan_3d", name: "Rendu 3D", kind: M.OTHER, unit: "forfait", unitPrice: 75000 },
    ],
    works: [
      {
        key: "etude_plan",
        name: "Étude & plan architectural",
        inputs: [
          { key: "surface", label: "Surface du bâtiment", unit: "m²", default: 120 },
        ],
        recipe: [
          { materialKey: "honoraire_plan", metric: "surface", coef: 1 },
          { materialKey: "plan_3d", metric: "unite", coef: 1 },
        ],
      },
      {
        key: "suivi_chantier",
        name: "Suivi de chantier",
        inputs: [
          { key: "surface", label: "Surface du chantier", unit: "m²", default: 120 },
        ],
        recipe: [{ materialKey: "honoraire_suivi", metric: "surface", coef: 1 }],
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seed Pro Devis…");

  for (let t = 0; t < TRADES.length; t++) {
    const def = TRADES[t];
    const trade = await prisma.trade.upsert({
      where: { key: def.key },
      update: { name: def.name, icon: def.icon, order: t },
      create: { key: def.key, name: def.name, icon: def.icon, order: t },
    });

    // Matériaux du catalogue global (companyId = null)
    for (const m of def.materials) {
      const existing = await prisma.material.findFirst({
        where: { key: m.key, companyId: null },
      });
      const data = {
        key: m.key,
        name: m.name,
        category: m.category ?? null,
        kind: m.kind ?? M.MATERIAL,
        unit: m.unit,
        unitPrice: m.unitPrice,
        margin: m.margin ?? 0,
        tradeId: trade.id,
      };
      if (existing) {
        await prisma.material.update({ where: { id: existing.id }, data });
      } else {
        await prisma.material.create({ data });
      }
    }

    // Types de travaux + recettes
    for (let w = 0; w < def.works.length; w++) {
      const work = def.works[w];
      await prisma.workType.upsert({
        where: { key: work.key },
        update: {
          name: work.name,
          order: w,
          tradeId: trade.id,
          inputs: work.inputs,
          recipe: work.recipe,
        },
        create: {
          key: work.key,
          name: work.name,
          order: w,
          tradeId: trade.id,
          inputs: work.inputs,
          recipe: work.recipe,
        },
      });
    }

    console.log(
      `  ✔ ${def.icon} ${def.name} — ${def.materials.length} matériaux, ${def.works.length} types de travaux`
    );
  }

  console.log("✅ Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
