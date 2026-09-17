import React from "react";

/* global React, window */

const {
  useState,
  useEffect
} = React;


/* =========================================================
   MEMBER SETTINGS
========================================================= */

function MemberSettings() {

  const [loading, setLoading] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [savingPassword, setSavingPassword] =
    useState(false);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");


  /* =========================================================
     LOCAL BACKEND
  ========================================================= */
const API_BASE_URL = "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

  /* =========================================================
     GET CURRENT MEMBER SESSION
     MULTI-ACCOUNT SAFE
  ========================================================= */

  const MEMBER_SESSIONS_KEY = "wealthoria-member-sessions";
  const CURRENT_MEMBER_KEY = "wealthoria-current-member";

  const readCurrentMemberUid = () => {
    const raw =
      sessionStorage.getItem(CURRENT_MEMBER_KEY) ||
      localStorage.getItem(CURRENT_MEMBER_KEY);

    if (!raw) return "";

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") return parsed;
      return parsed?.uid || "";
    } catch (err) {
      return raw;
    }
  };

  const readSessions = (storage) => {
    try {
      const raw = storage.getItem(MEMBER_SESSIONS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      console.error("Member sessions parse error:", err);
      return {};
    }
  };

  const getSession = () => {
    const currentUid = readCurrentMemberUid();

    if (currentUid) {
      const sessionStore = readSessions(sessionStorage);
      if (sessionStore[currentUid]) {
        return sessionStore[currentUid];
      }

      const localStore = readSessions(localStorage);
      if (localStore[currentUid]) {
        return localStore[currentUid];
      }
    }

    /* Backward compatibility for older single-session accounts */
    const legacy =
      localStorage.getItem("wealthoria-member") ||
      sessionStorage.getItem("wealthoria-member");

    if (legacy) {
      try {
        return JSON.parse(legacy);
      } catch (err) {
        console.error("Legacy session parse error:", err);
      }
    }

    return null;
  };


  /* =========================================================
     SAVE UPDATED SESSION
     UPDATES ONLY THE CURRENT MEMBER
  ========================================================= */

  const saveSession = (updatedSession) => {
    if (!updatedSession?.uid) return;

    const uid = updatedSession.uid;

    const sessionStore = readSessions(sessionStorage);
    if (sessionStore[uid]) {
      sessionStore[uid] = updatedSession;
      sessionStorage.setItem(
        MEMBER_SESSIONS_KEY,
        JSON.stringify(sessionStore)
      );
    }

    const localStore = readSessions(localStorage);
    if (localStore[uid]) {
      localStore[uid] = updatedSession;
      localStorage.setItem(
        MEMBER_SESSIONS_KEY,
        JSON.stringify(localStore)
      );
    }

    /*
      If this is an older session, keep the legacy key working
      without affecting the new multi-account storage.
    */
    if (
      localStorage.getItem("wealthoria-member") &&
      !localStore[uid]
    ) {
      localStorage.setItem(
        "wealthoria-member",
        JSON.stringify(updatedSession)
      );
    }

    if (
      sessionStorage.getItem("wealthoria-member") &&
      !sessionStore[uid]
    ) {
      sessionStorage.setItem(
        "wealthoria-member",
        JSON.stringify(updatedSession)
      );
    }
  };


  /* =========================================================
     LOAD MEMBER DATA
  ========================================================= */

  useEffect(() => {

    const loadMember =
      async () => {

        try {

          setLoading(true);
          setError("");
          setSuccess("");


          const session =
            getSession();


          if (!session) {

            throw new Error(
              "Your member session was not found. Please login again."
            );

          }


          if (
            !session.uid ||
            !session.token
          ) {

            throw new Error(
              "Your member session is invalid. Please login again."
            );

          }


          /* ---------------------------------------------
             INITIAL VALUES
          --------------------------------------------- */

          setName(
            session.name || ""
          );

          setEmail(
            session.email || ""
          );


          /* ---------------------------------------------
             GET LATEST MEMBER FROM BACKEND
          --------------------------------------------- */

          const response =
            await fetch(
              `${API_BASE_URL}/api/members/me`,
              {
                method: "GET",

                headers: {
                  "Authorization":
                    `Bearer ${session.token}`
                }
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data?.message ||
              "Unable to load member details."
            );

          }


          if (
            data?.success &&
            data?.member
          ) {

            const member =
              data.member;

            setName(
              member.name || ""
            );

            setEmail(
              member.email || ""
            );


            /* -------------------------------------------
               UPDATE SESSION
            ------------------------------------------- */

            saveSession({

              ...session,

              uid:
                member.uid ||
                session.uid,

              name:
                member.name ||
                "",

              email:
                member.email ||
                ""

            });

          }


        } catch (err) {

          console.error(
            "Settings load error:",
            err
          );


          setError(
            err?.message ||
            "Unable to load your account details."
          );

        } finally {

          setLoading(false);

        }

      };


    loadMember();

  }, []);


  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  const saveProfile =
    async () => {

      setSuccess("");
      setError("");


      const session =
        getSession();


      if (!session) {

        setError(
          "Your session was not found. Please login again."
        );

        return;

      }


      if (!session.token) {

        setError(
          "Your session is invalid. Please login again."
        );

        return;

      }


      const cleanName =
        name.trim();


      const cleanEmail =
        email.trim().toLowerCase();


      /* ---------------------------------------------
         VALIDATE NAME
      --------------------------------------------- */

      if (!cleanName) {

        setError(
          "Name is required."
        );

        return;

      }


      /* ---------------------------------------------
         VALIDATE EMAIL
      --------------------------------------------- */

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


      try {

        setSavingProfile(true);


        console.log(
          "Updating member profile:",
          session.uid
        );


        const response =
          await fetch(
            `${API_BASE_URL}/api/members/profile`,
            {
              method: "PUT",

              headers: {

                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${session.token}`

              },

              body:
                JSON.stringify({

                  name:
                    cleanName,

                  email:
                    cleanEmail

                })

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data?.message ||
            "Unable to update profile."
          );

        }


        /* ---------------------------------------------
           UPDATE SCREEN
        --------------------------------------------- */

        setName(
          cleanName
        );

        setEmail(
          cleanEmail
        );


        /* ---------------------------------------------
           UPDATE LOCAL SESSION
        --------------------------------------------- */

        saveSession({

          ...session,

          uid:
            session.uid,

          name:
            cleanName,

          email:
            cleanEmail

        });


        setSuccess(
          "Profile updated successfully."
        );


        console.log(
          "Profile updated successfully."
        );


      } catch (err) {

        console.error(
          "Profile update error:",
          err
        );


        setError(
          err?.message ||
          "Unable to update profile."
        );

      } finally {

        setSavingProfile(false);

      }

    };


  /* =========================================================
     CHANGE PASSWORD
  ========================================================= */

  const changePassword =
    async () => {

      setSuccess("");
      setError("");


      const session =
        getSession();


      if (!session) {

        setError(
          "Your session was not found. Please login again."
        );

        return;

      }


      if (!session.token) {

        setError(
          "Your session is invalid. Please login again."
        );

        return;

      }


      /* ---------------------------------------------
         VALIDATE CURRENT PASSWORD
      --------------------------------------------- */

      if (!currentPassword) {

        setError(
          "Current password is required."
        );

        return;

      }


      /* ---------------------------------------------
         VALIDATE NEW PASSWORD
      --------------------------------------------- */

      if (!newPassword) {

        setError(
          "New password is required."
        );

        return;

      }


      if (
        newPassword.length < 6
      ) {

        setError(
          "New password must be at least 6 characters."
        );

        return;

      }


      if (
        newPassword !==
        confirmPassword
      ) {

        setError(
          "New password and confirmation do not match."
        );

        return;

      }


      try {

        setSavingPassword(true);


        console.log(
          "Changing member password:",
          session.uid
        );


        const response =
          await fetch(
            `${API_BASE_URL}/api/members/change-password`,
            {
              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${session.token}`

              },

              body:
                JSON.stringify({

                  currentPassword:
                    currentPassword,

                  newPassword:
                    newPassword

                })

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data?.message ||
            "Unable to change password."
          );

        }


        /* ---------------------------------------------
           CLEAR PASSWORD FIELDS
        --------------------------------------------- */

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");


        setSuccess(
          "Password updated successfully."
        );


        console.log(
          "Member password updated successfully."
        );


      } catch (err) {

        console.error(
          "Password update error:",
          err
        );


        setError(
          err?.message ||
          "Unable to change password."
        );

      } finally {

        setSavingPassword(false);

      }

    };


  /* =========================================================
     BACK
  ========================================================= */
const goBack = () => {
  // Use a native browser navigation so the MembersRouter
  // always receives /members/dashboard.
  window.location.href = "/members/dashboard";
};

  /* =========================================================
     CLEAR MESSAGES WHEN TYPING
  ========================================================= */

  const clearMessages =
    () => {

      if (success) {
        setSuccess("");
      }

      if (error) {
        setError("");
      }

    };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (

      <section
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto"
        }}
      >

        <div
          className="member-panel"
        >

          <div
            style={{
              padding:
                "60px 30px",
              textAlign:
                "center",
              opacity:
                0.6
            }}
          >

            Loading Settings...

          </div>

        </div>

      </section>

    );

  }


  /* =========================================================
     MAIN SETTINGS PAGE
  ========================================================= */

  return (
    <>
      <style>{`
        .member-settings-page {
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
          padding: 22px 24px 42px;
          box-sizing: border-box;
        }

        .member-settings-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .member-settings-top h2 {
          margin: 5px 0 4px;
          color: #20231f;
          font-size: 25px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .member-settings-top p {
          margin: 0;
          color: #858a82;
          font-size: 12px;
          line-height: 1.5;
        }

        .member-settings-card {
          width: 100%;
          background: #fff;
          border: 1px solid #e7e9e4;
          border-radius: 14px;
          overflow: hidden;
        }

        .member-settings-section {
          padding: 22px 24px;
        }

        .member-settings-section + .member-settings-section {
          border-top: 1px solid #eceee9;
        }

        .member-settings-section-head {
          margin-bottom: 17px;
        }

        .member-settings-section-head .member-panel-label {
          margin-bottom: 5px;
        }

        .member-settings-section-head h3 {
          margin: 0;
          color: #252822;
          font-size: 16px;
          line-height: 1.3;
        }

        .member-settings-section-head p {
          margin: 5px 0 0;
          color: #8a8f87;
          font-size: 11px;
          line-height: 1.5;
        }

        .member-settings-field {
          margin-top: 14px;
        }

        .member-settings-field:first-child {
          margin-top: 0;
        }

        .member-settings-field label {
          display: block;
          margin-bottom: 6px;
          color: #343832;
          font-size: 11px;
          font-weight: 650;
        }

        .member-settings-input {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          box-sizing: border-box;
          border: 1px solid #d9ddd7;
          border-radius: 8px;
          outline: none;
          background: #fbfcfa;
          color: #242722;
          font: inherit;
          font-size: 12px;
          transition: border-color .18s ease, box-shadow .18s ease;
        }

        .member-settings-input:focus {
          border-color: #e8473f;
          box-shadow: 0 0 0 3px rgba(232,71,63,.08);
          background: #fff;
        }

        .member-settings-input:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .member-settings-message {
          margin-bottom: 14px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.45;
        }

        .member-settings-message.success {
          background: #f0f8f2;
          color: #23804b;
          border: 1px solid #d7ebdc;
        }

        .member-settings-message.error {
          background: #fff1ef;
          color: #c13d34;
          border: 1px solid #f2d1cc;
        }

        .member-settings-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 17px;
        }

        .member-settings-primary {
          min-width: 122px;
          height: 40px;
          padding: 0 17px;
          border: 0;
          border-radius: 8px;
          background: #e8473f;
          color: #fff;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform .18s ease, opacity .18s ease;
        }

        .member-settings-primary:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .member-settings-primary:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .member-settings-secondary {
          border: 0;
          background: transparent;
          color: #d45a45;
          font: inherit;
          font-size: 11px;
          cursor: pointer;
        }

        .member-settings-secondary:hover {
          text-decoration: underline;
        }

        .member-settings-security-note {
          margin-top: 15px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #f8f9f7;
          color: #858a82;
          font-size: 10px;
          line-height: 1.55;
        }

        .member-settings-loading {
          width: 100%;
          max-width: 760px;
          margin: 20px auto;
          padding: 45px 20px;
          box-sizing: border-box;
          text-align: center;
          color: #858a82;
          font-size: 12px;
          background: #fff;
          border: 1px solid #e7e9e4;
          border-radius: 14px;
        }

        html[data-theme="dark"] .member-settings-top h2 {
          color: #f3f5f7;
        }

        html[data-theme="dark"] .member-settings-top p,
        html[data-theme="dark"] .member-settings-section-head p {
          color: #9da5ad;
        }

        html[data-theme="dark"] .member-settings-card {
          background: #181b1f;
          border-color: #30353c;
        }

        html[data-theme="dark"] .member-settings-section + .member-settings-section {
          border-color: #30353c;
        }

        html[data-theme="dark"] .member-settings-section-head h3,
        html[data-theme="dark"] .member-settings-field label {
          color: #f3f5f7;
        }

        html[data-theme="dark"] .member-settings-input {
          background: #20242a;
          border-color: #363c44;
          color: #f3f5f7;
        }

        html[data-theme="dark"] .member-settings-input:focus {
          background: #20242a;
        }

        html[data-theme="dark"] .member-settings-security-note {
          background: #20242a;
          color: #a9b0b8;
        }

        html[data-theme="dark"] .member-settings-loading {
          background: #181b1f;
          border-color: #30353c;
          color: #a9b0b8;
        }

        @media (max-width: 700px) {
          .member-settings-page {
            padding: 18px 14px 30px;
          }

          .member-settings-top {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }

          .member-settings-top h2 {
            font-size: 23px;
          }

          .member-settings-section {
            padding: 18px 16px;
          }
        }
      `}</style>

      <section className="member-settings-page">

        <div className="member-settings-top">
          <div>
            <span className="member-eyebrow">
              ACCOUNT
            </span>

            <h2>Settings</h2>

            <p>
              Manage your Wealthoria account details.
            </p>
          </div>

         

        </div>

        <div className="member-settings-card">

          {/* PROFILE */}
          <section className="member-settings-section">

            <div className="member-settings-section-head">
              <span className="member-panel-label">
                PROFILE
              </span>

              <h3>Personal Information</h3>

              <p>
                Update the name and email associated with your member account.
              </p>
            </div>

            {success && (
              <div className="member-settings-message success">
                ✓ {success}
              </div>
            )}

            {error && (
              <div className="member-settings-message error">
                {error}
              </div>
            )}

            <div className="member-settings-field">
              <label>Name</label>

              <input
                className="member-settings-input"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearMessages();
                }}
                placeholder="Enter your name"
                disabled={savingProfile || savingPassword}
              />
            </div>

            <div className="member-settings-field">
              <label>Email</label>

              <input
                className="member-settings-input"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearMessages();
                }}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={savingProfile || savingPassword}
              />
            </div>

            <div className="member-settings-actions">
              <button
                type="button"
                className="member-settings-primary"
                onClick={saveProfile}
                disabled={savingProfile || savingPassword}
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="member-settings-secondary"
                onClick={goBack}
                disabled={savingProfile || savingPassword}
              >
                Cancel
              </button>
            </div>

          </section>

          {/* SECURITY */}
          <section className="member-settings-section">

            <div className="member-settings-section-head">
              <span className="member-panel-label">
                SECURITY
              </span>

              <h3>Change Password</h3>

              <p>
                Keep your account secure by using a strong password.
              </p>
            </div>

            <div className="member-settings-field">
              <label>Current Password</label>

              <input
                className="member-settings-input"
                type="password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  clearMessages();
                }}
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={savingProfile || savingPassword}
              />
            </div>

            <div className="member-settings-field">
              <label>New Password</label>

              <input
                className="member-settings-input"
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  clearMessages();
                }}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={savingProfile || savingPassword}
              />

              <small
                style={{
                  display: "block",
                  marginTop: 5,
                  fontSize: 10,
                  color: "#8a8f87"
                }}
              >
                Minimum 6 characters.
              </small>
            </div>

            <div className="member-settings-field">
              <label>Confirm New Password</label>

              <input
                className="member-settings-input"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearMessages();
                }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={savingProfile || savingPassword}
              />
            </div>

            <div className="member-settings-actions">
              <button
                type="button"
                className="member-settings-primary"
                onClick={changePassword}
                disabled={savingProfile || savingPassword}
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>

            <div className="member-settings-security-note">
              Your password is never displayed in the member interface.
              The server verifies the current password and stores only a
              secure password hash in Firestore.
            </div>

          </section>

        </div>
      </section>
    </>
  );
}


/* =========================================================
   EXPORT
========================================================= */

window.MemberSettings =
  MemberSettings;

window.Settings =
  MemberSettings;


console.log(
  "MemberSettings loaded successfully"
);
