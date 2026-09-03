(function () {
  console.log("🔥 NOTIFICATIONS.JS STARTED");

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

        member = JSON.parse(
          localMember
        );

      } else if (sessionMember) {

        member = JSON.parse(
          sessionMember
        );

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

    return new Promise(
      (resolve, reject) => {

        const existing =
          document.querySelector(
            `script[src="${src}"]`
          );

        if (existing) {

          resolve();

          return;
        }


        const script =
          document.createElement(
            "script"
          );


        script.src = src;


        script.onload = () => {

          console.log(
            "✅ Script loaded:",
            src
          );

          resolve();

        };


        script.onerror = () => {

          reject(
            new Error(
              "Failed to load: " +
              src
            )
          );

        };


        document.head.appendChild(
          script
        );

      }
    );

  }


  // =========================================================
  // GET FIREBASE MESSAGING
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
  // START FOREGROUND LISTENER
  // =========================================================

  async function initializeMemberForegroundNotifications() {

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


      const messaging =
        await getMessagingInstance();


      // Prevent duplicate listeners.

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
            "🔔 NEW FOREGROUND NOTIFICATION:",
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


          // =================================================
          // SEND ONLY NEW NOTIFICATION TO DASHBOARD
          // =================================================

          window.dispatchEvent(
            new CustomEvent(
              "wealthoria:notification",
              {
                detail: {
                  title:
                    title,

                  message:
                    body
                }
              }
            )
          );


          console.log(
            "✅ Dashboard notification event sent."
          );


          // =================================================
          // BROWSER NOTIFICATION
          // =================================================

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
                    body:
                      body,

                    icon:
                      "/icons/icon-192.png"
                  }
                );


              notification.onclick =
                function () {

                  window.focus();

                  notification.close();

                };


            } catch (error) {

              console.error(
                "❌ Browser notification error:",
                error
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
        "❌ Foreground listener error:",
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

        if (!window.firebase) {

          alert(
            "Firebase is not loaded."
          );

          return;
        }


        if (
          !("Notification" in window)
        ) {

          alert(
            "This browser does not support notifications."
          );

          return;
        }


        const member =
          getLoggedInMember();


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


        const permission =
          await Notification.requestPermission();


        console.log(
          "Notification permission:",
          permission
        );


        if (
          permission !== "granted"
        ) {

          return;
        }


        await initializeMemberForegroundNotifications();


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


        const messaging =
          await getMessagingInstance();


        const fcmToken =
          await messaging.getToken({

            vapidKey:
              VAPID_KEY,

            serviceWorkerRegistration:
              registration

          });


        if (!fcmToken) {

          console.error(
            "❌ FCM token was not created."
          );

          return;
        }


        console.log(
          "✅ FCM token received successfully."
        );


        const response =
          await fetch(
            `${BACKEND_URL}/api/members/notification-token`,
            {
              method:
                "POST",

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


        if (!response.ok) {

          console.error(
            "❌ Token save failed:",
            data
          );

          return;
        }


        console.log(
          "✅ Notification token saved successfully."
        );


      } catch (error) {

        console.error(
          "❌ Notification setup error:",
          error
        );

      }

    };


  // =========================================================
  // EXPOSE FOREGROUND INITIALIZER
  // =========================================================

  window.initializeMemberForegroundNotifications =
    initializeMemberForegroundNotifications;


  console.log(
    "✅ Wealthoria notification system loaded."
  );

})();