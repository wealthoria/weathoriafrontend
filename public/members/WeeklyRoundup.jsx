/* global React, window */

const { useState, useEffect } = React;

/* =========================================================
   WEEKLY ROUNDUP
   Displays inside the Members dashboard content area.
========================================================= */

function WeeklyRoundup() {

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoundup, setSelectedRoundup] = useState(null);

  const roundups = [
    {
      id: 1,
      title: "Weekly Market Roundup",
      date: "This Week",
      category: "Market Insights",
      summary:
        "A concise overview of the important market movements, trends and developments from the week.",
      content:
        "Use this space to publish the weekly Wealthoria market roundup. Add the week's key market movements, important events, sector updates and educational observations here."
    },
    {
      id: 2,
      title: "Markets & Economy",
      date: "Latest",
      category: "Economy",
      summary:
        "Key economic developments and what they mean for investors.",
      content:
        "Add the latest economic developments, policy updates, inflation information and other important investor-focused observations here."
    },
    {
      id: 3,
      title: "Investor Learning Corner",
      date: "Latest",
      category: "Education",
      summary:
        "Simple financial concepts and practical lessons for members.",
      content:
        "Add educational content here to help members understand investing concepts before making investment decisions."
    }
  ];

  const filteredRoundups =
    roundups.filter((item) => {

      const query =
        searchQuery.trim().toLowerCase();

      if (!query) return true;

      return (
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      );

    });


  /* =======================================================
     DETAIL VIEW
  ======================================================= */

  if (selectedRoundup) {

    return (

      <section className="member-weekly-roundup-page">

        <div className="member-chart-header">

          <div>

            <span className="member-eyebrow">
              WEEKLY ROUNDUP
            </span>

            <h2>
              {selectedRoundup.title}
            </h2>

            <p>
              {selectedRoundup.date}
              {" • "}
              {selectedRoundup.category}
            </p>

          </div>

          <button
            type="button"
            className="member-panel-link"
            onClick={() =>
              setSelectedRoundup(null)
            }
          >
            ← Back to Weekly Roundup
          </button>

        </div>


        <article
          className="member-weekly-roundup-article"
          style={{
            marginTop: 24,
            padding: 28,
            borderRadius: 18,
            background:
              "var(--member-card-bg, #ffffff)",
            border:
              "1px solid var(--member-border, #e7e7e7)"
          }}
        >

          <span
            style={{
              display: "inline-block",
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#e8473f"
            }}
          >
            {selectedRoundup.category}
          </span>

          <h3
            style={{
              marginTop: 0,
              marginBottom: 14
            }}
          >
            {selectedRoundup.title}
          </h3>

          <p
            style={{
              lineHeight: 1.8,
              marginBottom: 0
            }}
          >
            {selectedRoundup.content}
          </p>

        </article>

      </section>

    );

  }


  /* =======================================================
     LIST VIEW
  ======================================================= */

  return (

    <section className="member-weekly-roundup-page">

      <div className="member-chart-header">

        <div>

          <span className="member-eyebrow">
            MEMBER LEARNING
          </span>

          <h2>
            Weekly Roundup
          </h2>

          <p>
            Stay updated with weekly market
            insights and investor-focused updates.
          </p>

        </div>

        <button
          type="button"
          className="member-panel-link"
          onClick={() => {

            if (window.membersNavigate) {
              window.membersNavigate(
                "/members/dashboard"
              );
            }

          }}
        >
          ← Back to Dashboard
        </button>

      </div>


      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div
        style={{
          marginTop: 22,
          marginBottom: 24
        }}
      >

        <div
          style={{
            position: "relative",
            maxWidth: 620
          }}
        >

          <span
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              opacity: 0.55
            }}
          >
            🔍
          </span>

          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search weekly roundup..."
            aria-label="Search weekly roundup"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding:
                "14px 18px 14px 46px",
              borderRadius: 12,
              border:
                "1px solid var(--member-border, #dddddd)",
              background:
                "var(--member-input-bg, #ffffff)",
              color:
                "var(--member-text, #222222)",
              outline: "none",
              fontSize: 15
            }}
          />

        </div>

      </div>


      {/* =====================================================
          CARDS
      ===================================================== */}

      {filteredRoundups.length === 0 ? (

        <div
          style={{
            padding: 40,
            textAlign: "center",
            borderRadius: 16,
            border:
              "1px solid var(--member-border, #e7e7e7)"
          }}
        >

          <h3>
            No roundup found
          </h3>

          <p>
            Try another search.
          </p>

        </div>

      ) : (

        <div
          className="member-dashboard-grid"
        >

          {filteredRoundups.map(
            (item) => (

              <article
                key={item.id}
                className="member-panel"
                style={{
                  cursor: "default"
                }}
              >

                <div
                  className="member-panel-header"
                >

                  <div>

                    <span
                      className="member-panel-label"
                    >
                      {item.category}
                    </span>

                    <h3>
                      {item.title}
                    </h3>

                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      opacity: 0.65
                    }}
                  >
                    {item.date}
                  </span>

                </div>


                <p>
                  {item.summary}
                </p>


                <button
                  type="button"
                  className="member-panel-link"
                  onClick={() =>
                    setSelectedRoundup(item)
                  }
                  style={{
                    marginTop: 10
                  }}
                >
                  Read roundup →
                </button>

              </article>

            )
          )}

        </div>

      )}

    </section>

  );

}


/* =========================================================
   EXPORT
========================================================= */

window.WeeklyRoundup =
  WeeklyRoundup;