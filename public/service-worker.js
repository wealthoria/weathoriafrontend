/* =========================================================================
   Wealthoria — Service Worker
   Strategy:
     - Precache a small, certain "app shell" (atomic install can't be broken
       by one missing optional file — we use allSettled).
     - Same-origin assets (jsx/css/png/svg/json/html): stale-while-revalidate.
     - Cross-origin CDN + Google Fonts (versioned/immutable): cache-first.
     - Navigations: network-first, fall back to cache, then offline.html.
     - Admin + Member portal routes are NOT intercepted by this service worker.
   Bump CACHE_VERSION on any deploy to roll caches.
   ========================================================================= */


/* =========================================================================
   Firebase Messaging
   ========================================================================= */

importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDYeZggBR1oP8r8yjuNMYYs5VSOX3yfnE",
  authDomain: "wealthoria-6fc11.firebaseapp.com",
  projectId: "wealthoria-6fc11",
  storageBucket: "wealthoria-6fc11.firebasestorage.app",
  messagingSenderId: "141910518023",
  appId: "1:141910518023:web:7198ed847f459cb71ebda2"
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function (payload) {
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


/* =========================================================================
   Cache configuration
   ========================================================================= */

const CACHE_VERSION = "wealthoria-v5";

const PRECACHE = `${CACHE_VERSION}-precache`;
const RUNTIME = `${CACHE_VERSION}-runtime`;


/* =========================================================================
   Precache
   ========================================================================= */

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
  "icons/apple-touch-icon.png"
];


/* =========================================================================
   CDN / Fonts
   ========================================================================= */

const CDN_HOSTS = [
  "unpkg.com",
  "cdnjs.cloudflare.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
];

function isCdn(url) {
  return CDN_HOSTS.some(
    (h) =>
      url.hostname === h ||
      url.hostname.endsWith("." + h)
  );
}


/* =========================================================================
   Install
   ========================================================================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) =>
        // allSettled: a single 404 won't abort the whole install
        Promise.allSettled(
          PRECACHE_URLS.map((u) => cache.add(u))
        )
      )
      .then(() => self.skipWaiting())
  );
});


/* =========================================================================
   Activate
   ========================================================================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k !== PRECACHE &&
                k !== RUNTIME
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});


/* =========================================================================
   Fetch
   ========================================================================= */

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests.
  if (req.method !== "GET") {
    return;
  }

  const url = new URL(req.url);


  /* -----------------------------------------------------------------------
     IMPORTANT:
     Never intercept Admin or Member Portal routes.

     This prevents errors such as:

       The FetchEvent for "/admin/notifications"
       resulted in a network error response.

       TypeError: Failed to convert value to 'Response'

     Admin and Member pages should always be handled directly by the
     browser/Vite/server.
     ----------------------------------------------------------------------- */

  if (
    url.origin === self.location.origin &&
    (
      url.pathname.startsWith("/admin") ||
      url.pathname.startsWith("/members")
    )
  ) {
    return;
  }


  /* -----------------------------------------------------------------------
     1) Navigations
     Network-first -> cache -> offline page
     ----------------------------------------------------------------------- */

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const pathname = new URL(req.url).pathname;

          // Extra protection: never cache Admin pages.
          if (pathname.startsWith("/admin")) {
            return res;
          }

          // Extra protection: never cache Member pages.
          if (pathname.startsWith("/members")) {
            return res;
          }

          const copy = res.clone();

          caches
            .open(RUNTIME)
            .then((c) => c.put(req, copy))
            .catch(() => {});

          return res;
        })

        .catch(() => {
          const pathname =
            new URL(req.url).pathname;

          // Do not show public/offline page for Admin routes.
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

          // Do not show public/offline page for Member routes.
          if (pathname.startsWith("/members")) {
            return new Response(
              "Member portal unavailable offline.",
              {
                status: 503,
                headers: {
                  "Content-Type": "text/plain"
                }
              }
            );
          }

          return caches.match(req).then((hit) => {
            if (hit) {
              return hit;
            }

            return caches
              .match("index.html")
              .then((shell) => {
                if (shell) {
                  return shell;
                }

                return caches.match("offline.html");
              });
          });
        })
    );

    return;
  }


  /* -----------------------------------------------------------------------
     2) Cross-origin CDN + fonts
     Cache-first
     ----------------------------------------------------------------------- */

  if (url.origin !== self.location.origin) {
    if (isCdn(url)) {
      event.respondWith(
        caches.match(req).then((hit) => {
          if (hit) {
            return hit;
          }

          return fetch(req)
            .then((res) => {
              const copy = res.clone();

              caches
                .open(RUNTIME)
                .then((c) => c.put(req, copy))
                .catch(() => {});

              return res;
            })
            .catch(() => hit);
        })
      );
    }

    // Other cross-origin requests:
    // let the browser/network handle them.
    return;
  }


  /* -----------------------------------------------------------------------
     3) Same-origin assets
     Stale-while-revalidate
     ----------------------------------------------------------------------- */

  event.respondWith(
    caches.match(req).then((hit) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();

            caches
              .open(RUNTIME)
              .then((c) => c.put(req, copy))
              .catch(() => {});
          }

          return res;
        })
        .catch(() => hit);

      return hit || fetchPromise;
    })
  );
});


/* =========================================================================
   Message
   ========================================================================= */

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});