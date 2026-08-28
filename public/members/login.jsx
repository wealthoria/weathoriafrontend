/* global React, window */

const { useState } = React;

function MemberLogin() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [remember, setRemember] =
    useState(true);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  /* =========================================================
     BACKEND URL
  ========================================================= */

  const API_BASE_URL =
   "https://webinar-registration-backend.onrender.com";


  /* =========================================================
     LOGIN
  ========================================================= */

  const submitLogin = async (event) => {

    event.preventDefault();

    setError("");


    const cleanEmail =
      email.trim().toLowerCase();


    /* =======================================================
       VALIDATION
    ======================================================= */

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

      /* =====================================================
         SEND LOGIN TO BACKEND
      ===================================================== */

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


      /* =====================================================
         CHECK RESPONSE
      ===================================================== */

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


      console.log(
        "Member login successful:",
        data.uid
      );


      /* =====================================================
         CREATE MEMBER SESSION
      ===================================================== */

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


      /* =====================================================
         SAVE SESSION
      ===================================================== */

      if (remember) {

        localStorage.setItem(
          "wealthoria-member",
          JSON.stringify(
            session
          )
        );


        sessionStorage.removeItem(
          "wealthoria-member"
        );

      }

      else {

        sessionStorage.setItem(
          "wealthoria-member",
          JSON.stringify(
            session
          )
        );


        localStorage.removeItem(
          "wealthoria-member"
        );

      }


      console.log(
        "Member session saved:",
        {
          uid:
            session.uid,

          email:
            session.email,

          name:
            session.name,

          role:
            session.role
        }
      );


      /* =====================================================
         GO TO DASHBOARD
      ===================================================== */

      if (
        window.membersNavigate
      ) {

        window.membersNavigate(
          "/members/dashboard"
        );

      }

      else {

        window.location.href =
          "/members/dashboard";

      }


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
     RENDER
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
              value={email}
              onChange={(event) => {

                setEmail(
                  event.target.value
                );


                if (error) {

                  setError("");

                }

              }}
              placeholder="you@wealthoria.in"
              autoComplete="username"
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
                value={password}
                onChange={(event) => {

                  setPassword(
                    event.target.value
                  );


                  if (error) {

                    setError("");

                  }

                }}
                placeholder="Your password"
                autoComplete="current-password"
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
                checked={remember}
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