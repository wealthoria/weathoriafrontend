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

const [selectedDate, setSelectedDate] =
  useState("");


  const API_BASE_URL ="https://webinar-registration-backend.onrender.com";


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
        search
          .trim()
          .toLowerCase();


      const matchesSearch =
        !searchText ||
        newsletter.title
          .toLowerCase()
          .includes(searchText) ||
        newsletter.description
          .toLowerCase()
          .includes(searchText) ||
        newsletter.tags.some(
          (tag) =>
            String(tag)
              .toLowerCase()
              .includes(searchText)
        );


      let matchesDate = true;


      if (selectedDate) {

        let newsletterDate = "";


        if (
          newsletter.publishedAt &&
          typeof newsletter.publishedAt.toDate ===
            "function"
        ) {

          const date =
            newsletter.publishedAt
              .toDate();

          newsletterDate =
            date
              .toISOString()
              .slice(0, 10);

        } else {

          const date =
            new Date(
              newsletter.publishedAt
            );

          if (
            !Number.isNaN(
              date.getTime()
            )
          ) {

            newsletterDate =
              date
                .toISOString()
                .slice(0, 10);

          }

        }


        matchesDate =
          newsletterDate ===
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
          Loading newsletters...
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
            Newsletters
          </h2>

          <p>
            Read the latest Wealthoria newsletters,
            market updates and investment insights.
          </p>

        </div>

      </div>
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
    placeholder="Search newsletters..."
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

     {filteredNewsletters.length === 0  ? (




        <div
          style={{
            padding: 40,
            textAlign: "center"
          }}
        >
          No newsletters available yet.
        </div>

      ) : (

        <div className="member-newsletter-grid">

          {filteredNewsletters.map((newsletter) => (

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

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 10
                    }}
                  >

                    {newsletter.tags
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


              <button
                type="button"
                className="member-newsletter-button"
                disabled={!newsletter.pdfUrl}
                onClick={() => {

                  if (!newsletter.pdfUrl) {
                    return;
                  }

                  setSelectedPdf(newsletter);

                }}
              >
                Read Newsletter →
              </button>

            </article>

          ))}

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
