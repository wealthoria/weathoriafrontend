/* global React, window, localStorage, navigator */
import React from "react";

const { useState, useEffect } = React;

/* =========================================================================
   PWA INSTALL BUTTON
   - Shown only when the app is NOT installed and can be installed.
   - Hidden when running as an installed app (standalone) or after install.
   - Android/Chrome/Edge: uses the native install prompt.
   - iPhone/iPad Safari: no native prompt exists, so shows Add to Home Screen steps.
   ========================================================================= */

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
  const ua = window.navigator.userAgent || "";
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || iPadOs;
}

function useInstallState() {
  const [, force] = useState(0);

  useEffect(() => {
    const refresh = () => force((n) => n + 1);

    window.addEventListener("wl-install-change", refresh);
    window.addEventListener("appinstalled", refresh);

    const mq = window.matchMedia("(display-mode: standalone)");
    if (mq.addEventListener) mq.addEventListener("change", refresh);

    return () => {
      window.removeEventListener("wl-install-change", refresh);
      window.removeEventListener("appinstalled", refresh);
      if (mq.removeEventListener) mq.removeEventListener("change", refresh);
    };
  }, []);

  const installed = isStandalone();
  const nativeEvent = window.__wlInstallEvent || null;
  const ios = isIos();

  // Native prompt available -> definitely not installed.
  // iOS Safari has no prompt, so show manual steps unless already standalone.
  const canShow = !installed && (!!nativeEvent || ios);

  return { canShow, nativeEvent, ios };
}

function InstallButton({ className = "", onDone }) {
  const { canShow, nativeEvent, ios } = useInstallState();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (!canShow) return null;

  const handleClick = async () => {
    if (nativeEvent) {
      nativeEvent.prompt();
      try {
        await nativeEvent.userChoice;
      } catch (e) {}
      // The event can only be used once.
      window.__wlInstallEvent = null;
      window.dispatchEvent(new Event("wl-install-change"));
      if (onDone) onDone();
      return;
    }
    if (ios) setShowIosHelp(true);
  };

  return (
    <React.Fragment>
      <button
        type="button"
        className={`btn btn-outline pwa-install-btn ${className}`}
        onClick={handleClick}
        aria-label="Install Wealthoria app"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
        </svg>
        <span>Install app</span>
      </button>

      {showIosHelp && (
        <div className="pwa-ios-scrim" onClick={() => setShowIosHelp(false)}>
          <div className="pwa-ios-card" role="dialog" aria-modal="true"
            onClick={(e) => e.stopPropagation()}>
            <h3>Install Wealthoria</h3>
            <ol>
              <li>Tap the <strong>Share</strong> button in Safari.</li>
              <li>Scroll and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong>.</li>
            </ol>
            <button type="button" className="btn btn-green btn-block"
              onClick={() => { setShowIosHelp(false); if (onDone) onDone(); }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

window.InstallButton = InstallButton;
export default InstallButton;
