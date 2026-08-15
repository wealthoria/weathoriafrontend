/* global React, window */

const { useState, useEffect } = React;

/* =========================================================
   WEEKLY ROUNDUP
   ========================================================= */

function WeeklyRoundup() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     SAMPLE WEEKLY ROUNDUP DATA

     Replace/add articles here whenever you want to publish
     new weekly market updates.
  ========================================================= */

  const defaultArticles = [
    {
      id: 1,
      title: "Weekly Market Roundup",
      category: "MARKET UPDATE",
      date: "This Week",
      summary:
        "A quick overview of the important market developments, trends and financial news from this week.",
      content: `
        Markets continued to remain active this week with investors
        closely watching economic developments, corporate results
        and overall market sentiment.

        The key takeaway for investors is to remain focused on
        long-term financial goals rather than reacting to short-term
        market movements.

        Always understand the risk associated with an investment
        before making any investment decision.
      `
    },

    {
      id: 2,
      title: "Understanding Market Volatility",
      category: "LEARNING",
      date: "This Week",
      summary:
        "Why markets move up and down and how investors can handle short-term volatility.",
      content: `
        Market volatility is a normal part of investing.

        Prices can change because of economic announcements,
        company results, interest-rate expectations, global events
        and investor sentiment.

        Short-term volatility does not necessarily change the
        long-term fundamentals of an investment.

        Investors should therefore avoid making emotional decisions
        based only on short-term price movements.
      `
    },

    {
      id: 3,
      title: "Investor Focus This Week",
      category: "INVESTOR INSIGHTS",
      date: "This Week",
      summary:
        "Important points investors should keep in mind while reviewing their portfolio.",
      content: `
        Review your financial goals and make sure your investments
        are aligned with your time horizon and risk tolerance.

        Diversification can help reduce concentration risk.

        Regularly reviewing your portfolio is useful, but frequent
        unnecessary changes can also increase costs and emotional
        decision-making.
      `
    }
  ];

  /* =========================================================
     LOAD ARTICLES

     Data is stored locally so refresh will NOT remove the page.
     ========================================================= */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "wealthoria-weekly-roundup"
        );

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          setArticles(parsed);
          return;
        }
      }

      setArticles(defaultArticles);

      localStorage.setItem(
        "wealthoria-weekly-roundup",
        JSON.stringify(defaultArticles)
      );
    } catch (error) {
      console.error(
        "Weekly Roundup loading error:",
        error
      );

      setArticles(defaultArticles);
    }
  }, []);

  /* =========================================================
     OPEN ARTICLE
     ========================================================= */

  const openArticle = (article) => {
    setSelectedArticle(article);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /* =========================================================
     CLOSE ARTICLE
     ========================================================= */

  const closeArticle = () => {
    setSelectedArticle(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /* =========================================================
     BACK TO DASHBOARD
     ========================================================= */

  const backToDashboard = () => {
    if (window.membersNavigate) {
      window.membersNavigate(
        "/members/dashboard"
      );
      return;
    }

    window.history.pushState(
      {},
      "",
      "/members/dashboard"
    );

    window.dispatchEvent(
      new PopStateEvent("popstate")
    );
  };

  /* =========================================================
     ARTICLE VIEW
     ========================================================= */

  if (selectedArticle) {
    return (
      <section className="weekly-roundup-page">

        <div className="weekly-roundup-header">

          <button
            type="button"
            className="weekly-roundup-back"
            onClick={closeArticle}
          >
            ← Back to Weekly Roundup
          </button>

        </div>

        <article className="weekly-roundup-article">

          <div className="weekly-roundup-article-meta">
            <span>
              {selectedArticle.category}
            </span>

            <span>
              {selectedArticle.date}
            </span>
          </div>

          <h1>
            {selectedArticle.title}
          </h1>

          <p className="weekly-roundup-article-summary">
            {selectedArticle.summary}
          </p>

          <div className="weekly-roundup-divider" />

          <div className="weekly-roundup-article-content">
            {selectedArticle.content
              .trim()
              .split("\n\n")
              .map((paragraph, index) => (
                <p key={index}>
                  {paragraph.trim()}
                </p>
              ))}
          </div>

        </article>

      </section>
    );
  }

  /* =========================================================
     MAIN WEEKLY ROUNDUP PAGE
     ========================================================= */

  return (
    <section className="weekly-roundup-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="weekly-roundup-top">

        <div>

          <span className="weekly-roundup-eyebrow">
            MEMBER RESOURCE
          </span>

          <h1>
            Weekly Roundup
          </h1>

          <p>
            Stay updated with weekly market insights,
            financial developments and investor education.
          </p>

        </div>

        <button
          type="button"
          className="weekly-roundup-dashboard-button"
          onClick={backToDashboard}
        >
          ← Dashboard
        </button>

      </div>


      {/* =====================================================
          DIVIDER
      ===================================================== */}

      <div className="weekly-roundup-line" />


      {/* =====================================================
          INTRO
      ===================================================== */}

      <div className="weekly-roundup-intro">

        <div className="weekly-roundup-intro-icon">
          📰
        </div>

        <div>

          <h2>
            Latest Weekly Insights
          </h2>

          <p>
            Explore the latest updates and educational
            insights prepared for Wealthoria members.
          </p>

        </div>

      </div>


      {/* =====================================================
          ARTICLES
      ===================================================== */}

      {loading ? (

        <div className="weekly-roundup-loading">
          Loading Weekly Roundup...
        </div>

      ) : articles.length === 0 ? (

        <div className="weekly-roundup-empty">

          <div className="weekly-roundup-empty-icon">
            📰
          </div>

          <h3>
            No weekly updates yet
          </h3>

          <p>
            New weekly market insights will appear here.
          </p>

        </div>

      ) : (

        <div className="weekly-roundup-grid">

          {articles.map((article) => (

            <article
              key={article.id}
              className="weekly-roundup-card"
            >

              <div className="weekly-roundup-card-top">

                <span className="weekly-roundup-category">
                  {article.category}
                </span>

                <span className="weekly-roundup-date">
                  {article.date}
                </span>

              </div>


              <h3>
                {article.title}
              </h3>


              <p>
                {article.summary}
              </p>


              <button
                type="button"
                className="weekly-roundup-read-button"
                onClick={() =>
                  openArticle(article)
                }
              >
                Read More
                <span>→</span>
              </button>

            </article>

          ))}

        </div>

      )}


      {/* =====================================================
          FOOTER NOTE
      ===================================================== */}

      <div className="weekly-roundup-note">

        <strong>
          Wealthoria Member Resource
        </strong>

        <p>
          This section is intended for educational
          purposes. Market information should not be
          considered personalised investment advice.
        </p>

      </div>

    </section>
  );
}


/* =========================================================
   IMPORTANT

   dashboard.jsx uses:

   window.WeeklyRoundup

   Therefore we MUST expose the component globally.
   ========================================================= */

window.WeeklyRoundup = WeeklyRoundup;

console.log(
  "WeeklyRoundup component loaded successfully"
);