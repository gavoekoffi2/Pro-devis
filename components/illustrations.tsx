/**
 * Illustrations SVG d'artisans africains — rendu fiable, sans image externe.
 * Palette de peaux variées, tenues de métier réalistes, style premium et chaleureux.
 * Toutes les scènes représentent des artisans africains au travail.
 */

const SKIN = {
  deep: "#6b4226",
  brown: "#8d5524",
  warm: "#a86b3c",
  amber: "#c68642",
};

/* ---------------------------------------------------------------------------
 * HÉRO — Artisan africain qui présente fièrement son devis sur smartphone
 * ------------------------------------------------------------------------- */
export function ArtisanHero({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 440 420"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Artisan africain présentant un devis professionnel sur son téléphone"
    >
      <defs>
        <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef7ff" />
          <stop offset="1" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="heroSun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="phoneScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>

      {/* fond */}
      <circle cx="220" cy="200" r="190" fill="url(#heroBg)" />
      <circle cx="330" cy="90" r="46" fill="url(#heroSun)" opacity="0.85" />

      {/* motif wax africain discret en bas */}
      <g opacity="0.16" fill="#1c6df5">
        <circle cx="70" cy="360" r="6" />
        <circle cx="98" cy="360" r="6" />
        <circle cx="126" cy="360" r="6" />
        <path d="M300 356 l10 -12 l10 12 l-10 12 Z" />
        <path d="M330 356 l10 -12 l10 12 l-10 12 Z" />
      </g>

      {/* personnage principal */}
      <g transform="translate(150 96)">
        {/* corps / gilet haute visibilité */}
        <path d="M20 168 q80 -26 160 0 l-8 116 q-72 18 -144 0 Z" fill="#f59e0b" />
        <rect x="86" y="168" width="28" height="118" fill="#fcd34d" />
        <rect x="30" y="214" width="140" height="10" fill="#f8fafc" opacity="0.85" />
        <rect x="30" y="238" width="140" height="10" fill="#f8fafc" opacity="0.85" />
        {/* cou */}
        <rect x="86" y="128" width="28" height="42" rx="9" fill={SKIN.brown} />
        {/* tête */}
        <circle cx="100" cy="98" r="46" fill={SKIN.warm} />
        {/* cheveux crépus courts */}
        <path
          d="M54 90 q-4 -50 46 -52 q50 2 46 52 q-14 -22 -46 -22 q-32 0 -46 22 Z"
          fill="#241a12"
        />
        {/* casque de chantier */}
        <path d="M50 72 q50 -46 100 0 l7 10 q-57 -12 -114 0 Z" fill="#f5c000" />
        <rect x="46" y="80" width="108" height="10" rx="5" fill="#d4a000" />
        <rect x="94" y="52" width="12" height="12" rx="3" fill="#d4a000" />
        {/* visage souriant */}
        <circle cx="84" cy="98" r="4.5" fill="#1f2937" />
        <circle cx="116" cy="98" r="4.5" fill="#1f2937" />
        <path
          d="M86 116 q14 12 28 0"
          stroke="#4a2c12"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* bras qui tient le téléphone */}
        <path
          d="M172 176 q46 8 40 70"
          stroke={SKIN.warm}
          strokeWidth="24"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* smartphone avec devis à l'écran */}
      <g transform="rotate(9 340 250)">
        <rect x="300" y="176" width="104" height="188" rx="16" fill="#0f172a" />
        <rect x="308" y="186" width="88" height="168" rx="9" fill="url(#phoneScreen)" />
        {/* en-tête devis */}
        <rect x="308" y="186" width="88" height="34" rx="9" fill="#1c6df5" />
        <rect x="318" y="198" width="40" height="6" rx="3" fill="#ffffff" opacity="0.9" />
        <rect x="318" y="208" width="26" height="4" rx="2" fill="#ffffff" opacity="0.6" />
        {/* lignes du devis */}
        <rect x="318" y="232" width="52" height="6" rx="3" fill="#cbd5e1" />
        <rect x="318" y="246" width="68" height="6" rx="3" fill="#e2e8f0" />
        <rect x="318" y="260" width="60" height="6" rx="3" fill="#e2e8f0" />
        <rect x="318" y="274" width="68" height="6" rx="3" fill="#e2e8f0" />
        {/* total surligné */}
        <rect x="318" y="298" width="70" height="14" rx="4" fill="#dcfce7" />
        <rect x="324" y="302" width="40" height="6" rx="3" fill="#16a34a" />
        {/* pastille validée */}
        <circle cx="384" cy="336" r="13" fill="#16a34a" />
        <path
          d="M378 336 l4 4 l8 -8"
          stroke="#fff"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Petite scène métier réutilisable (avatar + outil)
 * ------------------------------------------------------------------------- */
export function TradeAvatar({
  tone = "warm",
  className = "",
  label = "Artisan africain",
}: {
  tone?: keyof typeof SKIN;
  className?: string;
  label?: string;
}) {
  const skin = SKIN[tone];
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      <circle cx="60" cy="60" r="58" fill="#eef7ff" />
      <circle cx="60" cy="54" r="26" fill={skin} />
      <path
        d="M34 50 q-2 -30 26 -31 q28 1 26 31 q-8 -13 -26 -13 q-18 0 -26 13 Z"
        fill="#241a12"
      />
      <circle cx="51" cy="55" r="3" fill="#1f2937" />
      <circle cx="69" cy="55" r="3" fill="#1f2937" />
      <path
        d="M52 66 q8 7 16 0"
        stroke="#4a2c12"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M22 118 q0 -34 38 -34 q38 0 38 34 Z" fill="#1c6df5" />
      <path d="M46 84 h28 v14 q-14 8 -28 0 Z" fill={skin} />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Scène « femme artisan africaine » (menuiserie alu) — diversité
 * ------------------------------------------------------------------------- */
export function ArtisanWoman({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 260"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Femme artisan africaine au travail"
    >
      <circle cx="130" cy="130" r="126" fill="#fef3c7" />
      {/* foulard wax */}
      <path
        d="M92 72 q38 -34 76 0 q6 22 -8 30 q-30 -16 -60 0 q-14 -8 -8 -30 Z"
        fill="#1c6df5"
      />
      <path
        d="M96 74 q34 -26 68 0"
        stroke="#f59e0b"
        strokeWidth="4"
        fill="none"
      />
      {/* visage */}
      <circle cx="130" cy="112" r="34" fill={SKIN.deep} />
      <circle cx="118" cy="112" r="3.5" fill="#1f2937" />
      <circle cx="142" cy="112" r="3.5" fill="#1f2937" />
      <path
        d="M120 126 q10 9 20 0"
        stroke="#3b1f0e"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* boucles d'oreilles */}
      <circle cx="96" cy="120" r="4" fill="#f5c000" />
      <circle cx="164" cy="120" r="4" fill="#f5c000" />
      {/* buste / tenue de travail */}
      <path d="M78 250 q0 -74 52 -74 q52 0 52 74 Z" fill="#16a34a" />
      <rect x="120" y="176" width="20" height="30" fill={SKIN.deep} />
      {/* mètre ruban dans la main */}
      <rect x="150" y="196" width="30" height="30" rx="6" fill="#f59e0b" />
      <rect x="158" y="204" width="14" height="14" rx="2" fill="#fff7ed" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Icône d'étape numérotée
 * ------------------------------------------------------------------------- */
export function StepIcon({ n, color = "#1c6df5" }: { n: number; color?: string }) {
  return (
    <div
      className="h-12 w-12 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-lg"
      style={{ background: color }}
    >
      {n}
    </div>
  );
}
