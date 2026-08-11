/* global React, window */

const { useState, useEffect } = React;

function MemberDashboard() {
  const [member, setMember] = useState(null);

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
              navigate("/members/trading")
            }
          >
            <span className="member-nav-icon">
              ▶
            </span>

            Trading Videos
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

            Market Roundup
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
            className="member-nav-item"
            onClick={() =>
              navigate("/members/nsc")
            }
          >
            <span className="member-nav-icon">
              ◫
            </span>

            NSC Data
          </button>


          <button
            className="member-nav-item"
            onClick={() =>
              navigate("/members/bsc")
            }
          >
            <span className="member-nav-icon">
              ◫
            </span>

            BSC Data
          </button>


          <button
            className="member-nav-item"
            onClick={() =>
              navigate("/members/charts")
            }
          >
            <span className="member-nav-icon">
              ◒
            </span>

            Charts
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
                  Trading Videos
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
                      Trading Videos
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
                    navigate("/members/market-roundup")
                  }
                >

                  <span className="action-icon">
                    ↗
                  </span>

                  <div>

                    <strong>
                      Market Roundup
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

        </div>

      </main>

    </div>
  );
}

window.MemberDashboard = MemberDashboard;