import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pro Devis — Devis pro pour artisans",
  description:
    "Générez des devis professionnels en quelques minutes : maçonnerie, menuiserie, peinture, électricité, plomberie, carrelage…",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c6df5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
