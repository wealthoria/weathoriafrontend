/* =========================================================================
   Wealthoria: firebase-messaging-sw.js  (legacy, kept on purpose)

   The app now registers push on /service-worker.js only.
   notifications.js unregisters this worker on every member's device, so
   it only matters until old devices open the app once more.

   Same rule as service-worker.js: ONE background handler, no raw "push"
   listener, so a message is never shown twice.
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

function buildWealthoriaNotification(payload) {
  var data = payload && payload.data ? payload.data : {};
  var notification = payload && payload.notification ? payload.notification : {};

  return {
    title: data.title || notification.title || "Wealthoria",
    options: {
      body: data.body || notification.body || "You have a new notification.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || ("wealthoria-" + Date.now()),
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      data: { url: data.url || "/members/dashboard" }
    }
  };
}

messaging.onBackgroundMessage(function (payload) {
  if (payload && payload.notification) {
    return; // already displayed by the Firebase SDK
  }
  var n = buildWealthoriaNotification(payload);
  return self.registration.showNotification(n.title, n.options);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var targetUrl = new URL(
    (event.notification.data && event.notification.data.url) || "/members/dashboard",
    self.location.origin
  ).href;

  event.waitUntil((async function () {
    var clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });

    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (new URL(client.url).origin === self.location.origin && "focus" in client) {
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
