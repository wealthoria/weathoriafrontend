/* =========================================================================
   Wealthoria PWA — service-worker registration + install affordance.
   Drop-in: <script src="pwa-register.js" defer></script>
   Self-contained (injects its own styles). Shows a small "Install app" pill
   only when the browser reports the app is installable; hides after install.
   ========================================================================= */
(function () {
  // 1) register the service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").then(function (reg) {
        // when a new SW is ready, activate it on next load silently
        reg.addEventListener("updatefound", function () {
          var sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", function () {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              reg.waiting && reg.waiting.postMessage("SKIP_WAITING");
            }
          });
        });
      }).catch(function () { /* offline-first is best-effort */ });
    });
  }

  // 2) install prompt handling
  var deferred = null;

  function injectStyles() {
    if (document.getElementById("pwa-install-style")) return;
    var s = document.createElement("style");
    s.id = "pwa-install-style";
    s.textContent =
      ".pwa-install{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(140%);" +
      "z-index:120;display:inline-flex;align-items:center;gap:11px;background:#0e0f0c;color:#fff;" +
      "padding:11px 14px 11px 16px;border-radius:999px;box-shadow:0 14px 40px rgba(8,10,7,.28);" +
      "font-family:Inter,system-ui,sans-serif;font-size:14px;transition:transform .32s cubic-bezier(.22,1,.36,1);max-width:calc(100vw - 28px)}" +
      ".pwa-install.show{transform:translateX(-50%) translateY(0)}" +
      ".pwa-install b{font-weight:700}" +
      ".pwa-install .pwa-mk{width:26px;height:26px;border-radius:7px;background:#fff;display:grid;place-items:center;flex:0 0 auto}" +
      ".pwa-install .pwa-mk img{width:18px;height:18px;object-fit:contain}" +
      ".pwa-install .pwa-go{background:linear-gradient(120deg,#e8473f,#f4823c);color:#fff;border:0;cursor:pointer;" +
      "font:inherit;font-weight:700;padding:8px 15px;border-radius:999px}" +
      ".pwa-install .pwa-x{background:transparent;border:0;color:#b4b9ad;cursor:pointer;font-size:18px;line-height:1;padding:4px 6px}";
    document.head.appendChild(s);
  }

  function showPill() {
    if (localStorage.getItem("wl-pwa-dismissed") === "1") return;
    injectStyles();
    if (document.querySelector(".pwa-install")) return;
    var el = document.createElement("div");
    el.className = "pwa-install";
    el.innerHTML =
      '<span class="pwa-mk"><img src="assets/logo-mark.png" alt=""></span>' +
      '<span>Install <b>Wealthoria</b> as an app</span>' +
      '<button class="pwa-go" type="button">Install</button>' +
      '<button class="pwa-x" type="button" aria-label="Dismiss">&times;</button>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });

    el.querySelector(".pwa-go").addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; hidePill(el); });
    });
    el.querySelector(".pwa-x").addEventListener("click", function () {
      localStorage.setItem("wl-pwa-dismissed", "1");
      hidePill(el);
    });
  }

  function hidePill(el) {
    el = el || document.querySelector(".pwa-install");
    if (!el) return;
    el.classList.remove("show");
    setTimeout(function () { el.remove(); }, 360);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    // small delay so it doesn't fight with first paint
    setTimeout(showPill, 1600);
  });

  window.addEventListener("appinstalled", function () {
    localStorage.setItem("wl-pwa-dismissed", "1");
    hidePill();
  });
})();
