
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
  "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";


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
  const loadNewsletter = async () => {
    try {
      const current = getCurrentMemberSession();

      if (!current?.session?.token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${DASHBOARD_API}/api/members/dashboard-content`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${current.session.token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Unable to load newsletter."
        );
      }

      const rows = Array.isArray(data.content)
        ? data.content
            .filter(
              item =>
                item.category === "Newsletter" &&
                item.status === "published"
            )
            .map(item => ({
              id: item.id,
              title:
                item.title ||
                item.pdfName ||
                "Newsletter",
              description:
                item.description || "",
              tags: Array.isArray(item.tags)
                ? item.tags
                : [],
              thumbnailUrl:
                item.thumbnailUrl || "",
              pdfUrl:
                item.pdfUrl || "",
              publishedAt:
                item.publishedAt ||
                item.createdAt ||
                ""
            }))
        : [];

      rows.sort(
        (a, b) =>
          getDashboardTime(b.publishedAt) -
          getDashboardTime(a.publishedAt)
      );

      setNewsletter(rows[0] || null);
    } catch (error) {
      console.error(
        "Dashboard Newsletter error:",
        error
      );

      setNewsletter(null);
    } finally {
      setLoading(false);
    }
  };

  loadNewsletter();
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
          No published Weekly Order Wins available.
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
              Read Weekly Order Wins →
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
  const loadWeeklyRoundup = async () => {
    try {
      const current = getCurrentMemberSession();

      if (!current?.session?.token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${DASHBOARD_API}/api/members/dashboard-content`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${current.session.token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Unable to load weekly roundup."
        );
      }

      const rows = Array.isArray(data.content)
        ? data.content
            .filter(
              item =>
                item.category === "Weekly Roundup" &&
                item.status === "published"
            )
            .map(item => ({
              id: item.id,
              title:
                item.title ||
                item.pdfName ||
                "Weekly Roundup",
              description:
                item.description || "",
              thumbnailUrl:
                item.thumbnailUrl || "",
              pdfUrl:
                item.pdfUrl || "",
              publishedAt:
                item.publishedAt ||
                item.createdAt ||
                ""
            }))
        : [];

      rows.sort(
        (a, b) =>
          getDashboardTime(b.publishedAt) -
          getDashboardTime(a.publishedAt)
      );

      setReport(rows[0] || null);
    } catch (error) {
      console.error(
        "Dashboard Weekly Roundup error:",
        error
      );

      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  loadWeeklyRoundup();
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
   DASHBOARD BOOK PROMO
   ========================================================= */

function DashboardBookPromo() {
  const openBook = () => {
    window.location.href = "https://www.wealthoria.in/Book.html";
  };

  return (
    <section className="wd-book-ad" aria-label="Hoodikeya Vijnana pre-book offer">
      <div className="wd-book-ad-track">
        <button type="button" className="wd-book-ad-card" onClick={openBook}>
          <div className="wd-book-ad-copy">
            <span className="wd-book-ad-kicker">NEW RELEASE</span>
            <h3>ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ</h3>
            <p>Learn investing with practical, simple insights.</p>
            <div className="wd-book-ad-price"><b>₹999</b><del>₹1499</del></div>
            <span className="wd-book-ad-cta">Pre-book now →</span>
          </div>
          <div className="wd-book-ad-cover"><img src="/hoodikeya-vijnana-cover.jpg" alt="ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ book cover" /></div>
        </button>

        <button type="button" className="wd-book-ad-card wd-book-ad-card-alt" onClick={openBook}>
          <div className="wd-book-ad-copy">
            <span className="wd-book-ad-kicker">LIMITED OFFER</span>
            <h3>Build wealth with knowledge.</h3>
            <p>Pre-book today for ₹999. Shipping starts Oct 1.</p>
            <span className="wd-book-ad-cta">Explore the book →</span>
          </div>
          <div className="wd-book-ad-cover"><img src="/hoodikeya-vijnana-cover.jpg" alt="ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ book cover" /></div>
        </button>

        <button type="button" className="wd-book-ad-card" onClick={openBook}>
          <div className="wd-book-ad-copy">
            <span className="wd-book-ad-kicker">WEALTHORIA BOOK</span>
            <h3>6 Months Ahead.</h3>
            <p>Start your investing journey with Wealthoria.</p>
            <div className="wd-book-ad-price"><b>₹999</b><del>₹1499</del></div>
            <span className="wd-book-ad-cta">Pre-book now →</span>
          </div>
          <div className="wd-book-ad-cover"><img src="/hoodikeya-vijnana-cover.jpg" alt="ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ book cover" /></div>
        </button>

        <button type="button" className="wd-book-ad-card wd-book-ad-card-alt" onClick={openBook}>
          <div className="wd-book-ad-copy">
            <span className="wd-book-ad-kicker">NEW RELEASE</span>
            <h3>ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ</h3>
            <p>Learn investing with practical, simple insights.</p>
            <div className="wd-book-ad-price"><b>₹999</b><del>₹1499</del></div>
            <span className="wd-book-ad-cta">Pre-book now →</span>
          </div>
          <div className="wd-book-ad-cover"><img src="/hoodikeya-vijnana-cover.jpg" alt="ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ book cover" /></div>
        </button>
      </div>
      <div className="wd-book-ad-glow" aria-hidden="true" />
    </section>
  );
}

window.DashboardBookPromo = DashboardBookPromo;


/* =========================================================
   DASHBOARD CONTENT
   LATEST PUBLISHED ITEM FROM EACH CATEGORY
   Uses the existing wd-* CSS classes only.
========================================================= */

function DashboardLatestContent({ onOpen, member }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!member?.token) {
    setLoading(false);
    return;
  }

  let cancelled = false;

  const loadLatest = async () => {
    try {
      const response = await fetch(
        `${DASHBOARD_API}/api/members/dashboard-content`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${member.token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
          "Unable to load dashboard content."
        );
      }

      if (cancelled) {
        return;
      }

      const configs = [
        {
          type: "Newsletter",
          category: "Newsletter",
          rows: Array.isArray(data.content)
            ? data.content.filter(
                item =>
                  item.category === "Newsletter"
              )
            : []
        },
        {
          type: "Weekly Roundup",
          category: "Weekly Roundup",
          rows: Array.isArray(data.content)
            ? data.content.filter(
                item =>
                  item.category === "Weekly Roundup"
              )
            : []
        },
        {
          type: "Articles & Reports",
          category: "Articles & Reports",
          rows: Array.isArray(data.content)
            ? data.content.filter(
                item =>
                  item.category === "Articles & Reports"
              )
            : []
        },
        {
          type: "Videos",
          category: "Vedios",
          rows: Array.isArray(data.content)
            ? data.content.filter(
                item =>
                  item.category === "Vedios"
              )
            : []
        },
        {
          type: "Courses",
          category: "Courses",
          rows: Array.isArray(data.courses)
            ? data.courses
            : []
        }
      ];

      const latest = configs
        .map(config => {
          const rows = config.rows
            .map(data => {
              const publishedAt =
                data.publishedAt ||
                data.createdAt ||
                "";

              return {
                id: data.id,
                type: config.type,
                category: config.category,

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

}, [member]);

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
                ? "Read Weekly Order Wins →"
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

/* =========================================================
   MEMBER SESSION HELPERS
   Session is restored from browser storage.
   Dashboard does NOT call /api/members/me on every refresh.
========================================================= */

const MEMBER_SESSIONS_KEY =
  "wealthoria-member-sessions";

const CURRENT_MEMBER_KEY =
  "wealthoria-current-member";

const readMemberSessions = (storage) => {
  try {
    const raw = storage.getItem(MEMBER_SESSIONS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? parsed
      : {};
  } catch (error) {
    console.warn("Could not read member sessions:", error);
    return {};
  }
};

const getCurrentMemberSession = () => {
  try {
    const sessionUid = sessionStorage.getItem(CURRENT_MEMBER_KEY);

    if (sessionUid) {
      const sessions = readMemberSessions(sessionStorage);
      const session = sessions[sessionUid];

      if (session?.uid && session?.token) {
        return { session, storage: sessionStorage };
      }
    }

    const localUid = localStorage.getItem(CURRENT_MEMBER_KEY);

    if (localUid) {
      const sessions = readMemberSessions(localStorage);
      const session = sessions[localUid];

      if (session?.uid && session?.token) {
        return { session, storage: localStorage };
      }
    }

    return null;
  } catch (error) {
    console.error("Could not read current member session:", error);
    return null;
  }
};

const updateCurrentMemberSession = (storage, session) => {
  try {
    if (!storage || !session?.uid) return;

    const sessions = readMemberSessions(storage);
    sessions[session.uid] = session;

    storage.setItem(
      MEMBER_SESSIONS_KEY,
      JSON.stringify(sessions)
    );
  } catch (error) {
    console.error("Could not update member session:", error);
  }
};

const removeCurrentMemberSession = (uid) => {
  try {
    if (!uid) return;

    const localSessions = readMemberSessions(localStorage);
    const sessionSessions = readMemberSessions(sessionStorage);

    delete localSessions[uid];
    delete sessionSessions[uid];

    localStorage.setItem(
      MEMBER_SESSIONS_KEY,
      JSON.stringify(localSessions)
    );

    sessionStorage.setItem(
      MEMBER_SESSIONS_KEY,
      JSON.stringify(sessionSessions)
    );

    if (localStorage.getItem(CURRENT_MEMBER_KEY) === uid) {
      localStorage.removeItem(CURRENT_MEMBER_KEY);
    }

    if (sessionStorage.getItem(CURRENT_MEMBER_KEY) === uid) {
      sessionStorage.removeItem(CURRENT_MEMBER_KEY);
    }
  } catch (error) {
    console.error("Could not remove member session:", error);
  }
};


function MemberDashboard() {

  const CourseVideos =
    window.CourseVideos;
    const MemberVideo =
  window.MemberVideo;

  const Newsletter =
    window.Newsletter;

  const WeeklyRoundup =
    window.WeeklyRoundup;

    const RatioAnalysis =
  window.RatioAnalysis; 

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

  const DashboardBookPromo =
    window.DashboardBookPromo;

    const MemberArticles =
  window.MemberArticles;

  /* =======================================================
     MEMBER
  ======================================================= */
const initialMemberSession = getCurrentMemberSession();

const [member, setMember] =
  useState(initialMemberSession?.session || null);

  const [membershipDays, setMembershipDays] =
  useState(
    Number(
      initialMemberSession?.session?.subscription?.remainingDays ??
      initialMemberSession?.session?.remainingDays ??
      0
    )
  );

const [activationLoading, setActivationLoading] =
  useState(false);


  const activateSubscription = async () => {
  setActivationLoading(true);

  try {
    const current = getCurrentMemberSession();

    if (!current?.session?.token || !current?.session?.uid) {
      throw new Error(
        "Your login session was not found. Please login again."
      );
    }

    const session = current.session;

    if (!window.Razorpay) {
      throw new Error(
        "Payment system is still loading. Please try again."
      );
    }

    // Create new Razorpay subscription
    const createResponse = await fetch(
      `${DASHBOARD_API}/api/subscription/reactivate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const createData =
      await createResponse.json();

    if (
      !createResponse.ok ||
      !createData?.success
    ) {
      throw new Error(
        createData?.message ||
        "Unable to start subscription activation."
      );
    }

    const subscriptionId =
      createData.subscriptionId;

    const razorpayKey =
      createData.key;

    if (!subscriptionId || !razorpayKey) {
      throw new Error(
        "Razorpay subscription details were not received."
      );
    }

    setActivationLoading(false);

    const options = {
      key: razorpayKey,

      subscription_id:
        subscriptionId,

      name: "Wealthoria",

      description:
        "Wealthoria Premium Subscription",

      prefill: {
        name: session.name || "",
        email: session.email || ""
      },

      theme: {
        color: "#e8473f"
      },

      handler: async (response) => {
        setActivationLoading(true);

        try {
          const paymentId =
            response?.razorpay_payment_id;

          const returnedSubscriptionId =
            response?.razorpay_subscription_id ||
            subscriptionId;

          if (!paymentId) {
            throw new Error(
              "Razorpay payment ID was not received."
            );
          }

          if (
            returnedSubscriptionId !==
            subscriptionId
          ) {
            throw new Error(
              "Razorpay subscription verification failed."
            );
          }

          // Complete subscription activation
          const completeResponse =
            await fetch(
              `${DASHBOARD_API}/api/subscription/reactivate/complete`,
              {
                method: "POST",

                headers: {
                  Authorization:
                    `Bearer ${session.token}`,
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  subscriptionId,
                  paymentId
                })
              }
            );

          const completeData =
            await completeResponse.json();

          if (
            !completeResponse.ok ||
            !completeData?.success
          ) {
            throw new Error(
              completeData?.message ||
              "Payment was received, but subscription activation could not be completed."
            );
          }

          // Update saved member session
        const updatedSession = {
  ...session,

  status: "active",

  subscription: {
    ...(session.subscription || {}),

    status: "active",

    razorpaySubscriptionId:
      completeData.razorpaySubscriptionId ||
      subscriptionId,

    nextBillingDate:
      completeData.nextBillingDate ||
      completeData.subscription?.nextBillingDate ||
      session.subscription?.nextBillingDate ||
      null,

    accessUntil:
      completeData.nextBillingDate ||
      completeData.subscription?.nextBillingDate ||
      session.subscription?.accessUntil ||
      null,

    remainingDays:
      Number(
        completeData.remainingDays ||
        completeData.subscription?.remainingDays ||
        0
      ),

    accessActive: true
  }
};

          updateCurrentMemberSession(
            current.storage,
            updatedSession
          );

          setMember(updatedSession);

          setMembershipDays(
            Number(
              completeData?.remainingDays ||
              updatedSession?.subscription
                ?.remainingDays ||
              0
            )
          );

          // Reload dashboard with active subscription
          window.location.replace(
            "/members/dashboard"
          );

        } catch (error) {
          console.error(
            "Subscription activation completion error:",
            error
          );

          alert(
            error?.message ||
            "Subscription activation failed. Please contact support."
          );

          setActivationLoading(false);
        }
      },

      modal: {
        ondismiss: () => {
          setActivationLoading(false);
        }
      }
    };

    const razorpay =
      new window.Razorpay(options);

    razorpay.on(
      "payment.failed",
      (response) => {
        console.error(
          "Razorpay activation payment failed:",
          response?.error
        );

        alert(
          response?.error?.description ||
          "Payment failed. Your subscription remains inactive."
        );

        setActivationLoading(false);
      }
    );

    razorpay.open();

  } catch (error) {
    console.error(
      "Subscription activation error:",
      error
    );

    alert(
      error?.message ||
      "Unable to activate subscription."
    );

    setActivationLoading(false);
  }
};


useEffect(() => {

  const updateMembershipDays = () => {

  const accessUntil =
  member?.subscription?.accessUntil ||
  member?.subscription?.nextBillingDate ||
  member?.accessUntil ||
  member?.nextBillingDate;

    if (!accessUntil) {
      setMembershipDays(0);
      return;
    }

  const expiryTime =
  getDashboardTime(accessUntil);
    if (!Number.isFinite(expiryTime)) {
      return;
    }

    const remaining =
      Math.max(
        0,
        Math.ceil(
          (expiryTime - Date.now()) /
          (1000 * 60 * 60 * 24)
        )
      );

    setMembershipDays(remaining);
  };

  updateMembershipDays();

  const timer =
    setInterval(
      updateMembershipDays,
      60 * 1000
    );

  return () => clearInterval(timer);

}, [member]);

const [authChecking, setAuthChecking] =
  useState(false);

  const [membershipLoaded, setMembershipLoaded] =
  useState(false);
const [notificationStatus, setNotificationStatus] =
  useState("checking");

useEffect(() => {
  if (!("Notification" in window)) {
    setNotificationStatus("unsupported");
    return;
  }

  if (Notification.permission === "granted") {
    setNotificationStatus("enabled");
  } else if (Notification.permission === "denied") {
    setNotificationStatus("blocked");
  } else {
    setNotificationStatus("not-enabled");
  }
}, []);

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

  /* =======================================================
     MEMBER SESSION
  ======================================================= */
useEffect(() => {

  const loadMember = async () => {

    const current = getCurrentMemberSession();

    if (!current?.session?.uid || !current?.session?.token) {
      setMember(null);
      setAuthChecking(false);

      if (window.membersNavigate) {
        window.membersNavigate("/members/login");
      } else {
        window.location.replace("/members/login");
      }

      return;
    }

    try {

      const response = await fetch(
        `${DASHBOARD_API}/api/members/me`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${current.session.token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success || !data?.member) {
        throw new Error(
          data?.message ||
          "Unable to load member details."
        );
      }

      const updatedSession = {
        ...current.session,
        ...data.member
      };

      updateCurrentMemberSession(
        current.storage,
        updatedSession
      );
setMember(updatedSession);
setMembershipLoaded(true);
setAuthChecking(false);

    } catch (error) {

      console.error(
        "Member session refresh failed:",
        error
      );

    setMember(current.session);
setMembershipLoaded(true);
setAuthChecking(false);
    }

  };

  loadMember();

}, []);
  /* =======================================================
     LOAD UNREAD COUNT ONLY
     
     IMPORTANT:
     Existing unread notifications DO NOT become slides.
  ======================================================= */



  // Google Analytics - dashboard view
useEffect(() => {
  if (
    member?.uid &&
    typeof window.gtag === "function"
  ) {
    window.gtag("event", "dashboard_viewed", {
      user_id: member.uid
    });
  }
}, [member]);

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

 if (!member?.token) {
  return;
}


    let cancelled = false;


    const loadStats =
      async () => {

        try {

          setStatsLoading(true);

const response = await fetch(
  `${DASHBOARD_API}/api/members/dashboard-content`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${member.token}`,
      "Content-Type": "application/json"
    }
  }
);

const data = await response.json();

if (!response.ok || !data.success) {
  throw new Error(
    data.message || "Unable to load dashboard statistics."
  );
}

const purchaseResponse = await fetch(
  `${DASHBOARD_API}/api/payment/purchase-history`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${member.token}`,
      "Content-Type": "application/json"
    }
  }
);

const purchaseData = await purchaseResponse.json();

if (!purchaseResponse.ok || !purchaseData.success) {
  throw new Error(
    purchaseData.message ||
    "Unable to load purchase history."
  );
}

const dashboardStats = data.stats || {};


          if (cancelled) {

            return;

          }


         setStats(
  current => ({
    totalContent:
      dashboardStats.totalContent || 0,

    courses:
      dashboardStats.courses || 0,

    marketReports:
      dashboardStats.marketReports || 0,

    purchases:
      Array.isArray(purchaseData.purchases)
        ? purchaseData.purchases.length
        : 0,

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

    setActivePage(page);

    sessionStorage.setItem(
      "wealthoria-active-page",
      page
    );

    // Google Analytics - track member page navigation
    if (
      typeof window.gtag === "function" &&
      page
    ) {
      window.gtag("event", "member_page_viewed", {
        page_name: page
      });
    }

    setMobileDrawerOpen(false);
  };


  /* =======================================================
     LOGOUT
  ======================================================= */
const logout =
  async () => {

  const current =
    getCurrentMemberSession();


      // Google Analytics - track member logout
  if (
    typeof window.gtag === "function" &&
    current?.session?.uid
  ) {
    window.gtag("event", "member_logout", {
      user_id: current.session.uid
    });
  }


  try {

    const session =
      current?.session;

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

  } catch (error) {

    console.warn(
      "Could not record member logout:",
      error
    );

  }

  /* Remove the current member from BOTH storage types. */
  if (current?.session?.uid) {
    removeCurrentMemberSession(
      current.session.uid
    );
  }

  sessionStorage.removeItem(
    "wealthoria-active-page"
  );

  setMember(null);

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



if (!member) {
  return null;
}

if (!membershipLoaded) {
  return (
    <div className="wd-page-state">
      Loading membership...
    </div>
  );
}
if (membershipDays <= 0) {
  window.location.replace("/members/login");
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

          {/* DASHBOARD FIRST */}

          <div className="wd-nav-title">
            OVERVIEW
          </div>

          <button
            type="button"
            className={
              activePage === "dashboard"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() => openPage("dashboard")}
          >
            <span>⌂</span>
            <b>Dashboard</b>
          </button>


          {/* ALL OTHER PAGES — ALPHABETICAL */}

          <div className="wd-nav-title">
            ALL PAGES
          </div>

          {/* ARTICLES & REPORTS */}

          <button
            type="button"
            className={
              activePage === "articles"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() => openPage("articles")}
          >
            <span>◈</span>
            <b>Articles & Reports</b>
          </button>


          {/* CALCULATORS */}

          <button
            type="button"
            className={
              activePage === "calculator"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() => openPage("calculator")}
          >
            <span>=</span>
            <b>Calculators</b>
          </button>


          {/* COURSES */}

          <button
            type="button"
            className={
              activePage === "courses"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() => openPage("courses")}
          >
            <span>▶</span>
            <b>Courses</b>
          </button>


          {/* NEWSLETTER */}

          <button
            type="button"
            className={
              activePage === "Weekly Order Wins"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() => openPage("newsletter")}
          >
            <span>✉</span>
            <b>Weekly Order Wins</b>
          </button>


          {/* NOTIFICATIONS */}

          <button
            type="button"
            className={
              activePage === "notifications"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() => openPage("notifications")}
          >
            <span>♢</span>
            <b>Notifications</b>

            {unreadNotifications > 0 && (
              <em>
                {unreadNotifications}
              </em>
            )}
          </button>


          {/* PURCHASE HISTORY */}

          <button
            type="button"
            className={
              activePage === "purchase"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() => openPage("purchase")}
          >
            <span>▣</span>
            <b>Purchase History</b>

            {stats.purchases > 0 && (
              <em>
                {stats.purchases}
              </em>
            )}
          </button>


          {/* VIDEOS */}

          <button
            type="button"
            className={
              activePage === "videos"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() => openPage("videos")}
          >
            <span>▶</span>
            <b>Videos</b>
          </button>


          {/* WEEKLY ROUNDUP */}

          <button
            type="button"
            className={
              activePage === "weekly"
                ? "wd-nav-item active"
                : "wd-nav-item"
            }
            onClick={() => openPage("weekly")}
          >
            <span>↗</span>
            <b>Weekly Roundup</b>
          </button>

{/* RATIO ANALYSIS */}

<button
  type="button"
  className={
    activePage === "ratio"
      ? "wd-nav-item active"
      : "wd-nav-item"
  }
  onClick={() => openPage("ratio")}
>
  <span>◈</span>
  <b>Ratio Analysis</b>
</button>


        </nav>


        {/* SIDEBAR LOGOUT */}

        <button
          type="button"
          className="wd-nav-item wd-sidebar-logout"
          onClick={logout}
        >
          <span>↪</span>
          <b>Logout</b>
        </button>


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
                  ? "Weekly Order Wins"
                  : activePage === "weekly"
                  ? "Weekly Roundup"
                  : activePage === "ratio"
                   ? "Ratio Analysis"

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
              className="member-header-button wd-mobile-header-action wd-mobile-notification-action"
          onClick={async () => {
  if (
    "Notification" in window &&
    Notification.permission !== "granted" &&
    typeof window.enableMemberNotifications === "function"
  ) {
    await window.enableMemberNotifications();
  }

  openPage("notifications");
}}
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
              className="wd-header-button wd-mobile-header-action wd-mobile-settings-action"
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
              className="wd-header-button wd-header-logout-button"
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
 {/* NOTIFICATION PERMISSION */}

  {notificationStatus === "not-enabled" && (
    <div className="notification-banner">
      <div className="notification-banner-content">
        <div>
          <strong>🔔 Stay updated with Wealthoria</strong>
          <p>
            Enable notifications to receive important updates,
            webinar reminders and new content.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            if (
              typeof window.enableMemberNotifications === "function"
            ) {
              await window.enableMemberNotifications();

              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                setNotificationStatus("enabled");
              }
            }
          }}
        >
          Enable Notifications
        </button>
      </div>
    </div>
  )}

  {notificationStatus === "enabled" && (
    <div className="notification-success">
      🔔 Notifications are enabled. You'll receive Wealthoria updates on this device.
    </div>
  )}

  {notificationStatus === "blocked" && (
    <div className="notification-blocked">
      🔕 Notifications are blocked. Please enable them in your browser/device settings.
    </div>
  )}

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
                Weekly Order Wins is loading...
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

: activePage === "ratio" ? (

  RatioAnalysis ? (

    <RatioAnalysis />

  ) : (

    <div className="wd-page-state">
      Ratio Analysis is loading...
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

{/* MEMBERSHIP STATUS */}

{(() => {

  const subscriptionStatus =
    String(
      member?.subscription?.status || ""
    ).toLowerCase();

  const isCancelled =
    ["cancelled", "halted"].includes(
      subscriptionStatus
    );

  // Show membership panel only when:
  // 1. Subscription is cancelled
  // 2. Only 1 day is remaining
  // 3. Membership has expired
const showMembershipPanel =
  isCancelled || membershipDays <= 1;
  
  if (!showMembershipPanel) {
    return null;
  }

  return (
    <section className="wd-panel membership-status-panel">

      <div className="wd-panel-head">

        <div>

          <span className="wd-panel-label">
            MEMBERSHIP
          </span>

          <h3>
            {membershipDays <= 0
              ? "Membership Expired"
              : isCancelled
              ? "Membership: Cancelled"
              : "Membership Expiring Soon"}
          </h3>

          <p>
            {membershipDays <= 0
              ? "Your Wealthoria membership has expired."
              : isCancelled
              ? `You still have access until ${getDashboardDate(
                  member?.subscription?.accessUntil ||
                  member?.accessUntil
                )}`
              : "Your membership is ending soon."}
          </p>

        </div>
{membershipDays === 1 && (
  <button
    type="button"
    onClick={activateSubscription}
    disabled={activationLoading}
  >
    {activationLoading
      ? "Opening Payment..."
      : "Activate Subscription"}
  </button>
)}

      </div>

    </section>
  );

})()}

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
    <span>Weekly Roundups</span>

    <strong>
      {statsLoading
        ? "—"
        : stats.marketReports}
    </strong>

    <small>
      Published weekly reports
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

              {/* BOOK PROMO */}

              {DashboardBookPromo && (
                <DashboardBookPromo />
              )}


              {/* LATEST CONTENT */}

              <section className="wd-feature-grid">

                {DashboardLatestContent && (
<DashboardLatestContent
  member={member}
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