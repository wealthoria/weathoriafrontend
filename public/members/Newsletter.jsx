/* global React, window */

const { useState } = React;

function Newsletter() {

  const [selectedPdf, setSelectedPdf] = useState(null);

  // SAMPLE DATA
  // Later this will come from your backend}

  const newsletters = [
  {
    id: 1,
    title: "Wealthoria Monthly Newsletter",
    description:
      "Latest market insights, investment ideas and financial updates.",
    date: "August 2026",
    file: "/members/pdfs/wealthoria-august-2026.pdf"
  }
];
  return (
    <section className="member-newsletter-page">

      <div className="member-newsletter-header">

        <div>
          <span className="member-eyebrow">
            WEALTHORIA
          </span>

          <h2>
            Newsletters
          </h2>

          <p>
            Read the latest Wealthoria newsletters,
            market updates and investment insights.
          </p>
        </div>

      </div>


      {/* NEWSLETTER GRID */}

      <div className="member-newsletter-grid">

        {newsletters.map((newsletter) => (

          <div
            className="member-newsletter-card"
            key={newsletter.id}
          >

            <div className="member-newsletter-icon">
              PDF
            </div>

            <div className="member-newsletter-content">

              <span className="member-newsletter-date">
                {newsletter.date}
              </span>

              <h3>
                {newsletter.title}
              </h3>

              <p>
                {newsletter.description}
              </p>

            </div>

            <button
              className="member-newsletter-button"
              onClick={() =>
                setSelectedPdf(newsletter)
              }
            >
              Read Newsletter →
            </button>

          </div>

        ))}

      </div>


      {/* PDF VIEWER */}

      {selectedPdf && (

        <div
          className="member-pdf-overlay"
          onClick={() => setSelectedPdf(null)}
        >

          <div
            className="member-pdf-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="member-pdf-header">

              <div>
                <span>
                  NEWSLETTER
                </span>

                <h3>
                  {selectedPdf.title}
                </h3>
              </div>

              <button
                className="member-pdf-close"
                onClick={() => setSelectedPdf(null)}
              >
                ×
              </button>

            </div>


            <iframe
              src={selectedPdf.file}
              title={selectedPdf.title}
              className="member-pdf-frame"
            />


            <div className="member-pdf-footer">

              <a
                href={selectedPdf.file}
                target="_blank"
                rel="noopener noreferrer"
                className="member-pdf-open"
              >
                Open PDF in new tab ↗
              </a>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}

window.Newsletter = Newsletter;