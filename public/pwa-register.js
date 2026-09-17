/* =========================================================================
   Wealthoria PWA + Firebase Cloud Messaging Service Worker

   Handles:
     1. Firebase background push notifications
     2. Notification click
     3. PWA caching
     4. Offline fallback
     5. Admin + Member routes are NOT intercepted

   Firebase SDK:
     8.10.1

   IMPORTANT:
     Bump CACHE_VERSION after deployment so browsers receive
     the new service worker.
   ========================================================================= */


/* =========================================================================
   FIREBASE MESSAGING
   ========================================================================= */

importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);


/* =========================================================================
   FIREBASE INITIALIZATION
   ========================================================================= */

firebase.initializeApp({

  apiKey:
    "AIzaSyDYeZggBR1oP8r8yjuNMYYs5VSOX3yfnE",

  authDomain:
    "wealthoria-6fc11.firebaseapp.com",

  projectId:
    "wealthoria-6fc11",

  storageBucket:
    "wealthoria-6fc11.firebasestorage.app",

  messagingSenderId:
    "141910518023",

  appId:
    "1:141910518023:web:7198ed847f459cb71ebda2"

});


const messaging =
  firebase.messaging();


console.log(
  "[Wealthoria SW] Firebase Messaging initialized."
);


/* =========================================================================
   BACKGROUND PUSH NOTIFICATION
   ========================================================================= */

/*
 * Firebase 8.x compatible background message handler.
 *
 * When the Wealthoria page is in the background, minimized,
 * or not currently open, this handler displays the notification.
 */

messaging.setBackgroundMessageHandler(
  function (payload) {

    console.log(
      "[Wealthoria SW] Background FCM message received:",
      payload
    );


    /* ---------------------------------------------------------------------
       GET TITLE
       --------------------------------------------------------------------- */

    const notificationTitle =
      (
        payload &&
        payload.notification &&
        payload.notification.title
      )
        ? payload.notification.title
        : (
            payload &&
            payload.data &&
            payload.data.title
          )
            ? payload.data.title
            : "Wealthoria";


    /* ---------------------------------------------------------------------
       GET BODY
       --------------------------------------------------------------------- */

    const notificationBody =
      (
        payload &&
        payload.notification &&
        payload.notification.body
      )
        ? payload.notification.body
        : (
            payload &&
            payload.data &&
            payload.data.body
          )
            ? payload.data.body
            : "You have a new notification.";


    /* ---------------------------------------------------------------------
       GET CLICK URL
       --------------------------------------------------------------------- */

    const notificationUrl =
      (
        payload &&
        payload.data &&
        payload.data.url
      )
        ? payload.data.url
        : "/members/dashboard";


    /* ---------------------------------------------------------------------
       NOTIFICATION OPTIONS
       --------------------------------------------------------------------- */

    const notificationOptions = {

      body:
        notificationBody,

      icon:
        "/icons/icon-192.png",

      badge:
        "/icons/icon-192.png",

      tag:
        "wealthoria-notification",

      renotify:
        true,

      requireInteraction:
        false,

      data: {

        url:
          notificationUrl

      }

    };


    console.log(
      "[Wealthoria SW] Showing notification:",
      {
        title:
          notificationTitle,

        body:
          notificationBody,

        url:
          notificationUrl
      }
    );


    /* ---------------------------------------------------------------------
       SHOW SYSTEM NOTIFICATION
       --------------------------------------------------------------------- */

    return self.registration.showNotification(

      notificationTitle,

      notificationOptions

    );

  }
);


/* =========================================================================
   NOTIFICATION CLICK
   ========================================================================= */

