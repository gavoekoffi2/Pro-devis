import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // `lib/` contient des classes utilitaires (badges de statut de
    // `lib/status.ts`). Sans ce chemin, Tailwind les purgeait : les badges
    // « Accepté » (vert) et « Refusé » / « Impayé » (rouge) s'affichaient sans
    // aucune couleur en production.
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8eccff",
          400: "#59afff",
          500: "#338dff",
          600: "#1c6df5",
          700: "#1556e1",
          800: "#1846b6",
          900: "#1a3f8f",
        },
        accent: {
          500: "#16a34a",
          600: "#15803d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
