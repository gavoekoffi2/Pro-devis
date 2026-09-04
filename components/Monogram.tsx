import { initials, contrastText, shade } from "@/lib/brand";

type Props = {
  name: string;
  color?: string;
  style?: string; // modern | rounded | square | circle | badge
  size?: number;
  icon?: string; // emoji métier optionnel
};

/**
 * Logo généré automatiquement (monogramme SVG) à partir du nom de l'entreprise,
 * d'une couleur et d'un style. Utilisé quand l'artisan n'a pas de logo.
 */
export function Monogram({
  name,
  color = "#1c6df5",
  style = "modern",
  size = 64,
  icon,
}: Props) {
  const text = initials(name);
  const fg = contrastText(color);
  const dark = shade(color, -0.18);
  const id = `g-${text}-${color.replace("#", "")}`;
  const radius =
    style === "circle"
      ? size / 2
      : style === "square"
        ? 4
        : style === "badge"
          ? 14
          : 14; // modern / rounded

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Logo ${name}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx={radius}
        fill={style === "modern" || style === "badge" ? `url(#${id})` : color}
      />
      {style === "badge" && (
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx={radius}
          fill="none"
          stroke={fg}
          strokeOpacity="0.35"
          strokeWidth="2"
        />
      )}
      <text
        x="32"
        y={icon ? 30 : 34}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        fontSize={text.length > 1 ? 24 : 30}
        fill={fg}
      >
        {text}
      </text>
      {icon && (
        <text
          x="32"
          y="48"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
        >
          {icon}
        </text>
      )}
    </svg>
  );
}
