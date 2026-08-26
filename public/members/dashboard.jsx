

const { useState, useEffect } = React;

/* =========================================================
   TRADINGVIEW CHART
   ========================================================= */

function TradingViewChart({ theme }) {

  const containerRef = React.useRef(null);

  React.useEffect(() => {

    const container = containerRef.current;

    if (!container) return;

    // Clear previous TradingView widget
    container.innerHTML = "";


    // Create TradingView script
    const script = document.createElement("script");

    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

    script.type = "text/javascript";

    script.async = true;


    script.innerHTML = JSON.stringify({

      autosize: true,

      // NIFTY 50
      symbol: "NSE:NIFTY",

      interval: "D",

      timezone: "Asia/Kolkata",

      // Follow Member Portal theme
      theme: theme === "dark" ? "dark" : "light",

      style: "1",

      locale: "en",

      // Keep NIFTY as the primary symbol
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

  // Resolve child pages during render so Babel's asynchronous
  // loading cannot leave us with an old undefined reference.
  const CourseVideos = window.CourseVideos;
  const Newsletter = window.Newsletter;
  const SeminarRegistrations = window.SeminarRegistrations;
  const WeeklyRoundup = window.WeeklyRoundup;
  const PurchaseHistory = window.PurchaseHistory;

  /* =======================================================
     MEMBER
     ======================================================= */

  const [member, setMember] = useState(null);
  const [showCourses, setShowCourses] = useState(false);
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showWeeklyRoundup, setShowWeeklyRoundup] = useState(false);

const [showSeminarRegistrations, setShowSeminarRegistrations] = useState(false);
const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);

  /* =======================================================
     DASHBOARD STATES
     ======================================================= */

  const [showCalculator, setShowCalculator] =
    useState(false);

    const [selectedCalculator, setSelectedCalculator] = useState(null);
  const [showCharts, setShowCharts] =
    useState(false);


  /* =======================================================
     THEME
     ======================================================= */

  const [theme, setTheme] = useState(
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
     LOAD MEMBER
     ======================================================= */
/* =======================================================
   CHECK MEMBER LOGIN
   ======================================================= */

const [authChecking, setAuthChecking] = useState(true);

useEffect(() => {

  if (!window.auth) {
    console.error("Firebase Auth is not initialized.");
    setAuthChecking(false);

    if (window.membersNavigate) {
      window.membersNavigate("/members/login");
    }

    return;
  }

  const unsubscribe = window.auth.onAuthStateChanged(async (user) => {

    console.log("Firebase current user:", user);

    // -----------------------------------------
    // NOT LOGGED IN
    // -----------------------------------------

    if (!user) {

      localStorage.removeItem("wealthoria-member");
      sessionStorage.removeItem("wealthoria-member");

      setMember(null);
      setAuthChecking(false);

      if (window.membersNavigate) {
        window.membersNavigate("/members/login");
      } else {
        window.location.href = "/members/login";
      }

      return;
    }

    // -----------------------------------------
    // LOGGED IN - GET SAVED MEMBER
    // -----------------------------------------

    const saved =
      localStorage.getItem("wealthoria-member") ||
      sessionStorage.getItem("wealthoria-member");

    if (!saved) {

      console.warn(
        "Firebase user exists but member session is missing."
      );

      await window.auth.signOut();

      setMember(null);
      setAuthChecking(false);

      if (window.membersNavigate) {
        window.membersNavigate("/members/login");
      } else {
        window.location.href = "/members/login";
      }

      return;
    }

    try {

      const parsedMember = JSON.parse(saved);

      // Make sure saved session belongs to
      // the currently authenticated Firebase user.

      if (
        parsedMember.uid &&
        parsedMember.uid !== user.uid
      ) {

        console.warn(
          "Member session does not match Firebase user."
        );

        localStorage.removeItem("wealthoria-member");
        sessionStorage.removeItem("wealthoria-member");

        await window.auth.signOut();

        setMember(null);
        setAuthChecking(false);

        if (window.membersNavigate) {
          window.membersNavigate("/members/login");
        } else {
          window.location.href = "/members/login";
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

      localStorage.removeItem("wealthoria-member");
      sessionStorage.removeItem("wealthoria-member");

      await window.auth.signOut();

      setMember(null);
      setAuthChecking(false);

      if (window.membersNavigate) {
        window.membersNavigate("/members/login");
      } else {
        window.location.href = "/members/login";
      }
    }

  });

  return () => unsubscribe();

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
    console.error("Logout error:", error);
  }

  // Remove saved member session
  localStorage.removeItem("wealthoria-member");
  sessionStorage.removeItem("wealthoria-member");

  // Go to login
  if (window.membersNavigate) {
    window.membersNavigate("/members/login");
  } else {
    window.location.href = "/members/login";
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
     RENDER
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

return (
  <div className="member-dashboard">



      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside className="member-sidebar">


        <div className="member-sidebar-brand">

          <img
            src="/assets/logo-mark.png"
            alt="Wealthoria"
          />

          <span>
            Wealthoria
          </span>

        </div>


        <nav className="member-sidebar-nav">


          {/* OVERVIEW */}

          <div className="member-nav-section">
            OVERVIEW
          </div>


          <button
            className="member-nav-item active"
            onClick={() =>
              navigate(
                "/members/dashboard"
              )
            }
          >

            <span className="member-nav-icon">
              ⌂
            </span>

            Dashboard

          </button>


          {/* LEARNING */}

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
<button
  className={`member-nav-item ${
    showCourses ? "active" : ""
  }`}
  onClick={() => {
    setShowCourses(true);
    setShowNewsletter(false);
    setShowWeeklyRoundup(false);
    setShowCharts(false);
    setShowCalculator(false);
  }}
>
  <span className="member-nav-icon">
    ▶
  </span>

  Courses
</button>
<button
  className={`member-nav-item ${
    showWeeklyRoundup ? "active" : ""
  }`}
  onClick={() => {
    setShowWeeklyRoundup(true);
    setShowCourses(false);
    setShowNewsletter(false);
    setShowCharts(false);
    setShowCalculator(false);
  }}
>
  <span className="member-nav-icon">
    ↗
  </span>

  Weekly Roundup
</button>
<button
  className={`member-nav-item ${
    showNewsletter ? "active" : ""
  }`}
  onClick={() => {
    setShowNewsletter(true);
    setShowCourses(false);
    setShowWeeklyRoundup(false);
    setShowCharts(false);
    setShowCalculator(false);
  }}
>
  <span className="member-nav-icon">
    ✉
  </span>

  Newsletter
</button>

          {/* DATA & RESEARCH */}

          <div className="member-nav-section">
            DATA & RESEARCH
          </div>


<button
  className={`member-nav-item ${
    showCalculator ? "active" : ""
  }`}
  onClick={async () => {

    setShowCalculator(true);
    setSelectedCalculator(
      "/Fundamental_Analysis_Lab.html"
    );

    setShowCourses(false);
    setShowNewsletter(false);
    setShowWeeklyRoundup(false);
    setShowCharts(false);
    setShowPurchaseHistory(false);

    try {
      if (
        !document.fullscreenElement &&
        document.documentElement.requestFullscreen
      ) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn(
        "Browser fullscreen is not available:",
        error
      );
    }

  }}
>
  <span className="member-nav-icon">
    =
  </span>

  Calculators
</button>


{/*
          <button
  className={`member-nav-item ${
    showSeminarRegistrations ? "active" : ""
  }`}
  onClick={() => {
    setShowSeminarRegistrations(true);
    setShowCourses(false);
    setShowNewsletter(false);
    setShowCharts(false);
    setShowCalculator(false);
  }}
>
  <span className="member-nav-icon">
    ▣
  </span>

  Seminar Registrations
</button>*/}


          {/* ACCOUNT */}

          <div className="member-nav-section">
            ACCOUNT
          </div>
<button
  className={`member-nav-item ${
    showPurchaseHistory ? "active" : ""
  }`}
  onClick={() => {

    setShowPurchaseHistory(true);

    setShowCourses(false);
    setShowNewsletter(false);
    setShowWeeklyRoundup(false);
    setShowCharts(false);
    setShowCalculator(false);

  }}
>
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
              Dashboard
            </h1>

          </div>


          <div className="member-header-actions">


            {/* =================================================
                LIGHT / DARK
                ================================================= */}

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
              CHART PAGE
              ================================================= */}

{showPurchaseHistory ? (

  window.PurchaseHistory ? (
    React.createElement(
      window.PurchaseHistory
    )
  ) : (
    <div
      style={{
        padding: "40px",
        textAlign: "center"
      }}
    >
      Loading Purchase History...
    </div>
  )

) :
         showCourses ? (
  <CourseVideos />
)  :  showNewsletter ? (

  <Newsletter />

) : showWeeklyRoundup ? (

  WeeklyRoundup ? (
    <WeeklyRoundup />
  ) : (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Weekly Roundup is loading</h2>
      <p>Please refresh the page once.</p>
    </div>
  )

) : showCharts ? (
  

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
                    setShowCharts(false)
                  }
                >

                  ← Back to Dashboard

                </button>


              </div>


              {/* =================================================
                  NIFTY TRADINGVIEW
                  ================================================= */}

              <div className="member-chart-container">

                <TradingViewChart
                  theme={theme}
                />

              </div>


            </section>


          ) : showCalculator ? (

            <div className="fundamental-fullscreen">

              <button
                type="button"
                className="fundamental-fullscreen-close"
                aria-label="Close Fundamental Analysis Lab"
                title="Close"
                onClick={async () => {

                  try {
                    if (
                      document.fullscreenElement &&
                      document.exitFullscreen
                    ) {
                      await document.exitFullscreen();
                    }
                  } catch (error) {
                    console.warn(
                      "Could not exit fullscreen:",
                      error
                    );
                  }

                  setSelectedCalculator(null);
                  setShowCalculator(false);

                }}
              >
                ×
              </button>

              <iframe
                src="/Fundamental_Analysis_Lab.html"
                title="Wealthoria Fundamental Analysis Lab"
                className="fundamental-fullscreen-frame"
                allow="fullscreen"
              />

            </div>

          ) : (


            /* =================================================
               DEFAULT DASHBOARD
               ================================================= */

            <>


              {/* WELCOME */}

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


              {/* STATS */}

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
                      Courses
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


                    <button
                      onClick={() =>
                        navigate(
                          "/members/trading"
                        )
                      }
                    >

                      <span className="action-icon">
                        ▶
                      </span>

                      <div>

                        <strong>
                          Course 
                        </strong>

                        <small>
                          Learn trading concepts
                        </small>

                      </div>

                      <span>
                        →
                      </span>

                    </button>


                    <button
                      onClick={() =>
                        navigate(
                          "/members/weekly-roundup"
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


                    <button
                      onClick={() =>
                        navigate(
                          "/members/charts"
                        )
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
   FUNDAMENTAL ANALYSIS LAB — FULL SCREEN
========================================================= */

(function injectFundamentalFullscreenStyles() {

  if (
    document.getElementById(
      "fundamental-fullscreen-styles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "fundamental-fullscreen-styles";

  style.textContent = `
    .fundamental-fullscreen {
      position: fixed;
      inset: 0;
      z-index: 999999;
      width: 100vw;
      height: 100vh;
      display: flex;
      background: #ffffff;
      overflow: hidden;
    }

    .fundamental-fullscreen-frame {
      display: block;
      width: 100%;
      height: 100%;
      flex: 1;
      border: 0;
      background: #ffffff;
    }

    .fundamental-fullscreen-close {
      position: absolute;
      top: 14px;
      right: 16px;
      z-index: 1000000;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0,0,0,.12);
      border-radius: 999px;
      background: rgba(255,255,255,.96);
      color: #18181b;
      font-size: 28px;
      line-height: 1;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,.10);
    }

    .fundamental-fullscreen-close:hover {
      background: #e8473f;
      border-color: #e8473f;
      color: #ffffff;
    }

    @media (max-width: 600px) {
      .fundamental-fullscreen-close {
        top: 10px;
        right: 10px;
        width: 38px;
        height: 38px;
        font-size: 24px;
      }
    }
  `;

  document.head.appendChild(style);

})();

/* =========================================================
   EXPORT
   ========================================================= */

window.MemberDashboard =
  MemberDashboard;