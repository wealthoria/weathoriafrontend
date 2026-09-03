(function () {
  console.log("🔥 NOTIFICATIONS.JS STARTED");

  // =========================================================
  // CONFIG
  // =========================================================

  const FIREBASE_MESSAGING_SDK =
    "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js";

  const VAPID_KEY =
    "BEoUv-g5znqXgkiql7pW95Ucw67PDIgJWNGYLkFVo4vu8ZxZEp0DSk0ggnl1piEktPvsBfJKqATvsAJO-GUFvpc";

  const BACKEND_URL =
    "https://webinar-registration-backend.onrender.com";


  // =========================================================
  // GET LOGGED-IN MEMBER
  // =========================================================

  function getLoggedInMember() {
    let member = null;

    const localMember =
      localStorage.getItem("wealthoria-member");

    const sessionMember =
      sessionStorage.getItem("wealthoria-member");

    try {
      if (localMember) {
        member = JSON.parse(localMember);
      } else if (sessionMember) {
        member = JSON.parse(sessionMember);
      }
    } catch (error) {
      console.error(
        "❌ Member session parse error:",
        error
      );
    }

    return member;
  }


  // =========================================================
  // LOAD SCRIPT
  // =========================================================

  function loadScript(src) {
    return new Promise((resolve, reject) => {

      const existing =
        document.querySelector(
          `script[src="${src}"]`
        );

      if (existing) {
        resolve();
        return;
      }

      const script =
        document.createElement("script");

      script.src = src;

      script.onload = () => {
        console.log(
          "✅ Script loaded:",
          src
        );

        resolve();
      };

      script.onerror = (error) => {
        console.error(
          "❌ Script failed:",
          src,
          error
        );

        reject(
          new Error(
            "Failed to load: " + src
          )
        );
      };

      document.head.appendChild(
        script
      );
    });
  }


  // =========================================================
  // FIREBASE MESSAGING
  // =========================================================

  async function getMessagingInstance() {

    if (!window.firebase) {
      throw new Error(
        "Firebase is not loaded."
      );
    }

    if (
      typeof window.firebase.messaging !==
      "function"
    ) {

      console.log(
        "📥 Loading Firebase Messaging SDK..."
      );

      await loadScript(
        FIREBASE_MESSAGING_SDK
      );
    }

    if (
      typeof window.firebase.messaging !==
      "function"
    ) {
      throw new Error(
        "Firebase Messaging SDK could not be loaded."
      );
    }

    return firebase.messaging();
  }


  // =========================================================
  // FOREGROUND NOTIFICATION LISTENER
  // =========================================================

  async function initializeMemberForegroundNotifications() {

    console.log(
      "🔔 Initializing foreground notification listener..."
    );

    try {

      const member =
        getLoggedInMember();

      if (
        !member ||
        !member.uid
      ) {

        console.warn(
          "⚠️ No logged-in member found."
        );

        return false;
      }


      if (!window.firebase) {

        console.error(
          "❌ Firebase is not loaded."
        );

        return false;
      }


      if (
        !("serviceWorker" in navigator)
      ) {

        console.error(
          "❌ Service Worker not supported."
        );

        return false;
      }


      const registration =
        await navigator.serviceWorker.ready;


      const messaging =
        await getMessagingInstance();


      if (
        window.memberForegroundListenerReady
      ) {

        console.log(
          "ℹ️ Foreground listener already exists."
        );

        return true;
      }


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


          // ==================================================
          // SEND EVENT TO MEMBER DASHBOARD
          // ==================================================

          window.dispatchEvent(
            new CustomEvent(
              "wealthoria:notification",
              {
                detail: {
                  title: title,
                  message: body
                }
              }
            )
          );


          console.log(
            "✅ Dashboard notification event dispatched."
          );


          // ==================================================
          // SHOW BROWSER NOTIFICATION
          // ==================================================

          if (
            "Notification" in window &&
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
                "✅ Browser notification displayed."
              );

            } catch (notificationError) {

              console.error(
                "❌ Could not display browser notification:",
                notificationError
              );

            }

          }

        }
      );


      window.memberForegroundListenerReady =
        true;


      console.log(
        "✅ Foreground notification listener ready."
      );


      return true;

    } catch (error) {

      console.error(
        "❌ Foreground notification initialization error:",
        error
      );

      return false;
    }
  }


  // =========================================================
  // ENABLE MEMBER NOTIFICATIONS
  // =========================================================

  window.enableMemberNotifications =
    async function () {

      console.log(
        "🔔 enableMemberNotifications called"
      );

      try {

        // --------------------------------------------------
        // 1. Firebase check
        // --------------------------------------------------

        if (!window.firebase) {

          alert(
            "Firebase is not loaded."
          );

          return;
        }


        console.log(
          "Firebase loaded:",
          firebase.SDK_VERSION
        );


        // --------------------------------------------------
        // 2. Browser notification support
        // --------------------------------------------------

        if (
          !("Notification" in window)
        ) {

          alert(
            "This browser does not support notifications."
          );

          return;
        }


        // --------------------------------------------------
        // 3. Get logged-in member
        // --------------------------------------------------

        const member =
          getLoggedInMember();


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
        // 4. Ask permission
        // --------------------------------------------------

        const permission =
          await Notification.requestPermission();


        console.log(
          "Notification permission:",
          permission
        );


        if (
          permission !== "granted"
        ) {

          alert(
            "Notification permission was not granted."
          );

          return;
        }


        // --------------------------------------------------
        // 5. Initialize foreground listener
        // --------------------------------------------------

        await initializeMemberForegroundNotifications();


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
        // 7. Get Messaging
        // --------------------------------------------------

        const messaging =
          await getMessagingInstance();


        console.log(
          "✅ Firebase Messaging instance created."
        );


        // --------------------------------------------------
        // 8. Get FCM token
        // --------------------------------------------------

        console.log(
          "Requesting FCM token..."
        );


        const fcmToken =
          await messaging.getToken({
            vapidKey:
              VAPID_KEY,

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
        // 9. Save token to backend
        // --------------------------------------------------

        console.log(
          "Sending token to backend..."
        );


        const response =
          await fetch(
            `${BACKEND_URL}/api/members/notification-token`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "Authorization":
                  "Bearer " +
                  member.token
              },

              body:
                JSON.stringify({
                  token:
                    fcmToken
                })
            }
          );


        const data =
          await response.json();


        console.log(
          "Backend response:",
          data
        );


        if (!response.ok) {

          alert(
            data.message ||
            "Failed to save notification token."
          );

          return;
        }


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
  // EXPOSE FOREGROUND INITIALIZER
  // =========================================================

  window.initializeMemberForegroundNotifications =
    initializeMemberForegroundNotifications;


  // =========================================================
  // SCRIPT LOADED
  // =========================================================

  console.log(
    "✅ Wealthoria notification system loaded."
  );

})();