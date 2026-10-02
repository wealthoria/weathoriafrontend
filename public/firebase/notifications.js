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


  // =========================================================
  // GET CURRENT LOGGED-IN MEMBER
  // MULTI-ACCOUNT SAFE
  // =========================================================

  function getLoggedInMember() {

    var MEMBER_SESSIONS_KEY = "wealthoria-member-sessions";
    var CURRENT_MEMBER_KEY  = "wealthoria-current-member";

    function readCurrentMemberUid() {
      var raw =
        sessionStorage.getItem(CURRENT_MEMBER_KEY) ||
        localStorage.getItem(CURRENT_MEMBER_KEY);

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
        console.error("Member sessions parse error:", e);
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
    var legacyLocal   = localStorage.getItem("wealthoria-member");
    var legacySession = sessionStorage.getItem("wealthoria-member");

    try {
      if (legacySession) return JSON.parse(legacySession);
      if (legacyLocal)   return JSON.parse(legacyLocal);
    } catch (e) {
      console.error("Legacy member session parse error:", e);
    }

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
      script.onerror = function (err) {
        console.error("Script failed:", src, err);
        reject(new Error("Failed to load: " + src));
      };
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

    return firebase.messaging();
  }


  // =========================================================
  // GET / REGISTER SERVICE WORKER
  //
  // We ALWAYS pass serviceWorkerRegistration to getToken() so
  // Firebase uses /service-worker.js and never falls back to
  // the default /firebase-messaging-sw.js scope.
  //
  // If the SW is still installing we wait up to 15 s before
  // giving a clear error message.
  // =========================================================

  var lastPushError = "";

  async function getPushServiceWorker() {
    var registration =
      await navigator.serviceWorker.getRegistration("/");

    if (!registration) {
      registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        { scope: "/" }
      );
    }

    // Already active — done immediately, no delay.
    if (registration.active) {
      return registration;
    }

    // Waiting for the SW to activate.
    var worker = registration.installing || registration.waiting;

    await new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error(
          "The app's background service did not start. " +
          "Close Wealthoria completely, open it again and retry."
        ));
      }, 15000);

      if (!worker) {
        clearTimeout(timer);
        resolve();
        return;
      }

      worker.addEventListener("statechange", function () {
        if (worker.state === "activated") {
          clearTimeout(timer);
          resolve();
        } else if (worker.state === "redundant") {
          clearTimeout(timer);
          reject(new Error(
            "The app's background service failed to install. " +
            "Close Wealthoria completely, open it again and retry."
          ));
        }
      });
    });

    return registration;
  }


  // =========================================================
  // GET FCM TOKEN AND SAVE TO BACKEND
  // =========================================================

  async function registerMemberFCMToken() {

    try {

      // 1. Member must be logged in.
      var member = getLoggedInMember();
      if (!member || !member.uid) {
        console.warn("No logged-in member found.");
        return false;
      }

      // 2. Member must have a valid auth token.
      if (!member.token) {
        console.warn("Member authentication token is missing.");
        lastPushError = "Your login has expired. Please log out and log in again.";
        return false;
      }

      // 3. Browser notification support.
      if (!("Notification" in window)) {
        console.warn("Notifications are not supported by this browser.");
        return false;
      }

      // 4. Firebase must be loaded.
      if (!window.firebase) {
        console.error("Firebase is not loaded.");
        return false;
      }

      // 5. Service Worker support.
      if (!("serviceWorker" in navigator)) {
        console.error("Service Worker is not supported.");
        return false;
      }

      var registration = await getPushServiceWorker();
      var messaging    = await getMessagingInstance();

      // 6. Get FCM token — explicitly pass our SW so no delay.
      var fcmToken = await messaging.getToken({
        vapidKey:                  VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!fcmToken) {
        console.error("Firebase did not return an FCM token.");
        lastPushError = "The phone did not provide a notification address. Please try again.";
        return false;
      }

      // 7. Send token to backend.
      var response = await fetch(
        BACKEND_URL + "/api/members/notification-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + member.token
          },
          body: JSON.stringify({ token: fcmToken })
        }
      );

      var data = {};
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.error("Could not parse backend response:", jsonErr);
      }

      if (!response.ok) {
        lastPushError =
          data.message ||
          ("Server error (" + response.status + "). Please log out, log in again and retry.");
        console.error("Failed to save FCM token.", { status: response.status, response: data });
        return false;
      }

      return true;

    } catch (error) {
      console.error("FCM token registration failed:", error);
      lastPushError = error.message || "Unknown error.";
      return false;
    }
  }


  // =========================================================
  // FOREGROUND NOTIFICATION LISTENER
  // =========================================================

  async function initializeMemberForegroundNotifications() {

    try {

      // 1. Member must be logged in.
      var member = getLoggedInMember();
      if (!member || !member.uid) {
        console.warn("No logged-in member found.");
        return false;
      }

      // 2. Firebase must be loaded.
      if (!window.firebase) {
        console.error("Firebase is not loaded.");
        return false;
      }

      // 3. Service Worker support.
      if (!("serviceWorker" in navigator)) {
        console.error("Service Worker not supported.");
        return false;
      }

      var registration = await getPushServiceWorker();
      var messaging    = await getMessagingInstance();

      // 4. If permission already granted, refresh the FCM token automatically.
      if ("Notification" in window && Notification.permission === "granted") {
        await registerMemberFCMToken();
      }

      // 5. Skip if already listening.
      if (window.memberForegroundListenerReady) {
        return true;
      }

      // 6. Foreground message listener.
      messaging.onMessage(async function (payload) {

        var title =
          (payload.notification && payload.notification.title) ||
          (payload.data && payload.data.title) ||
          "Wealthoria";

        var body =
          (payload.notification && payload.notification.body) ||
          (payload.data && payload.data.body) ||
          "You have a new notification.";

        // Notify the member dashboard UI.
        window.dispatchEvent(
          new CustomEvent("wealthoria:notification", {
            detail: {
              title:   title,
              message: body,
              url:     (payload.data && payload.data.url) || ""
            }
          })
        );

        // Show the browser notification popup.
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            var data = (payload.data) || {};

            await registration.showNotification(title, {
              body:               body,
              icon:               "/icons/icon-192.png",
              badge:              "/icons/icon-192.png",
              tag:                data.tag || ("wealthoria-" + Date.now()),
              renotify:           true,
              requireInteraction: true,
              silent:             false,
              vibrate:            [200, 100, 200],
              timestamp:          Date.now(),
              data: {
                url: data.url || "/members/dashboard"
              }
            });

          } catch (notificationError) {
            console.error("Could not display browser notification:", notificationError);
          }
        }

      });

      window.memberForegroundListenerReady = true;
      return true;

    } catch (error) {
      console.error("Foreground notification initialization error:", error);
      return false;
    }
  }


  // =========================================================
  // ENABLE MEMBER NOTIFICATIONS  (called by the Enable button)
  // =========================================================

  window.enableMemberNotifications = async function () {

    try {

      // 1. Firebase check.
      if (!window.firebase) {
        alert("Firebase is not loaded.");
        return;
      }

      // 2. Browser support.
      if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
      }

      // 3. Member must be logged in.
      var member = getLoggedInMember();
      if (!member || !member.uid) {
        alert("Please login as a member first.");
        return;
      }

      // 4. Request permission.
      var permission = Notification.permission;
      if (permission !== "granted") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        alert("Notification permission was not granted.");
        return;
      }

      // 5. Initialise the foreground listener.
      await initializeMemberForegroundNotifications();

      // 6. Register / refresh the FCM token.
      var saved = await registerMemberFCMToken();

      if (!saved) {
        alert(
          "Unable to enable notifications on this device:\n" +
          (lastPushError || "Please check the notification permission and try again.")
        );
        return;
      }

      // 7. Done.
      alert("Notifications enabled successfully! \uD83D\uDD14");

    } catch (error) {
      console.error("Notification setup error:", error);
      alert("Unable to enable notifications:\n" + error.message);
    }

  };


  // =========================================================
  // EXPOSE
  // =========================================================

  window.initializeMemberForegroundNotifications = initializeMemberForegroundNotifications;
  window.registerMemberFCMToken                  = registerMemberFCMToken;

})();
