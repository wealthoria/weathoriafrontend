import React from "react";

/* global React, window */

const { useState, useEffect } = React;

function RatioAnalysis() {

  const [reports, setReports] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  const API_BASE_URL =
    "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";


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
        "Ratio Analysis service is not available."
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
         "Ratio Analysis"
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
                      "Ratio Analysis",

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

pdfPath:
  data.pdfPath ||
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
              "Ratio Analysis Firestore error:",
              err
            );

            setError(
              "Unable to load Ratio Analysis reports."
            );

            setLoading(false);

          }
        );


    return () => {
      unsubscribe();
    };

  }, []);


  const getReportDate = (value) => {
    if (!value) return null;

    try {
      if (value && typeof value.toDate === "function") {
        return value.toDate();
      }

      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  };

  const filteredReports = reports.filter((report) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      String(report.title || "").toLowerCase().includes(searchText) ||
      String(report.description || "").toLowerCase().includes(searchText) ||
      report.tags.some((tag) =>
        String(tag).toLowerCase().includes(searchText)
      );

    const reportDate = getReportDate(report.publishedAt);

    let matchesStartDate = true;
    let matchesEndDate = true;

    if (startDate) {
      const from = new Date(`${startDate}T00:00:00`);
      matchesStartDate = reportDate ? reportDate >= from : false;
    }

    if (endDate) {
      const to = new Date(`${endDate}T23:59:59.999`);
      matchesEndDate = reportDate ? reportDate <= to : false;
    }

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const getMonthKey = (value) => {
    const date = getReportDate(value);
    if (!date) return "unknown";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMonthLabel = (monthKey) => {
    if (monthKey === "unknown") return "Undated Reports";

    const [year, month] = monthKey.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
      "en-IN",
      { month: "long", year: "numeric" }
    );
  };

  const groupedReports = filteredReports.reduce((groups, report) => {
    const key = getMonthKey(report.publishedAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(report);
    return groups;
  }, {});

  const reportMonths = Object.entries(groupedReports)
    .sort(([a], [b]) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return b.localeCompare(a);
    })
    .map(([key, items]) => ({
      key,
      label: getMonthLabel(key),
      reports: items.sort((a, b) => {
        const da = getReportDate(a.publishedAt);
        const db = getReportDate(b.publishedAt);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db.getTime() - da.getTime();
      })
    }));


  if (loading) {

    return (
      <section className="member-newsletter-page">

        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          Loading Ratio Analysis...
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
           Ratio Analysis
          </h2>

          <p>
            Read the latest Wealthoria weekly
            market updates and investment insights.
          </p>

        </div>

      </div>


      {/* FILTERS */}

      <div className="newsletter-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Ratio Analysis..."
          className="newsletter-search"
        />

        <div className="newsletter-date-filter-group">
          <div className="newsletter-date-field">
            <label>FROM DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="newsletter-date-filter"
            />
          </div>

          <div className="newsletter-date-field">
            <label>TO DATE</label>
            <input
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


      {/* REPORTS */}

      {filteredReports.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          No Ratio Analysis reports available yet.
        </div>
      ) : (
        <div className="member-newsletter-months">
          {reportMonths.map((month) => (
            <section
              className="member-newsletter-month"
              key={month.key}
            >
              <div className="member-newsletter-month-header">
                <div>
                  <span>Ratio Analysis</span>
                  <h3>{month.label}</h3>
                </div>

                <strong>
                  {month.reports.length}{" "}
                  {month.reports.length === 1 ? "Report" : "Reports"}
                </strong>
              </div>

              <div className="member-newsletter-grid">
                {month.reports.map((report) => (
                  <article
                    className="member-newsletter-card"
                    key={report.id}
                  >
                    <div className="member-newsletter-icon">
                      {report.thumbnailUrl ? (
                        <img
                          src={getFileUrl(report.thumbnailUrl)}
                          alt={report.title}
                        />
                      ) : (
                        <span>PDF</span>
                      )}
                    </div>

                    <div className="member-newsletter-content">
                      <span className="member-newsletter-date">
                        {formatDate(report.publishedAt)}
                      </span>

                      <h3>{report.title}</h3>

                      <p>{report.description}</p>

                      {report.tags.length > 0 && (
                        <div className="member-newsletter-tags">
                          {report.tags.slice(0, 4).map((tag) => (
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
                      disabled={!report.pdfUrl}
             onClick={async () => {
  if (!report.pdfPath) {
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", "ratio_analysis_opened", {
      content_id: String(report.id || ""),
      content_title: report.title || ""
    });
  }

  try {
    const current =
      window.localStorage.getItem(
        "wealthoria-current-member"
      );

    const member =
      current
        ? JSON.parse(current)
        : null;

    const token =
      member?.session?.token;

    if (!token) {
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/members/content-pdf-url/${report.id}`,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${token}`,
          "Content-Type":
            "application/json"
        }
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data?.success ||
      !data?.url
    ) {
      throw new Error(
        data?.message ||
        "Unable to open PDF."
      );
    }

    setSelectedPdf({
      ...report,
      pdfUrl: data.url
    });

  } catch (error) {
    console.error(
      "Ratio Analysis PDF error:",
      error
    );
  }
}}
                    >
                      Read Report →
                    </button>
                  </article>
                ))}
              </div>
            </section>
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
                 Ratio Analysis
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
             src={`${selectedPdf.pdfUrl}#toolbar=0&navpanes=0`}
              title={selectedPdf.title}
              className="member-pdf-frame"
            />

          </div>

        </div>

      )}

    </section>
  );
}


window.RatioAnalysis = RatioAnalysis;
