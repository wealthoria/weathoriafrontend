import React from "react";

/* global React, window */

const { useState, useEffect } = React;


/* =========================================================
   MEMBERS ROUTER
   ========================================================= */

function MembersRouter() {

  const [path, setPath] = useState(
    window.location.pathname
  );

  const [memberSession, setMemberSession] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

/* =========================================================
   MULTI-MEMBER SESSION STORAGE
========================================================= */

const MEMBER_SESSIONS_KEY =
  "wealthoria-member-sessions";

const CURRENT_MEMBER_KEY =
  "wealthoria-current-member";


const readStorageObject = (storage) => {

  try {

    const raw =
      storage.getItem(MEMBER_SESSIONS_KEY);

    if (!raw) {
      return {};
    }

    const parsed =
      JSON.parse(raw);

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : {};

  } catch (error) {

    console.warn(
      "Could not read member sessions:",
      error
    );

    return {};
  }

};


const writeStorageObject = (
  storage,
  sessions
) => {

  storage.setItem(
    MEMBER_SESSIONS_KEY,
    JSON.stringify(sessions)
  );

};


const getSavedMemberSession = () => {

  try {

    /* =====================================================
       1. NEW MULTI-ACCOUNT STORAGE
    ===================================================== */

    const sessionCurrentUid =
      sessionStorage.getItem(
        CURRENT_MEMBER_KEY
      );

    if (sessionCurrentUid) {

      const sessionSessions =
        readStorageObject(
          sessionStorage
        );

      const session =
        sessionSessions[
          sessionCurrentUid
        ];

      if (
        session?.uid &&
        session?.token
      ) {

        return {
          value:
            JSON.stringify(session),
          type:
            "session",
          uid:
            session.uid
        };

      }

    }


    const localCurrentUid =
      localStorage.getItem(
        CURRENT_MEMBER_KEY
      );

    if (localCurrentUid) {

      const localSessions =
        readStorageObject(
          localStorage
        );

      const session =
        localSessions[
          localCurrentUid
        ];

      if (
        session?.uid &&
        session?.token
      ) {

        return {
          value:
            JSON.stringify(session),
          type:
            "local",
          uid:
            session.uid
        };

      }

    }


    /* =====================================================
       2. BACKWARD COMPATIBILITY
       Read old single-session storage once
       ===================================================== */

    const oldLocal =
      localStorage.getItem(
        "wealthoria-member"
      );

    if (oldLocal) {

      try {

        const oldSession =
          JSON.parse(oldLocal);

        if (
          oldSession?.uid &&
          oldSession?.token
        ) {

          const localSessions =
            readStorageObject(
              localStorage
            );

          localSessions[
            oldSession.uid
          ] = oldSession;

          writeStorageObject(
            localStorage,
            localSessions
          );

          localStorage.setItem(
            CURRENT_MEMBER_KEY,
            oldSession.uid
          );

          localStorage.removeItem(
            "wealthoria-member"
          );

       

          return {
            value:
              JSON.stringify(oldSession),
            type:
              "local",
            uid:
              oldSession.uid
          };

        }

      } catch (error) {

        console.warn(
          "Old local member session is invalid:",
          error
        );

      }

    }


    const oldSessionStorage =
      sessionStorage.getItem(
        "wealthoria-member"
      );

    if (oldSessionStorage) {

      try {

        const oldSession =
          JSON.parse(
            oldSessionStorage
          );

        if (
          oldSession?.uid &&
          oldSession?.token
        ) {

          const sessions =
            readStorageObject(
              sessionStorage
            );

          sessions[
            oldSession.uid
          ] = oldSession;

          writeStorageObject(
            sessionStorage,
            sessions
          );

          sessionStorage.setItem(
            CURRENT_MEMBER_KEY,
            oldSession.uid
          );

          sessionStorage.removeItem(
            "wealthoria-member"
          );

        

          return {
            value:
              JSON.stringify(oldSession),
            type:
              "session",
            uid:
              oldSession.uid
          };

        }

      } catch (error) {

        console.warn(
          "Old sessionStorage member session is invalid:",
          error
        );

      }

    }


    return null;

  } catch (error) {

    console.error(
      "Could not read current member session:",
      error
    );

    return null;

  }

};

const saveMemberSession = (
  session,
  storageType
) => {

  try {

    if (!session?.uid) {
      return;
    }

    const storage =
      storageType === "local"
        ? localStorage
        : sessionStorage;

    const sessions =
      readStorageObject(storage);

    sessions[session.uid] =
      session;

    writeStorageObject(
      storage,
      sessions
    );

  } catch (error) {

    console.error(
      "Could not save member session:",
      error
    );

  }

};


const removeMemberSession = (
  uid
) => {

  try {

    if (!uid) {
      return;
    }

    const localSessions =
      readStorageObject(
        localStorage
      );

    const sessionSessions =
      readStorageObject(
        sessionStorage
      );


    delete localSessions[uid];
    delete sessionSessions[uid];


    writeStorageObject(
      localStorage,
      localSessions
    );

    writeStorageObject(
      sessionStorage,
      sessionSessions
    );


    if (
      localStorage.getItem(
        CURRENT_MEMBER_KEY
      ) === uid
    ) {

      localStorage.removeItem(
        CURRENT_MEMBER_KEY
      );

    }


    if (
      sessionStorage.getItem(
        CURRENT_MEMBER_KEY
      ) === uid
    ) {

      sessionStorage.removeItem(
        CURRENT_MEMBER_KEY
      );

    }

  } catch (error) {

    console.error(
      "Could not remove member session:",
      error
    );

  }

};

  /* =========================================================
     LISTEN FOR BACK / FORWARD
     ========================================================= */

  useEffect(() => {

    const handleNavigation = () => {

      setPath(
        window.location.pathname
      );

      window.scrollTo(
        0,
        0
      );

    };


    window.addEventListener(
      "popstate",
      handleNavigation
    );


    return () => {

      window.removeEventListener(
        "popstate",
        handleNavigation
      );

    };

  }, []);


  /* =========================================================
     NAVIGATION
     ========================================================= */

  const navigate = (to) => {

    if (!to) {
      return;
    }


    window.history.pushState(
      {},
      "",
      to
    );


    setPath(to);


    window.scrollTo(
      0,
      0
    );

  };


  /* =========================================================
     GLOBAL NAVIGATION
     ========================================================= */

  window.membersNavigate =
    navigate;


  /* =========================================================
     PUBLIC MEMBER ROUTES
     ========================================================= */

  const isLoginRoute =
    path === "/members/login" ||
    path === "/members/";

  const isForgotPasswordRoute =
    path === "/members/forgot-password";

  /*
   * Subscription registration stays available for
   * users who are NOT already logged in.
   *
   * An inactive logged-in member must use the
   * dedicated Activate Subscription button on login.
   */
  const isSubscriptionRoute =
    path === "/members/subscription";


  const isProtectedRoute =
    !isLoginRoute &&
    !isForgotPasswordRoute &&
    !(
      isSubscriptionRoute
    );


  /* =========================================================
     VERIFY CURRENT MEMBER ACCESS
     ========================================================= */

  useEffect(() => {

    let cancelled = false;
    let intervalId = null;


    const checkMemberAccess =
      async () => {

        /* -----------------------------------------------------
           Login / forgot-password do not require an existing
           member session.
        ----------------------------------------------------- */

        if (
          isLoginRoute ||
          isForgotPasswordRoute
        ) {
          if (!cancelled) {
            setCheckingAccess(false);
            setAccessDenied(false);
          }

          return;
        }


        /* -----------------------------------------------------
           Subscription registration page:
           allow only when there is no existing member session.
        ----------------------------------------------------- */

        const saved =
          getSavedMemberSession();

        if (
          isSubscriptionRoute &&
          !saved
        ) {
          if (!cancelled) {
            setCheckingAccess(false);
            setAccessDenied(false);
          }

          return;
        }


        /* -----------------------------------------------------
           Protected route requires a saved member session.
        ----------------------------------------------------- */

        if (!saved) {

          if (!cancelled) {
            setMemberSession(null);
            setAccessDenied(true);
            setCheckingAccess(false);
          }

          return;
        }


        let session;

        try {

          session =
            JSON.parse(
              saved.value
            );

        } catch (error) {

          console.error(
            "Saved member session is invalid:",
            error
          );

          clearMemberSession();

          if (!cancelled) {
            setMemberSession(null);
            setAccessDenied(true);
            setCheckingAccess(false);
          }

          return;
        }


        if (
          !session?.uid ||
          !session?.token
        ) {

         removeMemberSession(
  session?.uid || saved?.uid
);

          if (!cancelled) {
            setMemberSession(null);
            setAccessDenied(true);
            setCheckingAccess(false);
          }

          return;
        }


        /* -----------------------------------------------------
           ALWAYS ASK BACKEND FOR CURRENT MEMBER STATUS.
           localStorage is only a session cache.
        ----------------------------------------------------- */

        try {

          const response =
            await fetch(
              "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api/members/me",
              {
                method: "GET",
                headers: {
                  Authorization:
                    `Bearer ${session.token}`,

                  "Content-Type":
                    "application/json"
                }
              }
            );


          let data = null;

          try {
            data =
              await response.json();
          } catch (jsonError) {
            console.warn(
              "Could not parse member access response:",
              jsonError
            );
          }
if (
  !response.ok ||
  !data?.success ||
  !data?.member
) {

  console.error(
    "Member /api/members/me failed:",
    {
      httpStatus: response.status,
      responseData: data
    }
  );

  removeMemberSession(
    session?.uid || saved?.uid
  );

  if (!cancelled) {
    setMemberSession(null);
    setAccessDenied(true);
    setCheckingAccess(false);
  }

  return;
}


          const member =
            data.member;

          const currentStatus =
            String(
              member.status ||
              ""
            )
              .trim()
              .toLowerCase();


          /* ---------------------------------------------------
             INACTIVE / BLOCKED MEMBER
          --------------------------------------------------- */

          const inactiveStatuses = [
            "inactive",
            "cancelled",
            "canceled",
            "deactivated",
            "disabled",
            "blocked",
            "suspended"
          ];


          const updatedSession = {
            ...session,

            uid:
              member.uid ||
              session.uid,

            email:
              member.email ||
              session.email ||
              "",

            name:
              member.name ||
              session.name ||
              "",

            role:
              member.role ||
              session.role ||
              "member",

            status:
              currentStatus,

            subscription:
              member.subscription ||
              session.subscription ||
              null
          };


          saveMemberSession(
            updatedSession,
            saved.type
          );


          if (
            inactiveStatuses.includes(
              currentStatus
            )
          ) {

            /*
             * IMPORTANT:
             *
             * Do not allow an inactive member to access
             * ANY protected page.
             *
             * Keep the session available so the login page
             * can show the Activate Subscription action.
             */

            if (!cancelled) {
              setMemberSession(
                updatedSession
              );

              setAccessDenied(true);
              setCheckingAccess(false);
            }

            return;
          }


          /* ---------------------------------------------------
             ACTIVE MEMBER
          --------------------------------------------------- */

          if (
            !cancelled
          ) {

            setMemberSession(
              updatedSession
            );

            setAccessDenied(false);
            setCheckingAccess(false);

          }

        } catch (error) {

          console.error(
            "Member access check failed:",
            error
          );

          /*
           * Network failure should NOT automatically
           * delete the member's session.
           *
           * For a protected page, fail closed until
           * access can be verified.
           */

          if (!cancelled) {
            setAccessDenied(true);
            setCheckingAccess(false);
          }

        }

      };


    checkMemberAccess();


    /*
     * Check the current member status periodically.
     * This catches subscription cancellation while the
     * member is already sitting on a page.
     */
    if (
      !isLoginRoute &&
      !isForgotPasswordRoute
    ) {

      intervalId =
        window.setInterval(
          checkMemberAccess,
          30000
        );

    }


    return () => {

      cancelled = true;

      if (intervalId) {
        window.clearInterval(
          intervalId
        );
      }

    };

  }, [
    path
  ]);





  /* =========================================================
     ACCESS CHECKING SCREEN
     ========================================================= */
if (
  checkingAccess &&
  !isLoginRoute &&
  !isForgotPasswordRoute
) {
  return (
    <div className="members-router-loading">
      <div className="member-access-pulse-loader">

        <div className="member-access-pulse">
          <span className="pulse-ring pulse-ring-1"></span>
          <span className="pulse-ring pulse-ring-2"></span>
          <span className="pulse-ring pulse-ring-3"></span>

          <div className="member-access-logo">
            <img
              src="/assets/logo-mark.png"
              alt="Wealthoria"
            />
          </div>
        </div>

        <div className="member-access-title">
          Checking member access
          <span className="member-access-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>

      </div>
    </div>
  );
}

  /* =========================================================
     INACTIVE / BLOCKED MEMBER
     ========================================================= */

  if (
    accessDenied &&
    !isLoginRoute &&
    !isForgotPasswordRoute
  ) {

    /*
     * Send the member to login.
     *
     * We intentionally do NOT clear the session here
     * for inactive members because login.jsx needs the
     * existing session for the Activate Subscription flow.
     */

    if (
      window.location.pathname !==
      "/members/login"
    ) {

      window.history.replaceState(
        {},
        "",
        "/members/login"
      );

      setPath(
        "/members/login"
      );

      window.scrollTo(
        0,
        0
      );

      return null;
    }

    return null;
  }


  /* =========================================================
     LOGIN
     ========================================================= */

  if (
    path === "/members/login" ||
    path === "/members/"
  ) {

    return window.MemberLogin
      ? React.createElement(
          window.MemberLogin
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Member Login...
          </div>
        );

  }


  /* =========================================================
     DASHBOARD
     ========================================================= */

  if (
    path === "/members/dashboard"
  ) {

    return window.MemberDashboard
      ? React.createElement(
          window.MemberDashboard
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Dashboard...
          </div>
        );

  }


  /* =========================================================
     COURSE VIDEOS
     ========================================================= */

  if (
    path === "/members/course-videos"
  ) {

    return window.CourseVideos
      ? React.createElement(
          window.CourseVideos
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Course Videos...
          </div>
        );

  }


  /* =========================================================
     WEEKLY ROUNDUP
     ========================================================= */

  if (
    path === "/members/weekly-roundup"
  ) {

    return window.WeeklyRoundup
      ? React.createElement(
          window.WeeklyRoundup
        )
      : (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              padding: 40,
              textAlign: "center",
              fontFamily:
                "Arial, sans-serif"
            }}
          >

            <h2>
              Weekly Roundup is not available
            </h2>


            <p>
              WeeklyRoundup.jsx has not loaded.
            </p>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/members/dashboard"
                )
              }
              style={{
                marginTop: 20,
                padding:
                  "12px 22px",
                border: "none",
                borderRadius: 8,
                background:
                  "#e8473f",
                color: "#fff",
                cursor:
                  "pointer",
                fontSize: 14
              }}
            >
              ← Back to Dashboard
            </button>

          </div>
        );

  }


  /* =========================================================
     NEWSLETTER
     ========================================================= */

  if (
    path === "/members/newsletter"
  ) {

    return window.Newsletter
      ? React.createElement(
          window.Newsletter
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Newsletter...
          </div>
        );

  }


  /* =========================================================
     PURCHASE HISTORY
     ========================================================= */

  if (
    path ===
    "/members/purchase-history"
  ) {

    return window.PurchaseHistory
      ? React.createElement(
          window.PurchaseHistory
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Purchase History...
          </div>
        );

  }


  /* =========================================================
     SETTINGS
     ========================================================= */

  if (
    path === "/members/settings"
  ) {

    return window.MemberSettings
      ? React.createElement(
          window.MemberSettings
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Settings...
          </div>
        );

  }


  if (
    path ===
    "/members/subscription"
  ) {

    return window.MemberSubscription
      ? React.createElement(
          window.MemberSubscription
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Subscription...
          </div>
        );

  }


  /* =========================================================
     FORGOT PASSWORD
     ========================================================= */

  if (
    path === "/members/forgot-password"
  ) {

    return window.ForgotPassword
      ? React.createElement(
          window.ForgotPassword
        )
      : (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              padding: 40,
              fontFamily:
                "Arial, sans-serif"
            }}
          >

            <h2>
              Forgot Password
            </h2>


            <p>
              Password recovery page coming soon.
            </p>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/members/login"
                )
              }
              style={{
                marginTop: 20,
                padding:
                  "12px 24px",
                border: "none",
                borderRadius: 8,
                background:
                  "#e8473f",
                color: "#fff",
                cursor:
                  "pointer"
              }}
            >
              Back to Login
            </button>

          </div>
        );

  }


  /* =========================================================
     PAGE NOT FOUND
     ========================================================= */

  return (

    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 40,
        fontFamily:
          "Arial, sans-serif"
      }}
    >

      <h2>
        Members Portal
      </h2>


      <p>
        Page not found:
        <br />

        <strong>
          {path}
        </strong>
      </p>


      <button
        type="button"
        onClick={() =>
          navigate(
            "/members/dashboard"
          )
        }
        style={{
          marginTop: 20,
          padding:
            "12px 24px",
          border: "none",
          borderRadius: 8,
          background:
            "#e8473f",
          color: "#fff",
          cursor:
            "pointer",
          fontSize: 15
        }}
      >
        Go to Dashboard
      </button>

    </div>

  );

}


/* =========================================================
   EXPORT
   ========================================================= */

window.MembersRouter =
  MembersRouter;



  