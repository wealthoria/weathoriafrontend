/* =========================================================================
   Wealthoria — Service Worker

   Handles:
     1. Firebase background push messages
     2. Foreground notification requests from the page
     3. Notification click (focus / navigate existing tab)
     4. PWA caching (precache + runtime CDN cache)

   Firebase version: 12.16.0  (must match src/firebase.js)
   ========================================================================= */

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js"
);


/* =========================================================================
   FIREBASE CONFIG  (must match src/firebase.js)
   ========================================================================= */

firebase.initializeApp({
  apiKey: "AIzaSyDYeZggBRJ1oP8r8yjuNMYYs5VSOX3yfnE",
  authDomain: "wealthoria-6fc11.firebaseapp.com",
  projectId: "wealthoria-6fc11",
  storageBucket: "wealthoria-6fc11.firebasestorage.app",
  messagingSenderId: "141910518023",
  appId: "1:141910518023:web:7198ed847f459cb71ebda2"
});

const messaging = firebase.messaging();


/* =========================================================================
   NOTIFICATION BUILDER
   Shared by background push (below) and foreground page request (message).
   ========================================================================= */

function buildWealthoriaNotification(payload) {
  const data = (payload && payload.data) ? payload.data : {};

  const title =
    data.title ||
    (payload && payload.notification && payload.notification.title) ||
    "Wealthoria";

  const body =
    data.body ||
    (payload && payload.notification && payload.notification.body) ||
    "You have a new notification.";

  return {
    title: title,
    options: {
      body: body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",

      // Each notification gets its own tag so they stack (no silent replace).
      tag: data.tag || ("wealthoria-" + Date.now()),
      renotify: true,

      // Keeps the heads-up banner on screen until the user taps it.
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),

      data: {
        url: data.url || "/members/dashboard"
      }
    }
  };
}


/* =========================================================================
   BACKGROUND PUSH NOTIFICATION
   Fires when the app is closed or the tab is in the background.
   ========================================================================= */

messaging.onBackgroundMessage(function (payload) {
  const n = buildWealthoriaNotification(payload);
  return self.registration.showNotification(n.title, n.options);
});


/* =========================================================================
   MESSAGE HANDLER
   Combines WEALTHORIA_SHOW_NOTIFICATION (foreground display) and
   SKIP_WAITING (PWA update) in one listener.
   ========================================================================= */

self.addEventListener("message", function (event) {

  /* -----------------------------------------------------------------------
     PWA update — page sends "SKIP_WAITING" when a new SW is waiting.
     ----------------------------------------------------------------------- */
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  /* -----------------------------------------------------------------------
     Foreground notification — Android Chrome cannot call new Notification()
     from a page context, so the page asks the SW to show it.
     ----------------------------------------------------------------------- */
  if (event.data && event.data.type === "WEALTHORIA_SHOW_NOTIFICATION") {
    const n = buildWealthoriaNotification(event.data.payload);
    event.waitUntil(
      self.registration.showNotification(n.title, n.options)
    );
  }

});


/* =========================================================================
   NOTIFICATION CLICK
   Focus an existing Wealthoria tab or open a new one.
   ========================================================================= */

self.addEventListener("notificationclick", function (event) {

  event.notification.close();

  const targetUrl = new URL(
    (event.notification.data && event.notification.data.url) || "/members/dashboard",
    self.location.origin
  ).href;

  const isSiteUrl = targetUrl.startsWith(self.location.origin);

  event.waitUntil((async function () {

    const clientList = await clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    // Reuse an existing Wealthoria tab.
    for (const client of clientList) {
      if (
        new URL(client.url).origin === self.location.origin &&
        "focus" in client
      ) {
        await client.focus();

        if (!isSiteUrl) {
          // External content link — open separately.
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
          return;
        }

        if ("navigate" in client && client.url !== targetUrl) {
          try {
            await client.navigate(targetUrl);
          } catch (_) {
            // Uncontrolled tabs may refuse navigation; focus is enough.
          }
        }

        return;
      }
    }

    // No open tab — open Wealthoria.
    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }

  })());

});


/* =========================================================================
   CACHE CONFIGURATION
   ========================================================================= */

const CACHE_VERSION = "wealthoria-v13";
const PRECACHE      = CACHE_VERSION + "-precache";
const RUNTIME       = CACHE_VERSION + "-runtime";


