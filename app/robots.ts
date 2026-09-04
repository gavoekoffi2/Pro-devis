import type { MetadataRoute } from "next";

/**
 * Seules les pages publiques de présentation sont indexables.
 * L'espace de travail et surtout les liens de devis partagés (`/d/…`, qui
 * contiennent des données clients) restent hors des moteurs de recherche.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/d/",
        "/devis",
        "/dashboard",
        "/clients",
        "/materiaux",
        "/parametres",
        "/api/",
      ],
    },
  };
}
