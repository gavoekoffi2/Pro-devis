/** Conversion d'un entier en toutes lettres (français), pour les devis/factures. */

const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const TENS: Record<number, string> = {
  2: "vingt",
  3: "trente",
  4: "quarante",
  5: "cinquante",
  6: "soixante",
  7: "soixante",
  8: "quatre-vingt",
  9: "quatre-vingt",
};

function below100(n: number): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) {
    // soixante-dix … / quatre-vingt-dix …
    const base = TENS[t]; // "soixante" ou "quatre-vingt"
    const rest = below100(10 + u); // dix..dix-neuf
    return t === 7 ? joinTen(base, rest) : `${base}-${rest}`;
  }
  let word = TENS[t];
  if (u === 0) {
    if (t === 8) word += "s"; // quatre-vingts
    return word;
  }
  if (u === 1 && (t === 2 || t === 3 || t === 4 || t === 5 || t === 6)) {
    return `${word} et un`;
  }
  return `${word}-${UNITS[u]}`;
}

function joinTen(tenWord: string, rest: string) {
  // soixante-dix / soixante et onze
  if (rest === "onze") return `${tenWord} et onze`;
  return `${tenWord}-${rest}`;
}

function below1000(n: number): string {
  if (n < 100) return below100(n);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let word = h === 1 ? "cent" : `${UNITS[h]} cent`;
  if (rest === 0) {
    if (h > 1) word += "s"; // deux cents
    return word;
  }
  return `${word} ${below100(rest)}`;
}

export function numberToFrenchWords(value: number): string {
  let n = Math.round(Math.abs(value || 0));
  if (n === 0) return "zéro";

  const parts: string[] = [];
  const scales: [number, string, string][] = [
    [1_000_000_000, "milliard", "milliards"],
    [1_000_000, "million", "millions"],
    [1_000, "mille", "mille"],
  ];

  for (const [scale, sing, plur] of scales) {
    if (n >= scale) {
      const count = Math.floor(n / scale);
      n %= scale;
      // Au-delà de 999 milliards, le compteur dépasse lui-même 999 : on le
      // décrit récursivement ("mille milliards") au lieu de produire un
      // "dix cents milliards" incorrect.
      const countWords =
        count < 1000 ? below1000(count) : numberToFrenchWords(count);
      if (scale === 1000) {
        // "mille" invariable, et "mille" sans "un"
        parts.push(count === 1 ? "mille" : `${countWords} mille`);
      } else {
        const label = count > 1 ? plur : sing;
        parts.push(`${countWords} ${label}`);
      }
    }
  }
  if (n > 0) parts.push(below1000(n));
  let out = parts.join(" ").trim();
  // "cent" et "quatre-vingt" restent invariables devant mille/million/milliard
  out = out
    .replace(/cents (mille|million|milliard)/g, "cent $1")
    .replace(/quatre-vingts (mille|million|milliard)/g, "quatre-vingt $1");
  return out;
}

/** Montant formaté en toutes lettres avec la devise. Ex: "cent mille francs CFA". */
export function amountInWords(value: number, currency = "FCFA"): string {
  const words = numberToFrenchWords(value);
  const unit = currency === "FCFA" ? "francs CFA" : currency;
  const text = `${words} ${unit}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
