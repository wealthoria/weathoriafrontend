/* global React, window */

const { useState, useEffect } = React;
const {
  useApp,
  Icon,
  Reveal,
  SectionHead,
  ImagePlaceholder
} = window;


/* =========================================================================
   TESTIMONIALS
   ========================================================================= */

function Testimonials() {

  const { t, lang } = useApp();

  const items = t.testimonials.items;

  const [idx, setIdx] = useState(0);
  const [perView, setPerView] = useState(3);


  useEffect(() => {

    const calc = () => {

      const w = window.innerWidth;

      setPerView(
        w < 760
          ? 1
          : w < 1040
            ? 2
            : 3
      );

    };

    calc();

    window.addEventListener(
      "resize",
      calc
    );

    return () => {
      window.removeEventListener(
        "resize",
        calc
      );
    };

  }, []);


  const maxIdx = Math.max(
    0,
    items.length - perView
  );


  useEffect(() => {

    setIdx((i) =>
      Math.min(i, maxIdx)
    );

  }, [maxIdx]);


  useEffect(() => {

    setIdx(0);

  }, [lang]);


  const initials = (n) =>
    n.trim().charAt(0);


  return (

    <section
      className="band band-soft"
      id="testimonials"
    >

      <div className="wrap">

        <SectionHead
          eyebrow={t.testimonials.eyebrow}
          title={t.testimonials.title}
        />


        <div className="tst-viewport">

          <div
            className="tst-track"
            style={{
              transform:
                `translateX(-${idx * (100 / perView)}%)`
            }}
          >

            {items.map((it, i) => (

              <div
                className="tst-slide"
                key={i}
              >

                <div className="tst">

                  <div className="stars">

                    {[0, 1, 2, 3, 4].map(
                      (s) => (

                        <Icon
                          key={s}
                          name="star"
                          size={16}
                        />

                      )
                    )}

                  </div>


                  <p className="body">
                    &ldquo;{it.q}&rdquo;
                  </p>


                  <div className="who">

                    <div className="av">
                      {initials(it.n)}
                    </div>

                    <div>

                      <div className="nm">
                        {it.n}
                      </div>

                      <div className="rl">
                        {it.r}
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>


        <div className="slider-ctl">

          <button
            className="arrow"
            onClick={() =>
              setIdx((i) =>
                Math.max(0, i - 1)
              )
            }
            disabled={idx === 0}
            aria-label="Previous"
          >

            <Icon
              name="arrow"
              size={18}
              style={{
                transform:
                  "rotate(180deg)"
              }}
            />

          </button>


          <button
            className="arrow"
            onClick={() =>
              setIdx((i) =>
                Math.min(maxIdx, i + 1)
              )
            }
            disabled={idx >= maxIdx}
            aria-label="Next"
          >

            <Icon
              name="arrow"
              size={18}
            />

          </button>


          <div className="slider-dots">

            {Array.from({
              length: maxIdx + 1
            }).map((_, i) => (

              <i
                key={i}
                className={
                  i === idx
                    ? "on"
                    : ""
                }
                onClick={() =>
                  setIdx(i)
                }
              />

            ))}

          </div>

        </div>

      </div>

    </section>

  );

}


/* =========================================================================
   YOUTUBE / CONTENT HUB
   ========================================================================= */

function YouTube() {

  const { t } = useApp();

  const y = t.youtube;


  const [videos, setVideos] =
    useState([]);

  const [previewVideo, setPreviewVideo] =
    useState(null);


  /* =========================================================
     LOAD VIDEOS FROM FIRESTORE
  ========================================================= */

  useEffect(() => {

    if (!window.db) {

      console.error(
        "Firestore is not available"
      );

      return;

    }


    const unsubscribe =
      window.db
        .collection("youtube_videos")
        .onSnapshot(

          (snapshot) => {

            const data =
              snapshot.docs.map(
                (doc) => ({
                  id: doc.id,
                  ...doc.data()
                })
              );


            console.log(
              "YOUTUBE FIRESTORE DATA:",
              data
            );


            setVideos(data);

          },


          (error) => {

            console.error(
              "Error loading YouTube videos:",
              error
            );

          }

        );


    return () =>
      unsubscribe();

  }, []);


  /* =========================================================
     GET YOUTUBE VIDEO ID
  ========================================================= */

  const getYoutubeId = (url) => {

    if (!url) return null;


    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/
    );


    return match
      ? match[1]
      : null;

  };


  /* =========================================================
     OPEN PREVIEW
  ========================================================= */

  const openPreview = (video) => {

    setPreviewVideo(video);

  };


  /* =========================================================
     CLOSE PREVIEW
  ========================================================= */

  const closePreview = () => {

    setPreviewVideo(null);

  };


  return (

    <section
      className="band band-white"
      id="resources"
    >

      <div className="wrap">


        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 20
          }}
        >

          <SectionHead
            eyebrow={y.eyebrow}
            title={y.title}
            sub={y.sub}
            icon="youtube"
          />


          <Reveal>

            <a
              className="btn btn-outline"
              href={
                y.channelUrl || "#"
              }
              target="_blank"
              rel="noopener noreferrer"
            >

              {y.cta}

              <Icon
                name="arrow"
                size={18}
              />

            </a>

          </Reveal>

        </div>


        {/* =====================================================
            VIDEO GRID
        ===================================================== */}

        <div className="yt-grid">

          {videos.map((v, i) => {

            const youtubeId =
              v.youtubeId ||
              getYoutubeId(
                v.youtubeUrl
              );


            /* =================================================
               THUMBNAIL
            ================================================= */

            const thumbnail =
              v.thumbnailUrl ||
              (
                youtubeId
                  ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                  : ""
              );


            return (

              <Reveal
                key={v.id}
                className={`yt ${
                  v.featured
                    ? "feat-yt"
                    : ""
                }`}
                delay={i * 90}
              >


                {/* =================================================
                    VIDEO THUMBNAIL
                ================================================= */}

                <div
                  className="thumb"
                  onClick={() =>
                    openPreview(v)
                  }
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    overflow: "hidden"
                  }}
                >


                  {/* IMAGE */}

                  {thumbnail ? (

                    <img
                      src={thumbnail}
                      alt={
                        v.title ||
                        "YouTube video"
                      }
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        zIndex: 1
                      }}
                    />

                  ) : (

                    <ImagePlaceholder
                      label="Video thumbnail"
                      icon="play"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 0,
                        zIndex: 1
                      }}
                    />

                  )}


                  {/* =================================================
                      DARK OVERLAY
                  ================================================= */}

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "rgba(0,0,0,.18)",
                      zIndex: 2,
                      pointerEvents:
                        "none"
                    }}
                  />


                  {/* =================================================
                      PREVIEW PLAY ICON
                  ================================================= */}

                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform:
                        "translate(-50%, -50%)",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background:
                        "#e8473f",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      zIndex: 10,
                      boxShadow:
                        "0 6px 20px rgba(0,0,0,.35)",
                      pointerEvents:
                        "none"
                    }}
                  >

                    <Icon
                      name="play"
                      size={25}
                    />

                  </div>


                  {/* =================================================
                      PREVIEW LABEL
                  ================================================= */}

                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      bottom: "12px",
                      background:
                        "rgba(0,0,0,.75)",
                      color: "#fff",
                      padding:
                        "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      zIndex: 10,
                      pointerEvents:
                        "none"
                    }}
                  >

                    Preview

                  </span>


                  {/* =================================================
                      DURATION
                  ================================================= */}

                  {v.duration && (

                    <span
                      className="dur"
                      style={{
                        zIndex: 10
                      }}
                    >

                      {v.duration}

                    </span>

                  )}

                </div>


                {/* =================================================
                    VIDEO DETAILS
                ================================================= */}

                <div className="meta">


                  {/* TITLE */}

                  <h3>
                    {v.title}
                  </h3>


                  {/* DESCRIPTION */}

                  {v.description && (

                    <p
                      style={{
                        marginTop: 6,
                        marginBottom: 8
                      }}
                    >

                      {v.description}

                    </p>

                  )}


                  {/* CATEGORY */}

                  <div className="sub2">

                    {v.category && (

                      <span>
                        {v.category}
                      </span>

                    )}

                  </div>


                </div>

              </Reveal>

            );

          })}

        </div>


        {/* =====================================================
            NO VIDEOS
        ===================================================== */}

        {videos.length === 0 && (

          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color:
                "var(--muted)"
            }}
          >

            YouTube videos will appear here soon.

          </div>

        )}

      </div>


      {/* =========================================================
          10 SECOND PREVIEW POPUP
      ========================================================= */}

      {previewVideo && (

        <div
          onClick={closePreview}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background:
              "rgba(0,0,0,.78)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            padding: "20px"
          }}
        >


          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width:
                "min(850px, 100%)",
              background: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow:
                "0 25px 80px rgba(0,0,0,.4)"
            }}
          >


            {/* =================================================
                POPUP HEADER
            ================================================= */}

            <div
              style={{
                padding:
                  "16px 20px",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                borderBottom:
                  "1px solid #eee"
              }}
            >

              <div>

                <strong>
                  {previewVideo.title}
                </strong>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#777",
                    marginTop: 4
                  }}
                >

                  10-second preview

                </div>

              </div>


              {/* CLOSE BUTTON */}

              <button
                onClick={
                  closePreview
                }
                style={{
                  border: 0,
                  background:
                    "#f2f2f2",
                  width: "36px",
                  height: "36px",
                  borderRadius:
                    "50%",
                  fontSize: "22px",
                  cursor: "pointer"
                }}
              >

                ×

              </button>

            </div>


            {/* =================================================
                VIDEO
            ================================================= */}

            <div
              style={{
                position: "relative",
                aspectRatio:
                  "16 / 9",
                background: "#000"
              }}
            >

              {(() => {

                const id =
                  previewVideo.youtubeId ||
                  getYoutubeId(
                    previewVideo.youtubeUrl
                  );


                if (!id) {

                  return (

                    <div
                      style={{
                        color: "#fff",
                        height: "100%",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center"
                      }}
                    >

                      Invalid YouTube URL

                    </div>

                  );

                }


                return (

                  <iframe
                    src={
                      `https://www.youtube.com/embed/${id}?autoplay=1&start=0&end=10&rel=0`
                    }
                    title={
                      previewVideo.title
                    }
                    allow={
                      "autoplay; encrypted-media"
                    }
                    allowFullScreen
                    style={{
                      width: "100%",
                      height: "100%",
                      border: 0
                    }}
                  />

                );

              })()}

            </div>


            {/* =================================================
                POPUP FOOTER
            ================================================= */}

            <div
              style={{
                padding:
                  "15px 20px",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap"
              }}
            >

              <span
                style={{
                  fontSize: "13px",
                  color: "#777"
                }}
              >

                Preview limited to
                10 seconds.

              </span>


              <a
                className="btn btn-green btn-sm"
                href={
                  previewVideo.youtubeUrl
                }
                target="_blank"
                rel="noopener noreferrer"
              >

                Watch Full Video

              </a>

            </div>

          </div>

        </div>

      )}

    </section>

  );

}


