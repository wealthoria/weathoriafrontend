import React from "react";

/* global React, window */

const { useState, useEffect } = React;

/* =========================================================
   ADMIN YOUTUBE
   ========================================================= */

function AdminYouTube() {
  /* =========================================================
     FORM STATE
  ========================================================= */

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fundamentals");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState("");

  /* =========================================================
     VIDEO DATA
  ========================================================= */

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* =========================================================
     EDIT
  ========================================================= */

  const [editingVideo, setEditingVideo] = useState(null);

  /* =========================================================
     PREVIEW
  ========================================================= */

  const [previewVideo, setPreviewVideo] = useState(null);

  /* =========================================================
     DESCRIPTION
  ========================================================= */

  const [expandedDescriptions, setExpandedDescriptions] =
    useState({});

  /* =========================================================
     DRAG / DROP
  ========================================================= */

  const [draggedVideoId, setDraggedVideoId] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  /* =========================================================
     GET YOUTUBE ID
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
      const match = String(url).match(pattern);

      if (match) {
        return match[1];
      }
    }

    return null;
  };

  /* =========================================================
     GET YOUTUBE THUMBNAIL
  ========================================================= */

  const getYoutubeThumbnail = (url) => {
    const id = getYoutubeId(url);

    if (!id) {
      return "";
    }

    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  };

  /* =========================================================
     LOAD VIDEOS
  ========================================================= */

  useEffect(() => {
    if (!window.db) {
      console.error(
        "Firestore is not available"
      );

      return;
    }

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

          /* ---------------------------------------------
             SORT BY DISPLAY ORDER
          --------------------------------------------- */

          data.sort((a, b) => {
            const aOrder =
              Number(a.displayOrder);

            const bOrder =
              Number(b.displayOrder);

            const aHasOrder =
              Number.isFinite(aOrder) &&
              aOrder > 0;

            const bHasOrder =
              Number.isFinite(bOrder) &&
              bOrder > 0;

            if (
              aHasOrder &&
              bHasOrder
            ) {
              return aOrder - bOrder;
            }

            if (aHasOrder) {
              return -1;
            }

            if (bHasOrder) {
              return 1;
            }

            const aTime =
              a.createdAt?.toDate
                ? a.createdAt
                    .toDate()
                    .getTime()
                : 0;

            const bTime =
              b.createdAt?.toDate
                ? b.createdAt
                    .toDate()
                    .getTime()
                : 0;

            return bTime - aTime;
          });

          /* ---------------------------------------------
             NORMALIZE ORDER
          --------------------------------------------- */

          const normalized = data.map(
            (video, index) => ({
              ...video,
              displayOrder:
                Number.isFinite(
                  Number(video.displayOrder)
                ) &&
                Number(video.displayOrder) > 0
                  ? Number(video.displayOrder)
                  : index + 1
            })
          );

          setVideos(normalized);
        },
        (error) => {
          console.error(
            "Error loading YouTube videos:",
            error
          );

          setMessage(
            "Unable to load YouTube videos."
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
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Fundamentals");
    setYoutubeUrl("");
    setThumbnailUrl("");
    setDuration("");
    setEditingVideo(null);
  };

  /* =========================================================
     EDIT VIDEO
  ========================================================= */

  const editVideo = (video) => {
    if (!video) {
      return;
    }

 

    setEditingVideo(video);

    setTitle(
      video.title || ""
    );

    setDescription(
      video.description || ""
    );

    setCategory(
      video.category ||
        "Fundamentals"
    );

    setYoutubeUrl(
      video.youtubeUrl || ""
    );

    setThumbnailUrl(
      video.thumbnailUrl ||
        getYoutubeThumbnail(
          video.youtubeUrl || ""
        )
    );

    setDuration(
      video.duration || ""
    );

    setMessage("");

    /*
     * Scroll to the edit form.
     */

    window.setTimeout(() => {
      const formElement =
        document.getElementById(
          "youtube-video-form"
        );

      if (formElement) {
        formElement.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 50);
  };

  /* =========================================================
     SAVE / UPDATE VIDEO
  ========================================================= */

  const saveVideo = async (event) => {
    event.preventDefault();

    setMessage("");

    if (!title.trim()) {
      setMessage(
        "Please enter a video title."
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

      const finalThumbnail =
        thumbnailUrl.trim() ||
        `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

      /* =====================================================
         UPDATE
      ===================================================== */

      if (editingVideo) {
        await window.db
          .collection("youtube_videos")
          .doc(editingVideo.id)
          .update({
            title:
              title.trim(),

            description:
              description.trim(),

            category,

            youtubeUrl:
              youtubeUrl.trim(),

            youtubeId,

            thumbnailUrl:
              finalThumbnail,

            duration:
              duration.trim(),

            updatedAt:
              new Date()
          });

        setMessage(
          "Video updated successfully."
        );
      }

      /* =====================================================
         ADD NEW
      ===================================================== */

      else {
        let nextOrder = 1;

        if (videos.length > 0) {
          const orders =
            videos.map(
              (video, index) =>
                Number(
                  video.displayOrder
                ) || index + 1
            );

          nextOrder =
            Math.max(...orders) + 1;
        }

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
              finalThumbnail,

            duration:
              duration.trim(),

            published:
              true,

            displayOrder:
              nextOrder,

            createdAt:
              new Date()
          });

        setMessage(
          "Video added successfully."
        );
      }

      resetForm();

      window.setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (error) {
      console.error(
        "Error saving YouTube video:",
        error
      );

      setMessage(
        "Error saving video: " +
          (error.message ||
            "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     DELETE VIDEO
  ========================================================= */

  const deleteVideo = async (id) => {
    if (!id) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this video?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await window.db
        .collection("youtube_videos")
        .doc(id)
        .delete();

      if (
        editingVideo &&
        editingVideo.id === id
      ) {
        resetForm();
      }

      setMessage(
        "Video deleted successfully."
      );

      window.setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (error) {
      console.error(
        "Error deleting video:",
        error
      );

      setMessage(
        "Error deleting video: " +
          (error.message ||
            "Unknown error")
      );
    }
  };

  /* =========================================================
     OPEN YOUTUBE
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
     DESCRIPTION TOGGLE
  ========================================================= */

  const toggleDescription = (
    videoId
  ) => {
    setExpandedDescriptions(
      (previous) => ({
        ...previous,
        [videoId]:
          !previous[videoId]
      })
    );
  };

  /* =========================================================
     DRAG START
     ONLY THE HANDLE IS DRAGGABLE
  ========================================================= */

  const handleDragStart = (
    event,
    videoId
  ) => {
    if (savingOrder) {
      event.preventDefault();
      return;
    }

    setDraggedVideoId(videoId);

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      videoId
    );
  };

  /* =========================================================
     DRAG OVER
  ========================================================= */

  const handleDragOver = (
    event
  ) => {
    event.preventDefault();

    event.dataTransfer.dropEffect =
      "move";
  };

  /* =========================================================
     DRAG END
  ========================================================= */

  const handleDragEnd = () => {
    setDraggedVideoId(null);
  };

  /* =========================================================
     DROP
  ========================================================= */

  const handleDrop = async (
    event,
    targetVideoId
  ) => {
    event.preventDefault();

    const sourceVideoId =
      draggedVideoId ||
      event.dataTransfer.getData(
        "text/plain"
      );

    setDraggedVideoId(null);

    if (
      !sourceVideoId ||
      !targetVideoId ||
      sourceVideoId ===
        targetVideoId
    ) {
      return;
    }

    const oldVideos =
      [...videos];

    const sourceIndex =
      oldVideos.findIndex(
        (video) =>
          video.id ===
          sourceVideoId
      );

    const targetIndex =
      oldVideos.findIndex(
        (video) =>
          video.id ===
          targetVideoId
      );

    if (
      sourceIndex === -1 ||
      targetIndex === -1
    ) {
      return;
    }

    const reordered =
      [...oldVideos];

    const [
      movedVideo
    ] = reordered.splice(
      sourceIndex,
      1
    );

    reordered.splice(
      targetIndex,
      0,
      movedVideo
    );

    const orderedVideos =
      reordered.map(
        (video, index) => ({
          ...video,
          displayOrder:
            index + 1
        })
      );

    /* ---------------------------------------------
       UPDATE UI
    --------------------------------------------- */

    setVideos(
      orderedVideos
    );

    try {
      setSavingOrder(true);

      setMessage(
        "Saving video order..."
      );

      const batch =
        window.db.batch();

      orderedVideos.forEach(
        (video, index) => {
          const reference =
            window.db
              .collection(
                "youtube_videos"
              )
              .doc(video.id);

          batch.update(
            reference,
            {
              displayOrder:
                index + 1
            }
          );
        }
      );

      await batch.commit();

      setMessage(
        "Video order saved successfully."
      );

      window.setTimeout(() => {
        setMessage("");
      }, 2500);

    } catch (error) {
      console.error(
        "Error saving video order:",
        error
      );

      setVideos(
        oldVideos
      );

      setMessage(
        "Error saving video order: " +
          (error.message ||
            "Unknown error")
      );
    } finally {
      setSavingOrder(false);
    }
  };

  /* =========================================================
     CLOSE PREVIEW
  ========================================================= */

  const closePreview = () => {
    setPreviewVideo(null);
  };

  /* =========================================================
     CANCEL EDIT
  ========================================================= */

  const cancelEdit = () => {
    resetForm();
    setMessage("");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1150px",
        margin: "0 auto",
        padding:
          "10px 0 60px"
      }}
    >

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div
        style={{
          marginBottom: "25px"
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 800,
            color: "#11201f"
          }}
        >
          YouTube Videos
        </h2>

        <p
          style={{
            margin:
              "7px 0 0",
            color: "#777",
            fontSize: "14px"
          }}
        >
          Add, edit, preview and
          reorder your YouTube
          videos.
        </p>
      </div>

      {/* =====================================================
          TOTAL VIDEOS
      ===================================================== */}

      <div
        className="card"
        style={{
          marginBottom:
            "24px",
          padding:
            "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between"
        }}
      >
        <div>
          <div
            style={{
              fontSize:
                "13px",
              color:
                "#777",
              marginBottom:
                "5px"
            }}
          >
            Total YouTube Videos
          </div>

          <div
            style={{
              fontSize:
                "30px",
              fontWeight:
                800,
              color:
                "#11201f"
            }}
          >
            {videos.length}
          </div>
        </div>

        <div
          style={{
            width:
              "52px",
            height:
              "52px",
            borderRadius:
              "14px",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            background:
              "#fde7e1",
            color:
              "#e8473f",
            fontSize:
              "23px",
            fontWeight:
              700
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
          style={{
            marginBottom:
              "20px",
            padding:
              "12px 16px",
            borderRadius:
              "10px",
            background:
              "#fff4f1",
            border:
              "1px solid #f3d0c8",
            color:
              "#c53d34",
            fontSize:
              "14px",
            fontWeight:
              600
          }}
        >
          {message}
        </div>
      )}

      {/* =====================================================
          ADD / EDIT FORM
      ===================================================== */}

      <div
        id="youtube-video-form"
        className="card"
        style={{
          marginBottom:
            "35px",
          padding:
            "24px",
          scrollMarginTop:
            "30px",
          border:
            editingVideo
              ? "2px solid #e8473f"
              : undefined
        }}
      >

        {/* FORM HEADER */}

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
            marginBottom:
              "22px"
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize:
                  "20px",
                fontWeight:
                  800
              }}
            >
              {editingVideo
                ? "Edit YouTube Video"
                : "Add YouTube Video"}
            </h3>

            {editingVideo && (
              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#e8473f",
                  fontSize:
                    "13px",
                  fontWeight:
                    600
                }}
              >
                Editing:{" "}
                {editingVideo.title}
              </p>
            )}
          </div>

          {editingVideo && (
            <button
              type="button"
              onClick={
                cancelEdit
              }
              className="btn btn-outline btn-sm"
              style={{
                whiteSpace:
                  "nowrap"
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form
          onSubmit={
            saveVideo
          }
        >

          {/* TITLE */}

          <div
            className="field"
            style={{
              marginBottom:
                "16px"
            }}
          >
            <label>
              Video Title
            </label>

            <input
              className="input"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Enter video title"
              disabled={loading}
            />
          </div>

          {/* DESCRIPTION */}

          <div
            className="field"
            style={{
              marginBottom:
                "16px"
            }}
          >
            <label>
              Description
            </label>

            <textarea
              className="input"
              rows="4"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Enter video description"
              disabled={loading}
            />
          </div>

          {/* CATEGORY */}

          <div
            className="field"
            style={{
              marginBottom:
                "16px"
            }}
          >
            <label>
              Category
            </label>

            <select
              className="input"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              disabled={loading}
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

          {/* YOUTUBE URL */}

          <div
            className="field"
            style={{
              marginBottom:
                "16px"
            }}
          >
            <label>
              YouTube Link
            </label>

            <input
              className="input"
              type="url"
              value={youtubeUrl}
              onChange={(event) =>
                handleYoutubeUrl(
                  event.target.value
                )
              }
              placeholder="https://youtu.be/..."
              disabled={loading}
            />
          </div>

          {/* THUMBNAIL */}

          <div
            className="field"
            style={{
              marginBottom:
                "16px"
            }}
          >
            <label>
              Thumbnail URL
              <span
                style={{
                  marginLeft:
                    "8px",
                  color:
                    "#888",
                  fontWeight:
                    400
                }}
              >
                Optional
              </span>
            </label>

            <input
              className="input"
              type="url"
              value={thumbnailUrl}
              onChange={(event) =>
                setThumbnailUrl(
                  event.target.value
                )
              }
              placeholder="Automatically generated from YouTube"
              disabled={loading}
            />
          </div>

          {/* DURATION */}

          <div
            className="field"
            style={{
              marginBottom:
                "20px"
            }}
          >
            <label>
              Duration
            </label>

            <input
              className="input"
              type="text"
              value={duration}
              onChange={(event) =>
                setDuration(
                  event.target.value
                )
              }
              placeholder="12:40"
              disabled={loading}
            />
          </div>

          {/* THUMBNAIL PREVIEW */}

          {thumbnailUrl && (
            <div
              style={{
                marginBottom:
                  "22px"
              }}
            >
              <div
                style={{
                  fontSize:
                    "13px",
                  fontWeight:
                    700,
                  marginBottom:
                    "8px"
                }}
              >
                Thumbnail Preview
              </div>

              <div
                style={{
                  width:
                    "280px",
                  height:
                    "158px",
                  borderRadius:
                    "12px",
                  overflow:
                    "hidden",
                  background:
                    "#111",
                  position:
                    "relative"
                }}
              >
                <img
                  src={
                    thumbnailUrl
                  }
                  alt="Thumbnail preview"
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                    display:
                      "block"
                  }}
                />

                <div
                  style={{
                    position:
                      "absolute",
                    left:
                      "50%",
                    top:
                      "50%",
                    transform:
                      "translate(-50%, -50%)",
                    width:
                      "50px",
                    height:
                      "50px",
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
                      "20px"
                  }}
                >
                  ▶
                </div>
              </div>
            </div>
          )}

          {/* SAVE BUTTONS */}

          <div
            style={{
              display:
                "flex",
              gap:
                "10px",
              alignItems:
                "center"
            }}
          >
            <button
              className="btn btn-green"
              type="submit"
              disabled={
                loading
              }
              style={{
                minWidth:
                  "140px"
              }}
            >
              {loading
                ? "Saving..."
                : editingVideo
                  ? "Update Video"
                  : "Save Video"}
            </button>

            {editingVideo && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={
                  cancelEdit
                }
                disabled={
                  loading
                }
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* =====================================================
          UPLOADED VIDEOS HEADER
      ===================================================== */}

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
          marginBottom:
            "18px",
          flexWrap:
            "wrap"
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize:
                "20px",
              fontWeight:
                800
            }}
          >
            Uploaded Videos
          </h3>

          <p
            style={{
              margin:
                "5px 0 0",
              color:
                "#777",
              fontSize:
                "13px"
            }}
          >
            Drag the handle on
            each card to change
            the order.
          </p>
        </div>

        {savingOrder && (
          <div
            style={{
              padding:
                "7px 12px",
              borderRadius:
                "8px",
              background:
                "#fff4f1",
              color:
                "#e8473f",
              fontSize:
                "13px",
              fontWeight:
                700
            }}
          >
            Saving order...
          </div>
        )}
      </div>

      {/* =====================================================
          VIDEO LIST
      ===================================================== */}

      {videos.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign:
              "center",
            padding:
              "55px 20px",
            color:
              "#777"
          }}
        >
          No YouTube videos
          added yet.
        </div>
      ) : (
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(300px, 1fr))",
            gap:
              "22px",
            alignItems:
              "start"
          }}
        >
          {videos.map(
            (video, index) => {
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

              const description =
                video.description ||
                "No description available.";

              const isExpanded =
                Boolean(
                  expandedDescriptions[
                    video.id
                  ]
                );

              const isDragging =
                draggedVideoId ===
                video.id;

              return (
                <div
                  key={video.id}
                  className="card"
                  onDragOver={
                    handleDragOver
                  }
                  onDrop={(event) =>
                    handleDrop(
                      event,
                      video.id
                    )
                  }
                  style={{
                    padding: 0,
                    overflow:
                      "hidden",
                    opacity:
                      isDragging
                        ? 0.55
                        : 1,
                    transition:
                      "opacity .15s ease",
                    minWidth:
                      0
                  }}
                >

                  {/* =================================================
                      THUMBNAIL
                  ================================================= */}

                  <div
                    onClick={() =>
                      setPreviewVideo(
                        video
                      )
                    }
                    style={{
                      position:
                        "relative",
                      width:
                        "100%",
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
                        src={
                          thumbnail
                        }
                        alt={
                          video.title ||
                          "YouTube video"
                        }
                        style={{
                          width:
                            "100%",
                          height:
                            "100%",
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

                    {/* PLAY BUTTON */}

                    <div
                      style={{
                        position:
                          "absolute",
                        left:
                          "50%",
                        top:
                          "50%",
                        transform:
                          "translate(-50%, -50%)",
                        width:
                          "58px",
                        height:
                          "58px",
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
                          "23px",
                        boxShadow:
                          "0 8px 25px rgba(0,0,0,.3)"
                      }}
                    >
                      ▶
                    </div>

                    {/* PREVIEW */}

                    <div
                      style={{
                        position:
                          "absolute",
                        left:
                          "10px",
                        bottom:
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
                          700
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
                            "12px",
                          fontWeight:
                            600
                        }}
                      >
                        {
                          video.duration
                        }
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      INFORMATION
                  ================================================= */}

                  <div
                    style={{
                      padding:
                        "16px"
                    }}
                  >

                    {/* ORDER + DRAG HANDLE */}

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        marginBottom:
                          "11px"
                      }}
                    >
                      <span
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          padding:
                            "5px 9px",
                          borderRadius:
                            "7px",
                          background:
                            "#f5f5f5",
                          color:
                            "#555",
                          fontSize:
                            "12px",
                          fontWeight:
                            700
                        }}
                      >
                        Order #
                        {
                          video.displayOrder ||
                          index + 1
                        }
                      </span>

                      {/* ONLY THIS IS DRAGGABLE */}

                      <div
                        draggable={
                          !savingOrder
                        }
                        onDragStart={(
                          event
                        ) =>
                          handleDragStart(
                            event,
                            video.id
                          )
                        }
                        onDragEnd={
                          handleDragEnd
                        }
                        title="Drag to reorder"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                        style={{
                          width:
                            "38px",
                          height:
                            "34px",
                          borderRadius:
                            "8px",
                          border:
                            "1px solid #ddd",
                          background:
                            "#fafafa",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          color:
                            "#666",
                          fontSize:
                            "20px",
                          letterSpacing:
                            "-3px",
                          cursor:
                            savingOrder
                              ? "wait"
                              : "grab",
                          userSelect:
                            "none"
                        }}
                      >
                        ⋮⋮
                      </div>
                    </div>

                    {/* CATEGORY */}

                    <div
                      style={{
                        display:
                          "inline-block",
                        marginBottom:
                          "7px",
                        color:
                          "#e8473f",
                        fontSize:
                          "12px",
                        fontWeight:
                          800,
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          ".3px"
                      }}
                    >
                      {video.category ||
                        "Fundamentals"}
                    </div>

                    {/* TITLE */}

                    <h4
                      style={{
                        margin:
                          "0 0 9px",
                        fontSize:
                          "17px",
                        lineHeight:
                          1.35,
                        fontWeight:
                          800,
                        color:
                          "#11201f"
                      }}
                    >
                      {
                        video.title ||
                        "Untitled video"
                      }
                    </h4>

                    {/* DESCRIPTION */}

                    <div
                      style={{
                        marginBottom:
                          "16px"
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color:
                            "#777",
                          fontSize:
                            "13px",
                          lineHeight:
                            1.55,
                          display:
                            isExpanded
                              ? "block"
                              : "-webkit-box",
                          WebkitLineClamp:
                            isExpanded
                              ? "unset"
                              : 3,
                          WebkitBoxOrient:
                            "vertical",
                          overflow:
                            isExpanded
                              ? "visible"
                              : "hidden"
                        }}
                      >
                        {
                          description
                        }
                      </p>

                      {description.length >
                        140 && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            toggleDescription(
                              video.id
                            );
                          }}
                          style={{
                            marginTop:
                              "7px",
                            padding:
                              "0",
                            border:
                              "none",
                            background:
                              "transparent",
                            color:
                              "#e8473f",
                            fontSize:
                              "13px",
                            fontWeight:
                              800,
                            cursor:
                              "pointer"
                          }}
                        >
                          {isExpanded
                            ? "Show less"
                            : "Read more"}
                        </button>
                      )}
                    </div>

                    {/* =================================================
                        ACTION BUTTONS
                    ================================================= */}

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr 1.65fr",
                        gap:
                          "9px",
                        width:
                          "100%"
                      }}
                    >

                      {/* EDIT */}

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onMouseDown={(
                          event
                        ) => {
                          event.stopPropagation();
                        }}
                        onClick={(
                          event
                        ) => {
                          event.preventDefault();
                          event.stopPropagation();

                       

                          editVideo(
                            video
                          );
                        }}
                        disabled={
                          savingOrder ||
                          loading
                        }
                        style={{
                          width:
                            "100%",
                          height:
                            "46px",
                          minWidth:
                            0,
                          padding:
                            "0 12px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          whiteSpace:
                            "nowrap",
                          cursor:
                            "pointer",
                          boxSizing:
                            "border-box"
                        }}
                      >
                        Edit
                      </button>

                      {/* PREVIEW */}

                      <button
                        type="button"
                        className="btn btn-green btn-sm"
                        onMouseDown={(
                          event
                        ) => {
                          event.stopPropagation();
                        }}
                        onClick={(
                          event
                        ) => {
                          event.preventDefault();
                          event.stopPropagation();

                          setPreviewVideo(
                            video
                          );
                        }}
                        disabled={
                          savingOrder
                        }
                        style={{
                          width:
                            "100%",
                          height:
                            "46px",
                          minWidth:
                            0,
                          padding:
                            "0 10px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          whiteSpace:
                            "nowrap",
                          boxSizing:
                            "border-box"
                        }}
                      >
                        ▶ Preview 10 sec
                      </button>

                      {/* OPEN YOUTUBE */}

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onMouseDown={(
                          event
                        ) => {
                          event.stopPropagation();
                        }}
                        onClick={(
                          event
                        ) => {
                          event.preventDefault();
                          event.stopPropagation();

                          openYoutube(
                            video
                          );
                        }}
                        disabled={
                          savingOrder
                        }
                        style={{
                          width:
                            "100%",
                          height:
                            "46px",
                          minWidth:
                            0,
                          padding:
                            "0 10px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          whiteSpace:
                            "nowrap",
                          boxSizing:
                            "border-box"
                        }}
                      >
                        Open YouTube
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        className="btn btn-sm"
                        onMouseDown={(
                          event
                        ) => {
                          event.stopPropagation();
                        }}
                        onClick={(
                          event
                        ) => {
                          event.preventDefault();
                          event.stopPropagation();

                          deleteVideo(
                            video.id
                          );
                        }}
                        disabled={
                          savingOrder
                        }
                        style={{
                          width:
                            "100%",
                          height:
                            "46px",
                          minWidth:
                            0,
                          padding:
                            "0 10px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          whiteSpace:
                            "nowrap",
                          boxSizing:
                            "border-box",
                          color:
                            "#d33",
                          border:
                            "1px solid #ddd",
                          background:
                            "transparent",
                          cursor:
                            "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* =====================================================
          PREVIEW MODAL
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
            zIndex:
              99999,
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
            onClick={(event) =>
              event.stopPropagation()
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
              <div
                style={{
                  minWidth:
                    0
                }}
              >
                <div
                  style={{
                    fontSize:
                      "16px",
                    fontWeight:
                      800,
                    overflow:
                      "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap"
                  }}
                >
                  {
                    previewVideo.title
                  }
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

              <button
                type="button"
                onClick={
                  closePreview
                }
                style={{
                  flexShrink:
                    0,
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
              >
                ×
              </button>
            </div>

            {/* VIDEO */}

            <div
              style={{
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
                    src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&start=0&end=10&controls=1&rel=0`}
                    title={
                      "Preview: " +
                      previewVideo.title
                    }
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    style={{
                      width:
                        "100%",
                      height:
                        "100%",
                      border:
                        "none"
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
                Preview is limited
                to 10 seconds.
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
