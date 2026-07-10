/** @type {import('next').NextConfig} */

// En-têtes de sécurité appliqués à toutes les réponses.
const securityHeaders = [
  // Empêche l'affichage du site dans une iframe (anti-clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Bloque le MIME-sniffing du navigateur.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ne divulgue pas l'URL de provenance vers les sites externes.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restreint l'accès aux API sensibles du navigateur.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Force HTTPS (2 ans, sous-domaines inclus).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // ne pas exposer "X-Powered-By: Next.js"
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
