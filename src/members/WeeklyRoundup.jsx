import React from "react";

/* global React, window */

const { useState, useEffect } = React;

function WeeklyRoundup() {

  const [reports, setReports] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");


  const API_BASE_URL =
    "https://webinar-registration-backend.onrender.com";


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
        "Weekly Roundup service is not available."
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


            setReports(rows);

            setLoading(false);

            setError("");

          },


          (err) => {

            console.error(
              "Weekly Roundup Firestore error:",
              err
            );

            setError(
              "Unable to load Weekly Roundup reports."
            );

            setLoading(false);

          }
        );


    return () => {
      unsubscribe();
    };

  }, []);


  const filteredReports =
    reports.filter(
      (report) => {

        const searchText =
          search
            .trim()
            .toLowerCase();


        const matchesSearch =
          !searchText ||
          report.title
            .toLowerCase()
            .includes(searchText) ||
          report.description
            .toLowerCase()
            .includes(searchText) ||
          report.tags.some(
            (tag) =>
              String(tag)
                .toLowerCase()
                .includes(searchText)
          );


        let matchesDate = true;


        if (selectedDate) {

          let reportDate = "";


          if (
            report.publishedAt &&
            typeof report.publishedAt.toDate ===
              "function"
          ) {

            const date =
              report.publishedAt
                .toDate();

            reportDate =
              date
                .toISOString()
                .slice(0, 10);

          } else {

            const date =
              new Date(
                report.publishedAt
              );

            if (
              !Number.isNaN(
                date.getTime()
              )
            ) {

              reportDate =
                date
                  .toISOString()
                  .slice(0, 10);

            }

          }


          matchesDate =
            reportDate ===
            selectedDate;

        }


        return (
          matchesSearch &&
          matchesDate
        );

      }
    );


  if (loading) {

    return (
      <section className="member-newsletter-page">

        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          Loading Weekly Roundup...
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


      {/* HEADER */}

      <div className="member-newsletter-header">

        <div>

          <span className="member-eyebrow">
            WEALTHORIA
          </span>

          <h2>
            Weekly Roundup
          </h2>

          <p>
            Read the latest Wealthoria weekly
            market updates and investment insights.
          </p>

        </div>

      </div>


      {/* FILTERS */}

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
            setSearch(event.target.value)
          }
          placeholder="Search weekly roundup..."
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


      {/* REPORTS */}

      {filteredReports.length === 0 ? (

        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          No Weekly Roundup reports available yet.
        </div>

      ) : (

        <div className="member-newsletter-grid">

          {filteredReports.map((report) => (

            <article
              className="member-newsletter-card"
              key={report.id}
            >


              {/* THUMBNAIL */}

              <div className="member-newsletter-icon">

                {report.thumbnailUrl ? (

                  <img
  src={getFileUrl(report.thumbnailUrl)}
  alt={report.title}
  style={{
    width: "auto",
    height: "140px",
    maxWidth: "100%",
    objectFit: "contain",
    display: "block",
    margin: "0 auto"
  }}
/>

                ) : (

                  <span>PDF</span>

                )}

              </div>


              {/* CONTENT */}

              <div className="member-newsletter-content">

                <span className="member-newsletter-date">

                  {formatDate(
                    report.publishedAt
                  )}

                </span>


                <h3>
                  {report.title}
                </h3>


                <p>
                  {report.description}
                </p>


                {report.tags.length > 0 && (

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 10
                    }}
                  >

                    {report.tags
                      .slice(0, 4)
                      .map((tag) => (

                        <span
                          key={tag}
                          className="badge badge-soft"
                          style={{
                            fontSize: 10
                          }}
                        >
                          {tag}
                        </span>

                      ))}

                  </div>

                )}

              </div>


              {/* BUTTON */}

              <button
                type="button"
                className="member-newsletter-button"
                disabled={!report.pdfUrl}
                onClick={() => {

                  if (!report.pdfUrl) {
                    return;
                  }

                  setSelectedPdf(report);

                }}
              >
                Read Report →
              </button>


            </article>

          ))}

        </div>

      )}


      {/* PDF POPUP */}

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
                  WEEKLY ROUNDUP
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


window.WeeklyRoundup = WeeklyRoundup;
