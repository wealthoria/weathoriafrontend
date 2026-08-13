/* global React, window */

const { useState, useEffect } = React;

/* =========================================================
   TRADINGVIEW CHART
========================================================= */

function TradingViewChart() {

  const containerRef = React.useRef(null);

  React.useEffect(() => {

    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");

    widgetContainer.className =
      "tradingview-widget-container__widget";

    widgetContainer.style.width = "100%";
    widgetContainer.style.height = "calc(100% - 32px)";

    containerRef.current.appendChild(widgetContainer);


    const copyright = document.createElement("div");

    copyright.className =
      "tradingview-widget-copyright";

    copyright.innerHTML = `
      <a
        href="https://www.tradingview.com/symbols/NSE-NIFTY/"
        rel="noopener nofollow"
        target="_blank"
      >
        <span class="blue-text">
          NIFTY chart
        </span>
      </a>

      <span class="trademark">
        by TradingView
      </span>
    `;

    containerRef.current.appendChild(copyright);


    const script = document.createElement("script");

    script.type = "text/javascript";

    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

    script.async = true;


    script.innerHTML = JSON.stringify({

      allow_symbol_change: true,

      calendar: false,

      details: false,

      hide_side_toolbar: true,

      hide_top_toolbar: false,

      hide_legend: false,

      hide_volume: false,

      hotlist: false,

      interval: "D",

      locale: "en",

      save_image: true,

      style: "1",

      symbol: "NSE:NIFTY",

      theme: "light",

      timezone: "Etc/UTC",

      backgroundColor: "#ffffff",

      gridColor: "rgba(46, 46, 46, 0.2)",

      watchlist: [],

      withdateranges: false,

      compareSymbols: [],

      studies: [],

      autosize: true

    });


    containerRef.current.appendChild(script);


    return () => {

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

    };

  }, []);


  return (

    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        width: "100%",
        height: "100%"
      }}
    />

  );
}


function MemberDashboard() {
  const [member, setMember] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    const saved =
      localStorage.getItem("wealthoria-member") ||
      sessionStorage.getItem("wealthoria-member");

    if (saved) {
      try {
        setMember(JSON.parse(saved));
      } catch (error) {
        console.error("Session error:", error);
      }
    }
  }, []);

  const navigate = (path) => {
    if (window.membersNavigate) {
      window.membersNavigate(path);
    }
  };

  const logout = async () => {
    try {
      if (window.auth) {
        await window.auth.signOut();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("wealthoria-member");
    sessionStorage.removeItem("wealthoria-member");

    navigate("/members/login");
  };

  const name = member?.name || "Member";
  const role = member?.role || "Member";

  return (
    <div className="member-dashboard">

      {/* SIDEBAR */}

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

          <div className="member-nav-section">
            OVERVIEW
          </div>

          <button
            className="member-nav-item active"
            onClick={() =>
              navigate("/members/dashboard")
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
            className="member-nav-item"
            onClick={() =>
              navigate("/members/articles")
            }
          >
            <span className="member-nav-icon">
              ▤
            </span>

            Articles & Reports
          </button>


          <button
            className="member-nav-item"
            onClick={() =>
              navigate("/members/courses")
            }
          >
            <span className="member-nav-icon">
              ▶
            </span>

            Course Videos
          </button>


          <button
            className="member-nav-item"
            onClick={() =>
              navigate("/members/market-roundup")
            }
          >
            <span className="member-nav-icon">
              ↗
            </span>

          Weekly Roundup
          </button>


          <button
            className="member-nav-item"
            onClick={() =>
              navigate("/members/newsletter")
            }
          >
            <span className="member-nav-icon">
              ✉
            </span>

            Newsletter
          </button>


          <div className="member-nav-section">
            DATA & RESEARCH
          </div>


<button
  className={`member-nav-item ${
    showCharts ? "active" : ""
  }`}
  onClick={() => {
    setShowCharts(true);
    setShowCalculator(false);
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
  onClick={() => setShowCalculator(true)}
>
  <span className="member-nav-icon">
    =
  </span>

  Calculators
</button>

          <div className="member-nav-section">
            ACCOUNT
          </div>


          <button
            className="member-nav-item"
            onClick={() =>
              navigate("/members/purchase-history")
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
              navigate("/members/notifications")
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
              {name.charAt(0).toUpperCase()}
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


      {/* MAIN */}

      <main className="member-dashboard-main">

        {/* HEADER */}

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

            <button
              className="member-header-button"
              onClick={() =>
                navigate("/members/settings")
              }
            >
              ⚙ Settings
            </button>


            <div className="member-profile">

              <div className="member-avatar">
                {name.charAt(0).toUpperCase()}
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


            <button
              className="member-header-button"
              onClick={logout}
            >
              ↪ Logout
            </button>

          </div>

        </header>


        {/* CONTENT */}

        <div className="member-dashboard-content">


         {showCharts ? (

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
          Track market movements and explore financial charts.
        </p>

      </div>


      <button
        className="member-panel-link"
        onClick={() => setShowCharts(false)}
      >
        ← Back to Dashboard
      </button>

    </div>


    <div className="member-chart-container">

      <TradingViewChart />

    </div>

  </section>

) : showCalculator ? (
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


) : (

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
              Welcome to your Wealthoria member portal.
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


          {/* TWO PANELS */}

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
                    navigate("/members/articles")
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
                    navigate("/members/trading")
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
                    navigate("/members/weekly-roundup")
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
                    navigate("/members/charts")
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


window.MemberDashboard = MemberDashboard;