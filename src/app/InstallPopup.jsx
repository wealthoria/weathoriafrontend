/* global React, window, sessionStorage, localStorage, navigator, document */
import React from "react";

const { useState, useEffect } = React;

/* =========================================================================
   PWA INSTALL UI  (phones only, only while the app is NOT installed)

   1. InstallIcon  - small download icon in the top bar. Renders together with
                     the nav bar (no waiting for the browser).
   2. InstallPopup - (name kept) a slim horizontal bar fixed at the BOTTOM of the screen
                     when the HOME page opens:  text [Install app] [X]
                     X closes it until the page is reopened. Also hosts the small
                     "how to install" sheet used when the browser gives no
                     native prompt (iPhone, or Chrome that has not offered yet).

   Android Chrome/Edge: Install opens the native install prompt.
   Otherwise: shows the 2-3 manual steps for that phone.
   Installed app (standalone) or recently-installed: nothing is shown.
   ========================================================================= */

const DISMISS_KEY = "wl-install-dismissed";
const INSTALLED_KEY = "wl-pwa-installed-at";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const BUILD = "install-v7";

function urlFlag(name) {
  try {
    return new URLSearchParams(window.location.search).get(name) === "1";
  } catch (e) {
    return false;
  }
}

function isStandalone() {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://")
    );
  } catch (e) {
    return false;
  }
}

function isIos() {
  return /iphone|ipod/i.test(navigator.userAgent || "");
}

function isPhone() {
  const ua = navigator.userAgent || "";
  const phoneUA = /android.*mobile|iphone|ipod/i.test(ua);
  const uaDataMobile =
    !!(navigator.userAgentData && navigator.userAgentData.mobile === true);
  let coarseAndSmall = false;
  try {
    coarseAndSmall =
      window.matchMedia("(pointer: coarse)").matches &&
      window.matchMedia("(max-width: 820px)").matches;
  } catch (e) {}
  return phoneUA || uaDataMobile || coarseAndSmall;
}

function isHomePage() {
  try {
    const path = (window.location.pathname || "/").toLowerCase();
    const page = new URLSearchParams(window.location.search).get("page");
    return (
      !page &&
      (path === "/" || path === "/index.html" || path === "/wealthoria.html")
    );
  } catch (e) {
    return false;
  }
}

// Closing the bar hides it only until the page is reloaded or reopened.
let dismissedThisLoad = false;

function wasDismissed() {
  return dismissedThisLoad;
}

function rememberDismiss() {
  dismissedThisLoad = true;
}

function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, String(Date.now()));
  } catch (e) {}
}

function clearInstalled() {
  try {
    localStorage.removeItem(INSTALLED_KEY);
  } catch (e) {}
}

function installedRecently() {
  try {
    const t = Number(localStorage.getItem(INSTALLED_KEY) || 0);
    return t > 0 && Date.now() - t < THIRTY_DAYS;
  } catch (e) {
    return false;
  }
}

function isInstalled() {
  if (isStandalone()) return true;
  if (window.__wlJustInstalled) return true;      // installed in this visit
  if (window.__wlInstallEvent) return false;      // browser says: not installed
  return !!window.__wlRelatedInstalled;           // no stale localStorage guess
}

function canInstallHere() {
  if (urlFlag("installtest")) return true;
  // wait until the installed-app check settles (unless the browser already offered install)
  if (!window.__wlInstallChecked && !window.__wlInstallEvent) return false;
  return isPhone() && !isInstalled();
}

function installState() {
  return {
    build: BUILD,
    page: window.location.pathname + window.location.search,
    isPhone: isPhone(),
    isHomePage: isHomePage(),
    runningAsInstalledApp: isStandalone(),
    rememberedAsInstalled: installedRecently(),
    browserOfferedInstall: !!window.__wlInstallEvent,
    cancelledThisVisit: wasDismissed(),
    iphone: isIos(),
    installCheckDone: !!window.__wlInstallChecked,
    relatedAppInstalled: !!window.__wlRelatedInstalled,
    forcedByInstalltest: urlFlag("installtest"),
    showInstallUi: canInstallHere()
  };
}

// Type  __wlInstallDebug()  in the browser console to see why it is hidden.
window.__wlInstallDebug = installState;

