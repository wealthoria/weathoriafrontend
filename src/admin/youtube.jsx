import React from "react";

/* global React, window */

const { useState, useEffect } = React;


/* =========================================================
   ADMIN YOUTUBE
========================================================= */

function AdminYouTube() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fundamentals");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState("");

  const [videos, setVideos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [previewVideo, setPreviewVideo] = useState(null);


  /* =========================================================
     GET YOUTUBE VIDEO ID
  ========================================================= */

  const getYoutubeId = (url) => {

    if (!url) return null;

    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/embed\/([^?&]+)/,
      /youtube\.com\/shorts\/([^?&]+)/
    ];

    for (const pattern of patterns) {

      const match = url.match(pattern);

      if (match) {
        return match[1];
      }

    }

    return null;
  };


  /* =========================================================
     GET AUTOMATIC YOUTUBE THUMBNAIL
  ========================================================= */

  const getYoutubeThumbnail = (url) => {

    const id = getYoutubeId(url);

    if (!id) return "";

    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  };


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

    console.log(
      "Loading youtube_videos..."
    );


    const unsubscribe = window.db
      .collection("youtube_videos")
      .onSnapshot(

        (snapshot) => {

          const data = snapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data()
            })
          );


          data.sort((a, b) => {

            const aTime =
              a.createdAt?.toDate
                ? a.createdAt.toDate().getTime()
                : 0;

            const bTime =
              b.createdAt?.toDate
                ? b.createdAt.toDate().getTime()
                : 0;

            return bTime - aTime;

          });


          console.log(
            "YouTube videos loaded:",
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


    return () => unsubscribe();

  }, []);


  /* =========================================================
     YOUTUBE URL CHANGE
  ========================================================= */

  const handleYoutubeUrl = (value) => {

    setYoutubeUrl(value);


    const thumbnail =
      getYoutubeThumbnail(value);


    if (thumbnail) {

      setThumbnailUrl(thumbnail);

    }

  };


  /* =========================================================
     SAVE VIDEO
  ========================================================= */

  const saveVideo = async (e) => {

    e.preventDefault();

    setMessage("");


    if (!title.trim()) {

      setMessage(
        "Please enter a title."
      );

      return;

    }


    if (!youtubeUrl.trim()) {

      setMessage(
        "Please enter the YouTube link."
      );

      return;

    }


    const youtubeId =
      getYoutubeId(
        youtubeUrl.trim()
      );


    if (!youtubeId) {

      setMessage(
        "Please enter a valid YouTube link."
      );

      return;

    }


    try {

      setLoading(true);


      const automaticThumbnail =
        thumbnailUrl.trim() ||
        `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;


      await window.db
        .collection("youtube_videos")
        .add({

          title:
            title.trim(),

          description:
            description.trim(),

          category,

          youtubeUrl:
            youtubeUrl.trim(),

          youtubeId,

          thumbnailUrl:
            automaticThumbnail,

          duration:
            duration.trim(),

          published:
            true,

          createdAt:
            new Date()

        });


      /* RESET FORM */

      setTitle("");
      setDescription("");
      setCategory("Fundamentals");
      setYoutubeUrl("");
      setThumbnailUrl("");
      setDuration("");


      setMessage(
        "Video saved successfully."
      );


    } catch (error) {

      console.error(
        "Error saving YouTube video:",
        error
      );


      setMessage(
        "Error saving video: " +
        error.message
      );

    } finally {

      setLoading(false);

    }

  };


  /* =========================================================
     DELETE VIDEO
  ========================================================= */

  const deleteVideo = async (id) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this video?"
      );


    if (!confirmDelete) {
      return;
    }


    try {

      await window.db
        .collection("youtube_videos")
        .doc(id)
        .delete();


      setMessage(
        "Video deleted successfully."
      );


    } catch (error) {

      console.error(
        "Error deleting video:",
        error
      );


      setMessage(
        "Error deleting video: " +
        error.message
      );

    }

  };


  /* =========================================================
     OPEN FULL YOUTUBE VIDEO
  ========================================================= */

  const openYoutube = (video) => {

    if (!video?.youtubeUrl) {
      return;
    }


    window.open(
      video.youtubeUrl,
      "_blank",
      "noopener,noreferrer"
    );

  };


  /* =========================================================
     CLOSE PREVIEW
  ========================================================= */

  const closePreview = () => {

    setPreviewVideo(null);

  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        paddingBottom: "60px"
      }}
    >


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          marginBottom: "30px"
        }}
      >

        <h2
          style={{
            margin: 0,
            fontSize: "28px"
          }}
        >
          YouTube Videos
        </h2>


        <p
          style={{
            color: "#777",
            marginTop: "8px"
          }}
        >
          Add and manage videos that appear
          on the public Wealthoria website.
        </p>

      </div>


      {/* =====================================================
          VIDEO COUNT
      ===================================================== */}

      <div
        className="card"
        style={{
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >

        <div>

          <div
            style={{
              fontSize: "13px",
              color: "#777",
              marginBottom: "5px"
            }}
          >
            Total YouTube Videos
          </div>


          <div
            style={{
              fontSize: "32px",
              fontWeight: 800
            }}
          >
            {videos.length}
          </div>

        </div>


        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fce8e6",
            color: "#e8473f",
            fontSize: "24px",
            fontWeight: 700
          }}
        >
          ▶
        </div>

      </div>


      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message && (

        <div
          className="form-alert"
          style={{
            marginBottom: "20px"
          }}
        >

          {message}

        </div>

      )}


      {/* =====================================================
          ADD VIDEO
      ===================================================== */}

      <div
        className="card"
        style={{
          marginBottom: "35px"
        }}
      >

        <h3
          style={{
            marginTop: 0
          }}
        >
          Add YouTube Video
        </h3>


        <form
          onSubmit={saveVideo}
        >


          {/* TITLE */}

          <div className="field">

            <label>
              Video Title
            </label>


            <input
              className="input"
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="What is Mutual Fund?"
            />

          </div>


          {/* DESCRIPTION */}

          <div className="field">

            <label>
              Description
            </label>


            <textarea
              className="input"
              rows="4"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Enter video description"
            />

          </div>


          {/* CATEGORY */}

          <div className="field">

            <label>
              Category
            </label>


            <select
              className="input"
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
            >

              <option value="Fundamentals">
                Fundamentals
              </option>

              <option value="Markets">
                Markets
              </option>

              <option value="Mutual Funds">
                Mutual Funds
              </option>

              <option value="Investing">
                Investing
              </option>

              <option value="Mindset">
                Mindset
              </option>

            </select>

          </div>


          {/* YOUTUBE LINK */}

          <div className="field">

            <label>
              YouTube Link
            </label>


            <input
              className="input"
              type="url"
              value={youtubeUrl}
              onChange={(e) =>
                handleYoutubeUrl(
                  e.target.value
                )
              }
              placeholder="https://youtu.be/..."
            />

          </div>


          {/* THUMBNAIL */}

          <div className="field">

            <label>

              Thumbnail URL

              <span
                style={{
                  color: "#888",
                  fontWeight: 400,
                  marginLeft: "8px"
                }}
              >
                Optional
              </span>

            </label>


            <input
              className="input"
              type="url"
              value={thumbnailUrl}
              onChange={(e) =>
                setThumbnailUrl(
                  e.target.value
                )
              }
              placeholder="Automatically generated from YouTube"
            />

          </div>


          {/* DURATION */}

          <div className="field">

            <label>
              Duration
            </label>


            <input
              className="input"
              type="text"
              value={duration}
              onChange={(e) =>
                setDuration(
                  e.target.value
                )
              }
              placeholder="12:40"
            />

          </div>


          {/* =================================================
              THUMBNAIL PREVIEW
          ================================================= */}

          {thumbnailUrl && (

            <div
              style={{
                margin:
                  "20px 0"
              }}
            >

              <p
                style={{
                  fontWeight: 600,
                  marginBottom: 8
                }}
              >
                Preview
              </p>


              <div
                style={{
                  position: "relative",
                  width: "280px",
                  height: "158px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "#111"
                }}
              >

                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />


                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform:
                      "translate(-50%, -50%)",
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background:
                      "#e8473f",
                    color: "#fff",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    fontSize: "20px"
                  }}
                >
                  ▶
                </div>

              </div>

            </div>

          )}


          {/* SAVE */}

          <button
            className="btn btn-green"
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Saving..."
              : "Save Video"}

          </button>


        </form>

      </div>


      {/* =====================================================
          UPLOADED VIDEOS
      ===================================================== */}

      <div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            marginBottom: "18px"
          }}
        >

          <h3
            style={{
              margin: 0
            }}
          >
            Uploaded Videos
          </h3>


          <span
            className="badge badge-soft"
          >
            {videos.length} videos
          </span>

        </div>


        {videos.length === 0 ? (

          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: "#777"
            }}
          >

            No YouTube videos added yet.

          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px"
            }}
          >

            {videos.map((video) => {

              const youtubeId =
                video.youtubeId ||
                getYoutubeId(
                  video.youtubeUrl
                );


              const thumbnail =
                video.thumbnailUrl ||
                (
                  youtubeId
                    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                    : ""
                );


              return (

                <div
                  className="card"
                  key={video.id}
                  style={{
                    padding: 0,
                    overflow: "hidden"
                  }}
                >


                  {/* =================================================
                      VIDEO THUMBNAIL
                      CLICK = PREVIEW
                  ================================================= */}

                  <div
                    onClick={() =>
                      setPreviewVideo(
                        video
                      )
                    }
                    style={{
                      position: "relative",
                      aspectRatio:
                        "16 / 9",
                      background:
                        "#111",
                      overflow:
                        "hidden",
                      cursor:
                        "pointer"
                    }}
                  >

                    {thumbnail && (

                      <img
                        src={thumbnail}
                        alt={
                          video.title
                        }
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit:
                            "cover",
                          display:
                            "block"
                        }}
                      />

                    )}


                    {/* DARK OVERLAY */}

                    <div
                      style={{
                        position:
                          "absolute",
                        inset: 0,
                        background:
                          "rgba(0,0,0,.08)"
                      }}
                    />


                    {/* =================================================
                        PREVIEW PLAY ICON
                    ================================================= */}

                    <div
                      style={{
                        position:
                          "absolute",
                        left: "50%",
                        top: "50%",
                        transform:
                          "translate(-50%, -50%)",
                        width: "64px",
                        height: "64px",
                        borderRadius:
                          "50%",
                        background:
                          "#e8473f",
                        color:
                          "#fff",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontSize:
                          "26px",
                        boxShadow:
                          "0 8px 25px rgba(0,0,0,.35)"
                      }}
                    >
                      ▶
                    </div>


                    {/* =================================================
                        PREVIEW LABEL
                    ================================================= */}

                    <div
                      style={{
                        position:
                          "absolute",
                        bottom:
                          "10px",
                        left:
                          "10px",
                        padding:
                          "6px 10px",
                        borderRadius:
                          "6px",
                        background:
                          "rgba(0,0,0,.75)",
                        color:
                          "#fff",
                        fontSize:
                          "12px",
                        fontWeight:
                          600
                      }}
                    >
                      Preview 10 sec
                    </div>


                    {/* DURATION */}

                    {video.duration && (

                      <div
                        style={{
                          position:
                            "absolute",
                          right:
                            "10px",
                          bottom:
                            "10px",
                          padding:
                            "5px 8px",
                          borderRadius:
                            "5px",
                          background:
                            "rgba(0,0,0,.75)",
                          color:
                            "#fff",
                          fontSize:
                            "12px"
                        }}
                      >
                        {video.duration}
                      </div>

                    )}

                  </div>


                  {/* =================================================
                      VIDEO INFORMATION
                  ================================================= */}

                  <div
                    style={{
                      padding:
                        "16px"
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "12px",
                        color:
                          "#e8473f",
                        fontWeight:
                          700,
                        marginBottom:
                          "6px"
                      }}
                    >
                      {video.category}
                    </div>


                    <h4
                      style={{
                        margin:
                          "0 0 7px",
                        fontSize:
                          "17px"
                      }}
                    >
                      {video.title}
                    </h4>


                    <p
                      style={{
                        margin:
                          "0 0 14px",
                        color:
                          "#777",
                        fontSize:
                          "13px",
                        lineHeight:
                          1.5
                      }}
                    >
                      {video.description ||
                        "No description"}
                    </p>


                    {/* ACTIONS */}

                    <div
                      style={{
                        display:
                          "flex",
                        gap:
                          "8px",
                        flexWrap:
                          "wrap"
                      }}
                    >

                      {/* PREVIEW */}

                      <button
                        type="button"
                        className="btn btn-green btn-sm"
                        onClick={() =>
                          setPreviewVideo(
                            video
                          )
                        }
                      >
                        ▶ Preview 10 sec
                      </button>


                      {/* YOUTUBE */}

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          openYoutube(
                            video
                          )
                        }
                      >
                        Open YouTube
                      </button>


                      {/* DELETE */}

                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() =>
                          deleteVideo(
                            video.id
                          )
                        }
                        style={{
                          color:
                            "#d33",
                          border:
                            "1px solid #ddd",
                          background:
                            "transparent"
                        }}
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>


      {/* =====================================================
          10 SECOND PREVIEW MODAL
      ===================================================== */}

      {previewVideo && (

        <div
          onClick={
            closePreview
          }
          style={{
            position:
              "fixed",
            inset: 0,
            zIndex: 99999,
            background:
              "rgba(0,0,0,.78)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding:
              "20px"
          }}
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width:
                "min(850px, 100%)",
              background:
                "#fff",
              borderRadius:
                "16px",
              overflow:
                "hidden",
              boxShadow:
                "0 25px 80px rgba(0,0,0,.4)"
            }}
          >


            {/* MODAL HEADER */}

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap:
                  "15px",
                padding:
                  "16px 20px",
                borderBottom:
                  "1px solid #eee"
              }}
            >

              <div>

                <div
                  style={{
                    fontSize:
                      "16px",
                    fontWeight:
                      700
                  }}
                >
                  {previewVideo.title}
                </div>


                <div
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "#777",
                    marginTop:
                      "4px"
                  }}
                >
                  10-second preview
                </div>

              </div>


              {/* CLOSE */}

              <button
                type="button"
                onClick={
                  closePreview
                }
                style={{
                  width:
                    "36px",
                  height:
                    "36px",
                  border:
                    "none",
                  borderRadius:
                    "50%",
                  background:
                    "#f3f3f3",
                  fontSize:
                    "24px",
                  cursor:
                    "pointer"
                }}
                aria-label="Close preview"
              >
                ×
              </button>

            </div>


            {/* VIDEO */}

            <div
              style={{
                position:
                  "relative",
                width:
                  "100%",
                aspectRatio:
                  "16 / 9",
                background:
                  "#000"
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
                        height:
                          "100%",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        color:
                          "#fff"
                      }}
                    >
                      Invalid YouTube URL
                    </div>

                  );

                }


                return (

                  <iframe
                    key={id}
                    src={
                      `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&start=0&end=10&controls=1&rel=0`
                    }
                    title={
                      "Preview: " +
                      previewVideo.title
                    }
                    allow={
                      "autoplay; encrypted-media"
                    }
                    allowFullScreen
                    style={{
                      width:
                        "100%",
                      height:
                        "100%",
                      border:
                        0
                    }}
                  />

                );

              })()}

            </div>


            {/* MODAL FOOTER */}

            <div
              style={{
                padding:
                  "15px 20px",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap:
                  "12px",
                flexWrap:
                  "wrap"
              }}
            >

              <span
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#777"
                }}
              >
                Preview is limited to 10 seconds.
              </span>


              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "8px"
                }}
              >

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={
                    closePreview
                  }
                >
                  Close
                </button>


                <button
                  type="button"
                  className="btn btn-green btn-sm"
                  onClick={() =>
                    openYoutube(
                      previewVideo
                    )
                  }
                >
                  Watch Full Video
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.AdminYouTube =
  AdminYouTube;


console.log(
  "Admin YouTube loaded successfully"
);
