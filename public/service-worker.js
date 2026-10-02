/* =========================================================================
   Wealthoria — Firebase Messaging Service Worker

   Same Firebase version as the app (package.json -> firebase 12.16.0).
   ========================================================================= */

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js"
);


/* =========================================================================
   FIREBASE CONFIG (must match src/firebase.js)
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
   BUILD THE POPUP
   Used for background pushes here, and by the page for foreground pushes
   (see public/firebase/notifications.js), so both look the same.
   ========================================================================= */

function buildWealthoriaNotification(payload) {

  const data = payload?.data || {};

  const title =
    data.title ||
    payload?.notification?.title ||
    "Wealthoria";

  const body =
    data.body ||
    payload?.notification?.body ||
    "You have a new notification.";

  return {
    title,
    options: {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",

      // One popup per notification (a shared tag would replace the previous one).
      tag: data.tag || `wealthoria-${Date.now()}`,
      renotify: true,

      // Heads-up popup on phones: sound + vibration, stays until tapped.
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
   ========================================================================= */
messaging.onBackgroundMessage(function (payload) {

  console.log("[Wealthoria SW] Background message received:", payload);

  const notification =
    buildWealthoriaNotification(payload);

  return self.registration.showNotification(
    notification.title,
    notification.options
  );
});


/* =========================================================================
   FOREGROUND POPUP REQUEST FROM THE PAGE
   Android Chrome cannot show `new Notification()` from a page, so the page
   asks the service worker to show it.
   ========================================================================= */

self.addEventListener("message", function (event) {

  if (event.data?.type !== "WEALTHORIA_SHOW_NOTIFICATION") {
    return;
  }

  const notification =
    buildWealthoriaNotification(event.data.payload);

  event.waitUntil(
    self.registration.showNotification(
      notification.title,
      notification.options
    )
  );
});


/* =========================================================================
   NOTIFICATION CLICK
   ========================================================================= */

self.addEventListener(
  "notificationclick",
  function (event) {

    event.notification.close();

    const targetUrl = new URL(
      event.notification?.data?.url || "/members/dashboard",
      self.location.origin
    ).href;

    const isSiteUrl =
      targetUrl.startsWith(self.location.origin);

    event.waitUntil((async function () {

      const clientList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      // Wealthoria already open: reuse that tab.
      for (const client of clientList) {

        if (
          new URL(client.url).origin === self.location.origin &&
          "focus" in client
        ) {

          await client.focus();

          if (!isSiteUrl) {
            // Content link (video/PDF) on another site: open it separately.
            return clients.openWindow ? clients.openWindow(targetUrl) : undefined;
          }

          if ("navigate" in client && client.url !== targetUrl) {
            try {
              await client.navigate(targetUrl);
            } catch (error) {
              // Navigation can be refused for uncontrolled tabs; focus is enough.
            }
          }

          return;
        }
      }

      // Otherwise open Wealthoria.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

    })());
  }
);


/* =========================================================================
   CACHE CONFIGURATION
   ========================================================================= */

const CACHE_VERSION =
  "wealthoria-v13";

const PRECACHE =
  `${CACHE_VERSION}-precache`;

const RUNTIME =
  `${CACHE_VERSION}-runtime`;


/* =========================================================================
   PRECACHE
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
   CDN / FONTS
   ========================================================================= */

const CDN_HOSTS = [

  "unpkg.com",

  "cdnjs.cloudflare.com",

  "fonts.googleapis.com",

  "fonts.gstatic.com"

];


function isCdn(url) {

  return CDN_HOSTS.some(
    function (host) {

      return (
        url.hostname === host ||
        url.hostname.endsWith(
          "." + host
        )
      );

    }
  );

}


/* =========================================================================
   INSTALL
   ========================================================================= */

self.addEventListener(
  "install",
  function (event) {

    event.waitUntil(

      caches
        .open(PRECACHE)

        .then(function (cache) {

          return Promise.allSettled(

            PRECACHE_URLS.map(
              function (url) {

                return cache.add(url);

              }
            )

          );

        })

        .then(function () {

          return self.skipWaiting();

        })

    );

  }
);


/* =========================================================================
   ACTIVATE
   ========================================================================= */

self.addEventListener(
  "activate",
  function (event) {

    event.waitUntil(

      caches
        .keys()

        .then(function (keys) {

          return Promise.all(

            keys

              .filter(function (key) {

                return (
                  key !== PRECACHE &&
                  key !== RUNTIME
                );

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

  }
);


/* =========================================================================
   FETCH
   ========================================================================= */

self.addEventListener(
  "fetch",
  function (event) {

    const request =
      event.request;


    if (
      request.method !== "GET"
    ) {

      return;
    }


    const url =
      new URL(request.url);


    /* -------------------------------------------------------
       Never intercept Admin / Member routes
       ------------------------------------------------------- */

    if (
      url.origin === self.location.origin &&
      (
        url.pathname.startsWith("/admin") ||
        url.pathname.startsWith("/members")
      )
    ) {

      return;
    }


    /* -------------------------------------------------------
       Navigation
       ------------------------------------------------------- */

    if (
      request.mode === "navigate"
    ) {

      event.respondWith(

        fetch(request)

          .then(function (response) {

            const pathname =
              new URL(
                request.url
              ).pathname;


            if (
              pathname.startsWith(
                "/admin"
              ) ||
              pathname.startsWith(
                "/members"
              )
            ) {

              return response;
            }


            const copy =
              response.clone();


            caches
              .open(RUNTIME)
              .then(function (cache) {

                return cache.put(
                  request,
                  copy
                );

              })
              .catch(function () { });


            return response;

          })

          .catch(function () {

            const pathname =
              new URL(
                request.url
              ).pathname;


            if (
              pathname.startsWith(
                "/admin"
              )
            ) {

              return new Response(
                "Admin page unavailable offline.",
                {
                  status: 503,

                  headers: {
                    "Content-Type":
                      "text/plain"
                  }
                }
              );

            }


            if (
              pathname.startsWith(
                "/members"
              )
            ) {

              return new Response(
                "Member portal unavailable offline.",
                {
                  status: 503,

                  headers: {
                    "Content-Type":
                      "text/plain"
                  }
                }
              );

            }


            return caches
              .match(request)

              .then(function (cached) {

                if (cached) {
                  return cached;
                }


                return caches
                  .match(
                    "index.html"
                  )

                  .then(function (shell) {

                    if (shell) {
                      return shell;
                    }


                    return caches.match(
                      "offline.html"
                    );

                  });

              });

          })

      );


      return;
    }


    /* -------------------------------------------------------
       Cross-origin CDN
       ------------------------------------------------------- */

    if (
      url.origin !==
      self.location.origin
    ) {

      if (
        isCdn(url)
      ) {

        event.respondWith(

          caches
            .match(request)

            .then(function (cached) {

              if (cached) {
                return cached;
              }


              return fetch(request)

                .then(function (response) {

                  const copy =
                    response.clone();


                  caches
                    .open(RUNTIME)

                    .then(function (cache) {

                      return cache.put(
                        request,
                        copy
                      );

                    })

                    .catch(function () { });


                  return response;

                })

                .catch(function () {

                  return cached;

                });

            })

        );

      }


      return;
    }


    /* -------------------------------------------------------
       Same-origin assets
       ------------------------------------------------------- */

    event.respondWith(

      caches
        .match(request)

        .then(function (cached) {

          const fetchPromise =
            fetch(request)

              .then(function (response) {

                if (
                  response &&
                  response.status === 200
                ) {

                  const copy =
                    response.clone();


                  caches
                    .open(RUNTIME)

                    .then(function (cache) {

                      return cache.put(
                        request,
                        copy
                      );

                    })

                    .catch(function () { });

                }


                return response;

              })

              .catch(function () {

                return cached;

              });


          return (
            cached ||
            fetchPromise
          );

        })

    );

  }
);


/* =========================================================================
   MESSAGE
   ========================================================================= */

self.addEventListener(
  "message",
  function (event) {

    if (
      event.data ===
      "SKIP_WAITING"
    ) {

      self.skipWaiting();

    }

  }
);


