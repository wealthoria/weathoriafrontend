/* global React, window */

const { useState, useEffect } = React;

const CourseVideos = window.CourseVideos;
const Newsletter = window.Newsletter;
const SeminarRegistrations = window.SeminarRegistrations;
const WeeklyRoundup = window.WeeklyRoundup;
const PurchaseHistory = window.PurchaseHistory;


/* =========================================================
   TRADINGVIEW CHART
========================================================= */

function TradingViewChart({ theme }) {

  const containerRef = React.useRef(null);

  React.useEffect(() => {

    const container = containerRef.current;

    if (!container) return;

    container.innerHTML = "";

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

      theme:
        theme === "dark"
          ? "dark"
          : "light",

      style: "1",

      locale: "en",

      allow_symbol_change: false,

      hide_side_toolbar: false,

      hide_top_toolbar: false,

      hide_legend: false,

      hide_volume: false,

      withdateranges: true,

      save_image: true,

      calendar: false,

      studies: [],

      support_host:
        "https://www.tradingview.com"

    });

    container.appendChild(script);

    return () => {

      container.innerHTML = "";

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

  /* =======================================================
     MEMBER
  ======================================================= */

  const [member, setMember] =
    useState(null);


  /* =======================================================
     ACTIVE SECTION
     
     IMPORTANT:
     Saved in localStorage so refresh will NOT reset page.
  ======================================================= */

  const [activeSection, setActiveSection] =
    useState(() => {

      return (
        localStorage.getItem(
          "wealthoria-active-section"
        ) || "dashboard"
      );

    });


  /* =======================================================
     OPEN SECTION
  ======================================================= */

  const openSection = (section) => {

    setActiveSection(section);

    localStorage.setItem(
      "wealthoria-active-section",
      section
    );

    window.scrollTo(0, 0);

  };


  /* =======================================================
     THEME
  ======================================================= */

  const [theme, setTheme] =
    useState(
      () =>
        localStorage.getItem("wl-theme") ||
        "light"
    );


  /* =======================================================
     APPLY THEME
  ======================================================= */

  useEffect(() => {

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem(
      "wl-theme",
      theme
    );

  }, [theme]);


  /* =======================================================
     TOGGLE THEME
  ======================================================= */

  const toggleTheme = () => {

    setTheme((current) =>
      current === "dark"
        ? "light"
        : "dark"
    );

  };


  /* =======================================================
     CHECK MEMBER LOGIN
  ======================================================= */

  const [authChecking, setAuthChecking] =
    useState(true);


  useEffect(() => {

    if (!window.auth) {

      console.error(
        "Firebase Auth is not initialized."
      );

      setAuthChecking(false);

      if (window.membersNavigate) {

        window.membersNavigate(
          "/members/login"
        );

      }

      return;

    }


    const unsubscribe =
      window.auth.onAuthStateChanged(
        async (user) => {

          console.log(
            "Firebase current user:",
            user
          );


          /* -----------------------------------------
             NOT LOGGED IN
          ----------------------------------------- */

          if (!user) {

            localStorage.removeItem(
              "wealthoria-member"
            );

            sessionStorage.removeItem(
              "wealthoria-member"
            );

            setMember(null);

            setAuthChecking(false);

            if (
              window.membersNavigate
            ) {

              window.membersNavigate(
                "/members/login"
              );

            } else {

              window.location.href =
                "/members/login";

            }

            return;

          }


          /* -----------------------------------------
             LOGGED IN
          ----------------------------------------- */

          const saved =
            localStorage.getItem(
              "wealthoria-member"
            ) ||
            sessionStorage.getItem(
              "wealthoria-member"
            );


          if (!saved) {

            console.warn(
              "Firebase user exists but member session is missing."
            );

            await window.auth.signOut();

            setMember(null);

            setAuthChecking(false);

            if (
              window.membersNavigate
            ) {

              window.membersNavigate(
                "/members/login"
              );

            } else {

              window.location.href =
                "/members/login";

            }

            return;

          }


          try {

            const parsedMember =
              JSON.parse(saved);


            /* -----------------------------------------
               CHECK UID
            ----------------------------------------- */

            if (
              parsedMember.uid &&
              parsedMember.uid !== user.uid
            ) {

              console.warn(
                "Member session does not match Firebase user."
              );

              localStorage.removeItem(
                "wealthoria-member"
              );

              sessionStorage.removeItem(
                "wealthoria-member"
              );

              await window.auth.signOut();

              setMember(null);

              setAuthChecking(false);

              if (
                window.membersNavigate
              ) {

                window.membersNavigate(
                  "/members/login"
                );

              } else {

                window.location.href =
                  "/members/login";

              }

              return;

            }


            setMember(parsedMember);

            setAuthChecking(false);


          } catch (error) {

            console.error(
              "Invalid member session:",
              error
            );

            localStorage.removeItem(
              "wealthoria-member"
            );

            sessionStorage.removeItem(
              "wealthoria-member"
            );

            await window.auth.signOut();

            setMember(null);

            setAuthChecking(false);

            if (
              window.membersNavigate
            ) {

              window.membersNavigate(
                "/members/login"
              );

            } else {

              window.location.href =
                "/members/login";

            }

          }

        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate = (path) => {

    if (window.membersNavigate) {

      window.membersNavigate(path);

    }

  };


  /* =======================================================
     LOGOUT
  ======================================================= */

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

    localStorage.removeItem(
      "wealthoria-active-section"
    );


    if (
      window.membersNavigate
    ) {

      window.membersNavigate(
        "/members/login"
      );

    } else {

      window.location.href =
        "/members/login";

    }

  };


  /* =======================================================
     MEMBER DETAILS
  ======================================================= */

  const name =
    member?.name ||
    "Member";

  const role =
    member?.role ||
    "Member";


  /* =======================================================
     LOADING
  ======================================================= */

  if (authChecking) {

    return (

      <div className="member-loading">

        Checking login...

      </div>

    );

  }


  if (!member) {

    return null;

  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="member-dashboard">


      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="member-sidebar">


        {/* BRAND */}

        <div className="member-sidebar-brand">

          <img
            src="/assets/logo-mark.png"
            alt="Wealthoria"
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              cursor: "pointer"
            }}
          />

          <span>
            Wealthoria
          </span>

        </div>


        <nav className="member-sidebar-nav">


          {/* =================================================
              OVERVIEW
          ================================================= */}

          <div className="member-nav-section">

            OVERVIEW

          </div>


          <button
            className={`member-nav-item ${
              activeSection === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openSection("dashboard")
            }
          >

            <span className="member-nav-icon">
              ⌂
            </span>

            Dashboard

          </button>


          {/* =================================================
              LEARNING
          ================================================= */}

          <div className="member-nav-section">

            LEARNING

          </div>


          <button
            className="member-nav-item"
            onClick={() =>
              navigate(
                "/members/articles"
              )
            }
          >

            <span className="member-nav-icon">
              ▤
            </span>

            Articles & Reports

          </button>


          {/* COURSE VIDEOS */}

          <button
            className={`member-nav-item ${
              activeSection === "courses"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openSection("courses")
            }
          >

            <span className="member-nav-icon">
              ▶
            </span>

            Course Videos

          </button>


          {/* WEEKLY ROUNDUP */}

          <button
            className={`member-nav-item ${
              activeSection === "weekly-roundup"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openSection(
                "weekly-roundup"
              )
            }
          >

            <span className="member-nav-icon">
              ↗
            </span>

            Weekly Roundup

          </button>


          {/* NEWSLETTER */}

          <button
            className={`member-nav-item ${
              activeSection === "newsletter"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openSection("newsletter")
            }
          >

            <span className="member-nav-icon">
              ✉
            </span>

            Newsletter

          </button>


          {/* =================================================
              DATA & RESEARCH
          ================================================= */}

          <div className="member-nav-section">

            DATA & RESEARCH

          </div>


          {/* CHARTS */}

          <button
            className={`member-nav-item ${
              activeSection === "charts"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openSection("charts")
            }
          >

            <span className="member-nav-icon">
              ◒
            </span>

            Charts

          </button>


          {/* CALCULATORS */}

          <button
            className={`member-nav-item ${
              activeSection === "calculator"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openSection("calculator")
            }
          >

            <span className="member-nav-icon">
              =
            </span>

            Calculators

          </button>


          {/* =================================================
              ACCOUNT
          ================================================= */}

          <div className="member-nav-section">

            ACCOUNT

          </div>


          <button
            className={`member-nav-item ${
    activeSection === "purchase-history"
      ? "active"
      : ""
  }`}
  onClick={() =>
    openSection("purchase-history")
  }>
            <span className="member-nav-icon">
              ▣
            </span>

            Purchase History

          </button>


          <button
            className="member-nav-item"
            onClick={() =>
              navigate(
                "/members/notifications"
              )
            }
          >

            <span className="member-nav-icon">
              ♢
            </span>

            Notifications

            <span className="member-notification-count">
              3
            </span>

          </button>


        </nav>


        {/* SIDEBAR USER */}

        <div className="member-sidebar-bottom">

          <div className="member-sidebar-user">

            <div className="member-avatar">

              {name
                .charAt(0)
                .toUpperCase()}

            </div>


            <div className="member-sidebar-user-info">

              <strong>
                {name}
              </strong>

              <span>
                {role}
              </span>

            </div>

          </div>

        </div>


      </aside>


      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="member-dashboard-main">


        {/* =================================================
            HEADER
        ================================================= */}

        <header className="member-dashboard-header">


          <div>

            <span className="member-page-label">
              MEMBER PORTAL
            </span>

            <h1>

              {activeSection === "courses"
                ? "Course Videos"
                : activeSection ===
                  "newsletter"
                ? "Newsletters"
                : activeSection ===
                  "weekly-roundup"
                ? "Weekly Roundup"
                : activeSection ===
                  "charts"
                ? "Market Charts"
                : activeSection ===
                  "calculator"
                ? "Calculators"
                : activeSection ===
                  "purchase-history"
                ? "Purchase History"
                : "Dashboard"}

            </h1>

          </div>


          <div className="member-header-actions">


            {/* DARK MODE */}

            <button
              className="member-header-button"
              onClick={toggleTheme}
              type="button"
            >

              {theme === "dark"
                ? "☀ Light"
                : "☾ Dark"}

            </button>


            {/* SETTINGS */}

            <button
              className="member-header-button"
              onClick={() =>
                navigate(
                  "/members/settings"
                )
              }
            >

              ⚙ Settings

            </button>


            {/* PROFILE */}

            <div className="member-profile">

              <div className="member-avatar">

                {name
                  .charAt(0)
                  .toUpperCase()}

              </div>


              <div className="member-profile-info">

                <strong>
                  {name}
                </strong>

                <span>
                  {role}
                </span>

              </div>

            </div>


            {/* LOGOUT */}

            <button
              className="member-header-button"
              onClick={logout}
            >

              ↪ Logout

            </button>


          </div>

        </header>


        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="member-dashboard-content">


          {/* =================================================
              COURSE VIDEOS
          ================================================= */}

          {activeSection === "courses" ? (

            <CourseVideos />

          )


          /* =================================================
             NEWSLETTER
          ================================================= */

          : activeSection === "newsletter" ? (

            <Newsletter />

          )


          /* =================================================
             WEEKLY ROUNDUP
          ================================================= */

          : activeSection === "weekly-roundup" ? (

            <WeeklyRoundup />

          )


          /* =================================================
             CHARTS
          ================================================= */

          : activeSection === "charts" ? (

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


              <div className="member-chart-container">

                <TradingViewChart
                  theme={theme}
                />

              </div>


            </section>

          )


          /* =================================================
             CALCULATOR
          ================================================= */

          : activeSection === "calculator" ? (

            <section className="member-calculator-page">


              <div className="member-calculator-header">

              </div>


              <div className="member-calculator-container">

                <iframe
                  src="/ders-calculator.html"
                  title="Necessary Calculators"
                  className="member-calculator-frame"
                />

              </div>


            </section>

          )


          /* =================================================
             PURCHASE HISTORY
          ================================================= */

          : activeSection === "purchase-history" ? (

            <PurchaseHistory />

          )


          /* =================================================
             DEFAULT DASHBOARD
          ================================================= */

          : (

            <>


              {/* =================================================
                  WELCOME
              ================================================= */}

              <section className="member-welcome">

                <span className="member-eyebrow">
                  WELCOME BACK
                </span>

                <h2>
                  Good morning, {name} 👋
                </h2>

                <p>
                  Welcome to your
                  Wealthoria member portal.
                </p>

              </section>


              {/* =================================================
                  STATS
              ================================================= */}

              <section className="member-stats">


                <div className="member-stat-card">

                  <div className="member-stat-icon">
                    ◈
                  </div>

                  <div>

                    <span>
                      Total Content
                    </span>

                    <strong>
                      24
                    </strong>

                  </div>

                </div>


                <div className="member-stat-card">

                  <div className="member-stat-icon">
                    ▶
                  </div>

                  <div>

                    <span>
                      Course Videos
                    </span>

                    <strong>
                      18
                    </strong>

                  </div>

                </div>


                <div className="member-stat-card">

                  <div className="member-stat-icon">
                    ◒
                  </div>

                  <div>

                    <span>
                      Market Reports
                    </span>

                    <strong>
                      12
                    </strong>

                  </div>

                </div>


                <div className="member-stat-card">

                  <div className="member-stat-icon">
                    ♢
                  </div>

                  <div>

                    <span>
                      Notifications
                    </span>

                    <strong>
                      3
                    </strong>

                  </div>

                </div>


              </section>


              {/* =================================================
                  TWO PANELS
              ================================================= */}

              <section className="member-dashboard-grid">


                {/* RECENT ARTICLES */}

                <div className="member-panel">

                  <div className="member-panel-header">

                    <div>

                      <span className="member-panel-label">
                        LIBRARY
                      </span>

                      <h3>
                        Recent Articles & Reports
                      </h3>

                    </div>


                    <button
                      className="member-panel-link"
                      onClick={() =>
                        navigate(
                          "/members/articles"
                        )
                      }
                    >

                      View all →

                    </button>

                  </div>


                  <div className="member-content-list">


                    <div className="member-content-row">

                      <div className="member-content-icon">
                        PDF
                      </div>

                      <div className="member-content-info">

                        <strong>
                          Wealth Building Basics
                        </strong>

                        <span>
                          Financial Education
                        </span>

                      </div>

                    </div>


                    <div className="member-content-row">

                      <div className="member-content-icon">
                        RPT
                      </div>

                      <div className="member-content-info">

                        <strong>
                          Monthly Market Report
                        </strong>

                        <span>
                          Market Research
                        </span>

                      </div>

                    </div>


                    <div className="member-content-row">

                      <div className="member-content-icon">
                        PDF
                      </div>

                      <div className="member-content-info">

                        <strong>
                          Investment Planning Guide
                        </strong>

                        <span>
                          Personal Finance
                        </span>

                      </div>

                    </div>


                  </div>

                </div>


                {/* QUICK ACCESS */}

                <div className="member-panel">


                  <div className="member-panel-header">

                    <div>

                      <span className="member-panel-label">
                        QUICK ACCESS
                      </span>

                      <h3>
                        Explore
                      </h3>

                    </div>

                  </div>


                  <div className="member-actions">


                    {/* COURSE */}

                    <button
                      onClick={() =>
                        openSection("courses")
                      }
                    >

                      <span className="action-icon">
                        ▶
                      </span>

                      <div>

                        <strong>
                          Course Videos
                        </strong>

                        <small>
                          Learn trading concepts
                        </small>

                      </div>

                      <span>
                        →
                      </span>

                    </button>


                    {/* WEEKLY ROUNDUP */}

                    <button
                      onClick={() =>
                        openSection(
                          "weekly-roundup"
                        )
                      }
                    >

                      <span className="action-icon">
                        ↗
                      </span>

                      <div>

                        <strong>
                          Weekly Roundup
                        </strong>

                        <small>
                          Latest market updates
                        </small>

                      </div>

                      <span>
                        →
                      </span>

                    </button>


                    {/* CHARTS */}

                    <button
                      onClick={() =>
                        openSection("charts")
                      }
                    >

                      <span className="action-icon">
                        ◒
                      </span>

                      <div>

                        <strong>
                          Market Charts
                        </strong>

                        <small>
                          View market data
                        </small>

                      </div>

                      <span>
                        →
                      </span>

                    </button>


                  </div>


                </div>


              </section>


            </>

          )}

        </div>

      </main>

    </div>

  );

}


/* =========================================================
   EXPORT
========================================================= */

window.MemberDashboard =
  MemberDashboard;