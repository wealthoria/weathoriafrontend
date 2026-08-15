/* global React, ReactDOM, window */

const { useState, useEffect } = React;


/* =========================================================
   MEMBERS ROUTER
========================================================= */

function MembersRouter() {

  const [path, setPath] = useState(
    window.location.pathname
  );


  /* =========================================================
     LISTEN FOR BROWSER NAVIGATION
  ========================================================= */

  useEffect(() => {

    const handleNavigation = () => {
      setPath(window.location.pathname);
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
     MEMBERS NAVIGATION
  ========================================================= */

  const navigate = (to) => {

    window.history.pushState(
      {},
      "",
      to
    );

    setPath(to);

    window.scrollTo(0, 0);

  };


  /* Make navigation available to other components */

  window.membersNavigate = navigate;


  console.log(
    "MembersRouter path:",
    path
  );


  /* =========================================================
     MEMBER LOGIN
  ========================================================= */

  if (
    path === "/members/login" ||
    path === "/members/"
  ) {

    return React.createElement(
      window.MemberLogin
    );

  }


  /* =========================================================
     MEMBER DASHBOARD
  ========================================================= */

  if (
    path === "/members/dashboard"
  ) {

    return React.createElement(
      window.MemberDashboard
    );

  }


  /* =========================================================
     COURSE VIDEOS
  ========================================================= */

  if (
    path === "/members/course-videos"
  ) {

    return React.createElement(
      window.CourseVideos
    );

  }


  /* =========================================================
     NEWSLETTER
  ========================================================= */

  if (
    path === "/members/newsletter"
  ) {

    return React.createElement(
      window.Newsletter
    );

  }


  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  if (
    path === "/members/forgot-password"
  ) {

    return (
      <div
        style={{
          padding: 40,
          fontFamily: "Arial"
        }}
      >

        <h2>
          Forgot Password
        </h2>

        <p>
          Password recovery page coming soon.
        </p>

        <button
          onClick={() =>
            navigate("/members/login")
          }
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
        fontFamily: "Arial"
      }}
    >

      <h2>
        Members Portal
      </h2>

      <p>
        Page not found.
      </p>

      <button
        onClick={() =>
          navigate("/members/login")
        }
        style={{
          padding: "12px 24px",
          border: "none",
          borderRadius: 8,
          background: "#e56b3f",
          color: "#fff",
          cursor: "pointer",
          fontSize: 15
        }}
      >
        Go to Member Login
      </button>

    </div>
  );

}


/* =========================================================
   EXPORT
========================================================= */

window.MembersRouter = MembersRouter;

console.log(
  "MembersRouter loaded successfully"
);