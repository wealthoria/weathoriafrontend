/* global React, window */

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

  /* =======================================================
     MEMBER
     ======================================================= */

  const [member, setMember] = useState(null);
  const [showCourses, setShowCourses] = useState(false);
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showWeeklyRoundup, setShowWeeklyRoundup] = useState(false);

const [showSeminarRegistrations, setShowSeminarRegistrations] = useState(false);

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

  Course Videos
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
              showCharts
                ? "active"
                : ""
            }`}
            
           onClick={() => {
  setShowCharts(true);
  setShowCalculator(false);
  setSelectedCalculator(null);

  setShowCourses(false);
  setShowNewsletter(false);
  setShowWeeklyRoundup(false);
}}
          >

            <span className="member-nav-icon">
              ◒
            </span>

            Charts

          </button>

<button
  className={`member-nav-item ${
    showCalculator ? "active" : ""
  }`}
  onClick={() => {
    setShowCalculator(true);
    setSelectedCalculator(null);

    setShowCourses(false);
    setShowNewsletter(false);
    setShowWeeklyRoundup(false);
    setShowCharts(false);
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
            className="member-nav-item"
            onClick={() =>
              navigate(
                "/members/purchase-history"
              )
            }
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

         {showCourses ? (
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


            /* =================================================
               CALCULATOR
               ================================================= */
 <section className="member-calculator-page">

    {!selectedCalculator ? (

      <>
        <div className="member-calculator-header">

          <div>
            <span className="member-eyebrow">
              FINANCIAL TOOLS
            </span>

            <h2>
              Wealthoria Calculators
            </h2>

            <p>
              Explore financial planning, taxation,
              portfolio and investment analysis tools.
            </p>
          </div>

          <button
            className="member-panel-link"
            onClick={() => setShowCalculator(false)}
          >
            ← Back to Dashboard
          </button>

        </div>


        <div className="calculator-grid">

          <button
            className="calculator-card"
            onClick={() =>
              setSelectedCalculator(
                "/1_Safe_Withdrawal_Solver.html"
              )
            }
          >
            <span className="calculator-icon">↗</span>

            <div>
              <h3>Safe Withdrawal Solver</h3>
              <p>
                Explore sustainable retirement withdrawals.
              </p>
            </div>

            <span>→</span>
          </button>


          <button
            className="calculator-card"
            onClick={() =>
              setSelectedCalculator(
                "/2_LTCG_Harvest_Optimiser.html"
              )
            }
          >
            <span className="calculator-icon">₹</span>

            <div>
              <h3>LTCG Harvest Optimiser</h3>
              <p>
                Explore tax-aware capital gains harvesting.
              </p>
            </div>

            <span>→</span>
          </button>


          <button
            className="calculator-card"
            onClick={() =>
              setSelectedCalculator(
                "/3_Sequence_Risk_Lab.html"
              )
            }
          >
            <span className="calculator-icon">◒</span>

            <div>
              <h3>Sequence Risk Lab</h3>
              <p>
                Understand retirement sequence risk.
              </p>
            </div>

            <span>→</span>
          </button>


          <button
            className="calculator-card"
            onClick={() =>
              setSelectedCalculator(
                "/4_Plan_Diagnostics.html"
              )
            }
          >
            <span className="calculator-icon">⌁</span>

            <div>
              <h3>Plan Diagnostics</h3>
              <p>
                Analyse your financial plan.
              </p>
            </div>

            <span>→</span>
          </button>


          <button
            className="calculator-card"
            onClick={() =>
              setSelectedCalculator(
                "/5_Valuation_Aware_Harvesting.html"
              )
            }
          >
            <span className="calculator-icon">◈</span>

            <div>
              <h3>Valuation-Aware Harvesting</h3>
              <p>
                Explore valuation-aware tax harvesting.
              </p>
            </div>

            <span>→</span>
          </button>


          <button
            className="calculator-card"
            onClick={() =>
              setSelectedCalculator(
                "/6_Global_Allocation_Modeller.html"
              )
            }
          >
            <span className="calculator-icon">◎</span>

            <div>
              <h3>Global Allocation Modeller</h3>
              <p>
                Explore portfolio allocation.
              </p>
            </div>

            <span>→</span>
          </button>


          <button
            className="calculator-card"
            onClick={() =>
              setSelectedCalculator(
                "/7_Tax_Regime_Calculator.html"
              )
            }
          >
            <span className="calculator-icon">₹</span>

            <div>
              <h3>Tax Regime Calculator</h3>
              <p>
                Compare tax regime calculations.
              </p>
            </div>

            <span>→</span>
          </button>


          <button
            className="calculator-card"
            onClick={() =>
              setSelectedCalculator(
                "/8_DERS_Calculator.html"
              )
            }
          >
            <span className="calculator-icon">⌘</span>

            <div>
              <h3>DERS Calculator</h3>
              <p>
                Analyse retirement sustainability.
              </p>
            </div>

            <span>→</span>
          </button>


          <button
            className="calculator-card calculator-card-featured"
            onClick={() =>
              setSelectedCalculator(
                "/Fundamental_Analysis_Lab.html"
              )
            }
          >
            <span className="calculator-icon">◆</span>

            <div>
              <h3>Fundamental Analysis Lab</h3>
              <p>
                Advanced valuation and financial analysis tools.
              </p>
            </div>

            <span>→</span>
          </button>

        </div>
      </>

    ) : (

      <section className="calculator-viewer">

        <div className="calculator-viewer-header">

          <button
            className="member-panel-link"
            onClick={() => setSelectedCalculator(null)}
          >
            ← Back to Calculators
          </button>

        </div>

        <iframe
          src={selectedCalculator}
          title="Wealthoria Financial Calculator"
          className="member-calculator-frame"
        />

      </section>

    )}

  </section>


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
   EXPORT
   ========================================================= */

window.MemberDashboard =
  MemberDashboard;