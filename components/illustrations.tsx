/* Illustrations SVG d'artisans africains — rendu fiable, sans image externe. */

export function ArtisanHero({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 360"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Artisan africain avec un devis"
    >
      {/* fond */}
      <circle cx="200" cy="180" r="170" fill="#eef7ff" />
      <circle cx="200" cy="180" r="130" fill="#dbeafe" />

      {/* document devis flottant */}
      <g transform="rotate(-8 90 120)">
        <rect x="34" y="70" width="120" height="150" rx="10" fill="#fff" stroke="#cbd5e1" />
        <rect x="34" y="70" width="120" height="30" rx="10" fill="#1c6df5" />
        <rect x="48" y="115" width="60" height="7" rx="3.5" fill="#cbd5e1" />
        <rect x="48" y="132" width="92" height="7" rx="3.5" fill="#e2e8f0" />
        <rect x="48" y="149" width="80" height="7" rx="3.5" fill="#e2e8f0" />
        <rect x="48" y="172" width="92" height="7" rx="3.5" fill="#16a34a" />
        <circle cx="132" cy="200" r="12" fill="#16a34a" />
        <path d="M126 200 l4 4 l8 -8" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* personnage */}
      <g transform="translate(190 110)">
        {/* corps / gilet */}
        <path d="M30 150 q60 -20 120 0 l-6 90 q-54 14 -108 0 Z" fill="#f59e0b" />
        <rect x="78" y="150" width="24" height="92" fill="#fcd34d" />
        {/* bandes réfléchissantes */}
        <rect x="40" y="190" width="100" height="8" fill="#e2e8f0" opacity="0.7" />
        {/* cou */}
        <rect x="78" y="120" width="24" height="34" rx="8" fill="#8d5524" />
        {/* tête (peau brune) */}
        <circle cx="90" cy="96" r="40" fill="#a86b3c" />
        {/* cheveux */}
        <path d="M52 86 q-2 -42 38 -44 q40 2 38 44 q-10 -18 -38 -18 q-28 0 -38 18 Z" fill="#2b2118" />
        {/* casque de chantier jaune */}
        <path d="M44 70 q46 -40 92 0 l6 8 q-52 -10 -104 0 Z" fill="#f5c000" />
        <rect x="40" y="76" width="100" height="9" rx="4" fill="#d4a000" />
        {/* visage */}
        <circle cx="76" cy="96" r="4" fill="#1f2937" />
        <circle cx="104" cy="96" r="4" fill="#1f2937" />
        <path d="M80 112 q10 8 20 0" stroke="#5b3a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* bras qui présente */}
        <path d="M150 160 q40 6 44 46" stroke="#a86b3c" strokeWidth="20" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function StepIcon({ n, color = "#1c6df5" }: { n: number; color?: string }) {
  return (
    <div
      className="h-12 w-12 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow"
      style={{ background: color }}
    >
      {n}
    </div>
  );
}
