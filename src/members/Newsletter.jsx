import React from "react";

/* global React, window */

const { useState, useEffect } = React;

function Newsletter() {

  const [newsletters, setNewsletters] = useState([]);

  const [selectedPdf, setSelectedPdf] = useState(null);

  const [loading, setLoading] =  useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

const [contentType, setContentType] =  useState("all");

const [startDate, setStartDate] =
  useState("");

const [endDate, setEndDate] =
  useState("");


const API_BASE_URL = "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

  const getFileUrl = (fileUrl) => {

    if (!fileUrl) {
      return "";
    }

    if (
      fileUrl.startsWith("http://") || fileUrl.startsWith("https://")
    ) {
      return fileUrl;
    }

    if (fileUrl.startsWith("/")) {
      return API_BASE_URL + fileUrl;
    }

    return API_BASE_URL + "/" + fileUrl;
  };




  const formatDate = (value) => {

    if (!value) {
      return "";
    }

    try {

      if (
        value &&
        typeof value.toDate === "function"
      ) {
        return value
          .toDate()
          .toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          );
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return String(value);
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

      return String(value);

    }
  };
  useEffect(() => {

    if (!window.db) {

      console.error(
        "Firestore is not available."
      );

      setError(
        "Newsletter service is not available."
      );

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
                      "Wealthoria Newsletter",

                    description:
                      data.description ||
                      "",

                    tags:
                      Array.isArray(data.tags)
                        ? data.tags
                        : [],

                    pdfUrl:
                      data.pdfUrl ||
                      "",

                    thumbnailUrl:
                      data.thumbnailUrl ||
                      "",

                    publishedAt:
                      data.publishedAt ||
                      data.createdAt ||
                      ""
                  };

                }
              );

            setNewsletters(rows);

            setLoading(false);

            setError("");

          },

          (err) => {

            console.error(
              "Newsletter Firestore error:",
              err
            );

            setError(
              "Unable to load newsletters."
            );

            setLoading(false);

          }
        );

    return () => {
      unsubscribe();
    };

  }, []);



const filteredNewsletters =
  newsletters.filter(
    (newsletter) => {

      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        newsletter.title.toLowerCase().includes(searchText) ||
        newsletter.description.toLowerCase().includes(searchText) ||
        newsletter.tags.some(
          (tag) =>
            String(tag).toLowerCase().includes(searchText)
        );

      let newsletterTime = 0;

      try {
        const value = newsletter.publishedAt;

        if (
          value &&
          typeof value.toDate === "function"
        ) {
          newsletterTime = value.toDate().getTime();
        } else {
          const parsed = new Date(value).getTime();

          if (!Number.isNaN(parsed)) {
            newsletterTime = parsed;
          }
        }
      } catch (error) {
        newsletterTime = 0;
      }

      let matchesDate = true;

      if (startDate) {
        const startTime =
          new Date(`${startDate}T00:00:00`).getTime();

        matchesDate =
          newsletterTime > 0 &&
          newsletterTime >= startTime;
      }

      if (matchesDate && endDate) {
        const endTime =
          new Date(`${endDate}T23:59:59.999`).getTime();

        matchesDate =
          newsletterTime > 0 &&
          newsletterTime <= endTime;
      }

      return matchesSearch && matchesDate;
    }
  );

const getMonthKey = (value) => {
  try {
    const date =
      value && typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);

    if (!date || Number.isNaN(date.getTime())) {
      return "unknown";
    }

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
  } catch (error) {
    return "unknown";
  }
};

const getMonthLabel = (value) => {
  try {
    const date =
      value && typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);

    if (!date || Number.isNaN(date.getTime())) {
      return "Other Weekly order wins";
    }

    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric"
    });
  } catch (error) {
    return "Other Weekly order wins";
  }
};

