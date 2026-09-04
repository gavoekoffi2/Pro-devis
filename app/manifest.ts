import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pro Devis — Devis pour artisans",
    short_name: "Pro Devis",
    description:
      "Générez des devis professionnels en quelques minutes : maçonnerie, menuiserie, peinture, électricité, plomberie…",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f6fb",
    theme_color: "#1c6df5",
    lang: "fr",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
