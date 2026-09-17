/* =========================================================================
   Wealthoria — Firebase Messaging Service Worker
   ========================================================================= */

importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);


/* =========================================================================
   FIREBASE CONFIG
   ========================================================================= */

firebase.initializeApp({
  apiKey: "AIzaSyDYeZggBR1oP8r8yjuNMYYs5VSOX3yfnE",
  authDomain: "wealthoria-6fc11.firebaseapp.com",
  projectId: "wealthoria-6fc11",
  storageBucket: "wealthoria-6fc11.firebasestorage.app",
  messagingSenderId: "141910518023",
  appId: "1:141910518023:web:7198ed847f459cb71ebda2"
});


const messaging = firebase.messaging();


/* =========================================================================
   BACKGROUND PUSH NOTIFICATION
   ========================================================================= */

messaging.onBackgroundMessage(function (payload) {

  console.log(
    "[Wealthoria SW] Background message received:",
    payload
  );


  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    "Wealthoria";


  const notificationBody =
    payload.notification?.body ||
    payload.data?.body ||
    "You have a new notification.";


  const notificationOptions = {

    body: notificationBody,

    icon: "/icons/icon-192.png",

    badge: "/icons/icon-192.png",

    tag: "wealthoria-notification",

    renotify: true,

    data: {
      url:
        payload.data?.url ||
        "/members/dashboard"
    }

  };


  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});


/* =========================================================================
   NOTIFICATION CLICK
   ========================================================================= */

self.addEventListener(
  "notificationclick",
  function (event) {

    console.log(
      "[Wealthoria SW] Notification clicked"
    );


    event.notification.close();


    const targetUrl =
      event.notification?.data?.url ||
      "/members/dashboard";


    event.waitUntil(

      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })

        .then(function (clientList) {

          // ---------------------------------------------------
          // If Wealthoria is already open, focus it
          // ---------------------------------------------------

          for (
            const client of clientList
          ) {

            if (
              client.url.includes(
                "wealthoria.in"
              ) &&
              "focus" in client
            ) {

              return client.focus();
            }
          }


          // ---------------------------------------------------
          // Otherwise open Wealthoria
          // ---------------------------------------------------

          if (
            clients.openWindow
          ) {

            return clients.openWindow(
              targetUrl
            );
          }

        })

    );
  }
);


/* =========================================================================
   CACHE CONFIGURATION
   ========================================================================= */

const CACHE_VERSION =
  "wealthoria-v6";

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
              .catch(function () {});


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

                    .catch(function () {});


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

                    .catch(function () {});

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


console.log(
  "🔥 Wealthoria Firebase Messaging Service Worker loaded."
);