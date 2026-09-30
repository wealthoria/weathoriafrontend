/* global React, window, sessionStorage, navigator, document */
import React from "react";

const { useState, useEffect } = React;

/* =========================================================================
   PWA INSTALL POPUP
   - Phones only (Android + iPhone). Never on laptop/desktop/tablet.
   - Popup opens automatically ONLY on the home page, only if the app is NOT
     installed. A small install icon in the top bar (InstallIcon) covers every
     other page and the case where the popup was cancelled.
   - Never shown inside the installed app.
   - Buttons: Install / Cancel.
   - After Cancel it stays hidden for that visit (comes back next time the
     site is opened in a new session).
   - Android (Chrome/Edge): Install opens the browser's native install prompt.
   - iPhone (Safari): no native prompt exists, so Install shows the
     "Share -> Add to Home Screen" steps.
   ========================================================================= */

const DISMISS_KEY = "wl-install-dismissed";

/* Capture the browser's install event as early as possible (this runs when
   the bundle loads), so it is never missed. Chrome/Edge on Android only fire
   it when the app is NOT installed. */
if (typeof window !== "undefined" && !window.__wlInstallListening) {
  window.__wlInstallListening = true;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    window.__wlInstallEvent = e;
    window.dispatchEvent(new Event("wl-install-change"));
  });

  window.addEventListener("appinstalled", function () {
    window.__wlInstallEvent = null;
    window.dispatchEvent(new Event("wl-install-change"));
  });
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
  const ua = navigator.userAgent || "";
  return /iphone|ipod/i.test(ua);
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

function wasDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function rememberDismiss() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch (e) {}
}

const TEXT = {
  en: {
    title: "Install Wealthoria",
    body: "Add Wealthoria to your home screen to open it quickly, like an app.",
    install: "Install",
    cancel: "Cancel",
    stepsTitle: "Add to Home Screen",
    step1: "Tap the Share button in Safari.",
    step2: "Scroll down and tap Add to Home Screen.",
    step3: "Tap Add.",
    done: "Got it"
  },
  kn: {
    title: "Wealthoria ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ",
    body: "ಆ್ಯಪ್‌ನಂತೆ ಬೇಗ ತೆರೆಯಲು Wealthoria ಅನ್ನು ನಿಮ್ಮ ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ.",
    install: "ಇನ್‌ಸ್ಟಾಲ್",
    cancel: "ರದ್ದುಮಾಡಿ",
    stepsTitle: "ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ",
    step1: "Safari ನಲ್ಲಿ Share ಬಟನ್ ಒತ್ತಿ.",
    step2: "ಕೆಳಗೆ ಸ್ಕ್ರಾಲ್ ಮಾಡಿ, Add to Home Screen ಒತ್ತಿ.",
    step3: "Add ಒತ್ತಿ.",
    done: "ಸರಿ"
  }
};

function installState() {
  return {
    phone: isPhone(),
    installedOrStandalone: isStandalone(),
    dismissedThisVisit: wasDismissed(),
    hasInstallEvent: !!window.__wlInstallEvent,
    iphone: isIos()
  };
}

// Type  __wlInstallDebug()  in the phone's browser console to see why the popup is hidden.
window.__wlInstallDebug = installState;

/* Re-render whenever the browser's install state changes. */
function useInstallRefresh() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener("wl-install-change", refresh);
    window.addEventListener("appinstalled", refresh);
    refresh(); // covers an event that arrived before this listener attached
    return () => {
      window.removeEventListener("wl-install-change", refresh);
      window.removeEventListener("appinstalled", refresh);
    };
  }, []);
  return () => setTick((n) => n + 1);
}

/* Phone + not installed + can actually be installed.
   Android only gets the browser event when the app is NOT installed.
   iPhone has no event, so we rely on "not running as an installed app". */
function canInstallHere() {
  return (
    isPhone() &&
    !isStandalone() &&
    (!!window.__wlInstallEvent || isIos())
  );
}

/* =========================================================================
   POPUP  - opens automatically ONLY on the home page (once per visit).
   Also opens the iPhone steps when the top install icon is tapped.
   ========================================================================= */
function InstallPopup() {
  const app = typeof window.useApp === "function" ? window.useApp() : null;
  const tx = TEXT[app && app.lang === "kn" ? "kn" : "en"];

  const rerender = useInstallRefresh();
  const [open, setOpen] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const nativeEvent = window.__wlInstallEvent || null;
  const installable = canInstallHere();
  const autoShow = installable && isHomePage() && !wasDismissed();

  // Automatic popup: home page only, ~1 second after opening.
  useEffect(() => {
    if (!autoShow) return undefined;
    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [autoShow]);

  // Top-icon tap on iPhone asks us to show the "Add to Home Screen" steps.
  useEffect(() => {
    const showManual = () => {
      setShowSteps(true);
      setOpen(true);
    };
    window.addEventListener("wl-install-steps", showManual);
    return () => window.removeEventListener("wl-install-steps", showManual);
  }, []);

  if (!open || !installable) return null;

  const close = () => {
    rememberDismiss();
    setOpen(false);
    setShowSteps(false);
    rerender();
  };

  const install = async () => {
    if (nativeEvent) {
      try {
        nativeEvent.prompt();
        await nativeEvent.userChoice;
      } catch (e) {}
      // The event can only be used once.
      window.__wlInstallEvent = null;
      close();
      window.dispatchEvent(new Event("wl-install-change"));
      return;
    }
    if (isIos()) setShowSteps(true);
  };

  return (
    <div className="pwa-pop-scrim" onClick={close}>
      <div
        className="pwa-pop-card"
        role="dialog"
        aria-modal="true"
        aria-label={tx.title}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          className="pwa-pop-icon"
          src="/icons/icon-192-any.png"
          alt=""
          width="56"
          height="56"
        />

        {showSteps ? (
          <React.Fragment>
            <h3 className="pwa-pop-title">{tx.stepsTitle}</h3>
            <ol className="pwa-pop-steps">
              <li>{tx.step1}</li>
              <li>{tx.step2}</li>
              <li>{tx.step3}</li>
            </ol>
            <div className="pwa-pop-actions">
              <button type="button" className="btn btn-green" onClick={close}>
                {tx.done}
              </button>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <h3 className="pwa-pop-title">{tx.title}</h3>
            <p className="pwa-pop-text">{tx.body}</p>
            <div className="pwa-pop-actions">
              <button type="button" className="btn btn-outline" onClick={close}>
                {tx.cancel}
              </button>
              <button type="button" className="btn btn-green" onClick={install}>
                {tx.install}
              </button>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   TOP-BAR ICON - small download icon in the nav row (same size/style as the
   theme toggle). Shown on every page, phones only, and only while the app is
   NOT installed. It disappears once installed.
   ========================================================================= */
function InstallIcon() {
  useInstallRefresh();

  if (!canInstallHere()) return null;

  const onClick = async () => {
    const ev = window.__wlInstallEvent;
    if (ev) {
      try {
        ev.prompt();
        await ev.userChoice;
      } catch (e) {}
      window.__wlInstallEvent = null;
      window.dispatchEvent(new Event("wl-install-change"));
      return;
    }
    // iPhone: no native prompt, show the steps.
    window.dispatchEvent(new Event("wl-install-steps"));
  };

  return (
    <button
      type="button"
      className="theme-toggle pwa-install-icon"
      onClick={onClick}
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
