
import React from "react";
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
   DASHBOARD OVERVIEW CHARTS
   Uses existing wd-* classes only.
========================================================= */

function DashboardOverviewCharts({ stats }) {
  const courses = Number(stats?.courses || 0);
  const weeklyRoundups = Number(stats?.marketReports || 0);
  const purchases = Number(stats?.purchases || 0);

  const [contentMix, setContentMix] = React.useState({
    articles: 0,
    videos: 0,
    newsletters: 0
  });

  React.useEffect(() => {
    if (!window.db) return;

    let cancelled = false;

    Promise.all([
      window.db.collection("content")
        .where("category", "==", "Articles & Reports")
        .where("status", "==", "published")
        .get(),

      window.db.collection("content")
        .where("category", "==", "Vedios")
        .where("status", "==", "published")
        .get(),

      window.db.collection("content")
        .where("category", "==", "Newsletter")
        .where("status", "==", "published")
        .get()
    ])
      .then(([articles, videos, newsletters]) => {
        if (cancelled) return;

        setContentMix({
          articles: articles.size,
          videos: videos.size,
          newsletters: newsletters.size
        });
      })
      .catch((error) => {
        console.error("Dashboard overview chart error:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const total =
    contentMix.articles +
    contentMix.videos +
    contentMix.newsletters +
    weeklyRoundups +
    courses;

  const maxValue = Math.max(
    courses,
    contentMix.videos,
    contentMix.articles,
    weeklyRoundups,
    contentMix.newsletters,
    purchases,
    1
  );

  const bars = [
    { label: "Courses", value: courses },
    { label: "Videos", value: contentMix.videos },
    { label: "Articles", value: contentMix.articles },
    { label: "Weekly Reports", value: weeklyRoundups },
    { label: "Newsletters", value: contentMix.newsletters },
    { label: "My Purchases", value: purchases }
  ];

  const p1 = total ? (contentMix.articles / total) * 100 : 0;
  const p2 = p1 + (total ? (contentMix.videos / total) * 100 : 0);
  const p3 = p2 + (total ? (contentMix.newsletters / total) * 100 : 0);
  const p4 = p3 + (total ? (weeklyRoundups / total) * 100 : 0);

  return (
    <section className="wd-two-column">
      <section className="wd-panel">
        <div className="wd-panel-head">
          <div>
            <span className="wd-panel-label">CONTENT OVERVIEW</span>
            <h3>Published Content</h3>
          </div>
        </div>

        <div className="wd-overview-chart-row">
          <div
            className="wd-overview-donut"
            style={{
              background: total
                ? `conic-gradient(
                    #e8473f 0 ${p1}%,
                    #f39a3d ${p1}% ${p2}%,
                    #5878d6 ${p2}% ${p3}%,
                    #7a63c7 ${p3}% ${p4}%,
                    #2c9b72 ${p4}% 100%
                  )`
                : "#e9ebee"
            }}
          >
            <div className="wd-overview-donut-inner">
              <strong>{total}</strong>
              <span>TOTAL</span>
            </div>
          </div>

          <div className="wd-overview-legend">
            {[
              ["#e8473f", "Articles & Reports", contentMix.articles],
              ["#f39a3d", "Videos", contentMix.videos],
              ["#5878d6", "Newsletters", contentMix.newsletters],
              ["#7a63c7", "Weekly Reports", weeklyRoundups],
              ["#2c9b72", "Courses", courses]
            ].map(([color, label, value]) => (
              <div key={label}>
                <i style={{ background: color }} />
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wd-panel">
        <div className="wd-panel-head">
          <div>
            <span className="wd-panel-label">ACTIVITY</span>
            <h3>Learning & Content</h3>
          </div>
        </div>

        <div className="wd-overview-bars">
          {bars.map((bar) => (
            <div className="wd-overview-bar-row" key={bar.label}>
              <div className="wd-overview-bar-meta">
                <span>{bar.label}</span>
                <b>{bar.value}</b>
              </div>

              <div className="wd-overview-bar-track">
                <div
                  className="wd-overview-bar-fill"
                  style={{
                    width: bar.value
                      ? `${Math.max((bar.value / maxValue) * 100, 8)}%`
                      : "0%"
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="wd-overview-summary">
          <div>
            <span>My Purchases</span>
            <strong>{purchases}</strong>
          </div>
          <div>
            <span>Published Courses</span>
            <strong>{courses}</strong>
          </div>
        </div>
      </section>
    </section>
  );
}

window.DashboardOverviewCharts = DashboardOverviewCharts;


/* =========================================================
   DASHBOARD CONTENT
   LATEST PUBLISHED ITEM FROM EACH CATEGORY
   Uses the existing wd-* CSS classes only.
========================================================= */

function DashboardLatestContent({ onOpen }) {

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!window.db) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const configs = [
      {
        type: "Newsletter",
        collection: "content",
        category: "Newsletter"
      },
      {
        type: "Weekly Roundup",
        collection: "content",
        category: "Weekly Roundup"
      },
      {
        type: "Articles & Reports",
        collection: "content",
        category: "Articles & Reports"
      },
      {
        type: "Videos",
        collection: "content",
        category: "Vedios"
      },
      {
        type: "Courses",
        collection: "courses"
      }
    ];

    const loadLatest = async () => {

      try {

        const snapshots = await Promise.all(
          configs.map(config => {

            let query = window.db
              .collection(config.collection)
              .where("status", "==", "published");

            if (config.category) {
              query = query.where(
                "category",
                "==",
                config.category
              );
            }

            return query.get();

          })
        );

        if (cancelled) {
          return;
        }

        const latest = snapshots
          .map((snapshot, index) => {

            const config = configs[index];

            const rows = snapshot.docs.map(doc => {

              const data = doc.data() || {};

              const publishedAt =
                data.publishedAt ||
                data.createdAt ||
                "";

              return {
                id: doc.id,
                type: config.type,
                category:
                  config.category ||
                  "Courses",

                title:
                  data.title ||
                  data.name ||
                  data.pdfName ||
                  config.type,

                description:
                  data.description ||
                  data.shortDescription ||
                  "",

                thumbnailUrl:
                  data.thumbnailUrl ||
                  data.imageUrl ||
                  data.thumbnail ||
                  "",

                publishedAt,

                _time:
                  getDashboardTime(
                    publishedAt
                  )

              };

            });

            rows.sort(
              (a, b) =>
                b._time - a._time
            );

            return rows[0] || null;

          })
          .filter(Boolean);

        setItems(latest);

      } catch (error) {

        console.error(
          "Dashboard latest content error:",
          error
        );

        setItems([]);

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    };

    loadLatest();

    return () => {
      cancelled = true;
    };

  }, []);

  if (loading) {

    return (
      <section className="wd-panel">

        <div className="wd-panel-loading">
          Loading Latest Content...
        </div>

      </section>
    );

  }

  return (
    <section className="wd-panel">

      <div className="wd-panel-head">

        <div>

          <span className="wd-panel-label">
            LATEST CONTENT
          </span>

          <h3>
            Latest Content
          </h3>

        </div>

      </div>

      {items.length === 0 ? (

        <div className="wd-empty">
          No published content available.
        </div>

      ) : (

        <div className="wd-feature-grid">

          {items.map(item => {

            const isVideo =
              item.type === "Videos";

            const actionLabel =
              item.type === "Articles & Reports"
                ? "Read Article →"
                : item.type === "Weekly Roundup"
                ? "Read Report →"
                : item.type === "Newsletter"
                ? "Read Newsletter →"
                : item.type === "Courses"
                ? "View Course →"
                : "Watch Video →";

            return (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                className="wd-feature"
                onClick={() => {

                  if (
                    typeof onOpen === "function"
                  ) {
                    onOpen(item.category);
                  }

                }}
              >

                <div className="wd-feature-image">

                  {item.thumbnailUrl ? (

                    <img
                      src={getDashboardFileUrl(
                        item.thumbnailUrl
                      )}
                      alt={item.title}
                    />

                  ) : (

                    <span>
                      {isVideo ? "▶" : "PDF"}
                    </span>

                  )}

                </div>

                <div className="wd-feature-text">

                  <span className="wd-feature-type">
                    {item.type.toUpperCase()}
                  </span>

                  <h4>
                    {item.title}
                  </h4>

                  <p>
                    {item.description}
                  </p>

                  <span className="wd-feature-date">
                    {getDashboardDate(
                      item.publishedAt
                    )}
                  </span>

                  <span className="wd-feature-link">
                    {actionLabel}
                  </span>

                </div>

              </button>
            );

          })}

        </div>

      )}

    </section>
  );

}

window.DashboardLatestContent =
  DashboardLatestContent;


/* =========================================================
   MEMBER DASHBOARD
========================================================= */
/* =========================================================
   MEMBER NOTIFICATIONS PAGE
========================================================= */

function MemberNotificationsPage({
  member,
  onNotificationsRead
}) {

  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    if (!member?.token) {
      return;
    }


    let cancelled = false;


    const loadNotifications =
      async () => {

        try {

          setLoading(true);


          const response =
            await fetch(
              `${DASHBOARD_API}/api/members/notifications`,
              {
                method:
                  "GET",

                headers: {

                  Authorization:
                    `Bearer ${member.token}`

                }

              }
            );


          const data =
            await response.json();


          if (
            !response.ok ||
            !data?.success
          ) {

            throw new Error(
              data?.message ||
              "Unable to load notifications."
            );

          }


          if (cancelled) {
            return;
          }


          const rows =
            Array.isArray(
              data.notifications
            )
              ? data.notifications
              : [];


          setNotifications(
            rows
          );


          // =================================================
          // MARK EVERY UNREAD NOTIFICATION AS READ
          // =================================================

          const unread =
            rows.filter(
              notification =>
                notification.read !== true
            );


          for (
            const notification of unread
          ) {

            try {

              await fetch(
                `${DASHBOARD_API}/api/members/notifications/${notification.id}/read`,
                {
                  method:
                    "POST",

                  headers: {

                    Authorization:
                      `Bearer ${member.token}`

                  }

                }
              );

            } catch (error) {

              console.error(
                "❌ Could not mark notification as read:",
                error
              );

            }

          }


          if (!cancelled) {

            onNotificationsRead();

          }


        } catch (error) {

          console.error(
            "❌ Notifications page error:",
            error
          );


        } finally {

          if (!cancelled) {

            setLoading(false);

          }

        }

      };


    loadNotifications();


    return () => {

      cancelled = true;

    };

  }, [member]);


  if (loading) {

    return (

      <div className="wd-page-state">

        Loading notifications...

      </div>

    );

  }


  if (
    notifications.length === 0
  ) {

    return (

      <div className="wd-empty">

        No notifications yet.

      </div>

    );

  }


  return (

    <div className="member-notification-page-list">

      {notifications.map(
        notification => (

          <div
            key={notification.id}
            className="member-notification-page-item"
          >

            <div className="member-notification-page-icon">

              🔔

            </div>


            <div className="member-notification-page-content">

              <strong>
                {notification.title}
              </strong>


              <p>
                {notification.message}
              </p>


              <small>
                {notification.read
                  ? "Read"
                  : "New"}
              </small>

            </div>

          </div>

        )
      )}

    </div>

  );

}



/* =========================================================
   MEMBER DASHBOARD
========================================================= */

function MemberDashboard() {

  const CourseVideos =
    window.CourseVideos;
    const MemberVideo =
  window.MemberVideo;

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

  const DashboardLatestContent =
    window.DashboardLatestContent;

  const DashboardOverviewCharts =
    window.DashboardOverviewCharts;

    const MemberArticles =
  window.MemberArticles;

  /* =======================================================
     MEMBER
  ======================================================= */

  const [member, setMember] =
    useState(null);

  const [authChecking, setAuthChecking] =
    useState(true);


  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const [
    notificationSlides,
    setNotificationSlides
  ] =
    useState([]);

  const [
    unreadNotifications,
    setUnreadNotifications
  ] =
    useState(0);


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

  const [
    mobileDrawerOpen,
    setMobileDrawerOpen
  ] =
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
                method:
                  "GET",

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
     LOAD UNREAD COUNT ONLY
     
     IMPORTANT:
     Existing unread notifications DO NOT become slides.
  ======================================================= */

  useEffect(() => {

    if (
      !member?.token
    ) {

      return;

    }


    const loadUnreadCount =
      async () => {

        try {

          const response =
            await fetch(
              `${DASHBOARD_API}/api/members/notifications`,
              {
                method:
                  "GET",

                headers: {

                  Authorization:
                    `Bearer ${member.token}`

                }

              }
            );


          const data =
            await response.json();


          if (
            !response.ok ||
            !data?.success
          ) {

            console.error(
              "Notification API error:",
              data
            );

            return;

          }


          const count =
            Number(
              data.unreadCount || 0
            );


          setUnreadNotifications(
            count
          );


          setStats(
            current => ({

              ...current,

              notifications:
                count

            })
          );


        } catch (error) {

          console.error(
            "Unread notification count error:",
            error
          );

        }

      };


    loadUnreadCount();

  }, [member]);


  /* =======================================================
     START FCM AUTOMATICALLY AFTER LOGIN
  ======================================================= */

  useEffect(() => {

    if (
      !member?.uid
    ) {

      return;

    }


    let cancelled = false;


    const startFCM =
      async () => {

        try {

          // notifications.js may already
          // be loaded by another part
          // of the application.

          if (
            typeof window.initializeMemberForegroundNotifications ===
            "function"
          ) {

            await window.initializeMemberForegroundNotifications();

            return;

          }


          const existingScript =
            document.querySelector(
              'script[data-wealthoria-notifications="true"]'
            );


          if (
            !existingScript
          ) {

            const script =
              document.createElement(
                "script"
              );


            script.src =
              "/firebase/notifications.js?v=24";


            script.async = true;


            script.setAttribute(
              "data-wealthoria-notifications",
              "true"
            );


            await new Promise(
              (
                resolve,
                reject
              ) => {

                script.onload =
                  resolve;

                script.onerror =
                  reject;

                document.head.appendChild(
                  script
                );

              }
            );

          }


          if (
            cancelled
          ) {

            return;

          }


          if (
            typeof window.initializeMemberForegroundNotifications ===
            "function"
          ) {

            await window.initializeMemberForegroundNotifications();

          }

        } catch (error) {

          console.error(
            "❌ Automatic FCM startup error:",
            error
          );

        }

      };


    startFCM();


    return () => {

      cancelled = true;

    };

  }, [member]);


  /* =======================================================
     LIVE NEW NOTIFICATION
     
     ONLY a newly received FCM notification
     creates a slide.
  ======================================================= */

  useEffect(() => {

    const handleNotification =
      (event) => {

        const notification =
          event.detail;


        if (!notification) {

          return;

        }


        const newNotification = {

          id:
            `live-${Date.now()}-${Math.random()}`,

          title:
            notification.title ||
            "Wealthoria",

          message:
            notification.message ||
            "You have a new notification.",

          read:
            false

        };


        // Add ONE new popup.

        setNotificationSlides(
          current => [

            newNotification,

            ...current

          ].slice(0, 3)
        );


        // Increase unread badge.

        setUnreadNotifications(
          current =>
            current + 1
        );


        // Update dashboard statistic.

        setStats(
          current => ({

            ...current,

            notifications:
              current.notifications + 1

          })
        );


        // Remove only the popup after 7 seconds.

        window.setTimeout(
          () => {

            setNotificationSlides(
              current =>
                current.filter(
                  item =>
                    item.id !==
                    newNotification.id
                )
            );

          },
          7000
        );

      };


    window.addEventListener(
      "wealthoria:notification",
      handleNotification
    );


    return () => {

      window.removeEventListener(
        "wealthoria:notification",
        handleNotification
      );

    };

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
            purchaseSnapshot
          ] =
            await Promise.all([

              window.db
                .collection("content")
                .where(
                  "status",
                  "==",
                  "published"
                )
                .get(),


              window.db
                .collection("courses")
                .where(
                  "status",
                  "==",
                  "published"
                )
                .get(),


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


              window.db
                .collection("coursePurchases")
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


          setStats(
            current => ({

              totalContent:
                contentSnapshot.size,

              courses:
                courseSnapshot.size,

              marketReports:
                reportSnapshot.size,

              purchases:
                purchaseSnapshot.size,

              notifications:
                current.notifications

            })
          );


        } catch (error) {

          console.error(
            "Dashboard statistics error:",
            error
          );


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
        current =>
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

      setActivePage(
        page
      );


      sessionStorage.setItem(
        "wealthoria-active-page",
        page
      );


      setMobileDrawerOpen(
        false
      );

    };


  /* =======================================================
     LOGOUT
  ======================================================= */
const logout =
  async () => {

  try {

    const saved =
      localStorage.getItem(
        "wealthoria-member"
      ) ||
      sessionStorage.getItem(
        "wealthoria-member"
      );

    if (saved) {

      const session =
        JSON.parse(saved);

      if (session?.token) {

        await fetch(
          `${DASHBOARD_API}/api/members/logout`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.token}`
            }
          }
        );

      }

    }

  } catch (error) {

    console.warn(
      "Could not record member logout:",
      error
    );

  }

  localStorage.removeItem(
    "wealthoria-member"
  );

  sessionStorage.removeItem(
    "wealthoria-member"
  );

  setNotificationSlides(
    []
  );

  setUnreadNotifications(
    0
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
          NEW NOTIFICATION SLIDES ONLY
      =================================================== */}

      {notificationSlides.length > 0 && (

        <div className="member-notification-stack">

          {notificationSlides.map(
            notification => (

              <div
                key={notification.id}
                className="member-notification-slide"
              >

                <div className="member-notification-slide-icon">
                  🔔
                </div>


                <div className="member-notification-slide-content">

                  <strong>
                    {notification.title}
                  </strong>


                  <p>
                    {notification.message}
                  </p>

                </div>


                <button
                  type="button"
                  className="member-notification-slide-close"
                  onClick={() => {

                    setNotificationSlides(
                      current =>
                        current.filter(
                          item =>
                            item.id !==
                            notification.id
                        )
                    );

                  }}
                >
                  ×
                </button>

              </div>

            )
          )}

        </div>

      )}


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
              activePage === "videos"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() =>
              openPage("videos")
            }
          >
            <span>
              ▶
            </span>

            <b>
              Videos
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


          <button
  type="button"
  className={
    activePage === "articles"
      ? "wd-nav-item active"
      : "wd-nav-item"
  }
  onClick={() =>
    openPage("articles")
  }
>

  <span>
    ◈
  </span>

  <b>
    Articles & Reports
  </b>

</button>


          <div className="wd-nav-title">
            DATA & RESEARCH
          </div>



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


          {/* PURCHASES */}

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


          {/* NOTIFICATIONS */}

          <button
            type="button"
            className={
              activePage ===
              "notifications"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() =>
              openPage("notifications")
            }
          >

            <span>
              ♢
            </span>

            <b>
              Notifications
            </b>


            {unreadNotifications > 0 && (

              <em>
                {unreadNotifications}
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


            <button
              type="button"
              className="wd-sidebar-toggle"
              onClick={() =>
                setSidebarOpen(
                  value =>
                    !value
                )
              }
              aria-label="Toggle sidebar"
            >
              ☰
            </button>


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
                   : activePage === "videos"
                  ? "Videos"
                  : activePage === "newsletter"
                  ? "Newsletter"
                  : activePage === "weekly"
                  ? "Weekly Roundup"

                  : activePage === "articles"
                  ? "Articles & Reports"
                  : activePage === "purchase"
                  ? "Purchase History"
                  : activePage === "notifications"
                  ? "Notifications"
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


            {/* HEADER NOTIFICATIONS */}

            <button
              type="button"
              className="member-header-button"
              onClick={() =>
                openPage("notifications")
              }
            >

              🔔 Notifications


              {unreadNotifications > 0 && (

                <span className="member-header-notification-badge">
                  {unreadNotifications}
                </span>

              )}

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

          ) : activePage === "videos" ? (

            MemberVideo ? (

              <MemberVideo />

            ) : (

              <div className="wd-page-state">
                Videos are loading...
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


          ) 
           : activePage === "articles" ? (

  MemberArticles ? (

    <MemberArticles />

  ) : (

    <div className="wd-page-state">
      Articles & Reports are loading...
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


          ) : activePage === "notifications" ? (

            <section className="wd-panel">


              <div className="wd-panel-head">

                <div>

                  <span className="wd-panel-label">
                    ACCOUNT
                  </span>

                  <h3>
                    Notifications
                  </h3>

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


              <MemberNotificationsPage
                member={member}
                onNotificationsRead={() => {

                  setUnreadNotifications(
                    0
                  );


                  setNotificationSlides(
                    []
                  );


                  setStats(
                    current => ({

                      ...current,

                      notifications:
                        0

                    })
                  );

                }}
              />


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
                        : unreadNotifications}
                    </strong>


                    <small>
                      Unread notifications
                    </small>

                  </div>

                </div>


              </section>


              {/* OVERVIEW CHARTS */}
              {DashboardOverviewCharts && (
                <DashboardOverviewCharts stats={stats} />
              )}

              {/* LATEST CONTENT */}

              <section className="wd-feature-grid">

                {DashboardLatestContent && (

                  <DashboardLatestContent
                    onOpen={(category) => {

                      if (
                        category ===
                        "Articles & Reports"
                      ) {

                        openPage(
                          "articles"
                        );

                      } else if (
                        category === "Vedios"
                      ) {

                        openPage(
                          "videos"
                        );

                      } else if (
                        category === "Newsletter"
                      ) {

                        openPage(
                          "newsletter"
                        );

                      } else if (
                        category === "Weekly Roundup"
                      ) {

                        openPage(
                          "weekly"
                        );

                      } else if (
                        category === "Courses"
                      ) {

                        openPage(
                          "courses"
                        );

                      }

                    }}
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
  className={
    activePage === "articles"
      ? "wd-nav-item active"
      : "wd-nav-item"
  }
  onClick={() =>
    openPage("articles")
  }
>

  <span>
    ◈
  </span>

  <b>
    Articles & Reports
  </b>

</button>


                  <button
                    type="button"
                    onClick={() =>
                      openPage("videos")
                    }
                  >

                    <span>
                      ▶
                    </span>


                    <div>

                      <strong>
                        Videos
                      </strong>


                      <small>
                        Watch & learn
                      </small>

                    </div>


                    <b>
                      →
                    </b>

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      openPage("articles")
                    }
                  >

                    <span>
                      ◈
                    </span>


                    <div>

                      <strong>
                        Articles & Reports
                      </strong>


                      <small>
                        Research & insights
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