const newsletterMonths = (() => {
  const groups = {};

  filteredNewsletters.forEach((newsletter) => {
    const monthKey = getMonthKey(newsletter.publishedAt);

    if (!groups[monthKey]) {
      groups[monthKey] = {
        label: getMonthLabel(newsletter.publishedAt),
        newsletters: []
      };
    }

    groups[monthKey].newsletters.push(newsletter);
  });

  return Object.entries(groups).sort(([a], [b]) =>
    b.localeCompare(a)
  );
})();

  if (loading) {
    return (
      <section className="member-newsletter-page">
        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          Loading Weekly Order Wins...
        </div>
      </section>
    );
  }


  if (error) {
    return (
      <section className="member-newsletter-page">
        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          {error}
        </div>
      </section>
    );
  }


  return (
    <section className="member-newsletter-page">

      <div className="member-newsletter-header">

        <div>

          <span className="member-eyebrow">
            WEALTHORIA
          </span>

          <h2>
            Weekly Order Wins
          </h2>

          <p>
            Read the latest Wealthoria Weekly order wins,
            market updates and investment insights.
          </p>

        </div>

      </div>
<div
  className="newsletter-filters"
>

  <input
    type="search"
    value={search}
    onChange={(event) =>
      setSearch(event.target.value)
    }
    placeholder="Search Weekly order wins..."
    className="newsletter-search"
  />

  <div className="newsletter-date-filter-group">

    <div className="newsletter-date-field">
      <label htmlFor="newsletter-start-date">
        From Date
      </label>

      <input
        id="newsletter-start-date"
        type="date"
        value={startDate}
        onChange={(event) =>
          setStartDate(event.target.value)
        }
        className="newsletter-date-filter"
      />
    </div>

    <div className="newsletter-date-field">
      <label htmlFor="newsletter-end-date">
        To Date
      </label>

      <input
        id="newsletter-end-date"
        type="date"
        value={endDate}
        min={startDate || undefined}
        onChange={(event) =>
          setEndDate(event.target.value)
        }
        className="newsletter-date-filter"
      />
    </div>

    {(search || startDate || endDate) && (
      <button
        type="button"
        onClick={() => {
          setSearch("");
          setStartDate("");
          setEndDate("");
        }}
        className="newsletter-clear-filter"
      >
        Clear
      </button>
    )}

  </div>

</div>

     {filteredNewsletters.length === 0  ? (




        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          No Weekly order wins available yet.
        </div>

      ) : (

        <div className="member-newsletter-months">

          {newsletterMonths.map(
            ([monthKey, month]) => (
              <section
                className="member-newsletter-month"
                key={monthKey}
              >

                <div className="member-newsletter-month-header">

                  <div>
                    <span className="member-newsletter-month-eyebrow">
                      NEWSLETTER LIBRARY
                    </span>

                    <h3>
                      {month.label}
                    </h3>
                  </div>

                  <span className="member-newsletter-month-count">
                    {month.newsletters.length}{" "}
                    {month.newsletters.length === 1
                      ? "Newsletter"
                      : "Newsletters"}
                  </span>

                </div>

                <div className="member-newsletter-grid">

                  {month.newsletters.map(
                    (newsletter) => (
                      <article
                        className="member-newsletter-card"
                        key={newsletter.id}
                      >

                        <div className="member-newsletter-icon">

                          {newsletter.thumbnailUrl ? (
                            <img
                              src={getFileUrl(
                                newsletter.thumbnailUrl
                              )}
                              alt={newsletter.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block"
                              }}
                            />
                          ) : (
                            <span>PDF</span>
                          )}

                        </div>

                        <div className="member-newsletter-content">

                          <span className="member-newsletter-date">
                            {formatDate(
                              newsletter.publishedAt
                            )}
                          </span>

                          <h3>
                            {newsletter.title}
                          </h3>

                          <p>
                            {newsletter.description}
                          </p>

                          {newsletter.tags.length > 0 && (
                            <div className="member-newsletter-tags">
                              {newsletter.tags
                                .slice(0, 4)
                                .map((tag) => (
                                  <span
                                    key={tag}
                                    className="badge badge-soft"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          )}

                        </div>

                        <button
                          type="button"
                          className="member-newsletter-button"
                          disabled={!newsletter.pdfUrl}
                         onClick={() => {
  if (!newsletter.pdfUrl) {
    return;
  }

  // Google Analytics - track newsletter opened
  if (typeof window.gtag === "function") {
    window.gtag("event", "newsletter_opened", {
      content_id: String(newsletter.id || ""),
      content_title: newsletter.title || ""
    });
  }

  setSelectedPdf(newsletter);
}}
                        >
                          Read Newsletter →
                        </button>

                      </article>
                    )
                  )}

                </div>

              </section>
            )
          )}

        </div>
      )}


      {selectedPdf && (

        <div
          className="member-pdf-overlay"
          onClick={() =>
            setSelectedPdf(null)
          }
        >

          <div
            className="member-pdf-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
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
                type="button"
                className="member-pdf-close"
                onClick={() =>
                  setSelectedPdf(null)
                }
              >
                ×
              </button>

            </div>


            <iframe
              src={`${getFileUrl(
                selectedPdf.pdfUrl
              )}#toolbar=0&navpanes=0`}
              title={selectedPdf.title}
              className="member-pdf-frame"
            />

          </div>

        </div>

      )}

    </section>
  );




}

window.Newsletter = Newsletter;
