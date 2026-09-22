import React from "react";

/* global React, window */

const {
  useState,
  useEffect
} = React;


/* =========================================================
   MEMBER / ADMIN LOGIN
========================================================= */

function MemberLogin() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [remember, setRemember] =
    useState(true);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

const [subscriptionInactive, setSubscriptionInactive] =
  useState(false);
  /* =========================================================
     PREVENT PASSWORD MANAGER AUTOFILL
  ========================================================= */

  const [emailEditable, setEmailEditable] =
    useState(false);

  const [passwordEditable, setPasswordEditable] =
    useState(false);


  /* =========================================================
     BACKEND URL
  ========================================================= */

  const API_BASE_URL =
    "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

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


const getAllMemberSessions = () => {

  const localSessions =
    readStorageObject(localStorage);

  const sessionSessions =
    readStorageObject(sessionStorage);

  return {
    ...localSessions,
    ...sessionSessions
  };

};


const saveMemberSession = (
  session,
  shouldRemember
) => {

  try {

    if (!session?.uid) {
      throw new Error(
        "Member UID is missing."
      );
    }


    const localSessions =
      readStorageObject(localStorage);

    const sessionSessions =
      readStorageObject(sessionStorage);


    /* Remove this member from both stores first */
    delete localSessions[session.uid];
    delete sessionSessions[session.uid];


    if (shouldRemember) {

      localSessions[session.uid] =
        session;

      writeStorageObject(
        localStorage,
        localSessions
      );

      /* Current member is persistent */
      localStorage.setItem(
        CURRENT_MEMBER_KEY,
        session.uid
      );

      sessionStorage.removeItem(
        CURRENT_MEMBER_KEY
      );

    } else {

      sessionSessions[session.uid] =
        session;

      writeStorageObject(
        sessionStorage,
        sessionSessions
      );

      /* Current member is tab/session based */
      sessionStorage.setItem(
        CURRENT_MEMBER_KEY,
        session.uid
      );

      localStorage.removeItem(
        CURRENT_MEMBER_KEY
      );

    }


   

  } catch (storageError) {

    console.error(
      "Could not save member session:",
      storageError
    );

    throw new Error(
      "Unable to save your login session."
    );

  }

};


