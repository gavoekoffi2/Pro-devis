/**
 * Limiteur de débit léger (in-memory, fenêtre glissante).
 *
 * ⚠️ Portée : ce store est en mémoire par instance. Sur un déploiement
 * serverless multi-instances (Netlify, Vercel), il faut le remplacer par un
 * store partagé (Redis / Upstash / Vercel KV) pour une protection stricte.
 * Il reste néanmoins une première barrière utile contre les rafales.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Nettoyage périodique pour éviter une fuite mémoire.
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

/**
 * Vérifie et incrémente le compteur pour une clé donnée.
 * @param key    identifiant (ex: "login:1.2.3.4" ou "register:email")
 * @param limit  nombre d'actions autorisées dans la fenêtre
 * @param windowMs durée de la fenêtre en millisecondes
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

/**
 * Extrait l'IP cliente d'une requête (derrière proxy/CDN).
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-nf-client-connection-ip") ||
    "unknown"
  );
}
