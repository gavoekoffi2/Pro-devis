import sanitizeHtml from "sanitize-html";

/**
 * Nettoie une chaîne HTML/texte pour éviter les injections XSS.
 * Autorise le texte brut + retours à la ligne, interdit les balises dangereuses.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";

  return sanitizeHtml(input, {
    allowedTags: [], // Pas de balises HTML
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  }).trim();
}

/**
 * Nettoie un texte riche (Markdown-like) : permettre les retours à la ligne et l'italique/gras basique.
 * Utilisé pour les notes de devis, instructions spéciales, etc.
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";

  return sanitizeHtml(input, {
    allowedTags: ["b", "i", "em", "strong", "br", "p", "ul", "li", "ol"],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  }).trim();
}

/**
 * Valide et nettoie une couleur hexadécimale (#RRGGBB).
 */
export function sanitizeHexColor(color: string | null | undefined): string {
  if (!color) return "#1c6df5"; // défaut
  const match = color.match(/^#[0-9A-Fa-f]{6}$/);
  return match ? color.toLowerCase() : "#1c6df5";
}

/**
 * Limite la longueur d'une chaîne et supprime les caractères contrôle.
 */
export function sanitizeString(
  input: string | null | undefined,
  maxLength: number = 255
): string {
  if (!input) return "";
  return input
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, "") // Supprimer caractères contrôle
    .trim();
}
