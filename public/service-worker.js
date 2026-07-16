/* =========================================================================
   Wealthoria — Service Worker
   Strategy:
     - Precache a small, certain "app shell" (atomic install can't be broken
       by one missing optional file — we use allSettled).
     - Same-origin assets (jsx/css/png/svg/json/html): stale-while-revalidate.
     - Cross-origin CDN + Google Fonts (versioned/immutable): cache-first.
     - Navigations: network-first, fall back to cache, then offline.html.
   Bump CACHE_VERSION on any deploy to roll caches.
   ========================================================================= */
const CACHE_VERSION = "wealthoria-v1";
const PRECACHE = `${CACHE_VERSION}-precache`;
const RUNTIME = `${CACHE_VERSION}-runtime`;

/* keep this list short + certain — anything else is cached at runtime */
const PRECACHE_URLS = [
  "Wealthoria.html",
  "offline.html",
  "manifest.webmanifest",
  "assets/colors_and_type.css",
  "app/site.css",
  "assets/logo-mark.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-192-any.png",
  "icons/icon-512-any.png",
  "icons/apple-touch-icon.png",
];

const CDN_HOSTS = ["unpkg.com", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) =>
      // allSettled: a single 404 won't abort the whole install
      Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== PRECACHE && k !== RUNTIME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isCdn(url) { return CDN_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith("." + h)); }

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 1) Navigations -> network-first, fall back to cached page, then offline.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("Wealthoria.html").then((s) => s || caches.match("offline.html")))
        )
    );
    return;
  }

  // 2) Cross-origin CDN + fonts -> cache-first (immutable, versioned URLs)
  if (url.origin !== self.location.origin) {
    if (isCdn(url)) {
      event.respondWith(
        caches.match(req).then((hit) =>
          hit || fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
            return res;
          }).catch(() => hit)
        )
      );
    }
    return; // other cross-origin: let the network handle it
  }

  // 3) Same-origin assets -> stale-while-revalidate
  event.respondWith(
    caches.match(req).then((hit) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || fetchPromise;
    })
  );
});

/* allow the page to trigger an immediate update */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
