/** Utilitaires de marque : initiales, couleurs, contraste. Sûr côté client. */

export function initials(name: string): string {
  const words = (name || "")
    .trim()
    .split(/\s+/)
    .filter((w) => !/^(ets|sarl|sa|entreprise|et|de|du|la|le|les)$/i.test(w));
  const base = words.length ? words : (name || "P").trim().split(/\s+/);
  const letters = base.slice(0, 2).map((w) => w.charAt(0).toUpperCase());
  return letters.join("") || "P";
}

function hexToRgb(hex: string) {
  const h = (hex || "#1c6df5").replace("#", "");
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h.padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Renvoie "#000" ou "#fff" selon la luminosité de la couleur de fond. */
export function contrastText(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}

/** Éclaircit (amount>0) ou assombrit (amount<0) une couleur hex. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + amount * 255)));
  const toHex = (c: number) => adj(c).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const BRAND_COLORS = [
  { name: "Bleu", value: "#1c6df5" },
  { name: "Vert", value: "#16a34a" },
  { name: "Orange", value: "#ea580c" },
  { name: "Rouge", value: "#dc2626" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Or", value: "#b8860b" },
  { name: "Turquoise", value: "#0891b2" },
  { name: "Noir", value: "#111827" },
];
