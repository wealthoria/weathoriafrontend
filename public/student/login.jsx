/* global React, window */
/* =========================================================================
   Student Portal — Login screen (/student/login)
   ========================================================================= */
const { useState } = React;
const { useApp, Icon } = window;
const { useAuth } = window;
const { useRouter, PIcon } = window;
const { DEMO_USER } = window.STUDENT_DATA;

function GoogleGlyph() {
  return (
    <svg className="gmark" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.4 5.4 2.6 13.2l7.8 6.1C12.2 13.5 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.7 38 46.5 31.8 46.5 24.5z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.7 2.2-8.5 2.2-6.4 0-11.8-4-13.6-9.8l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function LoginScreen() {
  const { theme, toggleTheme } = useApp();
  const { login, loginWithGoogle } = useAuth();
  const { navigate } = useRouter();

const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErr, setFieldErr] = useState({});

  const submit = async (e) => {
  e.preventDefault();

  setErr("");

  const fe = {};

  // Frontend email validation
  if (!email.trim()) {
    fe.email = "Email is required";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    fe.email = "Enter a valid email address";
  }

  // Frontend password validation
  if (!password) {
    fe.password = "Password is required";
  } else if (password.length < 6) {
    fe.password = "Password must be at least 6 characters";
  }

  setFieldErr(fe);

  // Don't call backend when form validation fails
  if (Object.keys(fe).length > 0) {
    return;
  }

  setBusy(true);

  try {
    // auth.jsx calls backend here
    await login(email.trim(), password, remember);

    // Only runs after successful login
    navigate("/student/dashboard");

  } catch (ex) {
    console.error("Login failed:", ex);

    setErr(
      ex.message === "Failed to fetch"
        ? "Cannot connect to backend server"
        : ex.message || "Invalid email or password"
    );

  } finally {
    setBusy(false);
  }
};
  const google = async () => {
    setErr(""); setBusy(true);
    try { await loginWithGoogle(remember); navigate("/student/dashboard"); }
    catch (ex) { setErr("Google sign-in failed."); setBusy(false); }
  };

  return (
    <div className="auth">
      {/* brand panel */}
      <aside className="auth-brand">
        
       <div
  className="ab-top"
  onClick={() => {
    window.location.href = "wealthoria.html";
  }}
  style={{ cursor: "pointer" }}
>
  <img
    src="assets/logo-mark.png"
    alt="Wealthoria"
    style={{ height: 34 }}
  />
  <span className="ab-word">Wealthoria</span>
</div>


        <div className="ab-mid">
          <h2>Your learning, all in one place</h2>
          <ul className="ab-list">
            <li><span className="ab-tick"><Icon name="check" size={15} stroke={3} /></span>Pick up exactly where you left off</li>
            <li><span className="ab-tick"><Icon name="check" size={15} stroke={3} /></span>Track progress across every course</li>
            <li><span className="ab-tick"><Icon name="check" size={15} stroke={3} /></span>Learn in Kannada or English, at your pace</li>
          </ul>
          <div className="ab-quote">
            "I finally understand SIPs and risk instead of just following tips. I invest on my own now, calmly."
            
          </div>
        </div>
      </aside>

      {/* form */}
      <main className="auth-main">
        <button className="theme-toggle port" onClick={toggleTheme} aria-label="Toggle theme" style={{ position: "absolute", top: 20, right: 20 }}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
        <div className="auth-card reveal-up">
          <div className="auth-mark-sm">
            <img src="assets/logo-mark.png" alt="" style={{ height: 28 }} />
            <span className="w">Wealthoria</span>
          </div>
          <div className="auth-head">
            <h1>Welcome back</h1>
            <p>Log in to continue learning.</p>
          </div>

         

          <button className="oauth-btn" onClick={google} disabled={busy} type="button">
            <GoogleGlyph />Continue with Google
          </button>
          <div className="divider">or with email</div>

          {err && <div className="form-alert"><Icon name="shield" size={16} />{err}</div>}

          <form onSubmit={submit} noValidate>
            <div className={`field ${fieldErr.email ? "invalid" : ""}`}>
              <label>Email</label>
              <input className="input" type="email" inputMode="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErr((f) => ({ ...f, email: false })); }}
                placeholder="you@email.com" autoComplete="username" />

              {fieldErr.email && (
  <div className="err">{fieldErr.email}</div>
)}

            </div>

            <div className={`field ${fieldErr.password ? "invalid" : ""}`}>
              <label>Password</label>
              <div className="pw-wrap">
                <input className="input has-icon" type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErr((f) => ({ ...f, password: false })); }}
                  placeholder="Your password" autoComplete="current-password" />
                <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"}>
                  <PIcon name={showPw ? "eyeoff" : "eye"} size={18} />
                </button>
              </div>

              {fieldErr.password && (
  <div className="err">{fieldErr.password}</div>
)}

            </div>

            <div className="remember-row">
              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span className="box"><Icon name="check" size={13} stroke={3.5} /></span>
                Remember me
              </label>
<button
  type="button"
  className="link-coral"
  onClick={() => navigate("/student/forgot-password")}
>
  Forgot password?
</button>            </div>

            <button className="btn btn-green btn-block" type="submit" disabled={busy}>
              {busy ? "Logging in..." : "Log in"}{!busy && <Icon name="arrow" size={18} />}
            </button>
          </form>

          <div className="auth-foot">
  New to Wealthoria?{" "}

  <button
    type="button"
    className="link-coral"
    onClick={() => navigate("/student/register")}
  >
    Create an account
  </button>
</div>
        </div>
      </main>
    </div>
  );
}

window.LoginScreen = LoginScreen;
