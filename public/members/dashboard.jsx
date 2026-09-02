/* global React, window */

const {
  useState,
  useEffect,
  useRef
} = React;


/* =========================================================
   CONFIG
========================================================= */

const DASHBOARD_API =
  "https://webinar-registration-backend.onrender.com";


/* =========================================================
   HELPERS
========================================================= */

function getDashboardFileUrl(fileUrl) {

  if (!fileUrl) {
    return "";
  }

  if (
    fileUrl.startsWith("http://") ||
    fileUrl.startsWith("https://")
  ) {
    return fileUrl;
  }

  if (fileUrl.startsWith("/")) {
    return DASHBOARD_API + fileUrl;
  }

  return DASHBOARD_API + "/" + fileUrl;
}


function getDashboardDate(value) {

  if (!value) {
    return "";
  }

  try {

    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  } catch (error) {

    return "";

  }
}


function getDashboardTime(value) {

  if (!value) {
    return 0;
  }

  try {

    if (
      typeof value.toMillis === "function"
    ) {
      return value.toMillis();
    }

    if (
      typeof value.toDate === "function"
    ) {
      return value.toDate().getTime();
    }

    const time =
      new Date(value).getTime();

    return Number.isNaN(time)
      ? 0
      : time;

  } catch (error) {

    return 0;

  }
}


/* =========================================================
   TRADING VIEW
========================================================= */

function DashboardTradingView({ theme }) {

  const containerRef =
    useRef(null);


  useEffect(() => {

    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = "";


    const script =
      document.createElement("script");


    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

    script.type =
      "text/javascript";

    script.async = true;


    script.innerHTML =
      JSON.stringify({

        autosize: true,

        symbol:
          "NSE:NIFTY",

        interval:
          "D",

        timezone:
          "Asia/Kolkata",

        theme:
          theme === "dark"
            ? "dark"
            : "light",

        style:
          "1",

        locale:
          "en",

        allow_symbol_change:
          false,

        hide_side_toolbar:
          false,

        hide_top_toolbar:
          false,

        hide_legend:
          false,

        hide_volume:
          false,

        withdateranges:
          true,

        save_image:
          true,

        calendar:
          false,

        studies:
          [],

        support_host:
          "https://www.tradingview.com"

      });


    container.appendChild(
      script
    );


    return () => {
      container.innerHTML = "";
    };

  }, [theme]);


  return (
    <div
      ref={containerRef}
      className="wd-tradingview"
    />
  );

}


/* =========================================================
   DASHBOARD CONTENT CARD
   LATEST NEWSLETTER
========================================================= */

function DashboardNewsletter({ onOpen }) {

  const [newsletter, setNewsletter] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    if (!window.db) {

      setLoading(false);

      return;

    }


    const unsubscribe =
      window.db
        .collection("content")
        .where(
          "category",
          "==",
          "Newsletter"
        )
        .where(
          "status",
          "==",
          "published"
        )
        .onSnapshot(

          (snapshot) => {

            const rows =
              snapshot.docs.map(
                (doc) => {

                  const data =
                    doc.data() || {};

                  return {

                    id: doc.id,

                    title:
                      data.title ||
                      data.pdfName ||
                      "Newsletter",

                    description:
                      data.description ||
                      "",

                    tags:
                      Array.isArray(data.tags)
                        ? data.tags
                        : [],

                    thumbnailUrl:
                      data.thumbnailUrl ||
                      "",

                    pdfUrl:
                      data.pdfUrl ||
                      "",

                    publishedAt:
                      data.publishedAt ||
                      data.createdAt ||
                      ""

                  };

                }
              );


            rows.sort(
              (a, b) =>
                getDashboardTime(
                  b.publishedAt
                ) -
                getDashboardTime(
                  a.publishedAt
                )
            );


            setNewsletter(
              rows[0] || null
            );

            setLoading(false);

          },

          (error) => {

            console.error(
              "Dashboard Newsletter error:",
              error
            );

            setLoading(false);

          }

        );


    return () =>
      unsubscribe();

  }, []);


  const openNewsletter =
    () => {

      if (
        window.membersNavigate
      ) {

       onOpen();

      }

    };


  if (loading) {

    return (
      <section className="wd-panel">

        <div className="wd-panel-loading">
          Loading Newsletter...
        </div>

      </section>
    );

  }


  return (

    <section className="wd-panel">

      <div className="wd-panel-head">

        <div>

          <span className="wd-panel-label">
            NEWSLETTER
          </span>

          <h3>
            Latest Newsletter
          </h3>

        </div>


        <button
          type="button"
          className="wd-view-button"
          onClick={openNewsletter}
        >
          View all →
        </button>

      </div>


      {!newsletter ? (

        <div className="wd-empty">
          No published newsletter available.
        </div>

      ) : (

        <button
          type="button"
          className="wd-feature"
          onClick={openNewsletter}
        >

          <div className="wd-feature-image">

            {newsletter.thumbnailUrl ? (

              <img
                src={getDashboardFileUrl(
                  newsletter.thumbnailUrl
                )}
                alt={newsletter.title}
              />

            ) : (

              <span>PDF</span>

            )}

          </div>


          <div className="wd-feature-text">

            <span className="wd-feature-type">
              NEWSLETTER
            </span>

            <h4>
              {newsletter.title}
            </h4>

            <p>
              {newsletter.description}
            </p>

            <span className="wd-feature-date">
              {getDashboardDate(
                newsletter.publishedAt
              )}
            </span>

            <span className="wd-feature-link">
              Read Newsletter →
            </span>

          </div>

        </button>

      )}

    </section>

  );
}


