import React from "react";

/* global React, window */

const { useState } = React;

const API_BASE =
  "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api";

function ForgotPassword() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* =========================================================
     GO TO LOGIN
  ========================================================= */

  const goToLogin = () => {
    if (window.membersNavigate) {
      window.membersNavigate("/members/login");
    } else {
      window.location.href = "/members/login";
    }
  };

  /* =========================================================
     SEND VERIFICATION CODE
  ========================================================= */

  const sendCode = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/members/forgot-password/send-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Unable to send verification code."
        );
      }

      setEmail(cleanEmail);
      setCode("");
      setMessage(
        "If an account exists with this email, a verification code has been sent."
      );
      setStep(2);
    } catch (error) {
      console.error("Send verification code error:", error);

      setError(
        error?.message || "Unable to send verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     VERIFY CODE
  ========================================================= */

  const verifyCode = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (cleanCode.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/members/forgot-password/verify-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            code: cleanCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Invalid verification code."
        );
      }

      setMessage(
        "Verification successful. You can now create a new password."
      );

      setNewPassword("");
      setConfirmPassword("");
      setStep(3);
    } catch (error) {
      console.error("Verify verification code error:", error);

      setError(
        error?.message || "Unable to verify the code."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RESET PASSWORD
  ========================================================= */

  const resetPassword = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/members/forgot-password/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Unable to reset password."
        );
      }

      setNewPassword("");
      setConfirmPassword("");
      setCode("");

      setMessage(
        "Your password has been reset successfully. You can now log in."
      );

      setStep(4);
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        error?.message || "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="members-login-page">

      {/* =====================================================
          BRAND
      ===================================================== */}

      <a
        href="/"
        className="members-login-brand"
        aria-label="Go to Wealthoria website"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <img
          src="/assets/logo-mark.png"
          alt="Wealthoria"
        />

        <span>Wealthoria</span>
      </a>

      {/* =====================================================
          CARD
      ===================================================== */}

      <div className="members-login-card">

        <div className="members-login-heading">

          <span className="members-eyebrow">
            MEMBER PORTAL
          </span>

          <h1>
            {step === 4
              ? "Password reset"
              : "Forgot password?"}
          </h1>

        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="members-login-error">
            {error}
          </div>
        )}

        {/* ===================================================
            SUCCESS MESSAGE
        =================================================== */}

        {message && (
          <div
            style={{
              padding: "12px 14px",
              marginBottom: "18px",
              borderRadius: "8px",
              background: "#eefbf3",
              color: "#176b3a",
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        {/* ===================================================
            STEP 1 — EMAIL
        =================================================== */}

        {step === 1 && (
          <form onSubmit={sendCode} noValidate>

            <div className="members-field">

              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                  setMessage("");
                }}
                placeholder="you@wealthoria.in"
                autoComplete="email"
                disabled={loading}
              />

            </div>

            <button
              className="members-login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send Verification Code"}
            </button>

            <button
              type="button"
              className="members-link"
              style={{
                marginTop: "18px",
              }}
              onClick={goToLogin}
              disabled={loading}
            >
              ← Back to Login
            </button>

          </form>
        )}

        {/* ===================================================
            STEP 2 — VERIFY OTP
        =================================================== */}

        {step === 2 && (
          <form onSubmit={verifyCode} noValidate>

            <div className="members-field">

              <label>Verification Code</label>

              <input
                type="text"
                inputMode="numeric"
                value={code}
                maxLength={6}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  setCode(value);
                  setError("");
                  setMessage("");
                }}
                placeholder="Enter 6-digit code"
                autoComplete="one-time-code"
                disabled={loading}
              />

            </div>

            <button
              className="members-login-button"
              type="submit"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              className="members-link"
              style={{
                marginTop: "18px",
              }}
              onClick={() => {
                setStep(1);
                setCode("");
                setError("");
                setMessage("");
              }}
              disabled={loading}
            >
              ← Change Email
            </button>

          </form>
        )}

        {/* ===================================================
            STEP 3 — NEW PASSWORD
        =================================================== */}

        {step === 3 && (
          <form onSubmit={resetPassword} noValidate>

            <div className="members-field">

              <label>New Password</label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setError("");
                  setMessage("");
                }}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={loading}
              />

            </div>

            <div className="members-field">

              <label>Confirm Password</label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                  setMessage("");
                }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={loading}
              />

            </div>

            <button
              className="members-login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Resetting..."
                : "Reset Password"}
            </button>

          </form>
        )}

        {/* ===================================================
            STEP 4 — SUCCESS
        =================================================== */}

        {step === 4 && (
          <div>

            <button
              className="members-login-button"
              type="button"
              onClick={goToLogin}
            >
              Go to Login
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

/* =========================================================
   EXPORT
========================================================= */

window.ForgotPassword = ForgotPassword;

console.log(
  "ForgotPassword loaded successfully"
);