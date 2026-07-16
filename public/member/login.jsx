/* global React, window */
/* =========================================================================
   Member Portal — Login (/member/login) with optional MFA (OTP) step
   ========================================================================= */
const { useState, useRef } = React;
const { useApp, Icon } = window;
const { useMemberAuth } = window;
const { useMRouter, MIcon, Switch } = window;
const { MEMBERS } = window.MEMBER_DATA;

function OtpInput({ value, onChange }) {
  const refs = useRef([]);
  const set = (i, v) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[i] = digit;
    const next = arr.join("").slice(0, 6);
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => { if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus(); };
  return (
    <div className="otp-row">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} className="otp-cell" inputMode="numeric" maxLength={1}
          value={value[i] || ""} onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} />
      ))}
    </div>
  );
}

function MemberLogin() {
  const { theme, toggleTheme } = useApp();
  const { verifyCredentials, verifyMfa, DEMO_OTP } = useMemberAuth();
  const { navigate } = useMRouter();

  const [step, setStep] = useState("creds"); // creds | mfa
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [mfaOn, setMfaOn] = useState(false);
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const fillDemo = (m) => { setEmail(m.email); setPassword(m.password); setErr(""); };

  const submitCreds = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const res = await verifyCredentials(email, password, mfaOn);
      if (res.mfaRequired) { setPending(res.pending); setStep("mfa"); setBusy(false); }
      else navigate("/member/dashboard");
    } catch (ex) { setErr(ex.message); setBusy(false); }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await verifyMfa(pending, otp); navigate("/member/dashboard"); }
    catch (ex) { setErr(ex.message); setBusy(false); }
  };

  return (
    <div className="mauth">
      <button className="iconbtn" onClick={toggleTheme} aria-label="Toggle theme" style={{ position: "fixed", top: 20, right: 20 }}>
        <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
      </button>

      <div className="mauth-card reveal-fade">
        <div className="mauth-mark">
          <img src="assets/logo-mark.png" alt="" style={{ height: 28 }} />
          <span className="w">Wealthoria</span>
        </div>

        {step === "creds" ? (
          <React.Fragment>
            <h1>Member sign in</h1>
            <p className="sub">Editors and admins. Separate from student accounts.</p>

            <div className="demo-accts">
              {MEMBERS.map((m) => (
                <button key={m.id} type="button" className="demo-acct" onClick={() => fillDemo(m)}>
                  <span className="avatar sm" style={{ width: 34, height: 34, fontSize: 14 }}>{m.name.charAt(0)}</span>
                  <span className="meta"><span className="n">{m.name}</span><span className="e">{m.email}</span></span>
                  <span className={`role-badge ${m.role === "Admin" ? "admin" : "editor"}`}>{m.role}</span>
                </button>
              ))}
            </div>

            {err && <div className="form-alert"><Icon name="shield" size={16} />{err}</div>}

            <form onSubmit={submitCreds} noValidate>
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@wealthoria.in" autoComplete="username" />
              </div>
              <div className="field">
                <label>Password</label>
                <div className="pw-wrap">
                  <input className="input has-icon" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password"><MIcon name={showPw ? "eyeoff" : "eye"} size={18} /></button>
                </div>
              </div>
              <div className="settingrow" style={{ padding: "6px 0 18px", boxShadow: "none" }}>
                <div className="sr-body">
                  <h4 style={{ fontSize: 14 }}>Multi-factor authentication</h4>
                  <p style={{ fontSize: 12 }}>Require a 6-digit code after your password.</p>
                </div>
                <Switch checked={mfaOn} onChange={setMfaOn} />
              </div>
              <button className="btn btn-green btn-block" type="submit" disabled={busy}>
                {busy ? "Checking..." : "Continue"}{!busy && <Icon name="arrow" size={18} />}
              </button>
            </form>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <h1>Verify it's you</h1>
            <p className="sub">Enter the 6-digit code. For this demo, use <b>{DEMO_OTP}</b>.</p>
            {err && <div className="form-alert"><Icon name="shield" size={16} />{err}</div>}
            <form onSubmit={submitOtp}>
              <OtpInput value={otp} onChange={setOtp} />
              <button className="btn btn-green btn-block" type="submit" disabled={busy || otp.length < 6} style={{ marginTop: 18 }}>
                {busy ? "Verifying..." : "Verify and sign in"}
              </button>
            </form>
            <div className="mauth-foot">
              <button className="link-coral" onClick={() => { setStep("creds"); setOtp(""); setErr(""); }}>Back to sign in</button>
            </div>
          </React.Fragment>
        )}
        <div className="mauth-foot">This workspace is for Wealthoria staff. Student? <a className="link-coral" href="Student Portal.html">Student login</a></div>
      </div>
    </div>
  );
}

window.MemberLogin = MemberLogin;
