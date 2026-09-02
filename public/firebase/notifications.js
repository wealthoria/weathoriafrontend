(function () {
  console.log("🔥 NOTIFICATIONS.JS STARTED");

  // =========================================================
  // ENABLE MEMBER NOTIFICATIONS
  // =========================================================

  window.enableMemberNotifications = async function () {
    console.log("🔔 enableMemberNotifications called");

    try {
      // --------------------------------------------------
      // 1. Firebase check
      // --------------------------------------------------

      if (!window.firebase) {
        alert("Firebase is not loaded.");
        return;
      }

      console.log(
        "Firebase loaded:",
        firebase.SDK_VERSION
      );

      // --------------------------------------------------
      // 2. Browser notification support
      // --------------------------------------------------

      if (!("Notification" in window)) {
        alert(
          "This browser does not support notifications."
        );
        return;
      }

      // --------------------------------------------------
      // 3. Firebase Messaging check
      // --------------------------------------------------

      if (
        !window.firebase ||
        typeof window.firebase.messaging !== "function"
      ) {
        console.error(
          "Firebase Messaging SDK is not available.",
          window.firebase
        );

        alert(
          "Firebase Messaging SDK is not loaded. Please refresh the page."
        );

        return;
      }

      console.log(
        "✅ Firebase Messaging SDK is available."
      );

      // --------------------------------------------------
      // 4. Get logged-in member
      // --------------------------------------------------

      let member = null;

      const localMember =
        localStorage.getItem(
          "wealthoria-member"
        );

      const sessionMember =
        sessionStorage.getItem(
          "wealthoria-member"
        );

      try {
        if (localMember) {
          member = JSON.parse(localMember);
        } else if (sessionMember) {
          member = JSON.parse(sessionMember);
        }
      } catch (error) {
        console.error(
          "Member session parse error:",
          error
        );
      }

      // Do NOT print JWT/token in console
      console.log(
        "Logged-in member:",
        member
          ? {
              uid: member.uid,
              email: member.email,
              name: member.name,
              role: member.role
            }
          : null
      );

      if (
        !member ||
        !member.uid ||
        !member.token
      ) {
        alert(
          "Please login as a member first."
        );
        return;
      }

      // --------------------------------------------------
      // 5. Ask notification permission
      // --------------------------------------------------

      const permission =
        await Notification.requestPermission();

      console.log(
        "Notification permission:",
        permission
      );

      if (permission !== "granted") {
        alert(
          "Notification permission was not granted."
        );
        return;
      }

      // --------------------------------------------------
      // 6. Service Worker
      // --------------------------------------------------

      if (
        !("serviceWorker" in navigator)
      ) {
        alert(
          "Service Worker is not supported."
        );
        return;
      }

      const registration =
        await navigator.serviceWorker.ready;

      console.log(
        "Service worker ready:",
        registration
      );

      // --------------------------------------------------
      // 7. Firebase Messaging instance
      // --------------------------------------------------

      const messaging =
        firebase.messaging();

      console.log(
        "✅ Firebase Messaging instance created."
      );

      // --------------------------------------------------
      // 8. FOREGROUND NOTIFICATION LISTENER
      // --------------------------------------------------

      if (
        !window.memberForegroundListenerReady
      ) {
        messaging.onMessage(
          function (payload) {
            console.log(
              "🔔 Foreground notification received:",
              payload
            );

            const title =
              payload.notification?.title ||
              payload.data?.title ||
              "Wealthoria";

            const body =
              payload.notification?.body ||
              payload.data?.body ||
              "You have a new notification.";

            // ------------------------------------------
            // Show browser notification
            // ------------------------------------------

            if (
              Notification.permission ===
              "granted"
            ) {
              try {
                const notification =
                  new Notification(
                    title,
                    {
                      body: body,
                      icon:
                        "/icons/icon-192.png"
                    }
                  );

                notification.onclick =
                  function () {
                    window.focus();
                    notification.close();
                  };

                console.log(
                  "✅ Foreground browser notification displayed."
                );

              } catch (notificationError) {
                console.error(
                  "❌ Could not display browser notification:",
                  notificationError
                );
              }
            } else {
              console.warn(
                "⚠️ Notification permission is not granted."
              );
            }
          }
        );

        window.memberForegroundListenerReady =
          true;

        console.log(
          "✅ Foreground notification listener ready."
        );
      } else {
        console.log(
          "ℹ️ Foreground notification listener already exists."
        );
      }

      // --------------------------------------------------
      // 9. VAPID KEY
      // --------------------------------------------------

      const vapidKey =
        "BEoUv-g5znqXgkiql7pW95Ucw67PDIgJWNGYLkFVo4vu8ZxZEp0DSk0ggnl1piEktPvsBfJKqATvsAJO-GUFvpc";

      // --------------------------------------------------
      // 10. Get FCM TOKEN
      // --------------------------------------------------

      console.log(
        "Requesting FCM token..."
      );

      const fcmToken =
        await messaging.getToken({
          vapidKey: vapidKey,

          serviceWorkerRegistration:
            registration
        });

      if (!fcmToken) {
        alert(
          "Could not get FCM token."
        );
        return;
      }

      console.log(
        "✅ FCM token received successfully."
      );

      // --------------------------------------------------
      // 11. Send FCM token to backend
      // --------------------------------------------------

      console.log(
        "Sending token to backend..."
      );

      const response =
        await fetch(
          "https://webinar-registration-backend.onrender.com/api/members/notification-token",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Authorization":
                "Bearer " +
                member.token
            },

            body: JSON.stringify({
              token: fcmToken
            })
          }
        );

      const data =
        await response.json();

      console.log(
        "Backend response:",
        data
      );

      // --------------------------------------------------
      // 12. Backend error
      // --------------------------------------------------

      if (!response.ok) {
        alert(
          data.message ||
          "Failed to save notification token."
        );

        return;
      }

      // --------------------------------------------------
      // 13. Success
      // --------------------------------------------------

      console.log(
        "✅ Notification token saved successfully."
      );

      alert(
        "Notifications enabled successfully! 🔔"
      );

    } catch (error) {

      console.error(
        "❌ Notification setup error:",
        error
      );

      alert(
        "Unable to enable notifications:\n" +
        error.message
      );
    }
  };

  // =========================================================
  // SCRIPT LOADED
  // =========================================================

  console.log(
    "✅ Wealthoria notification system loaded."
  );
})();