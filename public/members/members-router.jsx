/* global React, window */

const { useState, useEffect } = React;


/* =========================================================
   MEMBERS ROUTER
========================================================= */

function MembersRouter() {

  const [path, setPath] = useState(
    window.location.pathname
  );


  /* =========================================================
     LISTEN FOR BACK / FORWARD
  ========================================================= */

  useEffect(() => {

    const handleNavigation = () => {

      setPath(
        window.location.pathname
      );

      window.scrollTo(0, 0);

    };


    window.addEventListener(
      "popstate",
      handleNavigation
    );


    return () => {

      window.removeEventListener(
        "popstate",
        handleNavigation
      );

    };

  }, []);


  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigate = (to) => {

    if (!to) {
      return;
    }


    window.history.pushState(
      {},
      "",
      to
    );


    setPath(to);


    window.scrollTo(
      0,
      0
    );

  };


  /* =========================================================
     GLOBAL NAVIGATION
  ========================================================= */

  window.membersNavigate =
    navigate;


  console.log(
    "MembersRouter path:",
    path
  );



  
  /* =========================================================
     LOGIN
  ========================================================= */

  if (
    path === "/members/login" ||
    path === "/members/"
  ) {

    return window.MemberLogin
      ? React.createElement(
          window.MemberLogin
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Member Login...
          </div>
        );

  }


  /* =========================================================
     DASHBOARD
  ========================================================= */

  if (
    path === "/members/dashboard"
  ) {

    return window.MemberDashboard
      ? React.createElement(
          window.MemberDashboard
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Dashboard...
          </div>
        );

  }


  /* =========================================================
     COURSE VIDEOS
  ========================================================= */

  if (
    path === "/members/course-videos"
  ) {

    return window.CourseVideos
      ? React.createElement(
          window.CourseVideos
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Course Videos...
          </div>
        );

  }


  /* =========================================================
     WEEKLY ROUNDUP
  ========================================================= */

  if (
    path === "/members/weekly-roundup"
  ) {

    return window.WeeklyRoundup
      ? React.createElement(
          window.WeeklyRoundup
        )
      : (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              padding: 40,
              textAlign: "center",
              fontFamily:
                "Arial, sans-serif"
            }}
          >

            <h2>
              Weekly Roundup is not available
            </h2>


            <p>
              WeeklyRoundup.jsx has not loaded.
            </p>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/members/dashboard"
                )
              }
              style={{
                marginTop: 20,
                padding:
                  "12px 22px",
                border: "none",
                borderRadius: 8,
                background:
                  "#e8473f",
                color: "#fff",
                cursor:
                  "pointer",
                fontSize: 14
              }}
            >
              ← Back to Dashboard
            </button>

          </div>
        );

  }


  /* =========================================================
     NEWSLETTER
  ========================================================= */

  if (
    path === "/members/newsletter"
  ) {

    return window.Newsletter
      ? React.createElement(
          window.Newsletter
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Newsletter...
          </div>
        );

  }


  /* =========================================================
     PURCHASE HISTORY
  ========================================================= */

  if (
    path ===
    "/members/purchase-history"
  ) {

    return window.PurchaseHistory
      ? React.createElement(
          window.PurchaseHistory
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Purchase History...
          </div>
        );

  }


  /* =========================================================
     SETTINGS
  ========================================================= */

  if (
    path === "/members/settings"
  ) {

    return window.MemberSettings
      ? React.createElement(
          window.MemberSettings
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Settings...
          </div>
        );

  }


  /* =========================================================
     SEMINAR REGISTRATIONS
  ========================================================= */

  if (
    path ===
    "/members/seminar-registrations"
  ) {

    return window.SeminarRegistrations
      ? React.createElement(
          window.SeminarRegistrations
        )
      : (
          <div
            className="members-router-loading"
          >
            Loading Seminar Registrations...
          </div>
        );

  }



  if (
  path === "/members/subscription"
) {
  return window.MemberSubscription
    ? React.createElement(
        window.MemberSubscription
      )
    : (
        <div className="members-router-loading">
          Loading Subscription...
        </div>
      );
}
  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  if (
    path ===
    "/members/forgot-password"
  ) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: 40,
          fontFamily:
            "Arial, sans-serif"
        }}
      >

        <h2>
          Forgot Password
        </h2>


        <p>
          Password recovery page coming soon.
        </p>


        <button
          type="button"
          onClick={() =>
            navigate(
              "/members/login"
            )
          }
          style={{
            marginTop: 20,
            padding:
              "12px 24px",
            border: "none",
            borderRadius: 8,
            background:
              "#e8473f",
            color: "#fff",
            cursor:
              "pointer"
          }}
        >
          Back to Login
        </button>

      </div>

    );

  }


  /* =========================================================
     PAGE NOT FOUND
  ========================================================= */

  return (

    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 40,
        fontFamily:
          "Arial, sans-serif"
      }}
    >

      <h2>
        Members Portal
      </h2>


      <p>
        Page not found:
        <br />

        <strong>
          {path}
        </strong>
      </p>


      <button
        type="button"
        onClick={() =>
          navigate(
            "/members/dashboard"
          )
        }
        style={{
          marginTop: 20,
          padding:
            "12px 24px",
          border: "none",
          borderRadius: 8,
          background:
            "#e8473f",
          color: "#fff",
          cursor:
            "pointer",
          fontSize: 15
        }}
      >
        Go to Dashboard
      </button>

    </div>

  );

}


/* =========================================================
   EXPORT
========================================================= */

window.MembersRouter =
  MembersRouter;


console.log(
  "MembersRouter loaded successfully"
);