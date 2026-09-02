(function () {
  console.log("🔥 NOTIFICATIONS.JS STARTED");

  window.enableMemberNotifications = async function () {
    console.log("🔔 enableMemberNotifications called");

    try {
      if (!window.firebase) {
        alert("Firebase is not loaded.");
        return;
      }

      console.log("Firebase loaded:", firebase.SDK_VERSION);

      if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
      }

      if (!firebase.messaging) {
        alert("Firebase Messaging is not loaded.");
        return;
      }

      let member = null;

      const localMember = localStorage.getItem("wealthoria-member");
      const sessionMember = sessionStorage.getItem("wealthoria-member");

      try {
        if (localMember) {
          member = JSON.parse(localMember);
        } else if (sessionMember) {
          member = JSON.parse(sessionMember);
        }
      } catch (e) {
        console.error("Member session parse error:", e);
      }

      console.log("Logged-in member:", member);

      if (!member || !member.uid || !member.token) {
        alert("Please login as a member first.");
        return;
      }

      const permission = await Notification.requestPermission();

      console.log("Notification permission:", permission);

      if (permission !== "granted") {
        alert("Notification permission was not granted.");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        alert("Service Worker is not supported.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      console.log("Service worker ready:", registration);

      const messaging = firebase.messaging();

      const vapidKey =
        "BEoUv-g5znqXgkiql7pW95Ucw67PDIgJWNGYLkFVo4vu8ZxZEp0DSk0ggnl1piEktPvsBfJKqATvsAJO-GUFvpc";

      console.log("Requesting FCM token...");

      const fcmToken = await messaging.getToken({
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (!fcmToken) {
        alert("Could not get FCM token.");
        return;
      }

      console.log("✅ FCM token received:", fcmToken);

      console.log("Sending token to backend...");

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

      console.log("Backend response:", data);

      if (!response.ok) {
        alert(
          data.message ||
          "Failed to save notification token."
        );
        return;
      }

      console.log("✅ Notification token saved successfully.");

      alert("Notifications enabled successfully! 🔔");

    } catch (error) {
      console.error("❌ Notification setup error:", error);

      alert(
        "Unable to enable notifications:\n" +
        error.message
      );
    }
  };

  console.log("✅ Wealthoria notification system loaded.");
})();