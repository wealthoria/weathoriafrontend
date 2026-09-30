/* =========================================================================
   Wealthoria PWA SERVICE-WORKER REGISTRATION

   IMPORTANT:
   This file runs in the normal browser page.
   The Firebase Messaging code belongs in /service-worker.js.
   ========================================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     INSTALL PROMPT CAPTURE
     Chrome/Edge/Android fire "beforeinstallprompt" only when the app is NOT
     installed. We stash the event so the React "Install app" button can use
     it later, and clear it once the app gets installed.
     ----------------------------------------------------------------------- */
  window.__wlInstallEvent = window.__wlInstallEvent || null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    window.__wlInstallEvent = e;
    window.dispatchEvent(new Event("wl-install-change"));
  });

  window.addEventListener("appinstalled", function () {
    window.__wlInstallEvent = null;
    try { localStorage.setItem("wl-pwa-installed", "1"); } catch (err) {}
    window.dispatchEvent(new Event("wl-install-change"));
  });
})();

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