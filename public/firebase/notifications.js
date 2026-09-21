(function () {

  // =========================================================
  // CONFIG
  // =========================================================

  const FIREBASE_MESSAGING_SDK =
    "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js";

  const VAPID_KEY =
    "BEoUv-g5znqXgkiql7pW95Ucw67PDIgJWNGYLkFVo4vu8ZxZEp0DSk0ggnl1piEktPvsBfJKqATvsAJO-GUFvpc";

  const BACKEND_URL =
    "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";


  // =========================================================
  // GET CURRENT LOGGED-IN MEMBER
  // MULTI-ACCOUNT SAFE
  // =========================================================

  function getLoggedInMember() {

    const MEMBER_SESSIONS_KEY =
      "wealthoria-member-sessions";

    const CURRENT_MEMBER_KEY =
      "wealthoria-current-member";


    // =======================================================
    // GET CURRENT MEMBER UID
    // =======================================================

    const readCurrentMemberUid = () => {

      const raw =
        sessionStorage.getItem(CURRENT_MEMBER_KEY) ||
        localStorage.getItem(CURRENT_MEMBER_KEY);

      if (!raw) {
        return "";
      }

      try {

        const parsed =
          JSON.parse(raw);

        if (typeof parsed === "string") {
          return parsed;
        }

        return parsed?.uid || "";

      } catch (error) {

        // UID may already be stored as plain text
        return raw;
      }
    };


    // =======================================================
    // READ MEMBER SESSIONS
    // =======================================================

    const readSessions = (storage) => {

      try {

        const raw =
          storage.getItem(MEMBER_SESSIONS_KEY);

        if (!raw) {
          return {};
        }

        const parsed =
          JSON.parse(raw);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          return parsed;
        }

        return {};

      } catch (error) {

        console.error(
          "❌ Member sessions parse error:",
          error
        );

        return {};
      }
    };


    // =======================================================
    // GET CURRENT UID
    // =======================================================

    const currentUid =
      readCurrentMemberUid();


    // =======================================================
    // FIND CURRENT MEMBER IN SESSION STORAGE
    // =======================================================

    if (currentUid) {

      const sessionStore =
        readSessions(sessionStorage);

      if (
        sessionStore[currentUid]
      ) {

   

        return sessionStore[currentUid];
      }


      // =====================================================
      // FIND CURRENT MEMBER IN LOCAL STORAGE
      // =====================================================

      const localStore =
        readSessions(localStorage);

      if (
        localStore[currentUid]
      ) {

      

        return localStore[currentUid];
      }
    }


    // =======================================================
    // LEGACY SESSION FALLBACK
    // =======================================================

    const legacyLocal =
      localStorage.getItem(
        "wealthoria-member"
      );

    const legacySession =
      sessionStorage.getItem(
        "wealthoria-member"
      );


    try {

      if (legacySession) {

        const member =
          JSON.parse(
            legacySession
          );

      

        return member;
      }


      if (legacyLocal) {

        const member =
          JSON.parse(
            legacyLocal
          );

     

        return member;
      }

    } catch (error) {

      console.error(
        "❌ Legacy member session parse error:",
        error
      );
    }


    return null;
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


      document.head.appendChild(script);
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
  // GET FCM TOKEN AND SAVE TO BACKEND
  // =========================================================
  //
  // IMPORTANT:
  //
  // This function automatically registers the FCM token
  // when:
  //
  // 1. Member is logged in
  // 2. Notification permission is granted
  //
  // =========================================================

  async function registerMemberFCMToken() {

  

    try {

      // -----------------------------------------------------
      // 1. Get logged-in member
      // -----------------------------------------------------

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


    


      // -----------------------------------------------------
      // 2. Authentication token
      // -----------------------------------------------------

      if (!member.token) {

        console.warn(
          "⚠️ Member authentication token is missing."
        );

        return false;
      }


      // -----------------------------------------------------
      // 3. Browser notification support
      // -----------------------------------------------------

      if (
        !("Notification" in window)
      ) {

        console.warn(
          "⚠️ Notifications are not supported."
        );

        return false;
      }



      if (!window.firebase) {

        console.error(
          "❌ Firebase is not loaded."
        );

        return false;
      }


      // -----------------------------------------------------
      // 6. Service Worker
      // -----------------------------------------------------

      if (
        !("serviceWorker" in navigator)
      ) {

        console.error(
          "❌ Service Worker is not supported."
        );

        return false;
      }


      const registration =
        await navigator.serviceWorker.ready;


    


      // -----------------------------------------------------
      // 7. Firebase Messaging
      // -----------------------------------------------------

      const messaging =
        await getMessagingInstance();


    

      // -----------------------------------------------------
      // 8. Get FCM token
      // -----------------------------------------------------

    

      const fcmToken =
        await messaging.getToken({

          vapidKey:
            VAPID_KEY,

          serviceWorkerRegistration:
            registration

        });


      if (!fcmToken) {

        console.error(
          "❌ Firebase did not return an FCM token."
        );

        return false;
      }





      // -----------------------------------------------------
      // 9. Send token to backend
      // -----------------------------------------------------

    

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


      // -----------------------------------------------------
      // 10. Read backend response
      // -----------------------------------------------------

      let data = {};


      try {

        data =
          await response.json();

      } catch (jsonError) {

        console.error(
          "❌ Could not parse backend response:",
          jsonError
        );
      }




      // -----------------------------------------------------
      // 11. Backend error
      // -----------------------------------------------------

      if (!response.ok) {

        console.error(
          "❌ Failed to save FCM token.",
          {
            status:
              response.status,

            response:
              data
          }
        );

        return false;
      }


      // -----------------------------------------------------
      // 12. SUCCESS
      // -----------------------------------------------------

   

     




      return true;


    } catch (error) {

      console.error(
        "❌ FCM token registration failed:",
        error
      );

      return false;
    }
  }



  // =========================================================
  // FOREGROUND NOTIFICATION LISTENER
  // =========================================================

  async function initializeMemberForegroundNotifications() {

  

    try {

      // -----------------------------------------------------
      // 1. Get member
      // -----------------------------------------------------

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


      // -----------------------------------------------------
      // 2. Firebase
      // -----------------------------------------------------

      if (!window.firebase) {

        console.error(
          "❌ Firebase is not loaded."
        );

        return false;
      }


      // -----------------------------------------------------
      // 3. Service Worker
      // -----------------------------------------------------

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




      // -----------------------------------------------------
      // 4. Messaging
      // -----------------------------------------------------

      const messaging =
        await getMessagingInstance();


      // =====================================================
      // 5. REGISTER FCM TOKEN AUTOMATICALLY
      // =====================================================
      //
      // This is the important new part.
      //
      // If permission is already granted, automatically
      // create/get the FCM token and save it to backend.
      //
      // =====================================================

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {

        await registerMemberFCMToken();

      } else {

       
      }


      // =====================================================
      // 6. FOREGROUND LISTENER
      // =====================================================

      if (
        window.memberForegroundListenerReady
      ) {

     

        return true;
      }


      messaging.onMessage(
        function (payload) {

      

          // -------------------------------------------------
          // Notification title
          // -------------------------------------------------

          const title =
            payload.notification?.title ||
            payload.data?.title ||
            "Wealthoria";


          // -------------------------------------------------
          // Notification body
          // -------------------------------------------------

          const body =
            payload.notification?.body ||
            payload.data?.body ||
            "You have a new notification.";


          // =================================================
          // SEND EVENT TO MEMBER DASHBOARD
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


       


          // =================================================
          // SHOW BROWSER NOTIFICATION
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



            } catch (
              notificationError
            ) {

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

   


      try {

        // ---------------------------------------------------
        // 1. Firebase check
        // ---------------------------------------------------

        if (!window.firebase) {

          alert(
            "Firebase is not loaded."
          );

          return;
        }




        // ---------------------------------------------------
        // 2. Browser notification support
        // ---------------------------------------------------

        if (
          !("Notification" in window)
        ) {

          alert(
            "This browser does not support notifications."
          );

          return;
        }


        // ---------------------------------------------------
        // 3. Get logged-in member
        // ---------------------------------------------------

        const member =
          getLoggedInMember();



        if (
          !member ||
          !member.uid
        ) {

          alert(
            "Please login as a member first."
          );

          return;
        }


        // ---------------------------------------------------
        // 4. Request permission
        // ---------------------------------------------------

        let permission =
          Notification.permission;


        if (
          permission !== "granted"
        ) {

          permission =
            await Notification.requestPermission();

        }




        if (
          permission !== "granted"
        ) {

          alert(
            "Notification permission was not granted."
          );

          return;
        }


        // ---------------------------------------------------
        // 5. Initialize notification system
        // ---------------------------------------------------

        await initializeMemberForegroundNotifications();


        // ---------------------------------------------------
        // 6. Explicitly register token
        // ---------------------------------------------------
        //
        // This ensures that pressing the Enable button
        // always registers/saves the current FCM token.
        //
        // ---------------------------------------------------

        const saved =
          await registerMemberFCMToken();


        if (!saved) {

          alert(
            "Unable to save the notification token. Please check the browser permissions and try again."
          );

          return;
        }


        // ---------------------------------------------------
        // 7. Success
        // ---------------------------------------------------


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
  // EXPOSE FUNCTIONS
  // =========================================================

  window.initializeMemberForegroundNotifications =
    initializeMemberForegroundNotifications;


  window.registerMemberFCMToken =
    registerMemberFCMToken;



  // =========================================================
  // SCRIPT LOADED
  // =========================================================

 

})();