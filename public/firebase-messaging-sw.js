/* =========================================================================
   Wealthoria — firebase-messaging-sw.js
   Required by Firebase SDK for background push notifications.

   Firebase's getToken() in notifications.js passes the /service-worker.js
   registration explicitly, so new FCM tokens already use /service-worker.js.
   This file handles any EXISTING tokens that were stored against the default
   /firebase-messaging-sw.js scope by older app versions.
   ========================================================================= */

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js"
);

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyDYeZggBRJ1oP8r8yjuNMYYs5VSOX3yfnE",
    authDomain: "wealthoria-6fc11.firebaseapp.com",
    projectId: "wealthoria-6fc11",
    storageBucket: "wealthoria-6fc11.firebasestorage.app",
    messagingSenderId: "141910518023",
    appId: "1:141910518023:web:7198ed847f459cb71ebda2"
  });
}

var messaging = firebase.messaging();

/* -------------------------------------------------------------------------
   Shared helper — identical to service-worker.js
   ------------------------------------------------------------------------- */
function buildWealthoriaNotification(payload) {
  var data = payload && payload.data ? payload.data : {};

  var title =
    data.title ||
    (payload.notification && payload.notification.title) ||
    "Wealthoria";

  var body =
    data.body ||
    (payload.notification && payload.notification.body) ||
    "You have a new notification.";

  return {
    title: title,
    options: {
      body: body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || ("wealthoria-" + Date.now()),
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      data: {
        url: data.url || "/members/dashboard"
      }
    }
  };
}

/* -------------------------------------------------------------------------
   Background push — fires when app is closed / backgrounded
   ------------------------------------------------------------------------- */
messaging.onBackgroundMessage(function (payload) {
  var n = buildWealthoriaNotification(payload);
  return self.registration.showNotification(n.title, n.options);
});

/* -------------------------------------------------------------------------
   Notification click
   ------------------------------------------------------------------------- */
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var targetUrl = new URL(
    (event.notification.data && event.notification.data.url) || "/members/dashboard",
    self.location.origin
  ).href;

  event.waitUntil((async function () {
    var clientList = await clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (
        new URL(client.url).origin === self.location.origin &&
        "focus" in client
      ) {
        await client.focus();
        if ("navigate" in client && client.url !== targetUrl) {
          try { await client.navigate(targetUrl); } catch (_) {}
        }
        return;
      }
    }

    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  })());
});
