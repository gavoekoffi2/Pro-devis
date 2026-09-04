/** Schémas de validation réutilisables (saisies utilisateur). */
import { z } from "zod";

/**
 * URL d'image fournie par l'utilisateur (logo, en-tête, signature).
 *
 * Ces valeurs finissent dans un attribut `src`. On n'accepte donc que
 * `http(s)` et les `data:image/...` : un `javascript:` ou un `data:text/html`
 * n'a rien à faire là, même si les navigateurs modernes ne l'exécutent pas
 * dans une balise `<img>`.
 */
export const imageUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) =>
      v === "" ||
      /^https?:\/\//i.test(v) ||
      /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);/i.test(v),
    "URL d'image invalide (http(s):// ou data:image/… attendu)"
  )
  .transform((v) => (v === "" ? null : v));

/** Couleur hexadécimale #rgb ou #rrggbb. */
export const hexColor = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Couleur invalide");

/** Texte court borné ; chaîne vide → null. */
export const boundedText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Texte trop long (max. ${max} caractères)`)
    .transform((v) => (v === "" ? null : v));
