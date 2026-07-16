/* global React, window */
const { useState } = React;
const { useApp, Icon } = window;
const { useRouter } = window;

function ForgotPasswordScreen() {
  const { theme, toggleTheme } = useApp();
  const { navigate } = useRouter();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      {/* Left Panel */}
      <aside className="auth-brand">
        <div className="ab-top">
          <img src="assets/logo-mark.png" alt="" style={{ height: 34 }} />
          <span className="ab-word">Wealthoria</span>
        </div>

        <div className="ab-mid">
          <h2>Reset your password</h2>

          <ul className="ab-list">
            <li>
              <span className="ab-tick">
                <Icon name="check" size={15} stroke={3} />
              </span>
              Secure password recovery
            </li>

            <li>
              <span className="ab-tick">
                <Icon name="check" size={15} stroke={3} />
              </span>
              Access your courses again
            </li>

            <li>
              <span className="ab-tick">
                <Icon name="check" size={15} stroke={3} />
              </span>
              Continue learning anytime
            </li>
          </ul>

          <div className="ab-quote">
            "Your learning journey continues with secure access."
          </div>
        </div>
      </aside>

      {/* Right Panel */}
      <main className="auth-main">
        <button
          className="theme-toggle port"
          onClick={toggleTheme}
          style={{ position: "absolute", top: 20, right: 20 }}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>

        <div className="auth-card reveal-up">
          <div className="auth-mark-sm">
            <img src="assets/logo-mark.png" alt="" style={{ height: 28 }} />
            <span className="w">Wealthoria</span>
          </div>

          <div className="auth-head">
            <h1>Forgot Password?</h1>
            <p>
              Enter your registered email address and we'll send you a password
              reset link.
            </p>
          </div>

          {error && (
            <div className="form-alert">
              <Icon name="shield" size={16} />
              {error}
            </div>
          )}

          {message && (
            <div className="form-alert success">
              <Icon name="check" size={16} />
              {message}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="field">
              <label>Email Address</label>

              <input
                className="input"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              className="btn btn-green btn-block"
              type="submit"
              disabled={busy}
            >
              {busy ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="auth-foot" style={{ marginTop: "20px" }}>
            Remember your password?{" "}
            <button
              className="link-coral"
              onClick={() => navigate("/student/login")}
            >
              Back to Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

window.ForgotPasswordScreen = ForgotPasswordScreen;