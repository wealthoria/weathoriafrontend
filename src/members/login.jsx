import React from "react";

/* global React, window */

const {
  useState,
  useEffect
} = React;


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

  /* ---------------------------------------------------------
     Prevent browser password manager from immediately
     filling the login fields.
  --------------------------------------------------------- */

  const [emailEditable, setEmailEditable] =
    useState(false);

  const [passwordEditable, setPasswordEditable] =
    useState(false);


  /* =========================================================
     BACKEND URL
  ========================================================= */

  const API_BASE_URL =
    "https://webinar-registration-backend.onrender.com";


  /* =========================================================
     STORAGE HELPERS
  ========================================================= */

  const clearMemberSession = () => {

    try {

      localStorage.removeItem(
        "wealthoria-member"
      );

      sessionStorage.removeItem(
        "wealthoria-member"
      );

    } catch (storageError) {

      console.error(
        "Could not clear member session:",
        storageError
      );

    }

  };


  const getSavedMemberSession = () => {

    try {

      const localSession =
        localStorage.getItem(
          "wealthoria-member"
        );

      if (localSession) {
        return {
          value: localSession,
          type: "local"
        };
      }


      const sessionOnly =
        sessionStorage.getItem(
          "wealthoria-member"
        );

      if (sessionOnly) {
        return {
          value: sessionOnly,
          type: "session"
        };
      }


      return null;

    } catch (storageError) {

      console.error(
        "Could not read member session:",
        storageError
      );

      return null;

    }

  };


  const saveMemberSession = (
    session,
    shouldRemember
  ) => {

    try {

      /*
       * Always remove the old copy first.
       * This prevents localStorage and sessionStorage
       * from both containing an active login.
       */

      localStorage.removeItem(
        "wealthoria-member"
      );

      sessionStorage.removeItem(
        "wealthoria-member"
      );


      if (shouldRemember) {

        localStorage.setItem(
          "wealthoria-member",
          JSON.stringify(session)
        );

      }

      else {

        sessionStorage.setItem(
          "wealthoria-member",
          JSON.stringify(session)
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


  /* =========================================================
     CHECK EXISTING MEMBER SESSION
  ========================================================= */

  useEffect(() => {

    let cancelled = false;


    const checkExistingSession =
      async () => {

        try {

          const saved =
            getSavedMemberSession();


          /* -----------------------------------------------
             NO SAVED SESSION
          ----------------------------------------------- */

          if (!saved) {

            if (!cancelled) {
              setCheckingSession(false);
            }

            return;
          }


          /* -----------------------------------------------
             PARSE SAVED SESSION
          ----------------------------------------------- */

          let session;

          try {

            session =
              JSON.parse(
                saved.value
              );

          } catch (parseError) {

            console.error(
              "Saved member session is invalid:",
              parseError
            );

            clearMemberSession();

            if (!cancelled) {
              setCheckingSession(false);
            }

            return;
          }


          /* -----------------------------------------------
             CHECK REQUIRED VALUES
          ----------------------------------------------- */

          if (
            !session?.uid ||
            !session?.token
          ) {

            console.warn(
              "Saved member session is missing uid or token."
            );

            clearMemberSession();

            if (!cancelled) {
              setCheckingSession(false);
            }

            return;
          }


          /* -----------------------------------------------
             VERIFY SESSION WITH BACKEND
          ----------------------------------------------- */

          const response =
            await fetch(
              `${API_BASE_URL}/api/members/me`,
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

            console.error(
              "Could not parse session response:",
              jsonError
            );

          }


          /* -----------------------------------------------
             VALID SESSION
          ----------------------------------------------- */

          if (
            response.ok &&
            data?.success &&
            data?.member
          ) {

            const updatedSession = {

              ...session,

              uid:
                data.member.uid ||
                session.uid,

              email:
                data.member.email ||
                session.email ||
                "",

              name:
                data.member.name ||
                session.name ||
                "",

              role:
                data.member.role ||
                session.role ||
                "member"

            };


            /* ---------------------------------------------
               UPDATE THE SAME STORAGE TYPE
            --------------------------------------------- */

            if (
              saved.type === "local"
            ) {

              localStorage.setItem(
                "wealthoria-member",
                JSON.stringify(
                  updatedSession
                )
              );

            }

            else {

              sessionStorage.setItem(
                "wealthoria-member",
                JSON.stringify(
                  updatedSession
                )
              );

            }


            console.log(
              "Existing member session is valid."
            );


            /*
             * IMPORTANT:
             *
             * replace() means the Login page does not
             * remain in browser history.
             *
             * So opening the login URL while already logged
             * in will send the member to Dashboard.
             */

            if (!cancelled) {

              window.location.replace(
                "/members/dashboard"
              );

            }

            return;
          }


          /* -----------------------------------------------
             INVALID / EXPIRED SESSION
          ----------------------------------------------- */

          console.warn(
            "Saved member session is no longer valid."
          );


          clearMemberSession();


          if (!cancelled) {
            setCheckingSession(false);
          }


        } catch (error) {

          console.error(
            "Existing member session check failed:",
            error
          );


          clearMemberSession();


          if (!cancelled) {
            setCheckingSession(false);
          }

        }

      };


    checkExistingSession();


    return () => {

      cancelled = true;

    };

  }, []);


  /* =========================================================
     LOGIN
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
           SEND LOGIN TO BACKEND
        ================================================= */

        console.log(
          "Member login request:",
          cleanEmail
        );


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
           CHECK RESPONSE
        ================================================= */

        if (!response.ok) {

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


        if (!data.uid) {

          throw new Error(
            "Login succeeded but member ID was not received."
          );

        }


        if (!data.token) {

          throw new Error(
            "Login succeeded but authentication token was not received."
          );

        }


        console.log(
          "Member login successful:",
          data.uid
        );


        /* =================================================
           CREATE MEMBER SESSION
        ================================================= */

        const session = {

          uid:
            data.uid,

          email:
            data.email ||
            cleanEmail,

          name:
            data.name ||
            "",

          role:
            data.role ||
            "member",

          token:
            data.token

        };


        /* =================================================
           SAVE SESSION
        ================================================= */

        saveMemberSession(
          session,
          remember
        );


        console.log(
          "Member session saved:",
          {
            uid:
              session.uid,

            email:
              session.email,

            role:
              session.role,

            remember:
              remember,

            storage:
              remember
                ? "localStorage"
                : "sessionStorage"
          }
        );


        /* =================================================
           GO TO DASHBOARD
           
           replace() is important because Login should
           not remain in browser history.
        ================================================= */

        window.location.replace(
          "/members/dashboard"
        );


      } catch (err) {

        console.error(
          "Member login error:",
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

  if (checkingSession) {

    return (

      <div className="members-login-page">

        <div
          className="members-login-card"
          style={{
            textAlign:
              "center"
          }}
        >

          <span className="members-eyebrow">
            MEMBER PORTAL
          </span>

          <h1>
            Checking session...
          </h1>

          <p>
            Please wait.
          </p>

        </div>

      </div>

    );

  }


  /* =========================================================
     RENDER LOGIN
  ========================================================= */

  return (

    <div
      className="members-login-page"
    >


      {/* =====================================================
          BRAND
      ===================================================== */}

      <a
        href="/"
        className="members-login-brand"
        aria-label="Go to Wealthoria website"

        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "8px",

          textDecoration:
            "none",

          color:
            "inherit"
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
            Member sign in
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


                if (error) {

                  setError("");

                }

              }}

              placeholder="you@wealthoria.in"

              autoComplete="new-password"

              data-lpignore="true"

              data-1p-ignore="true"

              disabled={loading}

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


                  if (error) {

                    setError("");

                  }

                }}

                placeholder="Your password"

                autoComplete="new-password"

                data-lpignore="true"

                data-1p-ignore="true"

                disabled={loading}

              />


              <button
                type="button"

                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }

                disabled={loading}
              >

                {showPassword
                  ? "Hide"
                  : "Show"}

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

                disabled={loading}
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

              disabled={loading}
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
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Continue →"}

          </button>


        </form>

      </div>


    </div>

  );
}


/* =========================================================
   EXPORT
========================================================= */

window.MemberLogin =
  MemberLogin;


console.log(
  "MemberLogin loaded successfully"
);
