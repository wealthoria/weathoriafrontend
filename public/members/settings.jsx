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

  const [uid, setUid] =
    useState("");

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

  const API_BASE_URL =
  "https://webinar-registration-backend.onrender.com";


  /* =========================================================
     GET MEMBER SESSION
  ========================================================= */

  const getSession = () => {

    const saved =
      localStorage.getItem(
        "wealthoria-member"
      ) ||
      sessionStorage.getItem(
        "wealthoria-member"
      );

    if (!saved) {
      return null;
    }

    try {

      return JSON.parse(saved);

    } catch (err) {

      console.error(
        "Session parse error:",
        err
      );

      return null;
    }
  };


  /* =========================================================
     SAVE UPDATED SESSION
  ========================================================= */

  const saveSession =
    (updatedSession) => {

      if (
        localStorage.getItem(
          "wealthoria-member"
        )
      ) {

        localStorage.setItem(
          "wealthoria-member",
          JSON.stringify(
            updatedSession
          )
        );
      }


      if (
        sessionStorage.getItem(
          "wealthoria-member"
        )
      ) {

        sessionStorage.setItem(
          "wealthoria-member",
          JSON.stringify(
            updatedSession
          )
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

          setUid(
            session.uid
          );

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


            setUid(
              member.uid ||
              session.uid
            );

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

  const goBack =
    () => {

      if (
        window.membersNavigate
      ) {

        window.membersNavigate(
          "/members/dashboard"
        );

      } else {

        window.location.href =
          "/members/dashboard";

      }

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
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "flex-end",

          gap:
            "24px",

          marginBottom:
            "28px"
        }}
      >

        <div>

          <span
            className="member-eyebrow"
          >
            ACCOUNT
          </span>


          <h2
            style={{
              margin:
                "6px 0 8px"
            }}
          >
            Settings
          </h2>


          <p
            style={{
              margin:
                0,

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
          onClick={
            goBack
          }
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
          width:
            "100%",

          maxWidth:
            "820px",

          margin:
            "0 auto",

          overflow:
            "hidden"
        }}
      >

        <div
          className="member-panel-header"
          style={{
            paddingBottom:
              "22px"
          }}
        >

          <div>

            <span
              className="member-panel-label"
            >
              PROFILE
            </span>


            <h3
              style={{
                marginTop:
                  "5px"
              }}
            >
              Personal Information
            </h3>

          </div>

        </div>


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
                  600,

                lineHeight:
                  1.5
              }}
            >

              {error}

            </div>

          )}


          {/* =================================================
              NAME
          ================================================= */}

          <div
            className="field"
          >

            <label>
              Name
            </label>


            <input
              className="input"
              type="text"
              value={name}
              onChange={(event) => {

                setName(
                  event.target.value
                );

                clearMessages();

              }}
              placeholder="Enter your name"
              disabled={
                savingProfile ||
                savingPassword
              }
            />

          </div>


          {/* =================================================
              EMAIL
          ================================================= */}

          <div
            className="field"
            style={{
              marginTop:
                "20px"
            }}
          >

            <label>
              Email
            </label>


            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => {

                setEmail(
                  event.target.value
                );

                clearMessages();

              }}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={
                savingProfile ||
                savingPassword
              }
            />

          </div>


          {/* =================================================
              USER ID
          ================================================= */}

          <div
            className="field"
            style={{
              marginTop:
                "20px"
            }}
          >

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

                opacity:
                  0.7,

                cursor:
                  "not-allowed"
              }}
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
              Your User ID cannot be changed.
            </small>

          </div>


          {/* =================================================
              SAVE PROFILE
          ================================================= */}

          <div
            style={{
              marginTop:
                "28px",

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "14px"
            }}
          >

            <button
              type="button"
              className="btn btn-green"
              onClick={
                saveProfile
              }
              disabled={
                savingProfile ||
                savingPassword
              }
            >

              {savingProfile
                ? "Saving..."
                : "Save Changes"}

            </button>


            <button
              type="button"
              className="member-panel-link"
              onClick={
                goBack
              }
              disabled={
                savingProfile ||
                savingPassword
              }
            >
              Cancel
            </button>

          </div>


          {/* =================================================
              SECURITY
          ================================================= */}

          <div
            style={{
              marginTop:
                "36px",

              paddingTop:
                "28px",

              borderTop:
                "1px solid rgba(0,0,0,.08)"
            }}
          >

            <span
              className="member-panel-label"
            >
              SECURITY
            </span>


            <h3
              style={{
                margin:
                  "6px 0 10px"
              }}
            >
              Change Password
            </h3>


            <p
              style={{
                margin:
                  "0 0 22px",

                fontSize:
                  "13px",

                lineHeight:
                  1.6,

                opacity:
                  0.65
              }}
            >
              Your member password is managed securely
              through the Wealthoria member system.
            </p>


            {/* CURRENT PASSWORD */}

            <div
              className="field"
            >

              <label>
                Current Password
              </label>


              <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={(event) => {

                  setCurrentPassword(
                    event.target.value
                  );

                  clearMessages();

                }}
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={
                  savingProfile ||
                  savingPassword
                }
              />

            </div>


            {/* NEW PASSWORD */}

            <div
              className="field"
              style={{
                marginTop:
                  "20px"
              }}
            >

              <label>
                New Password
              </label>


              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(event) => {

                  setNewPassword(
                    event.target.value
                  );

                  clearMessages();

                }}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={
                  savingProfile ||
                  savingPassword
                }
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
                Minimum 6 characters.
              </small>

            </div>


            {/* CONFIRM PASSWORD */}

            <div
              className="field"
              style={{
                marginTop:
                  "20px"
              }}
            >

              <label>
                Confirm New Password
              </label>


              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(event) => {

                  setConfirmPassword(
                    event.target.value
                  );

                  clearMessages();

                }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={
                  savingProfile ||
                  savingPassword
                }
              />

            </div>


            {/* CHANGE PASSWORD BUTTON */}

            <div
              style={{
                marginTop:
                  "26px"
              }}
            >

              <button
                type="button"
                className="btn btn-green"
                onClick={
                  changePassword
                }
                disabled={
                  savingProfile ||
                  savingPassword
                }
              >

                {savingPassword
                  ? "Updating..."
                  : "Update Password"}

              </button>

            </div>


            {/* SECURITY MESSAGE */}

            <div
              style={{
                marginTop:
                  "24px",

                padding:
                  "14px 16px",

                borderRadius:
                  "10px",

                background:
                  "rgba(0,0,0,.025)",

                fontSize:
                  "12px",

                lineHeight:
                  1.6,

                opacity:
                  0.65
              }}
            >

              Your password is never displayed in the
              member interface. The server verifies the
              current password and stores only a secure
              password hash in Firestore.

            </div>

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