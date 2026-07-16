/**
 * Limiteur de débit en mémoire (fenêtre glissante).
 *
 * Suffisant pour freiner la force brute sur /api/auth/* sur une instance.
 * (Pour du multi-instance strict, brancher un store partagé type Redis.)
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  // Nettoyage opportuniste pour éviter la croissance sans borne.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  bucket.count++;
  if (bucket.count > max) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** IP du client (derrière proxy Netlify/CDN). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
