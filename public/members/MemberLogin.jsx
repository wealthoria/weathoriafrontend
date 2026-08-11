/* global React, window */

/* =========================================================================
   Member Portal — Login (/member/login)
   ========================================================================= */

const { useState, useRef } = React;
const { useApp, Icon } = window;
const { useMemberAuth } = window;
const { useMRouter, MIcon, Switch } = window;
const { MEMBERS } = window.MEMBER_DATA;


/* =========================================================================
   OTP INPUT
   ========================================================================= */

function OtpInput({ value, onChange }) {
  const refs = useRef([]);

  const set = (index, inputValue) => {
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    const chars = value.split("");
    chars[index] = digit;

    const next = chars.join("").slice(0, 6);

    onChange(next);

    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const onKey = (index, event) => {
    if (
      event.key === "Backspace" &&
      !value[index] &&
      index > 0
    ) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="otp-row">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          className="otp-cell"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(event) =>
            set(index, event.target.value)
          }
          onKeyDown={(event) =>
            onKey(index, event)
          }
        />
      ))}
    </div>
  );
}


/* =========================================================================
   MEMBER LOGIN
   ========================================================================= */

function MemberLogin() {

  const { theme, toggleTheme } = useApp();

  const {
    verifyCredentials,
    verifyMfa,
    DEMO_OTP
  } = useMemberAuth();

  const { navigate } = useMRouter();


  /* -----------------------------------------------------------------------
     STATE
     ----------------------------------------------------------------------- */

  const [step, setStep] = useState("creds");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);

  const [mfaOn, setMfaOn] = useState(false);

  const [otp, setOtp] = useState("");

  const [pending, setPending] = useState(null);

  const [err, setErr] = useState("");

  const [busy, setBusy] = useState(false);


  /* -----------------------------------------------------------------------
     DEMO ACCOUNT
     ----------------------------------------------------------------------- */

  const fillDemo = (member) => {

    setEmail(member.email);
    setPassword(member.password);
    setErr("");

  };


  /* -----------------------------------------------------------------------
     CREDENTIAL LOGIN
     ----------------------------------------------------------------------- */

  const submitCreds = async (event) => {

    event.preventDefault();

    setErr("");
    setBusy(true);

    try {

      const result = await verifyCredentials(
        email.trim(),
        password,
        mfaOn
      );

      if (result.mfaRequired) {

        setPending(result.pending);
        setStep("mfa");
        setBusy(false);

        return;
      }

      navigate("/member/dashboard");

    } catch (error) {

      console.error(
        "Member login failed:",
        error
      );

      setErr(
        error.message ||
        "Invalid email or password."
      );

      setBusy(false);
    }
  };


  /* -----------------------------------------------------------------------
     OTP LOGIN
     ----------------------------------------------------------------------- */

  const submitOtp = async (event) => {

    event.preventDefault();

    setErr("");
    setBusy(true);

    try {

      await verifyMfa(
        pending,
        otp
      );

      navigate("/member/dashboard");

    } catch (error) {

      console.error(
        "MFA verification failed:",
        error
      );

      setErr(
        error.message ||
        "Invalid verification code."
      );

      setBusy(false);
    }
  };


  /* =========================================================================
     PAGE
     ========================================================================= */

  return (
    <div className="mauth">


      {/* ================================================================
          THEME BUTTON
          ================================================================ */}

      <button
        className="iconbtn"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 10
        }}
      >

        <Icon
          name={
            theme === "dark"
              ? "sun"
              : "moon"
          }
          size={18}
        />

      </button>


      {/* ================================================================
          LOGIN CARD
          ================================================================ */}

      <div className="mauth-card reveal-fade">


        {/* ==============================================================
            BRAND
            ============================================================== */}

        <div className="mauth-mark">

          <img
            src="assets/logo-mark.png"
            alt="Wealthoria"
            style={{ height: 28 }}
          />

          <span className="w">
            Wealthoria
          </span>

        </div>


        {/* ==============================================================
            CREDENTIAL STEP
            ============================================================== */}

        {step === "creds" ? (

          <React.Fragment>


            {/* HEADING */}

            <h1>
              Member sign in
            </h1>

            <p className="sub">
              Editors and admins. Separate from
              student accounts.
            </p>


            {/* ==========================================================
                DEMO / MEMBER ACCOUNTS
                ========================================================== */}

            <div className="demo-accts">

              {MEMBERS.map((member) => (

                <button
                  key={member.id}
                  type="button"
                  className="demo-acct"
                  onClick={() =>
                    fillDemo(member)
                  }
                >

                  <span
                    className="avatar sm"
                    style={{
                      width: 34,
                      height: 34,
                      fontSize: 14
                    }}
                  >
                    {member.name.charAt(0)}
                  </span>


                  <span className="meta">

                    <span className="n">
                      {member.name}
                    </span>

                    <span className="e">
                      {member.email}
                    </span>

                  </span>


                  <span
                    className={`role-badge ${
                      member.role === "Admin"
                        ? "admin"
                        : "editor"
                    }`}
                  >
                    {member.role}
                  </span>

                </button>

              ))}

            </div>


            {/* ==========================================================
                ERROR
                ========================================================== */}

            {err && (

              <div className="form-alert">

                <Icon
                  name="shield"
                  size={16}
                />

                {err}

              </div>

            )}


            {/* ==========================================================
                LOGIN FORM
                ========================================================== */}

            <form
              onSubmit={submitCreds}
              noValidate
            >


              {/* EMAIL */}

              <div className="field">

                <label>
                  Email
                </label>

                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@wealthoria.in"
                  autoComplete="username"
                />

              </div>


              {/* PASSWORD */}

              <div className="field">

                <label>
                  Password
                </label>

                <div className="pw-wrap">

                  <input
                    className="input has-icon"
                    type={
                      showPw
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Your password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() =>
                      setShowPw(
                        (current) =>
                          !current
                      )
                    }
                    aria-label={
                      showPw
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    <MIcon
                      name={
                        showPw
                          ? "eyeoff"
                          : "eye"
                      }
                      size={18}
                    />

                  </button>

                </div>

              </div>


              {/* ========================================================
                  MFA
                  ======================================================== */}

              <div
                className="settingrow"
                style={{
                  padding:
                    "6px 0 18px",
                  boxShadow:
                    "none"
                }}
              >

                <div className="sr-body">

                  <h4
                    style={{
                      fontSize: 14
                    }}
                  >
                    Multi-factor authentication
                  </h4>

                  <p
                    style={{
                      fontSize: 12
                    }}
                  >
                    Require a 6-digit code
                    after your password.
                  </p>

                </div>


                <Switch
                  checked={mfaOn}
                  onChange={setMfaOn}
                />

              </div>


              {/* ========================================================
                  CONTINUE
                  ======================================================== */}

              <button
                className="btn btn-green btn-block"
                type="submit"
                disabled={busy}
              >

                {busy
                  ? "Checking..."
                  : "Continue"}

                {!busy && (
                  <Icon
                    name="arrow"
                    size={18}
                  />
                )}

              </button>

            </form>

          </React.Fragment>

        ) : (

          /* ============================================================
             MFA STEP
             ============================================================ */

          <React.Fragment>

            <h1>
              Verify it's you
            </h1>

            <p className="sub">
              Enter the 6-digit code.
              For this demo, use{" "}
              <b>{DEMO_OTP}</b>.
            </p>


            {err && (

              <div className="form-alert">

                <Icon
                  name="shield"
                  size={16}
                />

                {err}

              </div>

            )}


            <form
              onSubmit={submitOtp}
            >

              <OtpInput
                value={otp}
                onChange={setOtp}
              />


              <button
                className="btn btn-green btn-block"
                type="submit"
                disabled={
                  busy ||
                  otp.length < 6
                }
                style={{
                  marginTop: 18
                }}
              >

                {busy
                  ? "Verifying..."
                  : "Verify and sign in"}

              </button>

            </form>


            <div className="mauth-foot">

              <button
                className="link-coral"
                type="button"
                onClick={() => {

                  setStep("creds");
                  setOtp("");
                  setErr("");

                }}
              >
                Back to sign in
              </button>

            </div>

          </React.Fragment>

        )}


        {/* ================================================================
            FOOTER
            ================================================================ */}

        <div className="mauth-foot">

          This workspace is for Wealthoria staff.

          {" "}

          Student?

          {" "}

          <a
            className="link-coral"
            href="Student Portal.html"
          >
            Student login
          </a>

        </div>


      </div>

    </div>
  );
}


/* =========================================================================
   EXPORT
   ========================================================================= */

window.MemberLogin = MemberLogin;