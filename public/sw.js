// Service worker minimal pour Pro Devis (installable + tolérance hors-ligne).
// Incrémenter CACHE à chaque changement du contenu pré-caché.
const CACHE = "prodevis-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // `addAll` échoue en bloc si une seule ressource manque : on installe
      // chaque entrée séparément pour ne jamais bloquer l'installation.
      .then((cache) =>
        Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/** Réponse de repli quand le réseau et le cache sont tous deux indisponibles. */
function offlineFallback() {
  return caches.match(OFFLINE_URL).then(
    (cached) =>
      cached ||
      // `caches.match` peut renvoyer `undefined` (cache vidé par le
      // navigateur) : `respondWith(undefined)` lèverait une erreur réseau.
      new Response(
        "<!doctype html><meta charset=\"utf-8\"><title>Hors ligne</title>" +
          "<p style=\"font-family:system-ui;padding:2rem;text-align:center\">" +
          "Vous êtes hors ligne. Reconnectez-vous pour continuer.</p>",
        { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
      )
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  // Ne jamais servir de contenu d'une autre origine depuis notre cache.
  if (url.origin !== self.location.origin) return;

  // Navigation : réseau d'abord, repli sur la page hors-ligne.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => offlineFallback()));
    return;
  }

  // Ressources statiques : cache d'abord, puis réseau (et mise en cache).
  if (url.pathname.startsWith("/_next/static") || url.pathname.endsWith(".svg")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            // Seules les réponses complètes et valides sont mises en cache.
            if (res && res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
  }
});
