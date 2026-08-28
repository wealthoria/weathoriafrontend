/* global React, window */

const { useState } = React;

function MemberLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    // =========================================
    // FRONTEND VALIDATION
    // =========================================

    if (!cleanEmail) {
      setError("Email is required.");
      return;
    }

    if (
!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {

      // =========================================
      // CHECK FIREBASE
      // =========================================

      if (!window.auth) {
        throw new Error(
          "Firebase Authentication is not initialized."
        );
      }

      if (!window.db) {
        throw new Error(
          "Firestore is not initialized."
        );
      }

      // =========================================
      // FIREBASE AUTHENTICATION
      // =========================================

      const userCredential =
        await window.auth.signInWithEmailAndPassword(
          cleanEmail,
          password
        );

      const user = userCredential.user;

      console.log(
        "Firebase login successful:",
        user.uid
      );

      console.log(
        "Firebase email:",
        user.email
      );

      // =========================================
      // FIND MEMBER BY EMAIL
      // =========================================

      const memberDoc =
  await window.db
    .collection("members")
    .doc(user.uid)
    .get();

if (!memberDoc.exists) {

  await window.auth.signOut();

  throw new Error(
    "Member account was not found."
  );

}

const member =
  memberDoc.data();

      // Member not found
      if (memberSnapshot.empty) {

        await window.auth.signOut();

        throw new Error(
          "Member account was not found."
        );
      }

      // Get first matching document
      const memberDoc =
        memberSnapshot.docs[0];

      const member = memberDoc.data();

      console.log(
        "Member document ID:",
        memberDoc.id
      );

      console.log(
        "Member data:",
        member
      );

      // =========================================
      // CHECK MEMBER ROLE
      // =========================================

      if (
        member.role &&
        member.role.toLowerCase() !== "member"
      ) {

        await window.auth.signOut();

        throw new Error(
          "You are not authorized to access the Members Portal."
        );
      }

      // =========================================
      // CREATE MEMBER SESSION
      // =========================================

      const session = {
        uid: user.uid,
        email: user.email,
        name: member.name || "",
        role: member.role || "member"
      };

      // =========================================
      // REMEMBER ME
      // =========================================

      if (remember) {

        localStorage.setItem(
          "wealthoria-member",
          JSON.stringify(session)
        );

        // Remove previous temporary session
        sessionStorage.removeItem(
          "wealthoria-member"
        );

      } else {

        sessionStorage.setItem(
          "wealthoria-member",
          JSON.stringify(session)
        );

        // Remove previous remembered session
        localStorage.removeItem(
          "wealthoria-member"
        );
      }

      console.log(
        "Member session saved:",
        session
      );

      // =========================================
      // GO TO MEMBER DASHBOARD
      // =========================================

      if (window.membersNavigate) {

        window.membersNavigate(
          "/members/dashboard"
        );

      } else {

        window.location.href =
          "/members/dashboard";

      }

   } catch (err) {
  console.error("Member login error:", err);

  let message = "Unable to LOgin in.";

  if (
    err.code === "auth/invalid-credential" ||
    err.code === "auth/wrong-password" ||
    err.code === "auth/user-not-found"
  ) {
    message = "Incorrect email or password.";
  } 
  else if (err.code === "auth/invalid-email") {
    message = "Please enter a valid email address.";
  } 
  else if (err.code === "auth/too-many-requests") {
    message = "Too many login attempts. Please try again later.";
  } 
  else if (err.code === "auth/user-disabled") {
    message = "This account has been disabled.";
  } 
  else if (err.message === "Member account was not found.") {
    message = "This email is not registered as a member.";
  }

  setError(message);

} finally {
  setLoading(false);
}
  };

  return (
    <div className="members-login-page">

      {/* =========================================
          BRAND
      ========================================= */}
<a
  href="/"
  className="members-login-brand"
  aria-label="Go to Wealthoria website" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}
>
  <img
    src="/assets/logo-mark.png"
    alt="Wealthoria"
  />

  <span>
    Wealthoria
  </span>
</a>


      {/* =========================================
          LOGIN CARD
      ========================================= */}

      <div className="members-login-card">

        <div className="members-login-heading">

          <span className="members-eyebrow">
            MEMBER PORTAL
          </span>

          <h1>
            Member sign in
          </h1>

        </div>


        {/* =========================================
            ERROR
        ========================================= */}

        {error && (
          <div className="members-login-error">
            {error}
          </div>
        )}


        {/* =========================================
            LOGIN FORM
        ========================================= */}

        <form
          onSubmit={submitLogin}
          noValidate
        >

          {/* EMAIL */}

          <div className="members-field">

            <label>
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              placeholder="you@wealthoria.in"
              autoComplete="username"
            />

          </div>


          {/* PASSWORD */}

          <div className="members-field">

            <label>
              Password
            </label>

            <div className="members-password">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="Your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>


          {/* =========================================
              OPTIONS
          ========================================= */}

          <div className="members-login-options">

            <label>

              <input
                type="checkbox"
                checked={remember}
                onChange={(event) =>
                  setRemember(
                    event.target.checked
                  )
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

              }}
            >
              Forgot password?
            </button>

          </div>


          {/* =========================================
              LOGIN BUTTON
          ========================================= */}

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

window.MemberLogin = MemberLogin;