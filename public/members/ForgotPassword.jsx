/* global React, window */

const {
  useState
} = React;


function ForgotPassword() {

  /* =========================================================
     HOSTINGER PHP URL

     CHANGE THIS TO YOUR REAL DOMAIN
  ========================================================= */

  const PHP_API_URL =
    "https://yourdomain.com/api/send-reset-code.php";


  /* =========================================================
     STATE
  ========================================================= */

  const [step, setStep] =
    useState(1);

  const [email, setEmail] =
    useState("");

  const [code, setCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [testCode, setTestCode] =
    useState("");


  /* =========================================================
     GO TO LOGIN
  ========================================================= */

  const goToLogin = () => {

    if (
      window.membersNavigate
    ) {

      window.membersNavigate(
        "/members/login"
      );

    }

    else {

      window.location.href =
        "/members/login";

    }

  };


  /* =========================================================
     SEND CODE
  ========================================================= */

  const sendCode =
    async (event) => {

      event.preventDefault();

      setError("");
      setMessage("");
      setTestCode("");


      const cleanEmail =
        email
          .trim()
          .toLowerCase();


      /* -----------------------------------------------
         VALIDATE
      ----------------------------------------------- */

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


      setLoading(true);


      try {

        const response =
          await fetch(
            PHP_API_URL,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({

                  email:
                    cleanEmail

                })

            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data?.success
        ) {

          throw new Error(
            data?.message ||
            "Unable to send verification code."
          );

        }


        setEmail(
          cleanEmail
        );


        setMessage(
          "Verification code sent to your email."
        );


        /*
         * TEST ONLY
         *
         * PHP returns the code so you can confirm
         * the system is working.
         *
         * Remove this after testing.
         */

        if (
          data?.testCode
        ) {

          setTestCode(
            data.testCode
          );

        }


        setStep(
          2
        );


      } catch (error) {

        console.error(
          "Send verification code error:",
          error
        );


        setError(
          error.message ||
          "Unable to send verification code."
        );


      } finally {

        setLoading(
          false
        );

      }

    };


  /* =========================================================
     VERIFY TEST CODE

     For this first test we only check the returned
     test code in the browser.

     Later this will be replaced by the secure
     Render backend verification.
  ========================================================= */

  const verifyTestCode =
    (event) => {

      event.preventDefault();

      setError("");
      setMessage("");


      if (
        code.length !== 6
      ) {

        setError(
          "Please enter the 6-digit verification code."
        );

        return;

      }


      if (
        code !== testCode
      ) {

        setError(
          "Incorrect verification code."
        );

        return;

      }


      setMessage(
        "Verification successful. PHP email system is working."
      );

    };


  /* =========================================================
     UI
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
          CARD
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
            Forgot password?
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
            SUCCESS MESSAGE
        =================================================== */}

        {message && (

          <div
            style={{
              padding:
                "12px 14px",

              marginBottom:
                "18px",

              borderRadius:
                "8px",

              background:
                "#eefbf3",

              color:
                "#176b3a",

              fontSize:
                "14px"
            }}
          >

            {message}

          </div>

        )}


        {/* ===================================================
            STEP 1
        =================================================== */}

        {step === 1 && (

          <form
            onSubmit={
              sendCode
            }

            noValidate
          >

            <div
              className="members-field"
            >

              <label>
                Email
              </label>


              <input
                type="email"

                value={
                  email
                }

                onChange={(event) => {

                  setEmail(
                    event.target.value
                  );

                  setError("");

                }}

                placeholder="you@wealthoria.in"

                autoComplete="off"

                disabled={
                  loading
                }

              />

            </div>


            <button
              className="members-login-button"

              type="submit"

              disabled={
                loading
              }
            >

              {loading
                ? "Sending..."
                : "Send Verification Code"}

            </button>


            <button
              type="button"

              className="members-link"

              style={{
                marginTop:
                  "18px"
              }}

              onClick={
                goToLogin
              }

              disabled={
                loading
              }
            >

              ← Back to Login

            </button>

          </form>

        )}


        {/* ===================================================
            STEP 2
        =================================================== */}

        {step === 2 && (

          <form
            onSubmit={
              verifyTestCode
            }

            noValidate
          >

            <div
              className="members-field"
            >

              <label>
                Verification Code
              </label>


              <input
                type="text"

                inputMode="numeric"

                value={
                  code
                }

                maxLength={
                  6
                }

                onChange={(event) => {

                  const value =
                    event.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        6
                      );

                  setCode(
                    value
                  );

                  setError("");

                }}

                placeholder="Enter 6-digit code"

                autoComplete="one-time-code"

                disabled={
                  loading
                }

              />

            </div>


            {/* -------------------------------------------------
                TEST ONLY
                ------------------------------------------------- */}

            {testCode && (

              <div
                style={{
                  marginBottom:
                    "18px",

                  padding:
                    "10px",

                  borderRadius:
                    "8px",

                  background:
                    "#fff8e6",

                  fontSize:
                    "13px"
                }}
              >

                Test Code:

                <strong
                  style={{
                    marginLeft:
                      "6px"
                  }}
                >
                  {testCode}
                </strong>

              </div>

            )}


            <button
              className="members-login-button"

              type="submit"

              disabled={
                loading ||
                code.length !== 6
              }
            >

              Verify Code

            </button>


            <button
              type="button"

              className="members-link"

              style={{
                marginTop:
                  "18px"
              }}

              onClick={() => {

                setStep(
                  1
                );

                setCode("");
                setError("");
                setMessage("");
                setTestCode("");

              }}

              disabled={
                loading
              }
            >

              ← Change Email

            </button>

          </form>

        )}

      </div>

    </div>

  );

}


/* =========================================================
   EXPORT
========================================================= */

window.ForgotPassword =
  ForgotPassword;


console.log(
  "ForgotPassword loaded successfully"
);