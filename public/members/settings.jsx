/* global React, window, firebase */

const { useState, useEffect } = React;


/* =========================================================
   MEMBER SETTINGS
========================================================= */

function MemberSettings() {

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");


  /* =========================================================
     LOAD CURRENT MEMBER
  ========================================================= */

  useEffect(() => {

    const user = window.auth?.currentUser;

    console.log(
      "Settings Firebase user:",
      user
    );

    if (!user) {

      setError(
        "Please login again."
      );

      setLoading(false);

      return;
    }


    setUid(
      user.uid || ""
    );

    setEmail(
      user.email || ""
    );


    if (!window.db) {

      setError(
        "Firestore is not available."
      );

      setLoading(false);

      return;
    }


    window.db
      .collection("members")
      .doc(user.uid)
      .get()
      .then((doc) => {

        if (doc.exists) {

          const data = doc.data();

          setName(
            data.name || ""
          );

          setEmail(
            data.email ||
            user.email ||
            ""
          );

        }

        else {

          const saved =
            localStorage.getItem(
              "wealthoria-member"
            ) ||
            sessionStorage.getItem(
              "wealthoria-member"
            );

          if (saved) {

            try {

              const parsed =
                JSON.parse(saved);

              setName(
                parsed.name || ""
              );

              setEmail(
                parsed.email ||
                user.email ||
                ""
              );

            } catch (err) {

              console.warn(
                "Could not read saved member session:",
                err
              );

            }

          }

        }

      })
      .catch((err) => {

        console.error(
          "Settings load error:",
          err
        );

        setError(
          "Unable to load your account details."
        );

      })
      .finally(() => {

        setLoading(false);

      });

  }, []);


  /* =========================================================
     UPDATE LOCAL SESSION
  ========================================================= */

  const updateLocalSession = (
    updatedName,
    updatedEmail
  ) => {

    const storages = [
      localStorage,
      sessionStorage
    ];

    storages.forEach((storage) => {

      const saved =
        storage.getItem(
          "wealthoria-member"
        );

      if (!saved) {
        return;
      }

      try {

        const parsed =
          JSON.parse(saved);

        parsed.name =
          updatedName;

        parsed.email =
          updatedEmail;

        parsed.uid =
          uid;

        storage.setItem(
          "wealthoria-member",
          JSON.stringify(parsed)
        );

      } catch (err) {

        console.warn(
          "Session update failed:",
          err
        );

      }

    });

  };


  /* =========================================================
     SAVE CHANGES
  ========================================================= */

  const saveChanges = async () => {

    setSuccess("");
    setError("");


    const user =
      window.auth?.currentUser;


    if (!user) {

      setError(
        "Your login session has expired. Please login again."
      );

      return;
    }


    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();


    /* =======================================================
       VALIDATE NAME
    ======================================================= */

    if (!cleanName) {

      setError(
        "Please enter your name."
      );

      return;
    }


    /* =======================================================
       VALIDATE EMAIL
    ======================================================= */

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


    const currentEmail =
      (user.email || "")
        .trim()
        .toLowerCase();


    const emailChanged =
      cleanEmail !== currentEmail;


    const passwordChanged =
      newPassword.trim().length > 0;


    /* =======================================================
       PASSWORD VALIDATION
    ======================================================= */

    if (passwordChanged) {

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

    }


    /* =======================================================
       CURRENT PASSWORD REQUIRED
       ONLY FOR EMAIL/PASSWORD CHANGES
    ======================================================= */

    if (
      (emailChanged || passwordChanged) &&
      !currentPassword
    ) {

      setError(
        "Enter your current password to change your email or password."
      );

      return;
    }


    try {

      setSaving(true);


      /* =====================================================
         RE-AUTHENTICATE
      ===================================================== */

      if (
        emailChanged ||
        passwordChanged
      ) {

        if (
          !window.firebase ||
          !firebase.auth
        ) {

          throw new Error(
            "Firebase Authentication is not available."
          );

        }


        if (!user.email) {

          throw new Error(
            "This account does not have an email/password login."
          );

        }


        console.log(
          "Re-authenticating Firebase user..."
        );


        const credential =
          firebase.auth.EmailAuthProvider.credential(
            user.email,
            currentPassword
          );


        await user.reauthenticateWithCredential(
          credential
        );


        console.log(
          "Firebase re-authentication successful."
        );

      }


      /* =====================================================
         UPDATE FIREBASE DISPLAY NAME
      ===================================================== */

      if (
        user.displayName !==
        cleanName
      ) {

        await user.updateProfile({
          displayName:
            cleanName
        });

      }


      /* =====================================================
         UPDATE FIREBASE EMAIL
      ===================================================== */

      if (emailChanged) {

        await user.updateEmail(
          cleanEmail
        );

      }


      /* =====================================================
         UPDATE FIREBASE PASSWORD
      ===================================================== */

     await firebase
  .auth()
  .sendPasswordResetEmail(user.email);

      /* =====================================================
         UPDATE FIRESTORE
      ===================================================== */

      if (!window.db) {

        throw new Error(
          "Firestore is not available."
        );

      }


      await window.db
        .collection("members")
        .doc(user.uid)
        .set(
          {
            name:
              cleanName,

            email:
              cleanEmail,

            uid:
              user.uid,

            updatedAt:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          },
          {
            merge: true
          }
        );


      /* =====================================================
         UPDATE LOCAL MEMBER SESSION
      ===================================================== */

      updateLocalSession(
        cleanName,
        cleanEmail
      );


      /* =====================================================
         CLEAR PASSWORD FIELDS
      ===================================================== */

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");


      /* =====================================================
         SUCCESS
      ===================================================== */

      setName(
        cleanName
      );

      setEmail(
        cleanEmail
      );


      setSuccess(
        "Account details updated successfully."
      );


      console.log(
        "Settings update completed successfully."
      );


    } catch (err) {

      console.error(
        "Settings update error:",
        err
      );


      /* =====================================================
         FIREBASE AUTH ERRORS
      ===================================================== */

      if (
        err?.code ===
          "auth/wrong-password" ||
        err?.code ===
          "auth/invalid-credential" ||
        err?.code ===
          "auth/internal-error"
      ) {

        setError(
          "Current password is incorrect. Please enter the same password you use to log in."
        );

      }

      else if (
        err?.code ===
        "auth/requires-recent-login"
      ) {

        setError(
          "Firebase requires a fresh login. Please log out and log in again, then try again."
        );

      }

      else if (
        err?.code ===
        "auth/email-already-in-use"
      ) {

        setError(
          "This email address is already in use."
        );

      }

      else if (
        err?.code ===
        "auth/invalid-email"
      ) {

        setError(
          "Please enter a valid email address."
        );

      }

      else if (
        err?.code ===
        "auth/weak-password"
      ) {

        setError(
          "The new password is too weak."
        );

      }

      else if (
        err?.code ===
        "auth/user-disabled"
      ) {

        setError(
          "This account has been disabled."
        );

      }

      else {

        setError(
          err?.message ||
          "Unable to update your account."
        );

      }

    } finally {

      setSaving(false);

    }

  };


  /* =========================================================
     BACK TO DASHBOARD
  ========================================================= */

  const goBack = () => {

    if (
      window.membersNavigate
    ) {

      window.membersNavigate(
        "/members/dashboard"
      );

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

        <div className="member-panel">

          <div
            style={{
              padding: "50px 30px",
              textAlign: "center",
              opacity: 0.6
            }}
          >

            Loading Settings...

          </div>

        </div>

      </section>

    );

  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (

    <section
      style={{
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto"
      }}
    >

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "24px",
          marginBottom: "28px"
        }}
      >

        <div>

          <span className="member-eyebrow">
            ACCOUNT
          </span>

          <h2
            style={{
              margin: "6px 0 8px"
            }}
          >
            Settings
          </h2>

          <p
            style={{
              margin: 0,
              color:
                "var(--muted, #71717a)"
            }}
          >
            Manage your Wealthoria account details.
          </p>

        </div>


        <button
          type="button"
          className="member-panel-link"
          onClick={goBack}
        >
          ← Back to Dashboard
        </button>

      </div>


      {/* =====================================================
          SETTINGS CARD
      ===================================================== */}

      <div
        className="member-panel"
        style={{
          width: "100%",
          maxWidth: "820px",
          margin: "0 auto",
          overflow: "hidden"
        }}
      >

        {/* ===================================================
            PROFILE HEADER
        =================================================== */}

        <div
          className="member-panel-header"
          style={{
            paddingBottom: "22px"
          }}
        >

          <div>

            <span className="member-panel-label">
              PROFILE
            </span>

            <h3
              style={{
                marginTop: "5px"
              }}
            >
              Personal Information
            </h3>

          </div>

        </div>


        {/* ===================================================
            FORM
        =================================================== */}

        <div
          style={{
            padding:
              "26px 28px 30px"
          }}
        >

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {success && (

            <div
              style={{
                marginBottom:
                  "22px",
                padding:
                  "13px 15px",
                borderRadius:
                  "10px",
                background:
                  "rgba(34,155,91,.09)",
                color:
                  "#218a50",
                fontSize:
                  "13px",
                fontWeight:
                  600
              }}
            >

              ✓ {success}

            </div>

          )}


          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {error && (

            <div
              style={{
                marginBottom:
                  "22px",
                padding:
                  "13px 15px",
                borderRadius:
                  "10px",
                background:
                  "rgba(220,60,50,.09)",
                color:
                  "#c52f2f",
                fontSize:
                  "13px",
                fontWeight:
                  600
              }}
            >

              {error}

            </div>

          )}


          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <div
            style={{
              display: "grid",
              gap: "20px"
            }}
          >

            {/* NAME */}

            <div className="field">

              <label>
                Name
              </label>

              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Enter your name"
                disabled={saving}
              />

            </div>


            {/* EMAIL */}

            <div className="field">

              <label>
                Email
              </label>

              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="Enter your email"
                autoComplete="email"
                disabled={saving}
              />

            </div>


            {/* USER ID */}

            <div className="field">

              <label>
                User ID
              </label>

              <input
                className="input"
                type="text"
                value={uid}
                readOnly
                style={{
                  background:
                    "rgba(0,0,0,.035)",
                  opacity: 0.7,
                  cursor:
                    "not-allowed"
                }}
              />

              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "12px",
                  opacity: 0.55
                }}
              >
                Your User ID cannot be changed.
              </small>

            </div>

          </div>


          {/* =================================================
              SECURITY
          ================================================= */}

          <div
            style={{
              marginTop: "32px",
              paddingTop: "26px",
              borderTop:
                "1px solid rgba(0,0,0,.08)"
            }}
          >

            <span className="member-panel-label">
              SECURITY
            </span>

            <h3
              style={{
                margin:
                  "6px 0 20px"
              }}
            >
              Password & Security
            </h3>


            <div
              style={{
                display: "grid",
                gap: "20px"
              }}
            >

              {/* CURRENT PASSWORD */}

              <div className="field">

                <label>
                  Current Password
                </label>

                <input
                  className="input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  disabled={saving}
                />

                <small
                  style={{
                    display:
                      "block",
                    marginTop:
                      "6px",
                    fontSize:
                      "12px",
                    opacity:
                      0.55
                  }}
                >
                  Required only when changing your email or password.
                </small>

              </div>


              {/* NEW PASSWORD */}

              <div className="field">

                <label>
                  New Password
                </label>

                <input
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={saving}
                />

              </div>


              {/* CONFIRM PASSWORD */}

              <div className="field">

                <label>
                  Confirm New Password
                </label>

                <input
                  className="input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={saving}
                />

              </div>

            </div>

          </div>


          {/* =================================================
              ACTIONS
          ================================================= */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginTop: "30px",
              paddingTop: "25px",
              borderTop:
                "1px solid rgba(0,0,0,.08)"
            }}
          >

            <button
              type="button"
              className="btn btn-green"
              onClick={saveChanges}
              disabled={saving}
            >

              {saving
                ? "Saving..."
                : "Save Changes"}

            </button>


            <button
              type="button"
              className="member-panel-link"
              onClick={goBack}
              disabled={saving}
            >
              Cancel
            </button>

          </div>


          {/* =================================================
              SECURITY NOTE
          ================================================= */}

          <div
            style={{
              marginTop: "24px",
              fontSize: "12px",
              lineHeight: 1.6,
              opacity: 0.58
            }}
          >

            <strong>
              Security
            </strong>

            <br />

            Your current password is never displayed
            or stored in Firestore. Firebase
            Authentication securely manages passwords.

          </div>

        </div>

      </div>

    </section>

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