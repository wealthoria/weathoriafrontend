/* =========================================================================
   Wealthoria: member push notifications (browser side)

   What this file does:
     1. Asks permission (only from the "Enable" button, a user tap).
     2. Waits until /service-worker.js is really ACTIVE, then gets the
        device's FCM token.
     3. Saves the token on the server with a stable per-device id, so a
        member can have desktop + phone + tablet at the same time.
     4. Re-checks the token every time the member opens the app (tokens
        rotate), and keeps it after logout so the device keeps receiving.
     5. Shows foreground notifications (when the app is open on screen).

   Version 29. Bump the ?v= in members/dashboard.jsx when this file changes.
   ========================================================================= */

(function () {

  // =========================================================
  // CONFIG
  // =========================================================

  var FIREBASE_MESSAGING_SDK =
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js";

  var VAPID_KEY =
    "BEoUv-g5znqXgkiql7pW95Ucw67PDIgJWNGYLkFVo4vu8ZxZEp0DSk0ggnl1piEktPvsBfJKqATvsAJO-GUFvpc";

  var BACKEND_URL =
    "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

  var SW_URL = "/service-worker.js";

  // Local keys (this device only)
  var DEVICE_ID_KEY      = "wealthoria-push-device-id";
  var SAVED_TOKEN_KEY    = "wealthoria-push-token";
  var SAVED_UID_KEY      = "wealthoria-push-uid";
  var SAVED_AT_KEY       = "wealthoria-push-saved-at";

  // Re-send an unchanged token to the server at most every 6 hours.
  var RESYNC_MS = 6 * 60 * 60 * 1000;

  var lastPushError = "";

  function setError(message) {
    lastPushError = message || "";
    window.wealthoriaLastPushError = lastPushError;
  }


  // =========================================================
  // SAFE STORAGE
  // =========================================================

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }


  // =========================================================
  // DEVICE INFO
  // =========================================================

  function getDeviceId() {
    var id = lsGet(DEVICE_ID_KEY);
    if (id) return id;

    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      id = window.crypto.randomUUID();
    } else {
      id = "dev-" + Date.now().toString(36) + "-" +
        Math.random().toString(36).slice(2, 10);
    }

    lsSet(DEVICE_ID_KEY, id);
    return id;
  }

  function isStandalone() {
    try {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
      );
    } catch (_) {
      return false;
    }
  }

  function getDeviceInfo() {
    var ua = navigator.userAgent || "";
    var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    return {
      deviceId:   getDeviceId(),
      platform:   isMobile ? "mobile" : "desktop",
      standalone: isStandalone(),
      userAgent:  ua.slice(0, 300)
    };
  }

  function isIos() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  }


  // =========================================================
  // GET CURRENT LOGGED-IN MEMBER (multi-account safe)
  // =========================================================

  function getLoggedInMember() {

    var MEMBER_SESSIONS_KEY = "wealthoria-member-sessions";
    var CURRENT_MEMBER_KEY  = "wealthoria-current-member";

    function readCurrentMemberUid() {
      var raw = null;
      try {
        raw =
          sessionStorage.getItem(CURRENT_MEMBER_KEY) ||
          localStorage.getItem(CURRENT_MEMBER_KEY);
      } catch (_) {}

      if (!raw) return "";

      try {
        var parsed = JSON.parse(raw);
        if (typeof parsed === "string") return parsed;
        return parsed && parsed.uid ? parsed.uid : "";
      } catch (_) {
        return raw;
      }
    }

    function readSessions(storage) {
      try {
        var raw = storage.getItem(MEMBER_SESSIONS_KEY);
        if (!raw) return {};
        var parsed = JSON.parse(raw);
        return (parsed && typeof parsed === "object") ? parsed : {};
      } catch (e) {
        return {};
      }
    }

    var currentUid = readCurrentMemberUid();

    if (currentUid) {
      var sessionStore = readSessions(sessionStorage);
      if (sessionStore[currentUid]) return sessionStore[currentUid];

      var localStore = readSessions(localStorage);
      if (localStore[currentUid]) return localStore[currentUid];
    }

    // Legacy single-session fallback.
    try {
      var legacySession = sessionStorage.getItem("wealthoria-member");
      var legacyLocal   = localStorage.getItem("wealthoria-member");
      if (legacySession) return JSON.parse(legacySession);
      if (legacyLocal)   return JSON.parse(legacyLocal);
    } catch (e) {}

    return null;
  }


  // =========================================================
  // LOAD SCRIPT
  // =========================================================

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.onload  = function () { resolve(); };
      script.onerror = function () { reject(new Error("Failed to load: " + src)); };
      document.head.appendChild(script);
    });
  }


  // =========================================================
  // FIREBASE MESSAGING INSTANCE
  // =========================================================

  async function getMessagingInstance() {
    if (!window.firebase) {
      throw new Error("Firebase is not loaded.");
    }

    if (typeof window.firebase.messaging !== "function") {
      await loadScript(FIREBASE_MESSAGING_SDK);
    }

    if (typeof window.firebase.messaging !== "function") {
      throw new Error("Firebase Messaging SDK could not be loaded.");
    }

    if (window.firebase.messaging.isSupported &&
        !window.firebase.messaging.isSupported()) {
      throw new Error(
        isIos()
          ? "On iPhone, open Wealthoria from the Home Screen icon (Share > Add to Home Screen), then enable notifications."
          : "This browser does not support push notifications."
      );
    }

    return window.firebase.messaging();
  }


  // =========================================================
  // REMOVE THE OLD /firebase-messaging-sw.js REGISTRATION
  // Older app versions created a second push subscription there,
  // which causes duplicate notifications. Its token dies after this
  // and the server removes it on the next send.
  // =========================================================

  async function removeLegacyMessagingWorker() {
    try {
      if (!navigator.serviceWorker.getRegistrations) return;
      var regs = await navigator.serviceWorker.getRegistrations();
      for (var i = 0; i < regs.length; i++) {
        var reg = regs[i];
        if (reg.scope && reg.scope.indexOf("firebase-cloud-messaging-push-scope") !== -1) {
          await reg.unregister();
        }
      }
    } catch (_) {}
  }


  // =========================================================
  // GET AN *ACTIVE* SERVICE WORKER
  // getToken() fails with "no active Service Worker" if the worker is
  // still installing, which is common on a phone's first visit.
  // =========================================================

  function waitForActivation(worker, timeoutMs) {
    return new Promise(function (resolve) {
      if (!worker) { resolve(false); return; }
      if (worker.state === "activated") { resolve(true); return; }

      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; resolve(false); }
      }, timeoutMs);

      worker.addEventListener("statechange", function () {
        if (done) return;
        if (worker.state === "activated") {
          done = true; clearTimeout(timer); resolve(true);
        } else if (worker.state === "redundant") {
          done = true; clearTimeout(timer); resolve(false);
        }
      });
    });
  }

  async function getPushServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker is not supported on this browser.");
    }

    var registration = await navigator.serviceWorker.getRegistration("/");

    if (!registration) {
      registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    }

    if (registration.active) {
      return registration;
    }

    var pending = registration.installing || registration.waiting;
    var ok = await waitForActivation(pending, 15000);

    if (!ok && !registration.active) {
      // Last attempt: the browser's own "ready" promise.
      var ready = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise(function (r) { setTimeout(r, 5000); })
      ]);
      if (ready && ready.active) return ready;
      throw new Error("The notification service is still starting. Please wait a few seconds and tap Enable again.");
    }

    return registration;
  }


  // =========================================================
  // GET FCM TOKEN AND SAVE TO BACKEND
  // Returns true / false. Reason for failure: window.wealthoriaLastPushError
  // =========================================================

  async function registerMemberFCMToken(explicitMember, options) {

    var force = !!(options && options.force);

    try {
      setError("");

      var member = explicitMember || getLoggedInMember();
      if (!member || !member.uid) {
        setError("Please log in as a member first.");
        return false;
      }

      if (!member.token) {
        setError("Your login has expired. Please log out and log in again.");
        return false;
      }

      if (!("Notification" in window)) {
        setError(isIos()
          ? "On iPhone, open Wealthoria from the Home Screen icon (Share > Add to Home Screen), then enable notifications."
          : "This browser does not support notifications.");
        return false;
      }

      if (Notification.permission !== "granted") {
        setError("Notification permission has not been granted on this device.");
        return false;
      }

      if (!window.firebase) {
        setError("Firebase is not loaded. Please refresh the page.");
        return false;
      }

      var registration = await getPushServiceWorker();
      var messaging    = await getMessagingInstance();

      var fcmToken = await messaging.getToken({
        vapidKey:                  VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!fcmToken) {
        setError("This device did not return a notification address. Please try again.");
        return false;
      }

      // Skip the network call if nothing changed recently.
      var savedToken = lsGet(SAVED_TOKEN_KEY);
      var savedUid   = lsGet(SAVED_UID_KEY);
      var savedAt    = Number(lsGet(SAVED_AT_KEY) || 0);

      if (
        !force &&
        savedToken === fcmToken &&
        savedUid === member.uid &&
        Date.now() - savedAt < RESYNC_MS
      ) {
        return true;
      }

      var info = getDeviceInfo();

      var response = await fetch(
        BACKEND_URL + "/api/members/notification-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + member.token
          },
          body: JSON.stringify({
            token:         fcmToken,
            previousToken: (savedToken && savedToken !== fcmToken) ? savedToken : null,
            deviceId:      info.deviceId,
            platform:      info.platform,
            standalone:    info.standalone,
            userAgent:     info.userAgent
          })
        }
      );

      var data = {};
      try { data = await response.json(); } catch (_) {}

      if (!response.ok || data.success === false) {
        if (response.status === 401 || response.status === 403) {
          setError("Your login has expired. Please log out, log in again and tap Enable.");
        } else {
          setError(data.message || ("Server error (" + response.status + "). Please try again."));
        }
        console.error("[Wealthoria push] Failed to save token.", response.status, data);
        return false;
      }

      lsSet(SAVED_TOKEN_KEY, fcmToken);
      lsSet(SAVED_UID_KEY, member.uid);
      lsSet(SAVED_AT_KEY, String(Date.now()));

      console.log("[Wealthoria push] Device registered for notifications.");
      return true;

    } catch (error) {
      console.error("[Wealthoria push] Token registration failed:", error);
      setError((error && error.message) || "Could not enable notifications on this device.");
      return false;
    }
  }


  // =========================================================
  // FOREGROUND LISTENER + AUTOMATIC TOKEN REFRESH
  // Called every time the member dashboard opens.
  // =========================================================

  async function initializeMemberForegroundNotifications(explicitMember) {

    try {
      var member = explicitMember || getLoggedInMember();
      if (!member || !member.uid) return false;
      if (!window.firebase) return false;
      if (!("serviceWorker" in navigator)) return false;

      await removeLegacyMessagingWorker();

      // Keep the server's copy of this device's token fresh.
      // The dashboard awaits window.wealthoriaPushRefresh to show errors.
      if ("Notification" in window && Notification.permission === "granted") {
        window.wealthoriaPushRefresh =
          registerMemberFCMToken(member).catch(function () { return false; });
      } else {
        window.wealthoriaPushRefresh = Promise.resolve(null);
      }

      if (window.memberForegroundListenerReady) {
        return true;
      }

      var messaging = await getMessagingInstance();

      // Fires only while a Wealthoria page is visible on screen.
      // (When the app is closed or hidden, the service worker shows it.)
      messaging.onMessage(function (payload) {

        var data = payload.data || {};
        var notification = payload.notification || {};

        var title = data.title || notification.title || "Wealthoria";
        var body  = data.body  || notification.body  || "You have a new notification.";
        var url   = data.url   || (payload.fcmOptions && payload.fcmOptions.link) || "/members/dashboard";

        // In-app banner on the member dashboard
        window.dispatchEvent(
          new CustomEvent("wealthoria:notification", {
            detail: { title: title, message: body, url: url }
          })
        );

        // System popup as well (the service worker draws it, which
        // also works on Android where new Notification() is not allowed).
        if ("Notification" in window && Notification.permission === "granted") {
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "WEALTHORIA_SHOW_NOTIFICATION",
              payload: {
                data: {
                  title: title,
                  body:  body,
                  url:   url,
                  tag:   data.tag || ""
                }
              }
            });
          }
        }
      });

      window.memberForegroundListenerReady = true;
      return true;

    } catch (error) {
      console.warn("[Wealthoria push] Foreground init:", error);
      return false;
    }
  }


  // =========================================================
  // ENABLE (called by the "Enable Notifications" button)
  // Returns { ok, permission, error }
  // =========================================================

  window.enableMemberNotifications = async function (explicitMember) {

    try {
      if (!("Notification" in window)) {
        var msg = isIos()
          ? "On iPhone, open Wealthoria from the Home Screen icon (Share > Add to Home Screen), then enable notifications."
          : "This browser does not support notifications.";
        setError(msg);
        return { ok: false, permission: "unsupported", error: msg };
      }

      var member = explicitMember || getLoggedInMember();
      if (!member || !member.uid) {
        setError("Please log in as a member first.");
        return { ok: false, permission: Notification.permission, error: lastPushError };
      }

      // Must run directly inside the tap, before any other await.
      var permission = Notification.permission;
      if (permission !== "granted") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        setError(permission === "denied"
          ? "Notifications are blocked. Allow them in your browser or phone settings for wealthoria.in."
          : "Permission was not given.");
        return { ok: false, permission: permission, error: lastPushError };
      }

      var saved = await registerMemberFCMToken(member, { force: true });
      await initializeMemberForegroundNotifications(member);

      return { ok: saved, permission: permission, error: saved ? "" : lastPushError };

    } catch (error) {
      setError((error && error.message) || "Notification setup error.");
      return { ok: false, permission: ("Notification" in window) ? Notification.permission : "unsupported", error: lastPushError };
    }
  };


  // =========================================================
  // DEBUG HELPER: run wealthoriaPushStatus() in the browser console
  // =========================================================

  window.wealthoriaPushStatus = async function () {
    var reg = null;
    try { reg = await navigator.serviceWorker.getRegistration("/"); } catch (_) {}
    var status = {
      permission:      ("Notification" in window) ? Notification.permission : "unsupported",
      serviceWorker:   reg ? (reg.active ? "active" : "not active yet") : "not registered",
      deviceId:        lsGet(DEVICE_ID_KEY),
      tokenSavedFor:   lsGet(SAVED_UID_KEY),
      tokenSavedAt:    lsGet(SAVED_AT_KEY) ? new Date(Number(lsGet(SAVED_AT_KEY))).toLocaleString() : null,
      tokenPreview:    (lsGet(SAVED_TOKEN_KEY) || "").slice(0, 24),
      lastError:       lastPushError || null
    };
    console.table(status);
    return status;
  };


  // =========================================================
  // EXPOSE
  // =========================================================

  window.initializeMemberForegroundNotifications = initializeMemberForegroundNotifications;
  window.registerMemberFCMToken                  = registerMemberFCMToken;

})();
