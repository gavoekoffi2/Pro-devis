import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Pro Devis — Devis pro pour artisans",
  description:
    "Générez des devis professionnels en quelques minutes : maçonnerie, menuiserie, peinture, électricité, plomberie, carrelage…",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Pro Devis",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
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
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