const getSavedMemberSession = () => {

  try {

    /*
     * Session storage gets priority because it
     * represents the account currently active
     * in this browser tab.
     */

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

      if (session) {

        return {
          value:
            JSON.stringify(session),
          type:
            "session",
          uid:
            sessionCurrentUid
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

      if (session) {

        return {
          value:
            JSON.stringify(session),
          type:
            "local",
          uid:
            localCurrentUid
        };

      }

    }


    return null;

  } catch (storageError) {

    console.error(
      "Could not read current member session:",
      storageError
    );

    return null;

  }

};


const getSavedAccounts = () => {

  try {

    const sessions =
      getAllMemberSessions();

    return Object.values(
      sessions
    );

  } catch (error) {

    console.error(
      "Could not get saved accounts:",
      error
    );

    return [];

  }

};


const setCurrentMember = (
  uid
) => {

  const allSessions =
    getAllMemberSessions();

  const session =
    allSessions[uid];

  if (!session) {
    return false;
  }


  const localSessions =
    readStorageObject(
      localStorage
    );

  const sessionSessions =
    readStorageObject(
      sessionStorage
    );


  if (
    localSessions[uid]
  ) {

    localStorage.setItem(
      CURRENT_MEMBER_KEY,
      uid
    );

    sessionStorage.removeItem(
      CURRENT_MEMBER_KEY
    );

  } else {

    sessionStorage.setItem(
      CURRENT_MEMBER_KEY,
      uid
    );

    localStorage.removeItem(
      CURRENT_MEMBER_KEY
    );

  }


  return true;

};


const clearCurrentMember = () => {

  localStorage.removeItem(
    CURRENT_MEMBER_KEY
  );

  sessionStorage.removeItem(
    CURRENT_MEMBER_KEY
  );

};


const removeMemberSession = (
  uid
) => {

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


  const localCurrent =
    localStorage.getItem(
      CURRENT_MEMBER_KEY
    );

  const sessionCurrent =
    sessionStorage.getItem(
      CURRENT_MEMBER_KEY
    );


  if (
    localCurrent === uid
  ) {

    localStorage.removeItem(
      CURRENT_MEMBER_KEY
    );

  }

  if (
    sessionCurrent === uid
  ) {

    sessionStorage.removeItem(
      CURRENT_MEMBER_KEY
    );

  }

};



  /* =========================================================
     ACTIVATE CANCELLED SUBSCRIPTION
  ========================================================= */

  const activateSubscription = async () => {
    setError("");
    setLoading(true);

    try {
      const saved = getSavedMemberSession();

      if (!saved) {
        throw new Error("Your login session was not found. Please login again.");
      }

      let session;
      try {
        session = JSON.parse(saved.value);
      } catch {
        throw new Error("Your login session is invalid. Please login again.");
      }

      if (!session?.token || !session?.uid) {
        throw new Error("Your login session is invalid. Please login again.");
      }

      if (!window.Razorpay) {
        throw new Error("Payment system is still loading. Please try again.");
      }

      /* Create a NEW Razorpay subscription using the existing plan */
      const createResponse = await fetch(
        `${API_BASE_URL}/api/subscription/reactivate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": "application/json"
          }
        }
      );

      let createData = null;

      try {
        createData = await createResponse.json();
      } catch {
        createData = null;
      }

      if (!createResponse.ok || !createData?.success) {
        throw new Error(
          createData?.message ||
          "Unable to start subscription activation."
        );
      }

      const subscriptionId = createData.subscriptionId;
      const razorpayKey = createData.key;

      if (!subscriptionId || !razorpayKey) {
        throw new Error(
          "Razorpay subscription details were not received."
        );
      }

      setLoading(false);

      const options = {
        key: razorpayKey,
        subscription_id: subscriptionId,
        name: "Wealthoria",
        description: "Wealthoria Premium Subscription",
        prefill: {
          name: session.name || "",
          email: session.email || ""
        },
        theme: {
          color: "#e8473f"
        },

        handler: async (response) => {
          setLoading(true);
          setError("");

          try {
            const paymentId =
              response?.razorpay_payment_id;

            const returnedSubscriptionId =
              response?.razorpay_subscription_id ||
              subscriptionId;

            if (!paymentId) {
              throw new Error(
                "Razorpay payment ID was not received."
              );
            }

            if (
              returnedSubscriptionId !== subscriptionId
            ) {
              throw new Error(
                "Razorpay subscription verification failed."
              );
            }

            const completeResponse = await fetch(
              `${API_BASE_URL}/api/subscription/reactivate/complete`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${session.token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  subscriptionId,
                  paymentId
                })
              }
            );

            let completeData = null;

            try {
              completeData =
                await completeResponse.json();
            } catch {
              completeData = null;
            }

            if (
              !completeResponse.ok ||
              !completeData?.success
            ) {
              throw new Error(
                completeData?.message ||
                "Payment was received, but subscription activation could not be completed."
              );
            }

            /* Update the existing session only */
            const updatedSession = {
              ...session,
              status: "active",
              subscription: {
                ...(session.subscription || {}),
                status: "active",
                razorpaySubscriptionId:
                  completeData.razorpaySubscriptionId ||
                  subscriptionId
              }
            };

        const storage =
  saved.type === "local"
    ? localStorage
    : sessionStorage;

const sessions =
  readStorageObject(storage);

sessions[session.uid] =
  updatedSession;

writeStorageObject(
  storage,
  sessions
);

            setSubscriptionInactive(false);

            window.location.replace(
              "/members/dashboard"
            );
          } catch (activationError) {
            console.error(
              "Subscription activation completion error:",
              activationError
            );

            setError(
              activationError?.message ||
              "Subscription activation failed. Please contact support."
            );

            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          
          }
        }
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        (response) => {
          console.error(
            "Razorpay activation payment failed:",
            response?.error
          );

          setError(
            response?.error?.description ||
            "Payment failed. Your subscription remains inactive."
          );

          setLoading(false);
        }
      );

      razorpay.open();
    } catch (activationError) {
      console.error(
        "Subscription activation error:",
        activationError
      );

      setError(
        activationError?.message ||
        "Unable to activate subscription."
      );

      setLoading(false);
    }
  };

  /* =========================================================
     CHECK EXISTING MEMBER SESSION
  ========================================================= */

  /* =========================================================
   RESTORE EXISTING MEMBER SESSION
========================================================= */

useEffect(() => {
  let cancelled = false;

 const restoreExistingSession = async () => {
  try {
    setCheckingSession(true);
const currentUser = await new Promise((resolve) => {
  if (!window.auth?.onAuthStateChanged) {
    resolve(null);
    return;
  }

  let unsubscribe;

  unsubscribe = window.auth.onAuthStateChanged((user) => {
    if (unsubscribe) unsubscribe();
    resolve(user);
  });
});

if (!currentUser) {
  setCheckingSession(false);
  return;
}

// Get fresh Firebase token
const tokenResult =
  await currentUser.getIdTokenResult(true);

    const claims = tokenResult?.claims || {};

    // Admin user
    if (claims.admin === true) {
      setCheckingSession(false);
      window.location.replace("/admin/dashboard");
      return;
    }

    // Normal member
 const savedSession = getSavedMemberSession?.();

if (savedSession) {
  try {
    const sessionData =
      typeof savedSession.value === "string"
        ? JSON.parse(savedSession.value)
        : savedSession.value;

    if (sessionData?.token && sessionData?.uid) {
      const response = await fetch(
        `${API_BASE_URL}/api/members/me`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setCheckingSession(false);
        window.location.replace("/members/dashboard");
        return;
      }
    }
  } catch (error) {
    console.warn("Saved member session is invalid:", error);
  }

  // Remove invalid/deleted member session
  try {
    if (savedSession.uid) {
      removeMemberSession(savedSession.uid);
    }
  } catch (error) {
    console.warn("Failed to remove old member session:", error);
  }
}


    // No valid session
    setCheckingSession(false);

  } catch (error) {
    console.error(
      "Session restore error:",
      error
    );

    // IMPORTANT:
    // Never leave the login page stuck on
    // "Checking session..."
    setCheckingSession(false);
  }
};

  restoreExistingSession();

  return () => {
    cancelled = true;
  };
}, []);

  /* =========================================================
     LOGIN
     MEMBER + ADMIN
  ========================================================= */

  const submitLogin =
    async (event) => {

      event.preventDefault();

      setError("");


      const cleanEmail =
        email
          .trim()
          .toLowerCase();


      /* =====================================================
         VALIDATION
      ===================================================== */

      if (!cleanEmail) {

        setError(
          "Email is required."
        );

        return;

      }


      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanEmail
        )
      ) {

        setError(
          "Please enter a valid email address."
        );

        return;

      }


      if (!password) {

        setError(
          "Password is required."
        );

        return;

      }


      if (
        password.length < 6
      ) {

        setError(
          "Password must be at least 6 characters."
        );

        return;

      }


      setLoading(true);


      try {

        /* =================================================
   1. ADMIN LOGIN — FIREBASE AUTH ONLY
================================================= */

if (window.auth) {
  try {
    const adminResult =
      await window.auth.signInWithEmailAndPassword(
        cleanEmail,
        password
      );

const adminUser = adminResult.user;

if (adminUser) {
  const tokenResult =
    await adminUser.getIdTokenResult(true);

  const claims =
    tokenResult?.claims || {};

  if (claims.admin === true) {
    window.location.replace("/admin/dashboard");
    return;
  }

  // Not an admin — sign out and continue
  // with normal member login.
  await window.auth.signOut();
}

  } catch (adminError) {
    /*
     * Not a Firebase admin account.
     * Continue with normal member login.
     */
    try {
      if (window.auth?.currentUser) {
        await window.auth.signOut();
      }
    } catch (signOutError) {
      console.warn(
        "Firebase sign-out cleanup failed:",
        signOutError
      );
    }
  }
}

        /* =================================================
           2. MEMBER LOGIN
        ================================================= */

      


        const response =
          await fetch(
            `${API_BASE_URL}/api/members/login`,
            {
              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify({

                  email:
                    cleanEmail,

                  password:
                    password

                })

            }
          );


        let data = null;


        try {

          data =
            await response.json();

        } catch (jsonError) {

          console.error(
            "Could not parse login response:",
            jsonError
          );

        }


        /* =================================================
           CHECK MEMBER RESPONSE
        ================================================= */

        if (
          !response.ok
        ) {

          throw {

            status:
              response.status,

            message:
              data?.message ||
              "Incorrect email or password."

          };

        }


        if (
          !data ||
          !data.success
        ) {

          throw {

            status:
              response.status,

            message:
              data?.message ||
              "Unable to login."

          };

        }


        if (
          !data.uid
        ) {

          throw new Error(
            "Login succeeded but member ID was not received."
          );

        }


        if (
          !data.token
        ) {

          throw new Error(
            "Login succeeded but authentication token was not received."
          );

        }




        /* =================================================
           3. CREATE MEMBER SESSION
        ================================================= */
const session = {
  uid: data.uid,
  email: data.email || cleanEmail,
  name: data.name || "",
  role: data.role || "member",
  status: data.status || "active",
  subscription: data.subscription || null,
  token: data.token
};


        /* =================================================
           4. SAVE MEMBER SESSION
        ================================================= */

        saveMemberSession(
          session,
          remember
        );

        /* =================================================
           5. CREATE LOGIN RECORD
        ================================================= */

        /* =================================================
           6. MEMBER DASHBOARD
        ================================================= */
const loginStatus = String(session.status || "")
  .trim()
  .toLowerCase();

/* Get the latest membership/access information */
const meResponse = await fetch(
  `${API_BASE_URL}/api/members/me`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json"
    }
  }
);

let meData = null;

try {
  meData = await meResponse.json();
} catch {
  meData = null;
}

if (!meResponse.ok || !meData?.success) {
  throw new Error(
    meData?.message ||
    "Unable to verify your membership."
  );
}

/* Update session with latest membership information */
const updatedSession = {
  ...session,
  ...meData.member,
  subscription:
    meData.member?.subscription ||
    session.subscription ||
    null,
  token: session.token
};



// Google Analytics - identify logged-in member anonymously
if (typeof window.gtag === "function" && updatedSession.uid) {
  window.gtag("config", "G-Q9955KR0G6", {
    user_id: updatedSession.uid
  });

  window.gtag("event", "login", {
    method: "member_login"
  });
}


saveMemberSession(
  updatedSession,
  remember
);

/* Check current access */
const accessUntil =
  updatedSession?.subscription?.accessUntil ||
  updatedSession?.accessUntil ||
  null;

const expiryTime =
  accessUntil &&
  typeof accessUntil === "object" &&
  typeof accessUntil.seconds === "number"
    ? accessUntil.seconds * 1000
    : accessUntil
      ? new Date(accessUntil).getTime()
      : 0;

const accessActive =
  Number.isFinite(expiryTime) &&
  expiryTime > Date.now();

if (
  (
    loginStatus === "inactive" ||
    loginStatus === "cancelled" ||
    loginStatus === "canceled"
  ) &&
  !accessActive
) {
  setSubscriptionInactive(true);
  setLoading(false);
  return;
}

window.location.replace(
  "/members/dashboard"
);

      } catch (err) {

        console.error(
          "Login error:",
          err
        );


        let message =
          "Unable to login.";


        if (
          err?.status === 401
        ) {

          message =
            "Incorrect email or password.";

        }

        else if (
          err?.status === 403
        ) {

          message =
            err.message ||
            "You are not authorized to access the Members Portal.";

        }

        else if (
          err?.status === 404
        ) {

          message =
            "Member account was not found.";

        }

        else if (
          err?.status === 500
        ) {

          message =
            err.message ||
            "Server error. Please try again.";

        }

        else if (
          err?.name ===
          "TypeError"
        ) {

          message =
            "Unable to connect to the member server.";

        }

        else if (
          err?.message
        ) {

          message =
            err.message;

        }


        setError(
          message
        );


      } finally {

        setLoading(
          false
        );

      }

    };


  /* =========================================================
     CHECKING SAVED SESSION
  ========================================================= */

/* =========================================================
   CHECKING SAVED SESSION
========================================================= */
if (checkingSession) {
  return (
    <div
      className="members-login-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="members-login-card"
        style={{
          textAlign: "center",
          maxWidth: "420px",
          width: "100%",
          padding: "45px 30px",
        }}
      >
        <div className="wealthoria-session-loader">

          {/* Animated Logo */}
          <div className="wealthoria-loader-ring">
            <img
              src="/assets/logo-mark.png"
              alt="Wealthoria"
              className="wealthoria-loader-logo"
            />
          </div>

          <span className="members-eyebrow">
            MEMBER PORTAL
          </span>

          <h1>Welcome back</h1>

          <p>Restoring your session</p>

          {/* Loading dots */}
          <div className="wealthoria-loader-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

        </div>

        <style>
          {`
            .wealthoria-session-loader {
              text-align: center;
            }

            .wealthoria-loader-ring {
              width: 82px;
              height: 82px;
              margin: 0 auto 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              animation: wealthoriaPulse 1.8s ease-in-out infinite;
            }

            .wealthoria-loader-ring::before {
              content: "";
              position: absolute;
              inset: 0;
              border-radius: 50%;
              border: 3px solid rgba(232, 71, 63, 0.15);
              border-top-color: #e8473f;
              border-right-color: #e8473f;
              animation: wealthoriaRotate 1s linear infinite;
            }

            .wealthoria-loader-logo {
              width: 42px;
              height: 42px;
              object-fit: contain;
              position: relative;
              z-index: 2;
            }

            .wealthoria-session-loader h1 {
              margin: 10px 0 8px;
            }

            .wealthoria-session-loader p {
              margin: 0;
              opacity: 0.65;
            }

            .wealthoria-loader-dots {
              display: flex;
              justify-content: center;
              gap: 7px;
              margin-top: 18px;
            }

            .wealthoria-loader-dots span {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #e8473f;
              animation: wealthoriaDots 1.2s infinite ease-in-out;
            }

            .wealthoria-loader-dots span:nth-child(2) {
              animation-delay: 0.15s;
            }

            .wealthoria-loader-dots span:nth-child(3) {
              animation-delay: 0.3s;
            }

            @keyframes wealthoriaRotate {
              to {
                transform: rotate(360deg);
              }
            }

            @keyframes wealthoriaPulse {
              0%,
              100% {
                transform: scale(1);
              }

              50% {
                transform: scale(1.06);
              }
            }

            @keyframes wealthoriaDots {
              0%,
              80%,
              100% {
                transform: translateY(0);
                opacity: 0.4;
              }

              40% {
                transform: translateY(-6px);
                opacity: 1;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}

  /* =========================================================
     RENDER LOGIN
  ========================================================= */

  return (
  <div className="members-login-page">

    <a
      href="/"
      className="members-login-brand"
      aria-label="Go to Wealthoria website"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        textDecoration: "none",
        color: "inherit"
      }}
    >
      <img
        src="/assets/logo-mark.png"
        alt="Wealthoria"
      />

      <span>
        Wealthoria
      </span>
    </a>

    {subscriptionInactive ? (

      <div className="members-login-card">

        <div className="members-login-heading">

          <span className="members-eyebrow">
            SUBSCRIPTION
          </span>

          <h1>
            Subscription Inactive
          </h1>

          <p>
            Your subscription has been cancelled.
          </p>

          <p>
            Activate your subscription to continue
            using the Wealthoria Member Portal.
          </p>

        </div>

        <button
          type="button"
          className="members-login-button"
          onClick={activateSubscription}
          disabled={loading}
        >
          Activate Subscription →
        </button>

<button
  type="button"
  className="members-link"
  style={{
    marginTop: "14px",
    width: "100%"
  }}
  onClick={() => {
    clearCurrentMember();

    setSubscriptionInactive(false);
    setCheckingSession(false);
    setError("");
    setEmail("");
    setPassword("");
    setEmailEditable(false);
    setPasswordEditable(false);
  }}
  disabled={loading}
>
  Use another account
</button>






      </div>

    ) : (
      <>

      {/* =====================================================
          LOGIN CARD
      ===================================================== */}

      <div
        className="members-login-card"
      >


        <div
          className="members-login-heading"
        >

          <span
            className="members-eyebrow"
          >
            MEMBER PORTAL
          </span>




          <h1>
            Sign in
          </h1>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div
            className="members-login-error"
          >

            {error}

          </div>

        )}


        {/* ===================================================
            LOGIN FORM
        =================================================== */}

        <form
          onSubmit={submitLogin}
          noValidate
          autoComplete="off"
        >


          {/* =================================================
              EMAIL
          ================================================= */}

          <div
            className="members-field"
          >

            <label>
              Email
            </label>


            <input
              type="email"

              name="wealthoria_member_email"

              value={
                email
              }

              readOnly={
                !emailEditable
              }

              onFocus={(event) => {

                setEmailEditable(
                  true
                );

                event.currentTarget.removeAttribute(
                  "readonly"
                );

              }}

              onChange={(event) => {

                setEmail(
                  event.target.value
                );


                if (
                  error
                ) {

                  setError("");

                }

              }}

              placeholder="example@gmail.com"

              autoComplete="new-password"

              data-lpignore="true"

              data-1p-ignore="true"

              disabled={
                loading
              }

            />

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div
            className="members-field"
          >

            <label>
              Password
            </label>


            <div
              className="members-password"
            >

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }

                name="wealthoria_member_password"

                value={
                  password
                }

                readOnly={
                  !passwordEditable
                }

                onFocus={(event) => {

                  setPasswordEditable(
                    true
                  );

                  event.currentTarget.removeAttribute(
                    "readonly"
                  );

                }}

                onChange={(event) => {

                  setPassword(
                    event.target.value
                  );


                  if (
                    error
                  ) {

                    setError("");

                  }

                }}

                placeholder="Your password"

                autoComplete="new-password"

                data-lpignore="true"

                data-1p-ignore="true"

                disabled={
                  loading
                }

              />


              <button
                type="button"

                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }

                disabled={
                  loading
                }
              >

                {
                  showPassword
                    ? "Hide"
                    : "Show"
                }

              </button>

            </div>

          </div>


          {/* =================================================
              OPTIONS
          ================================================= */}

          <div
            className="members-login-options"
          >

            <label>

              <input
                type="checkbox"

                checked={
                  remember
                }

                onChange={(event) =>
                  setRemember(
                    event.target.checked
                  )
                }

                disabled={
                  loading
                }
              />

              <span>
                Remember me
              </span>

            </label>


            <button
              type="button"

              className="members-link"

              onClick={() => {

                if (
                  window.membersNavigate
                ) {

                  window.membersNavigate(
                    "/members/forgot-password"
                  );

                }

                else {

                  window.location.href =
                    "/members/forgot-password";

                }

              }}

              disabled={
                loading
              }
            >

              Forgot password?

            </button>

          </div>


          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <button
            className="members-login-button"
            type="submit"
            disabled={
              loading
            }
          >

            {
              loading
                ? "Signing in..."
                : "Continue →"
            }

          </button>


          {/* =================================================
              SUBSCRIBE
          ================================================= */}

          <div
            className="members-login-subscribe"
          >

            <span>
              Not a member yet?
            </span>


            <button
              type="button"
              className="members-link"

              onClick={() => {

                if (
                  window.membersNavigate
                ) {

                  window.membersNavigate(
                    "/members/subscription"
                  );

                }

                else {

                  window.location.href =
                    "/members/subscription";

                }

              }}

              disabled={
                loading
              }
            >

              Subscribe now

            </button>

          </div>


        </form>
      </div>
      </>
    )}

  </div>
);

}

/* =========================================================
   EXPORT
========================================================= */

window.MemberLogin =
  MemberLogin;


