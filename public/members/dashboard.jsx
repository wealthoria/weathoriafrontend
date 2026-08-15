/* global React, window */

const { useState, useEffect, useRef } = React;

/* =========================================================
   OPTIONAL MEMBER PAGES
   ========================================================= */

function getComponent(name) {
  return window[name] || null;
}


/* =========================================================
   TRADINGVIEW CHART
========================================================= */

function TradingViewChart({ theme }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");

    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "NSE:NIFTY",
      interval: "D",
      timezone: "Asia/Kolkata",
      theme: theme === "dark" ? "dark" : "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: false,
      save_image: true,
      studies: [],
      support_host: "https://www.tradingview.com"
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        width: "100%",
        height: "650px"
      }}
    />
  );
}


/* =========================================================
   MEMBER DASHBOARD
========================================================= */

function MemberDashboard() {

  const [member, setMember] = useState(null);

  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem("wealthoria-member-theme") ||
      "light"
    );
  });

  const [activeSection, setActiveSection] =
    useState("dashboard");


  /* =========================================================
     LOAD MEMBER SESSION
  ========================================================= */

  useEffect(() => {

    const loadMember = () => {

      const saved =
        localStorage.getItem("wealthoria-member") ||
        sessionStorage.getItem("wealthoria-member");

      if (!saved) {

        console.log(
          "No member session found."
        );

        if (window.membersNavigate) {
          window.membersNavigate(
            "/members/login"
          );
        }

        return;
      }

      try {

        const parsed =
          JSON.parse(saved);

        setMember(parsed);

        console.log(
          "Member session loaded:",
          parsed
        );

      } catch (error) {

        console.error(
          "Session error:",
          error
        );

      }

    };

    loadMember();

  }, []);


  /* =========================================================
     KEEP THE CURRENT SECTION AFTER REFRESH
  ========================================================= */

  useEffect(() => {

    const path =
      window.location.pathname;

    if (
      path === "/members/course-videos"
    ) {
      setActiveSection("courses");

    } else if (
      path === "/members/newsletter"
    ) {
      setActiveSection("newsletter");

    } else if (
      path === "/members/weekly-roundup"
    ) {
      setActiveSection("weekly-roundup");

    } else if (
      path === "/members/market-roundup"
    ) {
      setActiveSection("market-roundup");

    } else if (
      path === "/members/purchase-history"
    ) {
      setActiveSection("purchase-history");

    } else if (
      path === "/members/seminar-registrations"
    ) {
      setActiveSection("seminars");

    } else if (
      path === "/members/settings"
    ) {
      setActiveSection("settings");

    } else {
      setActiveSection("dashboard");
    }

  }, []);


  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigate = (path) => {

    if (window.membersNavigate) {

      window.membersNavigate(path);

    } else {

      window.history.pushState(
        {},
        "",
        path
      );

      window.dispatchEvent(
        new PopStateEvent("popstate")
      );

    }

  };


  /* =========================================================
     OPEN SECTION
  ========================================================= */

  const openSection = (section) => {

    setActiveSection(section);

    switch (section) {

      case "courses":
        navigate(
          "/members/course-videos"
        );
        break;

      case "newsletter":
        navigate(
          "/members/newsletter"
        );
        break;

      case "weekly-roundup":
        navigate(
          "/members/weekly-roundup"
        );
        break;

      case "market-roundup":
        navigate(
          "/members/market-roundup"
        );
        break;

      case "purchase-history":
        navigate(
          "/members/purchase-history"
        );
        break;

      case "seminars":
        navigate(
          "/members/seminar-registrations"
        );
        break;

      case "settings":
        navigate(
          "/members/settings"
        );
        break;

      default:
        navigate(
          "/members/dashboard"
        );
    }

  };


  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = async () => {

    try {

      if (window.auth) {
        await window.auth.signOut();
      }

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    }

    localStorage.removeItem(
      "wealthoria-member"
    );

    sessionStorage.removeItem(
      "wealthoria-member"
    );

    navigate(
      "/members/login"
    );

  };


  /* =========================================================
     THEME
  ========================================================= */

  const toggleTheme = () => {

    const next =
      theme === "dark"
        ? "light"
        : "dark";

    setTheme(next);

    localStorage.setItem(
      "wealthoria-member-theme",
      next
    );

  };


  /* =========================================================
     MEMBER DETAILS
  ========================================================= */

  const name =
    member?.name ||
    "Member";

  const role =
    member?.role ||
    "Member";

  const email =
    member?.email ||
    "";


  /* =========================================================
     PAGE COMPONENTS
  ========================================================= */

  const CourseVideos =
    getComponent(
      "CourseVideos"
    );

  const Newsletter =
    getComponent(
      "Newsletter"
    );

  const SeminarRegistrations =
    getComponent(
      "SeminarRegistrations"
    );

  const WeeklyRoundup =
    getComponent(
      "WeeklyRoundup"
    );

  const PurchaseHistory =
    getComponent(
      "PurchaseHistory"
    );


  /* =========================================================
     LOADING
  ========================================================= */

  if (!member) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial"
        }}
      >
        Loading member portal...
      </div>
    );

  }


  /* =========================================================
     RENDER PAGE
  ========================================================= */

  const renderContent = () => {


    /* =====================================================
       COURSE VIDEOS
    ===================================================== */

    if (
      activeSection === "courses"
    ) {

      if (!CourseVideos) {

        return (
          <MissingComponent
            name="CourseVideos"
            file="CourseVideos.jsx"
            back={() =>
              openSection("dashboard")
            }
          />
        );

      }

      return (
        <CourseVideos />
      );

    }


    /* =====================================================
       NEWSLETTER
    ===================================================== */

    if (
      activeSection === "newsletter"
    ) {

      if (!Newsletter) {

        return (
          <MissingComponent
            name="Newsletter"
            file="Newsletter.jsx"
            back={() =>
              openSection("dashboard")
            }
          />
        );

      }

      return (
        <Newsletter />
      );

    }


    /* =====================================================
       WEEKLY ROUNDUP
    ===================================================== */

    if (
      activeSection === "weekly-roundup"
    ) {

      if (!WeeklyRoundup) {

        return (
          <MissingComponent
            name="WeeklyRoundup"
            file="WeeklyRoundup.jsx"
            back={() =>
              openSection("dashboard")
            }
          />
        );

      }

      return (
        <WeeklyRoundup />
      );

    }


    /* =====================================================
       SEMINAR REGISTRATIONS
    ===================================================== */

    if (
      activeSection === "seminars"
    ) {

      if (!SeminarRegistrations) {

        return (
          <MissingComponent
            name="SeminarRegistrations"
            file="SeminarRegistrations.jsx"
            back={() =>
              openSection("dashboard")
            }
          />
        );

      }

      return (
        <SeminarRegistrations />
      );

    }


    /* =====================================================
       PURCHASE HISTORY
    ===================================================== */

    if (
      activeSection === "purchase-history"
    ) {

      if (!PurchaseHistory) {

        return (
          <MissingComponent
            name="PurchaseHistory"
            file="PurchaseHistory.jsx"
            back={() =>
              openSection("dashboard")
            }
          />
        );

      }

      return (
        <PurchaseHistory />
      );

    }


    /* =====================================================
       MARKET ROUNDUP
    ===================================================== */

    if (
      activeSection === "market-roundup"
    ) {

      return (

        <section className="member-chart-page">

          <div className="member-chart-header">

            <div>

              <span className="member-eyebrow">
                MARKET DATA
              </span>

              <h2>
                Market Charts
              </h2>

              <p>
                Track market movements
                and explore financial
                charts.
              </p>

            </div>

            <button
              className="member-panel-link"
              onClick={() =>
                openSection("dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </div>


          <div
            className="member-chart-container"
            style={{
              width: "100%",
              minHeight: "650px"
            }}
          >

            <TradingViewChart
              theme={theme}
            />

          </div>

        </section>

      );

    }


    /* =====================================================
       SETTINGS
    ===================================================== */

    if (
      activeSection === "settings"
    ) {

      return (

        <section className="member-settings-page">

          <div className="member-chart-header">

            <div>

              <span className="member-eyebrow">
                ACCOUNT
              </span>

              <h2>
                Settings
              </h2>

              <p>
                Manage your member portal
                preferences.
              </p>

            </div>

            <button
              className="member-panel-link"
              onClick={() =>
                openSection("dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </div>


          <div
            className="member-settings-card"
            style={{
              marginTop: 25,
              padding: 25,
              borderRadius: 16,
              background:
                theme === "dark"
                  ? "#1c1c1c"
                  : "#ffffff"
            }}
          >

            <h3>
              Account
            </h3>

            <p>
              <strong>Name:</strong>{" "}
              {name}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {email}
            </p>

            <p>
              <strong>Role:</strong>{" "}
              {role}
            </p>

          </div>

        </section>

      );

    }


    /* =====================================================
       DASHBOARD HOME
    ===================================================== */

    return (

      <section className="member-home-page">

        <div className="member-welcome">

          <span className="member-eyebrow">
            MEMBER PORTAL
          </span>

          <h1>
            Welcome, {name}
          </h1>

          <p>
            Continue learning and
            explore your Wealthoria
            member resources.
          </p>

        </div>


        <div className="member-dashboard-grid">


          {/* COURSES */}

          <button
            className="member-dashboard-card"
            onClick={() =>
              openSection("courses")
            }
          >

            <span className="member-card-icon">
              ▶
            </span>

            <h3>
              Course Videos
            </h3>

            <p>
              Watch your available
              learning videos.
            </p>

            <span className="member-card-link">
              Open Courses →
            </span>

          </button>


          {/* NEWSLETTER */}

          <button
            className="member-dashboard-card"
            onClick={() =>
              openSection("newsletter")
            }
          >

            <span className="member-card-icon">
              ✉
            </span>

            <h3>
              Newsletter
            </h3>

            <p>
              Read Wealthoria
              newsletters.
            </p>

            <span className="member-card-link">
              Read Newsletter →
            </span>

          </button>


          {/* WEEKLY ROUNDUP */}

          <button
            className="member-dashboard-card"
            onClick={() =>
              openSection("weekly-roundup")
            }
          >

            <span className="member-card-icon">
              📰
            </span>

            <h3>
              Weekly Roundup
            </h3>

            <p>
              Stay updated with
              weekly market insights.
            </p>

            <span className="member-card-link">
              View Roundup →
            </span>

          </button>


          {/* MARKET */}

          <button
            className="member-dashboard-card"
            onClick={() =>
              openSection("market-roundup")
            }
          >

            <span className="member-card-icon">
              📈
            </span>

            <h3>
              Market Charts
            </h3>

            <p>
              View live market
              charts.
            </p>

            <span className="member-card-link">
              Open Charts →
            </span>

          </button>


          {/* PURCHASE HISTORY */}

          <button
            className="member-dashboard-card"
            onClick={() =>
              openSection("purchase-history")
            }
          >

            <span className="member-card-icon">
              🧾
            </span>

            <h3>
              Purchase History
            </h3>

            <p>
              View your subscription
              and purchase history.
            </p>

            <span className="member-card-link">
              View Purchases →
            </span>

          </button>


          {/* SEMINARS */}

          <button
            className="member-dashboard-card"
            onClick={() =>
              openSection("seminars")
            }
          >

            <span className="member-card-icon">
              📋
            </span>

            <h3>
              Seminar Registrations
            </h3>

            <p>
              View seminar
              registrations.
            </p>

            <span className="member-card-link">
              Open Registrations →
            </span>

          </button>


        </div>

      </section>

    );

  };


  /* =========================================================
     MAIN UI
  ========================================================= */

  return (

    <div
      className={
        theme === "dark"
          ? "member-dashboard member-dark"
          : "member-dashboard member-light"
      }
    >


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="member-sidebar">

        <div
          className="member-sidebar-brand"
          onClick={() => {
            window.location.href =
              "/";
          }}
          style={{
            cursor: "pointer"
          }}
        >

          <img
            src="/assets/logo-mark.png"
            alt="Wealthoria"
          />

          <span>
            Wealthoria
          </span>

        </div>


        <nav
          className="member-sidebar-nav"
        >

          <div className="member-nav-section">
            OVERVIEW
          </div>


          <button
            className={
              activeSection === "dashboard"
                ? "member-nav-item active"
                : "member-nav-item"
            }
            onClick={() =>
              openSection("dashboard")
            }
          >

            <span className="member-nav-icon">
              ⌂
            </span>

            Dashboard

          </button>


          <div className="member-nav-section">
            LEARNING
          </div>


          <button
            className={
              activeSection === "courses"
                ? "member-nav-item active"
                : "member-nav-item"
            }
            onClick={() =>
              openSection("courses")
            }
          >

            <span className="member-nav-icon">
              ▶
            </span>

            Course Videos

          </button>


          <button
            className={
              activeSection === "newsletter"
                ? "member-nav-item active"
                : "member-nav-item"
            }
            onClick={() =>
              openSection("newsletter")
            }
          >

            <span className="member-nav-icon">
              ✉
            </span>

            Newsletter

          </button>


          <button
            className={
              activeSection === "weekly-roundup"
                ? "member-nav-item active"
                : "member-nav-item"
            }
            onClick={() =>
              openSection("weekly-roundup")
            }
          >

            <span className="member-nav-icon">
              📰
            </span>

            Weekly Roundup

          </button>


          <div className="member-nav-section">
            FINANCE
          </div>


          <button
            className={
              activeSection === "market-roundup"
                ? "member-nav-item active"
                : "member-nav-item"
            }
            onClick={() =>
              openSection("market-roundup")
            }
          >

            <span className="member-nav-icon">
              📈
            </span>

            Market Charts

          </button>


          <button
            className={
              activeSection === "purchase-history"
                ? "member-nav-item active"
                : "member-nav-item"
            }
            onClick={() =>
              openSection("purchase-history")
            }
          >

            <span className="member-nav-icon">
              🧾
            </span>

            Purchase History

          </button>


          <div className="member-nav-section">
            EVENTS
          </div>


          <button
            className={
              activeSection === "seminars"
                ? "member-nav-item active"
                : "member-nav-item"
            }
            onClick={() =>
              openSection("seminars")
            }
          >

            <span className="member-nav-icon">
              📋
            </span>

            Seminar Registrations

          </button>

        </nav>


        <div
          className="member-sidebar-footer"
        >

          <button
            className="member-nav-item"
            onClick={() =>
              openSection("settings")
            }
          >

            ⚙ Settings

          </button>


          <button
            className="member-nav-item"
            onClick={logout}
          >

            ↪ Logout

          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="member-main">


        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="member-header">

          <div>

            <span className="member-header-title">
              Wealthoria Members
            </span>

            <span className="member-header-subtitle">
              Learning is the first investment
            </span>

          </div>


          <div
            className="member-header-actions"
          >

            <button
              className="member-header-button"
              onClick={toggleTheme}
            >

              {theme === "dark"
                ? "☀ Light"
                : "☾ Dark"}

            </button>


            <button
              className="member-header-button"
              onClick={() =>
                openSection("settings")
              }
            >

              ⚙ Settings

            </button>


            <div
              className="member-profile"
            >

              <div
                className="member-avatar"
              >

                {name
                  .charAt(0)
                  .toUpperCase()}

              </div>


              <div
                className="member-profile-info"
              >

                <strong>
                  {name}
                </strong>

                <span>
                  {role}
                </span>

              </div>

            </div>


            <button
              className="member-header-button"
              onClick={logout}
            >

              ↪ Logout

            </button>

          </div>

        </header>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <div
          className="member-dashboard-content"
        >

          {renderContent()}

        </div>

      </main>

    </div>

  );

}


/* =========================================================
   MISSING COMPONENT MESSAGE
========================================================= */

function MissingComponent({
  name,
  file,
  back
}) {

  return (

    <section
      style={{
        padding: "40px",
        maxWidth: "700px",
        margin: "40px auto",
        textAlign: "center",
        fontFamily: "Arial"
      }}
    >

      <div
        style={{
          padding: "30px",
          borderRadius: "16px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)"
        }}
      >

        <div
          style={{
            fontSize: "42px",
            marginBottom: "15px"
          }}
        >
          ⚠️
        </div>

        <h2>
          {name} is not loaded
        </h2>

        <p
          style={{
            color: "#666",
            lineHeight: 1.6
          }}
        >
          Please make sure{" "}
          <strong>
            /members/{file}
          </strong>{" "}
          is loaded before{" "}
          <strong>
            dashboard.jsx
          </strong>.
        </p>

        <button
          onClick={back}
          style={{
            marginTop: "15px",
            padding: "12px 22px",
            border: "none",
            borderRadius: "8px",
            background: "#e8473f",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          ← Back to Dashboard
        </button>

      </div>

    </section>

  );

}


/* =========================================================
   EXPORT
========================================================= */

window.MemberDashboard =
  MemberDashboard;