/* One place that starts an install (used by the icon and the bar button). */
async function runInstall() {
  const ev = window.__wlInstallEvent;
  if (ev) {
    let outcome = "";
    try {
      ev.prompt();
      const choice = await ev.userChoice;
      outcome = choice && choice.outcome;
    } catch (e) {}
    window.__wlInstallEvent = null; // the event can only be used once
    if (outcome === "accepted") { window.__wlJustInstalled = true; markInstalled(); }
    window.dispatchEvent(new Event("wl-install-change"));
    return;
  }
  // No native prompt available: show the manual steps.
  window.dispatchEvent(new Event("wl-install-steps"));
}
window.triggerPwaInstall = runInstall;

/* Re-render whenever the install state changes. */
function useInstallRefresh() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener("wl-install-change", refresh);
    window.addEventListener("appinstalled", refresh);
    refresh(); // covers a change that happened before this listener attached
    return () => {
      window.removeEventListener("wl-install-change", refresh);
      window.removeEventListener("appinstalled", refresh);
    };
  }, []);
  return () => setTick((n) => n + 1);
}

const TEXT = {
  en: {
    bar: "Get the Wealthoria app",
    install: "Install app",
    close: "Close",
    stepsTitle: "Install Wealthoria",
    iosSteps: [
      "Tap the Share button in Safari.",
      "Scroll down and tap Add to Home Screen.",
      "Tap Add."
    ],
    androidSteps: [
      "Tap the \u22EE menu at the top of Chrome.",
      "Tap Install app (or Add to Home screen).",
      "Tap Install."
    ],
    desktopSteps: [
      "Click the Install icon (\u2913 or \u2295) in your browser address bar.",
      "Or click the \u22EE menu in Chrome/Edge and select 'Install Wealthoria'.",
      "Click 'Install' to add Wealthoria to your desktop."
    ],
    done: "Got it"
  },
  kn: {
    bar: "Wealthoria \u0c86\u0ccd\u0caf\u0caa\u0ccd \u0caa\u0ca1\u0cc6\u0caf\u0cbf\u0cb0\u0cbf",
    install: "\u0c87\u0ca8\u0ccd\u200c\u0cb8\u0ccd\u0c9f\u0cbe\u0cb2\u0ccd \u0c86\u0ccd\u0caf\u0caa\u0ccd",
    close: "\u0cae\u0cc1\u0c9a\u0ccd\u0c9a\u0cbf",
    stepsTitle: "Wealthoria \u0c87\u0ca8\u0ccd\u200c\u0cb8\u0ccd\u0c9f\u0cbe\u0cb2\u0ccd \u0cae\u0cbe\u0ca1\u0cbf",
    iosSteps: [
      "Safari \u0ca8\u0cb2\u0ccd\u0cb2\u0cbf Share \u0cac\u0c9f\u0ca8\u0ccd \u0c92\u0ca4\u0ccd\u0ca4\u0cbf.",
      "\u0c95\u0cc6\u0cbb\u0c97\u0cc6 \u0cb8\u0ccd\u0c95\u0ccd\u0cb0\u0cbe\u0cb2\u0ccd \u0cae\u0cbe\u0ca1\u0cbf, Add to Home Screen \u0c92\u0ca4\u0ccd\u0ca4\u0cbf.",
      "Add \u0c92\u0ca4\u0ccd\u0ca4\u0cbf."
    ],
    androidSteps: [
      "Chrome \u0ca8 \u0cae\u0cc7\u0cb2\u0ccd\u0cad\u0cbe\u0c97\u0ca6 \u22EE \u0cae\u0cc6\u0ca8\u0cc1 \u0c92\u0ca4\u0ccd\u0ca4\u0cbf.",
      "Install app (\u0c85\u0ca5\u0cb5\u0cbe Add to Home screen) \u0c92\u0ca4\u0ccd\u0ca4\u0cbf.",
      "Install \u0c92\u0ca4\u0ccd\u0ca4\u0cbf."
    ],
    desktopSteps: [
      "\u0cac\u0ccd\u0cb0\u0ccc\u0cb8\u0cb0\u0ccd \u0c85\u0ca1\u0ccd\u0cb0\u0cc6\u0cb8\u0ccd \u0cac\u0cbe\u0cb0\u0ccd\u200c\u0ca8\u0cb2\u0ccd\u0cb2\u0cbf\u0cb0\u0cc1\u0cb5 \u0c87\u0ca8\u0ccd\u200c\u0cb8\u0ccd\u0c9f\u0cbe\u0cb2\u0ccd \u0c80\u0c95\u0cbe\u0ca8\u0ccd (\u2913) \u0c92\u0ca4\u0ccd\u0ca4\u0cbf.",
      "\u0c85\u0ca5\u0cb5\u0cbe Chrome/Edge \u0cae\u0cc6\u0ca8\u0cc1\u0cb5\u0cbf\u0ca8\u0cb2\u0ccd\u0cb2\u0cbf 'Install Wealthoria' \u0c86\u0caf\u0ccd\u0c95\u0cc6\u0cae\u0cbe\u0ca1\u0cbf.",
      "'Install' \u0c92\u0ca4\u0ccd\u0ca4\u0cbf \u0ca8\u0cbf\u0cae\u0ccd\u0cae \u0ca1\u0cc6\u0cb8\u0ccd\u0c95\u0ccd\u200c\u0c9f\u0cbe\u0caa\u0ccd\u200c\u0c97\u0cc6 \u0cb8\u0cc7\u0cb0\u0cbf\u0cb8\u0cbf."
    ],
    done: "\u0cb8\u0cb0\u0cbf"
  }
};

