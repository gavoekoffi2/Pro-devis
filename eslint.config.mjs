import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Configuration ESLint (format « flat », ESLint 9).
 *
 * `next lint` a été retiré de Next.js 16 : l'ancien script `npm run lint`
 * échouait systématiquement. On appelle désormais la CLI ESLint directement.
 */
const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Le projet utilise volontairement <img> : les URLs de logo, d'en-tête
      // et de cachet sont saisies librement et ne passent pas par next/image.
      "@next/next/no-img-element": "off",
      // Interface entièrement en français : les apostrophes sont partout
      // ("l'artisan", "d'accord"…). Les échapper une par une rendrait le JSX
      // illisible sans rien apporter — React échappe déjà le rendu.
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default config;