/* =========================================================================
   SEMINARS & EVENTS
   ========================================================================= */

function Seminars({ onNav }) {

  const { t } = useApp();

  const s = t.seminars;


  return (

    <section
      className="band band-soft"
      id="seminars"
    >

      <div className="wrap">

        <SectionHead
          eyebrow={s.eyebrow}
          title={s.title}
          sub={s.sub}
          icon="calendar"
        />


        <div className="sem-list">

          {s.items.map(
            (ev, i) => (

              <Reveal
                key={i}
                className="sem"
                delay={i * 80}
              >

                <div className="date">

                  <div className="d">
                    {ev.d}
                  </div>

                  <div className="m">
                    {ev.m}
                  </div>

                </div>


                <div className="info">

                  <h3>
                    {ev.t}
                  </h3>


                  <div className="row">

                    <span>

                      <Icon
                        name={
                          ev.mode === "Online" ||
                          ev.mode === "ಆನ್‌ಲೈನ್"
                            ? "monitor"
                            : "pin"
                        }
                        size={15}
                      />

                      {ev.city}

                    </span>


                    <span className="badge badge-green">
                      {ev.mode}
                    </span>


                    <span>

                      <Icon
                        name="users"
                        size={15}
                      />

                      {ev.seats}{" "}
                      {s.seatsLabel}

                    </span>

                  </div>

                </div>


                <div className="act">

                  <button
                    className="btn btn-green btn-sm"
                    onClick={() =>
                      onNav("consult")
                    }
                  >

                    {s.cta}

                  </button>

                </div>

              </Reveal>

            )
          )}

        </div>

      </div>

    </section>

  );

}


