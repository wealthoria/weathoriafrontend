import React from "react";

/* global React, window */

const { useState } = React;


/* =========================================================
   ADMIN / EDITOR LOGIN
========================================================= */

function AdminLogin() {

  const {
    login
  } = window.useAdminAuth();


  const [selectedRole, setSelectedRole] =
    useState(null);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  /* =======================================================
     SELECT ROLE
  ======================================================= */

  const selectRole = (role) => {

    setSelectedRole(role);

    setError("");

    setEmail("");

    setPassword("");

  };


  /* =======================================================
     LOGIN
  ======================================================= */

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    if (!email.trim()) {

      setError(
        "Please enter your email."
      );

      return;

    }

    if (!password) {

      setError(
        "Please enter your password."
      );

      return;

    }

    setLoading(true);

    try {

      await login(
        email.trim(),
        password
      );

      /*
        Login successful.
        AdminAuthProvider updates
        authentication state.
      */

      window.location.hash =
        "#/admin/dashboard";

    }

    catch (error) {

      console.error(
        "Login failed:",
        error
      );

      setError(
        error?.message ||
        "Unable to sign in."
      );

    }

    finally {

      setLoading(false);

    }

  };


  /* =======================================================
     THEME
  ======================================================= */

  const toggleTheme = () => {

    const current =
      document.documentElement
        .getAttribute("data-theme") ||
      "light";

    const next =
      current === "dark"
        ? "light"
        : "dark";

    document.documentElement
      .setAttribute(
        "data-theme",
        next
      );

    localStorage.setItem(
      "wl-theme",
      next
    );

  };


  const theme =
    document.documentElement
      .getAttribute("data-theme") ||
    "light";


  /* =======================================================
     ROLE SELECTION SCREEN
  ======================================================= */

  if (!selectedRole) {

    return (

      <div className="mauth">

        <button
          type="button"
          className="iconbtn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            position: "fixed",
            top: 20,
            right: 20
          }}
        >

          {theme === "dark"
            ? "☀"
            : "☾"}

        </button>


        <div className="mauth-card reveal-fade">

          <div className="mauth-mark">

            <img
              src="/assets/logo-mark.png"
              alt="Wealthoria"
              style={{
                height: 28
              }}
            />

            <span className="w">
              Wealthoria
            </span>

          </div>


          <h1>
            Admin Portal
          </h1>


          <p className="sub">
            Select how you want to continue.
          </p>


          <div
            style={{
              display: "grid",
              gap: "14px",
              marginTop: "28px"
            }}
          >

            {/* ADMIN */}

            <button
              type="button"
              className="btn btn-green btn-block"
              onClick={() =>
                selectRole("admin")
              }
            >

              Admin

            </button>


            {/* EDITOR */}

            <button
              type="button"
              className="btn btn-block"
              onClick={() =>
                selectRole("editor")
              }
            >

              Editor

            </button>

          </div>


          <div className="mauth-foot">

            This workspace is for
            Wealthoria staff.

          </div>

        </div>

      </div>

    );

  }


  /* =======================================================
     LOGIN SCREEN
  ======================================================= */

  return (

    <div className="mauth">

      <button
        type="button"
        className="iconbtn"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        style={{
          position: "fixed",
          top: 20,
          right: 20
        }}
      >

        {theme === "dark"
          ? "☀"
          : "☾"}

      </button>


      <div className="mauth-card reveal-fade">


        <div className="mauth-mark">

          <img
            src="/assets/logo-mark.png"
            alt="Wealthoria"
            style={{
              height: 28
            }}
          />

          <span className="w">
            Wealthoria
          </span>

        </div>


        <h1>

          {selectedRole === "admin"
            ? "Admin sign in"
            : "Editor sign in"}

        </h1>


        <p className="sub">

          Sign in to the Wealthoria{" "}
          {selectedRole === "admin"
            ? "Admin"
            : "Editor"}{" "}
          Portal.

        </p>


        {/* ERROR */}

        {error && (

          <div className="form-alert">

            <span>
              âš 
            </span>

            <span>
              {error}
            </span>

          </div>

        )}


        <form
          onSubmit={handleSubmit}
          noValidate
        >

          {/* EMAIL */}

          <div className="field">

            <label htmlFor="admin-email">
              Email
            </label>

            <input
              id="admin-email"
              className="input"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="username"
              disabled={loading}
            />

          </div>


          {/* PASSWORD */}

          <div className="field">

            <label htmlFor="admin-password">
              Password
            </label>


            <div className="pw-wrap">

              <input
                id="admin-password"
                className="input has-icon"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />


              <button
                type="button"
                className="pw-toggle"
                onClick={() =>
                  setShowPassword(
                    value => !value
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                {showPassword
                  ? "â—‰"
                  : "â—Œ"}

              </button>

            </div>

          </div>


          {/* LOGIN */}

          <button
            className="btn btn-green btn-block"
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Sign in"}

          </button>


        </form>


        {/* BACK */}

        <div className="mauth-foot">

          <button
            type="button"
            className="link-coral"
            onClick={() => {
              setSelectedRole(null);
              setError("");
              setEmail("");
              setPassword("");
            }}
          >

            ← Back

          </button>

        </div>


      </div>

    </div>

  );

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.AdminLogin =
  AdminLogin;


console.log(
  "Admin login loaded successfully"
);
