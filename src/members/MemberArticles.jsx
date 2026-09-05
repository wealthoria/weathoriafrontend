

/* global React, window */
import React from "react";


const { useState, useEffect } = React;

function MemberArticles() {
  const [articles, setArticles] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Expand/collapse description per article
  const [expandedDescriptionId, setExpandedDescriptionId] =
    useState(null);

  const [expandedTagsId, setExpandedTagsId] =
    useState(null);

  const API_BASE_URL =
    "https://webinar-registration-backend.onrender.com";

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

            console.log(
              "Articles & Reports loaded:",
              rows.length
            );
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
     FILTER
  ========================================================= */

  const filteredArticles =
    articles.filter((article) => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      const title =
        String(article.title || "")
          .toLowerCase();

      const description =
        String(article.description || "")
          .toLowerCase();

      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        description.includes(searchText) ||
        article.tags.some((tag) =>
          String(tag)
            .toLowerCase()
            .includes(searchText)
        );

      let matchesDate = true;

      if (selectedDate) {
        let articleDate = "";

        if (
          article.publishedAt &&
          typeof article.publishedAt.toDate ===
            "function"
        ) {
          articleDate =
            article.publishedAt
              .toDate()
              .toISOString()
              .slice(0, 10);
        } else {
          const date =
            new Date(
              article.publishedAt
            );

          if (
            !Number.isNaN(
              date.getTime()
            )
          ) {
            articleDate =
              date
                .toISOString()
                .slice(0, 10);
          }
        }

        matchesDate =
          articleDate ===
          selectedDate;
      }

      return (
        matchesSearch &&
        matchesDate
      );
    });

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

      <div
        className="newsletter-filters"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginTop: 20,
          marginBottom: 24,
          flexWrap: "wrap"
        }}
      >

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search articles & reports..."
          className="newsletter-search"
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(event) =>
            setSelectedDate(
              event.target.value
            )
          }
          className="newsletter-date-filter"
        />

        {(search || selectedDate) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedDate("");
            }}
            className="newsletter-clear-filter"
          >
            Clear
          </button>
        )}

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

        <div className="member-newsletter-grid">

          {filteredArticles.map(
            (article) => (

              <article
                className="member-newsletter-card"
                key={article.id}
              >

                {/* =================================================
                    CLICKABLE THUMBNAIL
                    SAME AS ADMIN
                ================================================= */}

                <div
                  className="member-newsletter-icon article-clickable-thumbnail"
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
                  style={{
                    width: "100%",
                    height: 180,
                    overflow: "hidden",
                    borderRadius: 12,
                    flexShrink: 0,
                    cursor: article.pdfUrl
                      ? "pointer"
                      : "default"
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
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column"
                  }}
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


                  {/* DESCRIPTION
                      <= 150 characters: show full description
                      > 150 characters: show first 150 + clickable ...
                      Click ...: expand
                      Click less: collapse
                  */}

                  {article.description && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "inherit",
                        opacity: 0.78,
                        display: "block",
                        width: "100%",
                        minHeight: 20,
                        overflow: "visible"
                      }}
                    >
                      {expandedDescriptionId === article.id ? (
                        <>
                          {article.description}

                          {article.description.length > 150 && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                setExpandedDescriptionId(null)
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  setExpandedDescriptionId(null);
                                }
                              }}
                              style={{
                                display: "inline",
                                marginLeft: 4,
                                color: "#e8473f",
                                fontWeight: 700,
                                textDecoration: "underline",
                                cursor: "pointer",
                                opacity: 1,
                                position: "relative",
                                zIndex: 50
                              }}
                            >
                              less
                            </span>
                          )}
                        </>
                      ) : article.description.length > 150 ? (
                        <>
                          {article.description
                            .slice(0, 150)
                            .trimEnd()}

                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="Show full description"
                            onClick={() =>
                              setExpandedDescriptionId(article.id)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                setExpandedDescriptionId(article.id);
                              }
                            }}
                            style={{
                              display: "inline",
                              marginLeft: 2,
                              color: "#e8473f",
                              fontWeight: 700,
                              textDecoration: "underline",
                              cursor: "pointer",
                              opacity: 1,
                              position: "relative",
                              zIndex: 50
                            }}
                          >
                            ...
                          </span>
                        </>
                      ) : (
                        article.description
                      )}
                    </div>
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
                  style={{
                    marginTop: "auto",
                    paddingTop: 20
                  }}
                >

                  <button
                    type="button"
                    className="member-newsletter-button article-report-button"
                    onClick={() =>
                      openPdf(article)
                    }
                    style={{
                      width: "100%",
                      position: "relative",
                      zIndex: 30,
                      pointerEvents: "auto",
                      cursor: article.pdfUrl
                        ? "pointer"
                        : "default"
                    }}
                  >
                    Read Article →
                  </button>

                </div>

              </article>

            )
          )}

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