/* =========================================================================
   FREE KNOWLEDGE LIBRARY
   ========================================================================= */

function Library() {

  const { t } = useApp();

  const l = t.library;

  const [overlay, setOverlay] =
    React.useState(null);

  const {
    CalcOverlay,
    ComingSoonOverlay
  } = window;


  const isCalc = (it) =>
    it.tag === "Calculator" ||
    it.tag ===
      "\u0c95\u0ccd\u0caf\u0cbe\u0cb2\u0ccd\u0c95\u0cc1\u0cb2\u0cc7\u0c9f\u0cb0\u0ccd";


  return (

    <section
      className="band band-white"
    >

      <div className="wrap">

        <SectionHead
          eyebrow={l.eyebrow}
          title={l.title}
          sub={l.sub}
          icon="book"
        />


        <div className="lib-grid">

          {l.items.map(
            (it, i) => (

              <Reveal
                as="button"
                key={i}
                className="lib"
                delay={(i % 4) * 70}
                style={{
                  border: 0,
                  font: "inherit",
                  cursor: "pointer",
                  textAlign: "left"
                }}
                onClick={() =>
                  setOverlay(
                    isCalc(it)
                      ? "calc"
                      : {
                          soon: it.t
                        }
                  )
                }
              >

                <div className="iconwrap">

                  <Icon
                    name={it.ic}
                    size={22}
                  />

                </div>


                <span
                  className="badge badge-soft"
                  style={{
                    alignSelf:
                      "flex-start"
                  }}
                >

                  {it.tag}

                </span>


                <h3>
                  {it.t}
                </h3>


                <p>
                  {it.d}
                </p>


                <span className="dl">

                  <Icon
                    name="arrow"
                    size={16}
                  />

                  {
                    it.tag ===
                      "Calculator" ||
                    it.tag ===
                      "ಕ್ಯಾಲ್ಕುಲೇಟರ್"
                      ? "Open"
                      : "Read"
                  }

                </span>

              </Reveal>

            )
          )}

        </div>

      </div>


      {overlay === "calc" && (

        <CalcOverlay
          onClose={() =>
            setOverlay(null)
          }
        />

      )}


      {overlay &&
        overlay.soon && (

          <ComingSoonOverlay
            title={overlay.soon}
            onClose={() =>
              setOverlay(null)
            }
          />

        )}

    </section>

  );

}


/* =========================================================================
   EXPORT
   ========================================================================= */

Object.assign(
  window,
  {
    Testimonials,
    YouTube,
    Seminars,
    Library
  }
);