self.addEventListener(
  "notificationclick",
  function (event) {

    console.log(
      "[Wealthoria SW] Notification clicked."
    );


    /* ---------------------------------------------------------------------
       CLOSE NOTIFICATION
       --------------------------------------------------------------------- */

    event.notification.close();


    /* ---------------------------------------------------------------------
       GET URL
       --------------------------------------------------------------------- */

    const notificationData =
      event.notification &&
      event.notification.data
        ? event.notification.data
        : {};


    const targetUrl =
      notificationData.url ||
      "/members/dashboard";


    console.log(
      "[Wealthoria SW] Opening:",
      targetUrl
    );


    /* ---------------------------------------------------------------------
       FOCUS EXISTING WEALTHORIA TAB
       --------------------------------------------------------------------- */

    event.waitUntil(

      clients
        .matchAll({

          type:
            "window",

          includeUncontrolled:
            true

        })

        .then(
          function (clientList) {

            for (
              const client
              of clientList
            ) {

              if (

                client.url.includes(
                  "wealthoria.in"
                )

              ) {

                if (
                  "focus"
                  in client
                ) {

                  return client
                    .focus()
                    .then(
                      function () {

                        if (
                          "navigate"
                          in client
                        ) {

                          return client.navigate(
                            targetUrl
                          );

                        }

                      }
                    );

                }

              }

            }


            /* -------------------------------------------------------------
               NO EXISTING TAB
               ------------------------------------------------------------- */

            if (
              clients.openWindow
            ) {

              return clients.openWindow(
                targetUrl
              );

            }

          }
        )

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
   CDN / GOOGLE FONTS
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

    console.log(
      "[Wealthoria SW] Installing..."
    );


    event.waitUntil(

      caches

        .open(PRECACHE)

        .then(
          function (cache) {

            /*
             * allSettled prevents one missing optional
             * file from breaking the whole installation.
             */

            return Promise.allSettled(

              PRECACHE_URLS.map(
                function (url) {

                  return cache.add(
                    url
                  );

                }
              )

            );

          }
        )

        .then(
          function () {

            console.log(
              "[Wealthoria SW] Installation complete."
            );


            return self.skipWaiting();

          }
        )

    );

  }
);


/* =========================================================================
   ACTIVATE
   ========================================================================= */

self.addEventListener(
  "activate",
  function (event) {

    console.log(
      "[Wealthoria SW] Activating..."
    );


    event.waitUntil(

      caches

        .keys()

        .then(
          function (keys) {

            return Promise.all(

              keys

                .filter(
                  function (key) {

                    return (

                      key !==
                        PRECACHE &&

                      key !==
                        RUNTIME

                    );

                  }
                )

                .map(
                  function (key) {

                    console.log(
                      "[Wealthoria SW] Removing old cache:",
                      key
                    );


                    return caches.delete(
                      key
                    );

                  }
                )

            );

          }
        )

        .then(
          function () {

            console.log(
              "[Wealthoria SW] Activated."
            );


            return self.clients.claim();

          }
        )

    );

  }
);


/* =========================================================================
   FETCH
   ========================================================================= */

self.addEventListener(
  "fetch",
  function (event) {

    const req =
      event.request;


    /* ---------------------------------------------------------------------
       ONLY GET REQUESTS
       --------------------------------------------------------------------- */

    if (
      req.method !== "GET"
    ) {

      return;

    }


    const url =
      new URL(
        req.url
      );


    /* ---------------------------------------------------------------------
       IMPORTANT:
       NEVER INTERCEPT ADMIN OR MEMBER ROUTES
       --------------------------------------------------------------------- */

    if (

      url.origin ===
        self.location.origin &&

      (

        url.pathname.startsWith(
          "/admin"
        ) ||

        url.pathname.startsWith(
          "/members"
        )

      )

    ) {

      return;

    }


    /* ---------------------------------------------------------------------
       1. NAVIGATION REQUESTS
       ---------------------------------------------------------------------

       Network first
       ↓
       Cache
       ↓
       Offline page
       --------------------------------------------------------------------- */

    if (
      req.mode === "navigate"
    ) {

      event.respondWith(

        fetch(req)

          .then(
            function (res) {

              const pathname =
                new URL(
                  req.url
                ).pathname;


              /* -----------------------------------------------------------
                 NEVER CACHE ADMIN
                 ----------------------------------------------------------- */

              if (
                pathname.startsWith(
                  "/admin"
                )
              ) {

                return res;

              }


              /* -----------------------------------------------------------
                 NEVER CACHE MEMBER
                 ----------------------------------------------------------- */

              if (
                pathname.startsWith(
                  "/members"
                )
              ) {

                return res;

              }


              /* -----------------------------------------------------------
                 CACHE PUBLIC PAGE
                 ----------------------------------------------------------- */

              const copy =
                res.clone();


              caches

                .open(RUNTIME)

                .then(
                  function (cache) {

                    return cache.put(
                      req,
                      copy
                    );

                  }
                )

                .catch(
                  function () {}
                );


              return res;

            }
          )

          .catch(
            function () {

              const pathname =
                new URL(
                  req.url
                ).pathname;


              /* -----------------------------------------------------------
                 ADMIN OFFLINE
                 ----------------------------------------------------------- */

              if (
                pathname.startsWith(
                  "/admin"
                )
              ) {

                return new Response(

                  "Admin page unavailable offline.",

                  {

                    status:
                      503,

                    headers: {

                      "Content-Type":
                        "text/plain"

                    }

                  }

                );

              }


              /* -----------------------------------------------------------
                 MEMBER OFFLINE
                 ----------------------------------------------------------- */

              if (
                pathname.startsWith(
                  "/members"
                )
              ) {

                return new Response(

                  "Member portal unavailable offline.",

                  {

                    status:
                      503,

                    headers: {

                      "Content-Type":
                        "text/plain"

                    }

                  }

                );

              }


              /* -----------------------------------------------------------
                 CACHE FALLBACK
                 ----------------------------------------------------------- */

              return caches

                .match(req)

                .then(
                  function (hit) {

                    if (hit) {

                      return hit;

                    }


                    return caches

                      .match(
                        "index.html"
                      )

                      .then(
                        function (shell) {

                          if (shell) {

                            return shell;

                          }


                          return caches.match(
                            "offline.html"
                          );

                        }
                      );

                  }
                );

            }
          )

      );


      return;

    }


    /* ---------------------------------------------------------------------
       2. CROSS-ORIGIN CDN + GOOGLE FONTS
       --------------------------------------------------------------------- */

    if (
      url.origin !==
      self.location.origin
    ) {

      if (
        isCdn(url)
      ) {

        event.respondWith(

          caches

            .match(req)

            .then(
              function (hit) {

                if (hit) {

                  return hit;

                }


                return fetch(req)

                  .then(
                    function (res) {

                      const copy =
                        res.clone();


                      caches

                        .open(RUNTIME)

                        .then(
                          function (cache) {

                            return cache.put(
                              req,
                              copy
                            );

                          }
                        )

                        .catch(
                          function () {}
                        );


                      return res;

                    }
                  )

                  .catch(
                    function () {

                      return hit;

                    }
                  );

              }
            )

        );

      }


      /* ---------------------------------------------------------------
         Other cross-origin requests:
         Let browser/network handle them.
         --------------------------------------------------------------- */

      return;

    }


    /* ---------------------------------------------------------------------
       3. SAME-ORIGIN ASSETS
       STALE-WHILE-REVALIDATE
       --------------------------------------------------------------------- */

    event.respondWith(

      caches

        .match(req)

        .then(
          function (hit) {

            const fetchPromise =

              fetch(req)

                .then(
                  function (res) {

                    if (

                      res &&

                      res.status === 200

                    ) {

                      const copy =
                        res.clone();


                      caches

                        .open(RUNTIME)

                        .then(
                          function (cache) {

                            return cache.put(
                              req,
                              copy
                            );

                          }
                        )

                        .catch(
                          function () {}
                        );

                    }


                    return res;

                  }
                )

                .catch(
                  function () {

                    return hit;

                  }
                );


            return (
              hit ||
              fetchPromise
            );

          }
        )

    );

  }
);


/* =========================================================================
   SERVICE WORKER MESSAGE
   ========================================================================= */

self.addEventListener(
  "message",
  function (event) {

    if (
      event.data ===
      "SKIP_WAITING"
    ) {

      console.log(
        "[Wealthoria SW] SKIP_WAITING received."
      );


      self.skipWaiting();

    }

  }
);


/* =========================================================================
   READY
   ========================================================================= */

console.log(
  "🔥 Wealthoria Service Worker loaded successfully."
);

console.log(
  "🔥 Firebase background push handler is ready."
);