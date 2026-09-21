

/* global React, window */
import React from "react";


const { useState, useEffect } = React;

function MemberArticles() {
  const [articles, setArticles] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Expand/collapse description per article
  const [expandedDescriptionId, setExpandedDescriptionId] =
    useState(null);

  const [expandedTagsId, setExpandedTagsId] =
    useState(null);

const API_BASE_URL = "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

  /* =========================================================
     FILE URL
  ========================================================= */

  const getFileUrl = (fileUrl) => {
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
      return API_BASE_URL + fileUrl;
    }

    return API_BASE_URL + "/" + fileUrl;
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    try {
      if (
        value &&
        typeof value.toDate === "function"
      ) {
        return value.toDate().toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }
        );
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
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
    } catch (err) {
      return String(value);
    }
  };

  /* =========================================================
     OPEN PDF
     SAME BEHAVIOUR AS ADMIN UPLOAD
  ========================================================= */

  const openPdf = (article) => {
    if (!article) {
      return;
    }

    if (!article.pdfUrl) {
      console.error(
        "PDF URL missing:",
        article
      );

      return;
    }

    setSelectedPdf(article);
  };

  /* =========================================================
     LOAD ARTICLES & REPORTS
  ========================================================= */

  useEffect(() => {
    if (!window.db) {
      console.error(
        "Firestore is not available."
      );

      setError(
        "Articles & Reports service is not available."
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
          "Articles & Reports"
        )
        .where(
          "status",
          "==",
          "published"
        )
        .onSnapshot(
          (snapshot) => {
            const rows =
              snapshot.docs.map((doc) => {
                const data =
                  doc.data() || {};

                return {
                  id: doc.id,

                  title:
                    data.title ||
                    data.pdfName ||
                    "Wealthoria Article & Report",

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
              });

            /* NEWEST FIRST */

            rows.sort((a, b) => {
              const getTime = (value) => {
                if (!value) {
                  return 0;
                }

                if (
                  typeof value.toMillis ===
                  "function"
                ) {
                  return value.toMillis();
                }

                if (
                  typeof value.toDate ===
                  "function"
                ) {
                  return value
                    .toDate()
                    .getTime();
                }

                const time =
                  new Date(value).getTime();

                return Number.isNaN(time)
                  ? 0
                  : time;
              };

              return (
                getTime(b.publishedAt) -
                getTime(a.publishedAt)
              );
            });

            setArticles(rows);
            setLoading(false);
            setError("");

         
          },

          (err) => {
            console.error(
              "Articles & Reports Firestore error:",
              err
            );

            setError(
              "Unable to load Articles & Reports."
            );

            setLoading(false);
          }
        );

    return () => {
      unsubscribe();
    };
  }, []);

  /* =========================================================
     FILTER + MONTH GROUPING
  ========================================================= */

  const getArticleDate = (value) => {
    if (!value) return null;

    try {
      if (value && typeof value.toDate === "function") {
        return value.toDate();
      }

      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    } catch (err) {
      return null;
    }
  };

  const getArticleTime = (value) => {
    const date = getArticleDate(value);
    return date ? date.getTime() : 0;
  };

  const filteredArticles =
    articles.filter((article) => {
      const searchText = search.trim().toLowerCase();

      const title = String(article.title || "").toLowerCase();
      const description = String(article.description || "").toLowerCase();

      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        description.includes(searchText) ||
        article.tags.some((tag) =>
          String(tag).toLowerCase().includes(searchText)
        );

      const articleDate = getArticleDate(article.publishedAt);

      const from = startDate
        ? new Date(`${startDate}T00:00:00`)
        : null;

      const to = endDate
        ? new Date(`${endDate}T23:59:59.999`)
        : null;

      const matchesFrom = !from || (articleDate && articleDate >= from);
      const matchesTo = !to || (articleDate && articleDate <= to);

      return matchesSearch && matchesFrom && matchesTo;
    })
    .sort((a, b) => getArticleTime(b.publishedAt) - getArticleTime(a.publishedAt));

  const getMonthKey = (value) => {
    const date = getArticleDate(value);
    if (!date) return "unknown";

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMonthLabel = (value) => {
    const date = getArticleDate(value);
    if (!date) return "Date Not Available";

    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric"
    });
  };

  const articleMonths = Object.entries(
    filteredArticles.reduce((groups, article) => {
      const key = getMonthKey(article.publishedAt);

      if (!groups[key]) {
        groups[key] = {
          key,
          label: getMonthLabel(article.publishedAt),
          articles: []
        };
      }

      groups[key].articles.push(article);
      return groups;
    }, {})
  ).sort(([a], [b]) => b.localeCompare(a)).map(([, month]) => month);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <section className="member-newsletter-page">
        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          Loading Articles & Reports...
        </div>
      </section>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

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

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <section className="member-newsletter-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="member-newsletter-header">

        <div>

          <span className="member-eyebrow">
            WEALTHORIA
          </span>

          <h2>
            Articles & Reports
          </h2>

          <p>
            Read the latest Wealthoria articles,
            research reports and investment insights.
          </p>

        </div>

      </div>


      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="newsletter-filters">

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search articles & reports..."
          className="newsletter-search"
        />

        <div className="newsletter-date-filter-group">
          <div className="newsletter-date-field">
            <label htmlFor="articles-from-date">FROM DATE</label>
            <input
              id="articles-from-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="newsletter-date-filter"
            />
          </div>

          <div className="newsletter-date-field">
            <label htmlFor="articles-to-date">TO DATE</label>
            <input
              id="articles-to-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
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

      {/* =====================================================
          CONTENT
      ===================================================== */}

      {filteredArticles.length === 0 ? (

        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          No Articles & Reports available yet.
        </div>

      ) : (

        <div className="member-newsletter-months">
          {articleMonths.map((month) => (
            <section className="member-newsletter-month" key={month.key}>
              <div className="member-newsletter-month-header">
                <div>
                  <span>ARTICLES & REPORTS</span>
                  <h3>{month.label}</h3>
                </div>
                <strong>
                  {month.articles.length} {month.articles.length === 1 ? "Article" : "Articles"}
                </strong>
              </div>

              <div className="member-newsletter-grid">
                {month.articles.map((article) => (
              <article
                className="member-newsletter-card"
                key={article.id}
              >

                {/* =================================================
                    CLICKABLE THUMBNAIL
                    SAME AS ADMIN
                ================================================= */}

                <div
                  role="button"
                  tabIndex={
                    article.pdfUrl ? 0 : -1
                  }
                  onClick={() =>
                    openPdf(article)
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      openPdf(article);
                    }

                  }}
                  className="member-newsletter-icon article-clickable-thumbnail"
                  style={{
                    cursor: article.pdfUrl ? "pointer" : "default"
                  }}
                >

                  {article.thumbnailUrl ? (

                    <img
                      src={getFileUrl(
                        article.thumbnailUrl
                      )}
                      alt={article.title}
                      onError={(event) => {
                        console.error(
                          "Thumbnail failed:",
                          getFileUrl(
                            article.thumbnailUrl
                          )
                        );

                        event.currentTarget.style.display =
                          "none";
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        pointerEvents: "none"
                      }}
                    />

                  ) : (

                    <span>
                      PDF
                    </span>

                  )}

                </div>


                {/* =================================================
                    CONTENT
                ================================================= */}

                <div
                  className="member-newsletter-content"

                >

                  {/* DATE */}

                  <span className="member-newsletter-date">
                    {formatDate(
                      article.publishedAt
                    )}
                  </span>


                  {/* TITLE */}

                  <h3>
                    {article.title}
                  </h3>


                  {/* DESCRIPTION — CSS limits this to exactly two lines */}
                  {article.description && (
                    expandedDescriptionId === article.id ? (
                      <p className="member-newsletter-description article-description-expanded">
                        {article.description}
                        {article.description.length > 0 && (
                          <span
                            className="member-article-description-toggle"
                            role="button"
                            tabIndex={0}
                            onClick={() => setExpandedDescriptionId(null)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setExpandedDescriptionId(null);
                              }
                            }}
                          >
                            less
                          </span>
                        )}
                      </p>
                    ) : (
                      <p
                        className={`member-newsletter-description ${
                          article.description.length > 120
                            ? "article-description-collapsed article-description-expandable"
                            : ""
                        }`}
                        role={article.description.length > 120 ? "button" : undefined}
                        tabIndex={article.description.length > 120 ? 0 : undefined}
                        onClick={() => {
                          if (article.description.length > 120) {
                            setExpandedDescriptionId(article.id);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (
                            article.description.length > 120 &&
                            (event.key === "Enter" || event.key === " ")
                          ) {
                            event.preventDefault();
                            setExpandedDescriptionId(article.id);
                          }
                        }}
                      >
                        {article.description}
                      </p>
                    )
                  )}


                  {/* TAGS
                      First 4 tags + ...
                      Click ... to show all tags.
                      Click less to collapse.
                  */}

                  {article.tags.length > 0 && (
                    <div className="article-report-tags">

                      {expandedTagsId === article.id ? (
                        <>
                          {article.tags.map((tag, index) => (
                            <span
                              key={`${tag}-${index}`}
                              className="badge badge-soft"
                            >
                              {tag}
                            </span>
                          ))}

                          {article.tags.length > 4 && (
                            <span
                              className="member-article-inline-toggle"
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                setExpandedTagsId(null)
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  setExpandedTagsId(null);
                                }
                              }}
                            >
                              less
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {article.tags.slice(0, 4).map((tag, index) => (
                            <span
                              key={`${tag}-${index}`}
                              className="badge badge-soft"
                            >
                              {tag}
                            </span>
                          ))}

                          {article.tags.length > 4 && (
                            <span
                              className="member-article-inline-toggle"
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                setExpandedTagsId(article.id)
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  setExpandedTagsId(article.id);
                                }
                              }}
                            >
                              ...
                            </span>
                          )}
                        </>
                      )}

                    </div>
                  )}

                </div>


                {/* =================================================
                    READ ARTICLE
                ================================================= */}

                <div
                  className="article-report-button-wrap"

                >

                  <button
                    type="button"
                    className="member-newsletter-button article-report-button"
                    onClick={() =>
                      openPdf(article)
                    }
                    style={{
                      cursor: article.pdfUrl ? "pointer" : "default"
                    }}
                  >
                    Read Article →
                  </button>

                </div>

              </article>
                ))}
              </div>
            </section>
          ))}
        </div>

      )}

      {/* =====================================================
          PDF PREVIEW
          SAME IDEA AS ADMIN
      ===================================================== */}

      {selectedPdf &&
        selectedPdf.pdfUrl && (

          <div
            className="member-pdf-overlay"
            onClick={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedPdf(null);
              }

            }}
          >

            <div
              className="member-pdf-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="member-pdf-header">

                <div>

                  <span>
                    ARTICLE & REPORT
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


              {/* PDF */}

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


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.MemberArticles =
  MemberArticles;

window.Articles =
  MemberArticles;

export default MemberArticles;