/* On-screen status panel: open  yoursite/?installdebug=1  on the phone. */
function InstallDebug() {
  useInstallRefresh();
  const st = installState();
  const rows = Object.keys(st).map((k) => k + ": " + String(st[k]));
  return (
    <pre
      style={{
        position: "fixed", left: 8, right: 8, bottom: 8, zIndex: 10001,
        margin: 0, padding: "10px 12px", borderRadius: 10,
        background: "rgba(0,0,0,.88)", color: "#7CFC9A",
        font: "12px/1.5 monospace", whiteSpace: "pre-wrap", pointerEvents: "none"
      }}
    >
      {rows.join("\n")}
    </pre>
  );
}

/* =========================================================================
   BAR BELOW THE NAV  (home page only)  +  "how to install" sheet
   ========================================================================= */
function InstallPopup() {
  const app = typeof window.useApp === "function" ? window.useApp() : null;
  const tx = TEXT[app && app.lang === "kn" ? "kn" : "en"];

  const rerender = useInstallRefresh();
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    const open = () => setSheet(true);
    window.addEventListener("wl-install-steps", open);
    return () => window.removeEventListener("wl-install-steps", open);
  }, []);

  const canInstall = canInstallHere();
  const showBar = canInstall && isHomePage() && !wasDismissed();
  const debugPanel = urlFlag("installdebug") ? <InstallDebug /> : null;

  useEffect(() => {
    document.body.classList.toggle("has-pwa-bar", !!showBar);
    return () => document.body.classList.remove("has-pwa-bar");
  }, [showBar]);

  const closeBar = () => {
    rememberDismiss();
    rerender();
  };

  const closeSheet = () => setSheet(false);

  return (
    <React.Fragment>
      {debugPanel}

      {showBar && (
        <div className="pwa-bar" role="region" aria-label={tx.install}>
          <span className="pwa-bar-text">{tx.bar}</span>
          <button
            type="button"
            className="btn btn-green pwa-bar-btn"
            onClick={runInstall}
          >
            {tx.install}
          </button>
          <button
            type="button"
            className="pwa-bar-x"
            onClick={closeBar}
            aria-label={tx.close}
            title={tx.close}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}

      {sheet && (
        <div className="pwa-pop-scrim" onClick={closeSheet}>
          <div
            className="pwa-pop-card"
            role="dialog"
            aria-modal="true"
            aria-label={tx.stepsTitle}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              className="pwa-pop-icon"
              src="/icons/icon-192-any.png"
              alt=""
              width="56"
              height="56"
            />
            <h3 className="pwa-pop-title">{tx.stepsTitle}</h3>
            <ol className="pwa-pop-steps">
              {(isIos() ? tx.iosSteps : isPhone() ? tx.androidSteps : tx.desktopSteps).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
            <div className="pwa-pop-actions">
              <button
                type="button"
                className="btn btn-green"
                onClick={closeSheet}
              >
                {tx.done}
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

/* =========================================================================
   TOP-BAR ICON - shows the moment the nav bar renders (phones, not installed)
   ========================================================================= */
function InstallIcon() {
  useInstallRefresh();

  if (!canInstallHere()) return null;

  return (
    <button
      type="button"
      className="theme-toggle pwa-install-icon"
      onClick={runInstall}
      aria-label="Install app"
      title="Install app"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    </button>
  );
}

window.InstallPopup = InstallPopup;
window.InstallIcon = InstallIcon;
export { InstallIcon };
export default InstallPopup;