window.DashboardNewsletter =
  DashboardNewsletter;


/* =========================================================
   DASHBOARD CONTENT CARD
   LATEST WEEKLY ROUNDUP
========================================================= */

function DashboardWeeklyRoundup({onOpen}) {

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    if (!window.db) {

      setLoading(false);

      return;

    }


    const unsubscribe =
      window.db
        .collection("content")
        .where(
          "category",
          "==",
          "Weekly Roundup"
        )
        .where(
          "status",
          "==",
          "published"
        )
        .onSnapshot(

          (snapshot) => {

            const rows =
              snapshot.docs.map(
                (doc) => {

                  const data =
                    doc.data() || {};

                  return {

                    id: doc.id,

                    title:
                      data.title ||
                      data.pdfName ||
                      "Weekly Roundup",

                    description:
                      data.description ||
                      "",

                    thumbnailUrl:
                      data.thumbnailUrl ||
                      "",

                    pdfUrl:
                      data.pdfUrl ||
                      "",

                    publishedAt:
                      data.publishedAt ||
                      data.createdAt ||
                      ""

                  };

                }
              );


            rows.sort(
              (a, b) =>
                getDashboardTime(
                  b.publishedAt
                ) -
                getDashboardTime(
                  a.publishedAt
                )
            );


            setReport(
              rows[0] || null
            );

            setLoading(false);

          },

          (error) => {

            console.error(
              "Dashboard Weekly Roundup error:",
              error
            );

            setLoading(false);

          }

        );


    return () =>
      unsubscribe();

  }, []);


  const openWeekly =
    () => {

      if (
        window.membersNavigate
      ) {

       onOpen();

      }

    };


  if (loading) {

    return (
      <section className="wd-panel">

        <div className="wd-panel-loading">
          Loading Weekly Roundup...
        </div>

      </section>
    );

  }


  return (

    <section className="wd-panel">

      <div className="wd-panel-head">

        <div>

          <span className="wd-panel-label">
            WEEKLY ROUNDUP
          </span>

          <h3>
            Latest Market Report
          </h3>

        </div>


        <button
          type="button"
          className="wd-view-button"
          onClick={openWeekly}
        >
          View all →
        </button>

      </div>


      {!report ? (

        <div className="wd-empty">
          No published market report available.
        </div>

      ) : (

        <button
          type="button"
          className="wd-feature"
          onClick={openWeekly}
        >

          <div className="wd-feature-image">

            {report.thumbnailUrl ? (

              <img
                src={getDashboardFileUrl(
                  report.thumbnailUrl
                )}
                alt={report.title}
              />

            ) : (

              <span>PDF</span>

            )}

          </div>


          <div className="wd-feature-text">

            <span className="wd-feature-type">
              WEEKLY ROUNDUP
            </span>

            <h4>
              {report.title}
            </h4>

            <p>
              {report.description}
            </p>

            <span className="wd-feature-date">
              {getDashboardDate(
                report.publishedAt
              )}
            </span>

            <span className="wd-feature-link">
              Read Report →
            </span>

          </div>

        </button>

      )}

    </section>

  );
}


