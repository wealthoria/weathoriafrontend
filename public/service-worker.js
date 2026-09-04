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



   importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDYeZggBRJ1oP8r8yjuNMYYs5VSOX3yfnE",
  authDomain: "wealthoria-6fc11.firebaseapp.com",
  projectId: "wealthoria-6fc11",
  storageBucket: "wealthoria-6fc11.firebasestorage.app",
  messagingSenderId: "141910518023",
  appId: "1:141910518023:web:7198ed847f459cb71ebda2"
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "Wealthoria";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "You have a new notification.",
    icon: "/icons/icon-192.png"
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});


const CACHE_VERSION = "wealthoria-v4";
const PRECACHE = `${CACHE_VERSION}-precache`;
const RUNTIME = `${CACHE_VERSION}-runtime`;

/* keep this list short + certain — anything else is cached at runtime */
const PRECACHE_URLS = [
  "index.html",
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
  // 1) Navigations
if (req.mode === "navigate") {

  event.respondWith(

    fetch(req)
      .then((res) => {

        const pathname =
          new URL(req.url).pathname;

        // Never cache Admin pages
        if (pathname.startsWith("/admin")) {
          return res;
        }

        const copy = res.clone();

        caches.open(RUNTIME)
          .then((c) => c.put(req, copy))
          .catch(() => {});

        return res;
      })

      .catch(() => {

        const pathname =
          new URL(req.url).pathname;

        // Do not show public/offline page for Admin routes
        if (pathname.startsWith("/admin")) {
          return new Response(
            "Admin page unavailable offline.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain"
              }
            }
          );
        }

        return caches.match(req)
          .then((hit) => {

            if (hit) return hit;

            return caches.match("index.html")
              .then((shell) => {

                if (shell) return shell;

                return caches.match("offline.html");
              });

          });

      })

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
