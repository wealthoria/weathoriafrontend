/* =========================================================================
   Wealthoria PWA SERVICE-WORKER REGISTRATION

   IMPORTANT:
   This file runs in the normal browser page.
   The Firebase Messaging code belongs in /service-worker.js.
   ========================================================================= */

(function () {
  "use strict";

  // Check browser support
  if (!("serviceWorker" in navigator)) {
    console.warn(
      "[Wealthoria PWA] Service workers are not supported."
    );
    return;
  }

  // Register service worker after page has loaded
  window.addEventListener("load", async function () {
    try {
      const registration =
        await navigator.serviceWorker.register(
          "/service-worker.js",
          {
            scope: "/"
          }
        );

      console.log(
        "[Wealthoria PWA] Service worker registered:",
        registration.scope
      );

      // Watch for a new service-worker version
      registration.addEventListener(
        "updatefound",
        function () {
          const worker = registration.installing;

          if (!worker) {
            return;
          }

          worker.addEventListener(
            "statechange",
            function () {
              if (
                worker.state === "installed" &&
                navigator.serviceWorker.controller &&
                registration.waiting
              ) {
                registration.waiting.postMessage(
                  "SKIP_WAITING"
                );
              }
            }
          );
        }
      );

      // Ask browser to check for an updated service worker
      if (
        typeof registration.update === "function"
      ) {
        registration.update().catch(function () {});
      }

    } catch (error) {
      console.error(
        "[Wealthoria PWA] Service worker registration failed:",
        error
      );
    }
  });

})();