window.DashboardWeeklyRoundup =
  DashboardWeeklyRoundup;


/* =========================================================
   MEMBER DASHBOARD
========================================================= */

function MemberDashboard() {

  const CourseVideos =
    window.CourseVideos;

  const Newsletter =
    window.Newsletter;

  const WeeklyRoundup =
    window.WeeklyRoundup;

  const PurchaseHistory =
    window.PurchaseHistory;

  const MemberSettings =
    window.MemberSettings;

  const DashboardNewsletter =
    window.DashboardNewsletter;

  const DashboardWeeklyRoundup =
    window.DashboardWeeklyRoundup;


  /* =======================================================
     MEMBER
  ======================================================= */

  const [member, setMember] =
    useState(null);

  const [authChecking, setAuthChecking] =
    useState(true);


  /* =======================================================
     ACTIVE PAGE
  ======================================================= */

const [activePage, setActivePage] =
  useState(
    () =>
      sessionStorage.getItem(
        "wealthoria-active-page"
      ) || "dashboard"
  );
  /* =======================================================
     SIDEBAR
  ======================================================= */

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [mobileDrawerOpen, setMobileDrawerOpen] =
    useState(false);


  /* =======================================================
     STATS
  ======================================================= */

  const [stats, setStats] =
    useState({

      totalContent: 0,

      courses: 0,

      marketReports: 0,

      notifications: 0,

      purchases: 0

    });


  const [statsLoading, setStatsLoading] =
    useState(true);


  /* =======================================================
     THEME
  ======================================================= */

  const [theme, setTheme] =
    useState(
      () =>
        localStorage.getItem(
          "wl-theme"
        ) || "light"
    );


  /* =======================================================
     MEMBER SESSION
  ======================================================= */

  useEffect(() => {

    const checkMemberSession =
      async () => {

        try {

          const saved =
            localStorage.getItem(
              "wealthoria-member"
            ) ||
            sessionStorage.getItem(
              "wealthoria-member"
            );


          if (!saved) {

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


          let parsedMember;

          try {

            parsedMember =
              JSON.parse(saved);

          } catch (error) {

            localStorage.removeItem(
              "wealthoria-member"
            );

            sessionStorage.removeItem(
              "wealthoria-member"
            );

            setMember(null);
            setAuthChecking(false);

            return;

          }


          if (
            !parsedMember.uid ||
            !parsedMember.token
          ) {

            setMember(null);
            setAuthChecking(false);

            return;

          }


          const response =
            await fetch(
              `${DASHBOARD_API}/api/members/me`,
              {
                method: "GET",

                headers: {

                  Authorization:
                    `Bearer ${parsedMember.token}`

                }

              }
            );


          const data =
            await response.json();


          if (
            !response.ok ||
            !data.success ||
            !data.member
          ) {

            throw new Error(
              data?.message ||
              "Member session is no longer valid."
            );

          }


          const latestMember =
            data.member;


          const updatedSession = {

            ...parsedMember,

            uid:
              latestMember.uid ||
              parsedMember.uid,

            email:
              latestMember.email ||
              parsedMember.email,

            name:
              latestMember.name ||
              "",

            role:
              latestMember.role ||
              "member"

          };


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


          setMember(
            updatedSession
          );

          setAuthChecking(false);


        } catch (error) {

          console.error(
            "Member session error:",
            error
          );

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

          }

        }

      };


    checkMemberSession();

  }, []);


  /* =======================================================
     LOAD REAL DASHBOARD COUNTS
  ======================================================= */

  useEffect(() => {

    if (
      !member ||
      !window.db
    ) {

      return;

    }


    let cancelled = false;


    const loadStats =
      async () => {

        try {

          setStatsLoading(true);


          const [
            contentSnapshot,
            courseSnapshot,
            reportSnapshot,
            purchaseSnapshot,
            notificationSnapshot
          ] =
            await Promise.all([

              /* Total published content */

              window.db
                .collection("content")
                .where(
                  "status",
                  "==",
                  "published"
                )
                .get(),


              /* Published courses */

              window.db
                .collection("courses")
                .where(
                  "status",
                  "==",
                  "published"
                )
                .get(),


              /* Published Weekly Roundups */

              window.db
                .collection("content")
                .where(
                  "category",
                  "==",
                  "Weekly Roundup"
                )
                .where(
                  "status",
                  "==",
                  "published"
                )
                .get(),


              /* Current member purchases */

              window.db
                .collection("coursePurchases")
                .where(
                  "userId",
                  "==",
                  member.uid
                )
                .get(),


              /* Current member notifications */

              window.db
                .collection("notifications")
                .where(
                  "userId",
                  "==",
                  member.uid
                )
                .get()

            ]);


          if (cancelled) {
            return;
          }


          setStats({

            totalContent:
              contentSnapshot.size,

            courses:
              courseSnapshot.size,

            marketReports:
              reportSnapshot.size,

            purchases:
              purchaseSnapshot.size,

            notifications:
              notificationSnapshot.size

          });


        } catch (error) {

          console.error(
            "Dashboard statistics error:",
            error
          );


          if (!cancelled) {

            setStats({
              totalContent: 0,
              courses: 0,
              marketReports: 0,
              purchases: 0,
              notifications: 0
            });

          }

        } finally {

          if (!cancelled) {

            setStatsLoading(
              false
            );

          }

        }

      };


    loadStats();


    return () => {

      cancelled = true;

    };

  }, [member]);


  /* =======================================================
     THEME
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


  const toggleTheme =
    () => {

      setTheme(
        (current) =>
          current === "dark"
            ? "light"
            : "dark"
      );

    };


  /* =======================================================
     OPEN PAGE
  ======================================================= */
const openPage =
  (page) => {

    setActivePage(page);

    sessionStorage.setItem(
      "wealthoria-active-page",
      page
    );

    setMobileDrawerOpen(false);

  };

  /* =======================================================
     NAVIGATE EXTERNAL MEMBER PAGE
  ======================================================= */

  const openRoute =
    (path) => {

      setMobileDrawerOpen(
        false
      );

      if (
        window.membersNavigate
      ) {

        window.membersNavigate(
          path
        );

      } else {

        window.location.href =
          path;

      }

    };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout =
    () => {

      localStorage.removeItem(
        "wealthoria-member"
      );

      sessionStorage.removeItem(
        "wealthoria-member"
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
     GREETING
  ======================================================= */

  const getGreeting =
    () => {

      const hour =
        new Date().getHours();


      if (hour < 12) {
        return "Good morning";
      }


      if (hour < 17) {
        return "Good afternoon";
      }


      return "Good evening";

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
     AUTH LOADING
  ======================================================= */

  if (authChecking) {

    return (
      <div className="wd-auth-loading">
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

    <div
      className={
        sidebarOpen
          ? "wd-app"
          : "wd-app wd-sidebar-collapsed"
      }
    >


      {/* ===================================================
          MOBILE DRAWER OVERLAY
      =================================================== */}

      {mobileDrawerOpen && (

        <div
          className="wd-drawer-overlay"
          onClick={() =>
            setMobileDrawerOpen(
              false
            )
          }
        />

      )}


      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={
          mobileDrawerOpen
            ? "wd-sidebar wd-mobile-open"
            : "wd-sidebar"
        }
      >


        {/* SIDEBAR HEADER */}

        <div className="wd-sidebar-header">

          <div className="wd-brand">

            <img
              src="/assets/logo-mark.png"
              alt="Wealthoria"
            />

            <span>
              Wealthoria
            </span>

          </div>


          {/* MOBILE CLOSE */}

          <button
            type="button"
            className="wd-mobile-close"
            onClick={() =>
              setMobileDrawerOpen(
                false
              )
            }
          >
            ×
          </button>

        </div>


        {/* SIDEBAR NAV */}

        <nav className="wd-sidebar-nav">


          <div className="wd-nav-title">
            OVERVIEW
          </div>


          <button
            type="button"
            className={
              activePage ===
              "dashboard"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() =>
              openPage("dashboard")
            }
          >

            <span>
              ⌂
            </span>

            <b>
              Dashboard
            </b>

          </button>


          <div className="wd-nav-title">
            LEARNING
          </div>


          <button
            type="button"
            className={
              activePage ===
              "courses"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() =>
              openPage("courses")
            }
          >

            <span>
              ▶
            </span>

            <b>
              Courses
            </b>

          </button>


          <button
            type="button"
            className={
              activePage ===
              "newsletter"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() =>
              openPage("newsletter")
            }
          >

            <span>
              ✉
            </span>

            <b>
              Newsletter
            </b>

          </button>


          <button
            type="button"
            className={
              activePage ===
              "weekly"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() =>
              openPage("weekly")
            }
          >

            <span>
              ↗
            </span>

            <b>
              Weekly Roundup
            </b>

          </button>




          <div className="wd-nav-title">
            DATA & RESEARCH
          </div>


          <button
            type="button"
            className={
              activePage ===
              "charts"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() =>
              openPage("charts")
            }
          >

            <span>
              ◒
            </span>

            <b>
              Market Charts
            </b>

          </button>


          <button
            type="button"
            className={
              activePage ===
              "calculator"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() =>
              openPage("calculator")
            }
          >

            <span>
              =
            </span>

            <b>
              Calculators
            </b>

          </button>


          <div className="wd-nav-title">
            ACCOUNT
          </div>


          <button
            type="button"
            className={
              activePage ===
              "purchase"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() =>
              openPage("purchase")
            }
          >

            <span>
              ▣
            </span>

            <b>
              Purchase History
            </b>

            {stats.purchases > 0 && (

              <em>
                {stats.purchases}
              </em>

            )}

          </button>


          <button
            type="button"
            className="wd-nav-item"
           onClick={() =>
  openPage("purchase")
}
          >

            <span>
              ♢
            </span>

            <b>
              Notifications
            </b>

            {stats.notifications > 0 && (

              <em>
                {stats.notifications}
              </em>

            )}

          </button>


        </nav>


        {/* SIDEBAR PROFILE */}

        <div className="wd-sidebar-user">

          <div className="wd-user-avatar">

            {name
              .charAt(0)
              .toUpperCase()}

          </div>


          <div className="wd-user-text">

            <strong>
              {name}
            </strong>

            <span>
              {role}
            </span>

          </div>

        </div>

      </aside>


      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="wd-main">


        {/* =================================================
            HEADER
        ================================================= */}

        <header className="wd-header">


          <div className="wd-header-left">


            {/* DESKTOP SIDEBAR TOGGLE */}

            <button
              type="button"
              className="wd-sidebar-toggle"
              onClick={() =>
                setSidebarOpen(
                  (value) => !value
                )
              }
              aria-label="Toggle sidebar"
            >
              ☰
            </button>


            {/* MOBILE DRAWER */}

            <button
              type="button"
              className="wd-mobile-menu"
              onClick={() =>
                setMobileDrawerOpen(
                  true
                )
              }
              aria-label="Open menu"
            >
              ☰
            </button>


            <div>

              <span className="wd-header-label">
                MEMBER PORTAL
              </span>

              <h1>

                {activePage === "dashboard"
                  ? "Dashboard"
                  : activePage === "courses"
                  ? "Courses"
                  : activePage === "newsletter"
                  ? "Newsletter"
                  : activePage === "weekly"
                  ? "Weekly Roundup"
                  : activePage === "purchase"
                  ? "Purchase History"
                  : activePage === "charts"
                  ? "Market Charts"
                  : activePage === "calculator"
                  ? "Calculators"
                  : activePage === "settings"
                  ? "Settings"
                  : "Dashboard"}

              </h1>

            </div>

          </div>


          <div className="wd-header-right">


            <button
              type="button"
              className="wd-header-button"
              onClick={toggleTheme}
            >
              {theme === "dark"
                ? "☀ Light"
                : "☾ Dark"}
            </button>


            <button
              type="button"
              className="wd-header-button"
              onClick={() =>
                openPage("settings")
              }
            >
              ⚙ Settings
            </button>


            <div className="wd-profile">

              <div className="wd-user-avatar">
                {name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="wd-profile-text">

                <strong>
                  {name}
                </strong>

                <span>
                  {role}
                </span>

              </div>

            </div>


            <button
              type="button"
              className="wd-header-button"
              onClick={logout}
            >
              ↪ Logout
            </button>

          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <div className="wd-content">


          {/* SETTINGS */}

          {activePage === "settings" ? (

            MemberSettings ? (
              <MemberSettings />
            ) : (
              <div className="wd-page-state">
                Settings is loading...
              </div>
            )


          ) : activePage === "courses" ? (

            CourseVideos ? (
              <CourseVideos />
            ) : (
              <div className="wd-page-state">
                Courses are loading...
              </div>
            )


          ) : activePage === "newsletter" ? (

            Newsletter ? (
              <Newsletter />
            ) : (
              <div className="wd-page-state">
                Newsletter is loading...
              </div>
            )


          ) : activePage === "weekly" ? (

            WeeklyRoundup ? (
              <WeeklyRoundup />
            ) : (
              <div className="wd-page-state">
                Weekly Roundup is loading...
              </div>
            )


          ) : activePage === "purchase" ? (

            PurchaseHistory ? (
              <PurchaseHistory />
            ) : (
              <div className="wd-page-state">
                Purchase History is loading...
              </div>
            )


          ) : activePage === "charts" ? (

            <section className="wd-chart-page">

              <div className="wd-chart-head">

                <div>

                  <span className="wd-panel-label">
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
                  type="button"
                  className="wd-view-button"
                  onClick={() =>
                    openPage("dashboard")
                  }
                >
                  ← Dashboard
                </button>

              </div>


              <div className="wd-chart-box">

                <DashboardTradingView
                  theme={theme}
                />

              </div>

            </section>


          ) : activePage === "calculator" ? (

            <section className="wd-calculator-page">

              <button
                type="button"
                className="wd-calculator-close"
                onClick={() =>
                  openPage("dashboard")
                }
              >
                ×
              </button>

              <iframe
                src="/Fundamental_Analysis_Lab.html"
                title="Wealthoria Fundamental Analysis Lab"
                className="wd-calculator-frame"
                allow="fullscreen"
              />

            </section>


          ) : (


            /* =================================================
               DASHBOARD HOME
            ================================================= */

            <>

              {/* WELCOME */}

              <section className="wd-welcome">

                <span>
                  WELCOME BACK
                </span>

                <h2>
                  {getGreeting()}, {name} 👋
                </h2>

                <p>
                  Stay informed, keep learning,
                  and make smarter financial
                  decisions with Wealthoria.
                </p>

              </section>


              {/* STATS */}

              <section className="wd-stats">


                <div className="wd-stat-card">

                  <div className="wd-stat-icon">
                    ◈
                  </div>

                  <div>

                    <span>
                      Total Content
                    </span>

                    <strong>
                      {statsLoading
                        ? "—"
                        : stats.totalContent}
                    </strong>

                    <small>
                      Published resources
                    </small>

                  </div>

                </div>


                <div className="wd-stat-card">

                  <div className="wd-stat-icon">
                    ▶
                  </div>

                  <div>

                    <span>
                      Courses
                    </span>

                    <strong>
                      {statsLoading
                        ? "—"
                        : stats.courses}
                    </strong>

                    <small>
                      Published courses
                    </small>

                  </div>

                </div>


                <div className="wd-stat-card">

                  <div className="wd-stat-icon">
                    ◒
                  </div>

                  <div>

                    <span>
                      Market Reports
                    </span>

                    <strong>
                      {statsLoading
                        ? "—"
                        : stats.marketReports}
                    </strong>

                    <small>
                      Weekly Roundups
                    </small>

                  </div>

                </div>


                <div className="wd-stat-card">

                  <div className="wd-stat-icon">
                    ♢
                  </div>

                  <div>

                    <span>
                      Notifications
                    </span>

                    <strong>
                      {statsLoading
                        ? "—"
                        : stats.notifications}
                    </strong>

                    <small>
                      Your notifications
                    </small>

                  </div>

                </div>


              </section>


              {/* LATEST CONTENT */}

              <section className="wd-feature-grid">

              {DashboardNewsletter && (
  <DashboardNewsletter
    onOpen={() => openPage("newsletter")}
  />
)}

{DashboardWeeklyRoundup && (
  <DashboardWeeklyRoundup
    onOpen={() => openPage("weekly")}
  />
)}

              </section>


              {/* LOWER ROW */}

              <section className="wd-two-column">


                {/* COURSES */}

                <section className="wd-panel">

                  <div className="wd-panel-head">

                    <div>

                      <span className="wd-panel-label">
                        LEARNING
                      </span>

                      <h3>
                        Continue Learning
                      </h3>

                    </div>


                    <button
                      type="button"
                      className="wd-view-button"
                      onClick={() =>
                        openPage("courses")
                      }
                    >
                      View all →
                    </button>

                  </div>


                  <button
                    type="button"
                    className="wd-action-card"
                    onClick={() =>
                      openPage("courses")
                    }
                  >

                    <div className="wd-action-icon">
                      ▶
                    </div>

                    <div>

                      <strong>
                        Explore Courses
                      </strong>

                      <span>
                        {stats.courses} published
                        courses available
                      </span>

                    </div>

                    <b>
                      →
                    </b>

                  </button>

                </section>


                {/* PURCHASE HISTORY */}

                <section className="wd-panel">

                  <div className="wd-panel-head">

                    <div>

                      <span className="wd-panel-label">
                        ACCOUNT
                      </span>

                      <h3>
                        Purchase History
                      </h3>

                    </div>


                    <button
                      type="button"
                      className="wd-view-button"
                      onClick={() =>
                        openPage("purchase")
                      }
                    >
                      View all →
                    </button>

                  </div>


                  <button
                    type="button"
                    className="wd-action-card"
                    onClick={() =>
                      openPage("purchase")
                    }
                  >

                    <div className="wd-action-icon">
                      ₹
                    </div>

                    <div>

                      <strong>
                        Your Purchases
                      </strong>

                      <span>
                        {stats.purchases} course
                        {stats.purchases === 1
                          ? ""
                          : "s"} purchased
                      </span>

                    </div>

                    <b>
                      →
                    </b>

                  </button>

                </section>


              </section>


              {/* QUICK ACCESS */}

              <section className="wd-panel">

                <div className="wd-panel-head">

                  <div>

                    <span className="wd-panel-label">
                      QUICK ACCESS
                    </span>

                    <h3>
                      Explore Wealthoria
                    </h3>

                  </div>

                </div>


                <div className="wd-quick-grid">


                  <button
                    type="button"
                    onClick={() =>
                      openPage("newsletter")
                    }
                  >

                    <span>
                      ✉
                    </span>

                    <div>

                      <strong>
                        Newsletter
                      </strong>

                      <small>
                        Latest insights
                      </small>

                    </div>

                    <b>
                      →
                    </b>

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      openPage("weekly")
                    }
                  >

                    <span>
                      ↗
                    </span>

                    <div>

                      <strong>
                        Weekly Roundup
                      </strong>

                      <small>
                        Market reports
                      </small>

                    </div>

                    <b>
                      →
                    </b>

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      openPage("courses")
                    }
                  >

                    <span>
                      ▶
                    </span>

                    <div>

                      <strong>
                        Courses
                      </strong>

                      <small>
                        Learn & grow
                      </small>

                    </div>

                    <b>
                      →
                    </b>

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      openPage("purchase")
                    }
                  >

                    <span>
                      ▣
                    </span>

                    <div>

                      <strong>
                        Purchases
                      </strong>

                      <small>
                        Payment history
                      </small>

                    </div>

                    <b>
                      →
                    </b>

                  </button>


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