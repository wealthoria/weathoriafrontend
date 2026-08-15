/* global React, window */

function WeeklyRoundup() {
  return (
    <section className="member-roundup-page">

      {/* HEADER */}
      <div className="member-roundup-header">

        <div>
          <span className="member-eyebrow">
            WEALTHORIA
          </span>

          <h2>
            Weekly Roundup
          </h2>

          <p>
            Stay updated with the latest market developments,
            financial insights and important investment updates.
          </p>
        </div>

      </div>


      {/* SEARCH */}
      <div className="member-roundup-search">

        <span className="member-roundup-search-icon">
          🔍
        </span>

        <input
          type="text"
          placeholder="Search weekly updates..."
        />

      </div>


      {/* CURRENT WEEK */}
      <div className="member-roundup-card">

        <div className="member-roundup-card-top">

          <div>
            <span className="member-roundup-label">
              WEEKLY MARKET UPDATE
            </span>

            <h3>
              Weekly Market Roundup
            </h3>
          </div>

          <span className="member-roundup-date">
            August 2026
          </span>

        </div>


        <div className="member-roundup-divider"></div>


        <p className="member-roundup-description">
          Get a quick overview of the important market
          movements, investment developments and financial
          news from the week.
        </p>


        {/* MARKET ITEMS */}
        <div className="member-roundup-items">

          <div className="member-roundup-item">

            <span className="member-roundup-number">
              01
            </span>

            <div>
              <h4>
                Market Overview
              </h4>

              <p>
                Key movements and developments in the
                financial markets this week.
              </p>
            </div>

          </div>


          <div className="member-roundup-item">

            <span className="member-roundup-number">
              02
            </span>

            <div>
              <h4>
                Important Developments
              </h4>

              <p>
                Important financial and economic developments
                investors should know about.
              </p>
            </div>

          </div>


          <div className="member-roundup-item">

            <span className="member-roundup-number">
              03
            </span>

            <div>
              <h4>
                Investor Insights
              </h4>

              <p>
                Simple insights to help members understand
                the week's market activity.
              </p>
            </div>

          </div>

        </div>


        {/* PDF / REPORT AREA */}
        <div className="member-roundup-report">

          <div className="member-roundup-report-icon">
            PDF
          </div>

          <div className="member-roundup-report-info">

            <strong>
              Weekly Market Report
            </strong>

            <span>
              Latest weekly investment insights
            </span>

          </div>

          <button
            className="member-roundup-report-button"
            onClick={() => {
              alert("Weekly report will be available here.");
            }}
          >
            Read Report →
          </button>

        </div>

      </div>


      {/* PREVIOUS WEEKS */}
      <div className="member-roundup-section-title">

        <div>
          <span className="member-eyebrow">
            ARCHIVE
          </span>

          <h3>
            Previous Roundups
          </h3>
        </div>

      </div>


      <div className="member-roundup-grid">

        {/* WEEK 1 */}
        <div className="member-roundup-small-card">

          <span className="member-roundup-small-date">
            August 2026
          </span>

          <h4>
            Weekly Market Roundup
          </h4>

          <p>
            Market movements and important investment
            developments from the week.
          </p>

          <button
            onClick={() => {
              alert("Report will be available here.");
            }}
          >
            Read More →
          </button>

        </div>


        {/* WEEK 2 */}
        <div className="member-roundup-small-card">

          <span className="member-roundup-small-date">
            July 2026
          </span>

          <h4>
            Weekly Investment Update
          </h4>

          <p>
            A simple overview of the week's important
            financial developments.
          </p>

          <button
            onClick={() => {
              alert("Report will be available here.");
            }}
          >
            Read More →
          </button>

        </div>


        {/* WEEK 3 */}
        <div className="member-roundup-small-card">

          <span className="member-roundup-small-date">
            July 2026
          </span>

          <h4>
            Market Insights
          </h4>

          <p>
            Key insights and developments for investors
            from the previous week.
          </p>

          <button
            onClick={() => {
              alert("Report will be available here.");
            }}
          >
            Read More →
          </button>

        </div>

      </div>

    </section>
  );
}


/* EXPORT */
window.WeeklyRoundup = WeeklyRoundup;