/* =========================================================================
   PRECACHE URLS
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
   CDN HOSTS  (cache-first for fonts and third-party scripts)
   ========================================================================= */

const CDN_HOSTS = [
  "unpkg.com",
  "cdnjs.cloudflare.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
];

function isCdn(url) {
  return CDN_HOSTS.some(function (host) {
    return (
      url.hostname === host ||
      url.hostname.endsWith("." + host)
    );
  });
}


/* =========================================================================
   INSTALL
   ========================================================================= */

self.addEventListener("install", function (event) {

  event.waitUntil(
    caches
      .open(PRECACHE)
      .then(function (cache) {
        // allSettled so a single missing asset does not abort install.
        return Promise.allSettled(
          PRECACHE_URLS.map(function (url) {
            return cache.add(url);
          })
        );
      })
      .then(function () {
        return self.skipWaiting();
      })
  );

});


/* =========================================================================
   ACTIVATE
   ========================================================================= */

self.addEventListener("activate", function (event) {

  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== PRECACHE && key !== RUNTIME;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );

});


/* =========================================================================
   FETCH
   ========================================================================= */

self.addEventListener("fetch", function (event) {

  const request = event.request;

  // Only intercept GET requests.
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /* -----------------------------------------------------------------------
     Never intercept Admin or Member API / page routes — they require fresh
     server data on every load and must not be served from cache.
     ----------------------------------------------------------------------- */
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/admin") ||
     url.pathname.startsWith("/members"))
  ) {
    return;
  }


  /* -----------------------------------------------------------------------
     Navigation — network first, fall back to cached shell / offline page.
     ----------------------------------------------------------------------- */
  if (request.mode === "navigate") {

    event.respondWith(
      fetch(request)
        .then(function (response) {
          const pathname = new URL(request.url).pathname;

          // Admin / member navigations: return network response directly.
          if (
            pathname.startsWith("/admin") ||
            pathname.startsWith("/members")
          ) {
            return response;
          }

          // Cache other pages for offline fallback.
          const copy = response.clone();
          caches
            .open(RUNTIME)
            .then(function (cache) {
              return cache.put(request, copy);
            })
            .catch(function () {});

          return response;
        })
        .catch(function () {
          const pathname = new URL(request.url).pathname;

          if (pathname.startsWith("/admin")) {
            return new Response(
              "Admin page unavailable offline.",
              { status: 503, headers: { "Content-Type": "text/plain" } }
            );
          }

          if (pathname.startsWith("/members")) {
            return new Response(
              "Member portal unavailable offline.",
              { status: 503, headers: { "Content-Type": "text/plain" } }
            );
          }

          return caches
            .match(request)
            .then(function (cached) {
              if (cached) return cached;
              return caches
                .match("index.html")
                .then(function (shell) {
                  return shell || caches.match("offline.html");
                });
            });
        })
    );

    return;
  }


  /* -----------------------------------------------------------------------
     Cross-origin CDN — cache first, then network.
     ----------------------------------------------------------------------- */
  if (url.origin !== self.location.origin) {

    if (isCdn(url)) {
      event.respondWith(
        caches
          .match(request)
          .then(function (cached) {
            if (cached) return cached;

            return fetch(request)
              .then(function (response) {
                const copy = response.clone();
                caches
                  .open(RUNTIME)
                  .then(function (cache) {
                    return cache.put(request, copy);
                  })
                  .catch(function () {});

                return response;
              })
              .catch(function () {
                // CDN offline — nothing to serve.
              });
          })
      );
    }

    return;
  }


  /* -----------------------------------------------------------------------
     Same-origin assets — stale-while-revalidate.
     Serve cached copy immediately while fetching a fresh copy in background.
     ----------------------------------------------------------------------- */
  event.respondWith(
    caches
      .match(request)
      .then(function (cached) {

        const fetchPromise =
          fetch(request)
            .then(function (response) {
              if (response && response.status === 200) {
                const copy = response.clone();
                caches
                  .open(RUNTIME)
                  .then(function (cache) {
                    return cache.put(request, copy);
                  })
                  .catch(function () {});
              }
              return response;
            })
            .catch(function () {
              return cached;
            });

        // Return cached copy immediately; background fetch updates the cache.
        return cached || fetchPromise;
      })
  );

});
