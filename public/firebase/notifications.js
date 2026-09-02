
console.log("🔥 NOTIFICATIONS.JS STARTED");

(function () {
  async function enableMemberNotifications() {
    try {
      // Check Firebase
      if (!window.firebase) {
        alert("Firebase is not loaded.");
        return;
      }

      // Check browser support
      if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
      }

      if (!firebase.messaging.isSupported()) {
        alert("Firebase notifications are not supported in this browser.");
        return;
      }

      // Get logged-in member
      let member = null;

      const localMember = localStorage.getItem("wealthoria-member");
      const sessionMember = sessionStorage.getItem("wealthoria-member");

      if (localMember) {
        member = JSON.parse(localMember);
      } else if (sessionMember) {
        member = JSON.parse(sessionMember);
      }

      if (!member || !member.uid || !member.token) {
        alert("Please login as a member first.");
        return;
      }

      // Ask notification permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        alert("Notification permission was not granted.");
        return;
      }

      // Get registered service worker
      const registration = await navigator.serviceWorker.ready;

      // Firebase Messaging
      const messaging = firebase.messaging();

      // IMPORTANT:
      // Replace this with your exact VAPID public key
      const vapidKey =
        "BEoUv-g5znqXgkiql7pW95Ucw67PDIgJWNGYLkFVo4vu8ZxZEp0DSk0ggnl1piEktPvsBfJKqATvsAJO-GUFvpc";

      const fcmToken = await messaging.getToken({
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (!fcmToken) {
        alert("Could not get FCM token.");
        return;
      }

      console.log("FCM Token:", fcmToken);

      // Send token to backend
      const response = await fetch(
        "https://webinar-registration-backend.onrender.com/api/members/notification-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + member.token
          },
          body: JSON.stringify({
            token: fcmToken
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Backend error:", data);
        alert(data.message || "Failed to save notification token.");
        return;
      }

      console.log("Notification token saved:", data);

      alert("Notifications enabled successfully! 🔔");

    } catch (error) {
      console.error("Notification setup error:", error);
      alert("Unable to enable notifications: " + error.message);
    }
  }

  // Dashboard calls this function
  window.enableMemberNotifications = enableMemberNotifications;

  console.log("Wealthoria notification system loaded.");
})();