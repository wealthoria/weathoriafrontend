import React from "react";

import {
  trackMemberContentOpen,
  getCurrentMemberInfo,
  getMemberToken
} from "./memberContent.js";

const { useState, useEffect, useRef } = React;

// Remembers the video a member is watching so that, if the phone
// reloads or relaunches the app (screen lock, app switch, low
// memory), the same video opens again instead of the Home screen.
const OPEN_VIDEO_KEY = "wealthoria-open-video";
const OPEN_VIDEO_MAX_AGE = 3 * 60 * 60 * 1000;

function rememberOpenVideo(videoId) {
  try {
    if (videoId) {
      localStorage.setItem(
        OPEN_VIDEO_KEY,
        JSON.stringify({ id: String(videoId), at: Date.now() })
      );
    } else {
      localStorage.removeItem(OPEN_VIDEO_KEY);
    }
  } catch (e) { }
}

function getRememberedVideoId() {
  try {
    const saved = JSON.parse(localStorage.getItem(OPEN_VIDEO_KEY) || "null");
    if (saved?.id && Date.now() - Number(saved.at || 0) < OPEN_VIDEO_MAX_AGE) {
      return saved.id;
    }
  } catch (e) { }
  return "";
}

const MEMBER_API = "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

/* =========================================================
   HELPERS
========================================================= */

function getFileUrl(value) {
  if (!value) return "";

  const raw = String(value).trim();

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://")
  ) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return MEMBER_API + raw;
  }

  return MEMBER_API + "/" + raw;
}

function getTime(value) {
  if (!value) return 0;

  try {
    if (typeof value?.toMillis === "function") {
      return value.toMillis();
    }

    if (typeof value?.toDate === "function") {
      return value.toDate().getTime();
    }

    const time = new Date(value).getTime();

    return Number.isNaN(time) ? 0 : time;
  } catch {
    return 0;
  }
}

function getDate(value) {
  const time = getTime(value);

  if (!time) return "";

  return new Date(time).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getMonthKey(value) {
  const time = getTime(value);
  if (!time) return "unknown";

  const date = new Date(time);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getMonthLabel(value) {
  const time = getTime(value);

  if (!time) {
    return "Other Videos";
  }

  return new Date(time).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
}

/*
 * VdoCipher field may contain:
 *
 * 1. Normal VdoCipher player URL
 * 2. iframe HTML copied from VdoCipher
 *
 * This extracts iframe src when necessary.
 */
function getVideoEmbedUrl(value) {
  if (!value) return "";

  const raw = String(value).trim();

  const iframeMatch = raw.match(
    /<iframe[^>]+src=["']([^"']+)["']/i
  );

  if (iframeMatch?.[1]) {
    return iframeMatch[1];
  }

  return raw;
}

/* =========================================================
   RELATIVE TIME HELPER (YOUTUBE STYLE)
========================================================= */

function formatRelativeTime(dateVal) {
  const t = getTime(dateVal);
  if (!t) return "Recently";
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(t).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });
}

/* =========================================================
   VIDEO PLAYER MODAL
========================================================= */

function MemberVideoPlayer({
  video,
  onClose
}) {
  if (!video) {
    return null;
  }

  useEffect(() => {
    if (video) {
      trackMemberContentOpen({
        type: "video",
        contentId: video.id || "video_modal",
        contentTitle: video.title || "Video Player"
      });
    }
  }, [video?.id]);

  const embedUrl = getVideoEmbedUrl(
    video.vdocipherUrl
  );

  const directVideoUrl =
    video.videoUrl || "";

  return (
    <div className="member-video-modal-overlay">
      <div
        className="member-video-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* MODAL HEADER */}

        <div className="member-video-modal-head">
          <div>
            <span className="member-eyebrow">
              VIDEO
            </span>

            <h3>
              {video.title || "Video"}
            </h3>
          </div>

          <button
            type="button"
            className="member-video-modal-close"
            onClick={onClose}
            aria-label="Close video"
          >
            ×
          </button>
        </div>

        {/* VIDEO PLAYER */}

        <div className="member-video-player">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={
                video.title ||
                "Wealthoria video"
              }
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                display: "block"
              }}
              allowFullScreen
              allow="
                encrypted-media;
                fullscreen;
                picture-in-picture;
                autoplay
              "
            />
          ) : directVideoUrl ? (
            <video
              src={getFileUrl(
                directVideoUrl
              )}
              controls
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                background: "#000"
              }}
            />
          ) : (
            <div className="member-video-unavailable">
              Video is not available.
            </div>
          )}
        </div>

        {/* VIDEO INFORMATION */}

        <div className="member-video-modal-info">
          <strong>
            {video.title ||
              "Untitled Video"}
          </strong>

          {video.description && (
            <p>
              {video.description}
            </p>
          )}

          {video.category && (
            <span>
              {video.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MEMBER VIDEO PAGE
========================================================= */

function MemberVideo() {
  const [videos, setVideos] =
    useState([]);


  const [likeStats, setLikeStats] = useState({});
  const [likeLoading, setLikeLoading] = useState({});

  const [commentOpenVideoId, setCommentOpenVideoId] = useState("");
  const [commentText, setCommentText] = useState("");

  const [videoComments, setVideoComments] = useState({});
  const [openCommentsVideoId, setOpenCommentsVideoId] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedVideo, setSelectedVideo] =
    useState(null);

  const restoredVideoRef = useRef(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  // Track visiting the Videos section
  useEffect(() => {
    trackMemberContentOpen({
      type: "video",
      contentId: "videos_section",
      contentTitle: "Recorded Videos Section"
    });
  }, []);

  /* =======================================================
     LOAD PUBLISHED VIDEOS
  ======================================================= */

  useEffect(() => {
    if (!window.db) {
      setError(
        "Unable to connect to content."
      );

      setLoading(false);

      return;
    }

    const unsubscribe =
      window.db
        .collection("content")
        .where(
          "type",
          "==",
          "video"
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
                (doc) => ({
                  id: doc.id,
                  ...(doc.data() || {})
                })
              );

            rows.sort(
              (a, b) =>
                getTime(
                  b.publishedAt ||
                  b.createdAt
                ) -
                getTime(
                  a.publishedAt ||
                  a.createdAt
                )
            );

            setVideos(rows);

            if (!restoredVideoRef.current) {
              restoredVideoRef.current = true;

              const rememberedId = getRememberedVideoId();
              const remembered = rememberedId
                ? rows.find((row) => String(row.id) === rememberedId)
                : null;

              if (remembered) {
                trackMemberContentOpen({
                  type: "video",
                  contentId: remembered.id,
                  contentTitle: remembered.title || "Restored Video"
                });
                setSelectedVideo(remembered);
              } else {
                rememberOpenVideo("");
              }
            }

            setLoading(false);

            setError("");
          },
          (snapshotError) => {
            console.error(
              "Member video loading error:",
              snapshotError
            );

            setError(
              snapshotError?.message ||
              "Unable to load videos."
            );

            setLoading(false);
          }
        );

    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, []);

  // Load saved like counts whenever the video list loads or changes
  useEffect(() => {
    if (videos.length === 0) return;

    const loadVideoLikes = async () => {
      try {
        const token = getMemberToken();
        if (!token) return;

        const videoIds = videos.map((video) => video.id);

        const response = await fetch(
          `https://api-jsbpm362pq-el.a.run.app/members/video-likes?videoIds=${encodeURIComponent(videoIds.join(","))}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load saved likes."
          );
        }

        setLikeStats((previous) => ({
          ...previous,
          ...result.likes,
        }));
      } catch (error) {
        console.error("Loading video likes failed:", error);
      }
    };

    loadVideoLikes();

    const loadVideoComments = async () => {
      try {
        const token = getMemberToken();
        if (!token) return;

        const videoIds = videos.map((video) => video.id);

        const response = await fetch(
          `https://api-jsbpm362pq-el.a.run.app/members/video-comments?videoIds=${encodeURIComponent(videoIds.join(","))}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok && result.success && result.comments) {
          setVideoComments((previous) => ({
            ...previous,
            ...result.comments,
          }));
        }
      } catch (error) {
        console.warn("Loading video comments via API failed:", error);
      }
    };

    loadVideoComments();
  }, [videos]);

  // Real-time listener for video comments grouped by videoId
  useEffect(() => {
    let unsubscribe = null;
    let timer = null;

    const setupListener = () => {
      if (!window.db) return false;

      unsubscribe = window.db
        .collection("videocomments")
        .onSnapshot(
          (snapshot) => {
            if (!snapshot) return;
            const grouped = {};
            snapshot.docs.forEach((doc) => {
              const data = doc.data() || {};
              const vid = String(data.videoId || "");
              if (!vid) return;
              if (!grouped[vid]) grouped[vid] = [];
              grouped[vid].push({
                id: doc.id,
                userName: data.userName || "Member",
                comment: data.comment || "",
                createdAt: data.createdAt,
                userId: data.userId
              });
            });

            // Sort newest comments first
            Object.keys(grouped).forEach((vid) => {
              grouped[vid].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
            });

            setVideoComments((prev) => ({
              ...prev,
              ...grouped
            }));
          },
          (error) => {
            console.warn("videocomments listener error:", error);
          }
        );
      return true;
    };

    if (!setupListener()) {
      let attempts = 0;
      timer = setInterval(() => {
        attempts++;
        if (setupListener() || attempts > 20) {
          clearInterval(timer);
        }
      }, 250);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredVideos =
    videos.filter((video) => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      const videoTime = getTime(
        video.publishedAt ||
        video.createdAt
      );

      // Inclusive date-wise filtering.
      if (startDate) {
        const startTime =
          new Date(
            `${startDate}T00:00:00`
          ).getTime();

        if (!videoTime || videoTime < startTime) {
          return false;
        }
      }

      if (endDate) {
        const endTime =
          new Date(
            `${endDate}T23:59:59.999`
          ).getTime();

        if (!videoTime || videoTime > endTime) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      const title =
        String(
          video.title || ""
        ).toLowerCase();

      const description =
        String(
          video.description || ""
        ).toLowerCase();

      const category =
        String(
          video.category || ""
        ).toLowerCase();

      const tags =
        Array.isArray(video.tags)
          ? video.tags.join(" ")
          : String(
            video.tags || ""
          );

      return (
        title.includes(query) ||
        description.includes(query) ||
        category.includes(query) ||
        tags
          .toLowerCase()
          .includes(query)
      );
    });

  const groupedVideos = filteredVideos.reduce(
    (groups, video) => {
      const dateValue =
        video.publishedAt ||
        video.createdAt;

      const monthKey =
        getMonthKey(dateValue);

      if (!groups[monthKey]) {
        groups[monthKey] = {
          label: getMonthLabel(dateValue),
          videos: []
        };
      }

      groups[monthKey].videos.push(video);

      return groups;
    },
    {}
  );

  const videoMonths =
    Object.entries(groupedVideos).sort(
      (a, b) => {
        if (a[0] === "unknown") return 1;
        if (b[0] === "unknown") return -1;

        return b[0].localeCompare(a[0]);
      }
    );

  /* =======================================================
     OPEN VIDEO
  ======================================================= */

  function openVideo(video) {
    if (!video) return;

    trackMemberContentOpen({
      type: "video",
      contentId: video.id,
      contentTitle: video.title || "Video"
    });

    rememberOpenVideo(video.id);

    setSelectedVideo(video);
  }
  /* =======================================================
     CLOSE VIDEO
  ======================================================= */

  function closeVideo() {
    // Google Analytics - track video closed
    if (
      typeof window.gtag === "function" &&
      selectedVideo
    ) {
      window.gtag("event", "video_closed", {
        content_id: String(selectedVideo.id || ""),
        content_title: selectedVideo.title || ""
      });
    }

    rememberOpenVideo("");

    setSelectedVideo(null);
  }






  const handleLike = async (video) => {
    try {
      const videoData =
        typeof video === "string"
          ? videos.find((item) => item.id === video)
          : video;

      if (!videoData) {
        console.error("Video not found.");
        return;
      }

      const token = getMemberToken();

      if (!token) {
        alert("Please log in again to like this video.");
        return;
      }

      const response = await fetch(
        "https://api-jsbpm362pq-el.a.run.app/members/video-like",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            videoId: videoData.id,
            category: videoData.category || "",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update video like."
        );
      }

      console.log(
        result.liked ? "Video liked successfully." : "Like removed.",
        result
      );


      setLikeStats((previous) => {
        const current = previous[videoData.id] || {
          count: 0,
          liked: false,
        };

        const liked = result.liked === true;

        return {
          ...previous,
          [videoData.id]: {
            liked,
            count: Math.max(
              0,
              current.count + (liked ? 1 : -1)
            ),
          },
        };
      });

    } catch (error) {
      console.error("Like error:", error);
      alert(error.message || "Unable to update like. Please try again.");
    }
  };



  const [commentSaving, setCommentSaving] = useState(false);

  const handleSaveComment = async (event, videoId) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const text = commentText.trim();
    if (!text || !videoId || commentSaving) return;

    const token = getMemberToken();

    if (!token) {
      alert("Please log in again to comment.");
      return;
    }

    setCommentSaving(true);

    try {
      const response = await fetch(
        "https://api-jsbpm362pq-el.a.run.app/members/video-comment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            videoId,
            comment: text,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to save comment."
        );
      }

      setCommentText("");

      const memberInfo = getCurrentMemberInfo() || {};
      const newComment = {
        id: result?.comment?.id || `temp-${Date.now()}`,
        userName: result?.comment?.userName || memberInfo?.name || "Member",
        comment: text,
        createdAt: Date.now(),
        userId: result?.comment?.userId || memberInfo?.uid || ""
      };

      setVideoComments((previous) => ({
        ...previous,
        [videoId]: [newComment, ...(previous[videoId] || [])]
      }));

      // Make sure comments are open and visible
      setOpenCommentsVideoId(videoId);

      alert("Comment saved successfully.");
    } catch (error) {
      console.error("Save comment error:", error);
      alert(error.message || "Unable to save comment. Please try again.");
    } finally {
      setCommentSaving(false);
    }
  };



/* =======================================================
   RENDER
======================================================= */

return (
  <>
    <section className="member-video-page">

      {/* =================================================
            HEADER
        ================================================= */}

      <div className="member-video-header">
        <div>
          <span className="member-eyebrow">
            LEARNING
          </span>

          <h2>
            Videos
          </h2>

          <p>
            Watch the latest video
            content from Wealthoria.
          </p>
        </div>

        <div className="member-video-count">
          {filteredVideos.length}{" "}
          {filteredVideos.length === 1
            ? "Video"
            : "Videos"}
        </div>
      </div>

      {/* =================================================
            SEARCH
        ================================================= */}

      <div className="member-video-search">
        <span
          className="member-video-search-icon"
          aria-hidden="true"
        >
          🔍
        </span>

        <input
          type="text"
          value={searchQuery}
          onChange={(event) => {
            const value = event.target.value;
            setSearchQuery(value);

            // Google Analytics - track video search
            if (
              typeof window.gtag === "function" &&
              value.trim().length >= 3
            ) {
              window.gtag("event", "video_search", {
                search_term: value.trim()
              });
            }
          }}
          placeholder="Search videos..."
          aria-label="Search videos"
        />

        {searchQuery && (
          <button
            type="button"
            className="member-video-search-clear"
            onClick={() =>
              setSearchQuery("")
            }
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>



      {/* =================================================
            DATE-WISE FILTER
        ================================================= */}
      {/* =================================================
    DATE-WISE FILTER
================================================= */}

      <div className="member-video-date-filter">

        <div className="member-video-date-field">
          <label htmlFor="member-video-start-date">
            From Date
          </label>

          <input
            id="member-video-start-date"
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
            aria-label="Filter videos from date"
          />
        </div>


        <div className="member-video-date-field">
          <label htmlFor="member-video-end-date">
            To Date
          </label>

          <input
            id="member-video-end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) =>
              setEndDate(event.target.value)
            }
            aria-label="Filter videos to date"
          />
        </div>


        {(startDate || endDate) && (
          <button
            type="button"
            className="member-video-date-clear"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
          >
            Clear Dates
          </button>
        )}

      </div>

      {/* =================================================
            LOADING
        ================================================= */}

      {loading && (
        <div className="member-video-empty">
          <div className="member-video-empty-icon">
            ⏳
          </div>

          <h3>
            Loading videos...
          </h3>

          <p>
            Please wait while we
            load the latest videos.
          </p>
        </div>
      )}

      {/* =================================================
            ERROR
        ================================================= */}

      {!loading && error && (
        <div className="member-video-empty">
          <div className="member-video-empty-icon">
            !
          </div>

          <h3>
            Unable to load videos
          </h3>

          <p>
            {error}
          </p>
        </div>
      )}




      {/* =================================================
            EMPTY
        ================================================= */}

      {!loading &&
        !error &&
        filteredVideos.length === 0 && (
          <div className="member-video-empty">
            <div className="member-video-empty-icon">
              ▶
            </div>

            <h3>
              {searchQuery
                ? "No videos found"
                : "No videos available"}
            </h3>

            <p>
              {searchQuery
                ? "Try another search."
                : "Published videos will appear here."}
            </p>
          </div>
        )}

      {/* =================================================
            MONTH-WISE VIDEO GRID
        ================================================= */}

      {!loading &&
        !error &&
        filteredVideos.length > 0 && (
          <div className="member-video-months">

            {videoMonths.map(
              ([monthKey, month]) => (
                <section
                  className="member-video-month"
                  key={monthKey}
                >

                  <div className="member-video-month-header">
                    <div>
                      <span className="member-video-month-eyebrow">
                        VIDEO LIBRARY
                      </span>

                      <h3>
                        {month.label}
                      </h3>
                    </div>

                    <span className="member-video-month-count">
                      {month.videos.length}{" "}
                      {month.videos.length === 1
                        ? "Video"
                        : "Videos"}
                    </span>
                  </div>

                  <div className="member-video-grid">

                    {month.videos.map(
                      (video) => (
                        <article
                          className="member-video-card"
                          key={video.id}
                        >

                          {/* THUMBNAIL */}

                          <button
                            type="button"
                            className="member-video-thumbnail"
                            onClick={() =>
                              openVideo(video)
                            }
                            aria-label={`Play ${video.title ||
                              "video"
                              }`}
                          >
                            {video.thumbnailUrl ? (
                              <img
                                src={getFileUrl(
                                  video.thumbnailUrl
                                )}
                                alt={
                                  video.title ||
                                  "Video thumbnail"
                                }
                              />
                            ) : (
                              <div className="member-video-no-thumbnail">
                                ▶
                              </div>
                            )}

                            <span className="member-video-badge">
                              VIDEO
                            </span>

                            <span className="member-video-play">
                              ▶
                            </span>
                          </button>

                          {/* BODY */}

                          <div className="member-video-body">

                            <h3>
                              {video.title ||
                                "Untitled Video"}
                            </h3>

                            {video.description && (
                              <p>
                                {video.description}
                              </p>
                            )}

                            <div className="member-video-meta">

                              <span>
                                {video.category ||
                                  "Video"}
                              </span>

                              <span>
                                {getDate(
                                  video.publishedAt ||
                                  video.createdAt
                                )}
                              </span>

                            </div>



                            <div className="member-video-card-actions">
                              {/* Like button */}
                              <button
                                type="button"
                                className="member-video-card-action"
                                aria-label="Like video"
                                onClick={() => handleLike(video)}
                              >
                                <svg
                                  width="19"
                                  height="19"
                                  viewBox="0 0 24 24"
                                  fill={likeStats[video.id]?.liked ? "currentColor" : "none"}
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{
                                    color: likeStats[video.id]?.liked ? "#e11d48" : "inherit",
                                  }}
                                >
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                                </svg>

                                {likeStats[video.id]?.count > 0 && (
                                  <span>{likeStats[video.id].count}</span>
                                )}
                              </button>

                              {/* Comment button */}
                              <button
                                type="button"
                                className="member-video-card-action"
                                aria-label="Comment on video"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  const nextState = commentOpenVideoId === video.id ? "" : video.id;
                                  setCommentOpenVideoId(nextState);
                                  setOpenCommentsVideoId(nextState);
                                  setCommentText("");
                                }}
                              >
                                <svg
                                  width="19"
                                  height="19"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" />
                                </svg>

                                {(videoComments[video.id]?.length || 0) > 0 && (
                                  <span>{videoComments[video.id].length}</span>
                                )}
                              </button>

                              {/* Watch Video button */}
                              <button
                                type="button"
                                className="member-video-open"
                                onClick={() => openVideo(video)}
                              >
                                ▶ Watch Video
                              </button>
                            </div>




                            <div
                              className={`member-video-comment-panel ${commentOpenVideoId === video.id ? "is-open" : ""
                                }`}
                            >
                              <form
                                className="member-video-comment-form"
                                onSubmit={(event) =>
                                  handleSaveComment(event, video.id)
                                }
                              >
                                <input
                                  type="text"
                                  value={commentOpenVideoId === video.id ? commentText : ""}
                                  onChange={(event) => setCommentText(event.target.value)}
                                  placeholder="Write a comment..."
                                  aria-label="Write a comment"
                                  maxLength={1000}
                                  onClick={(event) => event.stopPropagation()}
                                  disabled={commentSaving}
                                />

                                <button
                                  type="submit"
                                  disabled={!commentText.trim() || commentSaving}
                                >
                                  {commentSaving ? "Saving..." : "Send"}
                                </button>
                              </form>
                            </div>

                            {/* View Comments button & YouTube style comments list */}
                            {((videoComments[video.id]?.length || 0) > 0 ||
                              commentOpenVideoId === video.id ||
                              openCommentsVideoId === video.id) && (
                              <div className="member-video-comments-wrap">
                                <button
                                  type="button"
                                  className="member-video-view-comments-btn"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenCommentsVideoId((previous) =>
                                      previous === video.id ? "" : video.id
                                    );
                                  }}
                                >
                                  <span>
                                    {openCommentsVideoId === video.id
                                      ? "Hide Comments"
                                      : (videoComments[video.id]?.length || 0) > 0
                                        ? `View Comments (${videoComments[video.id].length})`
                                        : "Comments (0)"}
                                  </span>
                                  <span className="member-video-view-comments-arrow">
                                    {openCommentsVideoId === video.id ? "▲" : "▼"}
                                  </span>
                                </button>

                                {openCommentsVideoId === video.id && (
                                  <div className="member-video-comments-list">
                                    {(videoComments[video.id] || []).length === 0 ? (
                                      <p className="member-video-comments-empty">
                                        No comments yet. Be the first to share your thoughts!
                                      </p>
                                    ) : (
                                      videoComments[video.id].map((c) => (
                                        <div key={c.id} className="member-video-comment-card">
                                          <div className="member-video-comment-avatar">
                                            {(c.userName || "M").charAt(0).toUpperCase()}
                                          </div>
                                          <div className="member-video-comment-body">
                                            <div className="member-video-comment-header">
                                              <span className="member-video-comment-author">
                                                {c.userName || "Member"}
                                              </span>
                                              <span className="member-video-comment-date">
                                                {formatRelativeTime(c.createdAt)}
                                              </span>
                                            </div>
                                            <p className="member-video-comment-content">{c.comment}</p>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </article>
                      )
                    )}

                  </div>
                </section>
              )
            )}

          </div>
        )}

    </section>

    {/* =================================================
          VIDEO MODAL
      ================================================= */}

    {selectedVideo && (
      <MemberVideoPlayer
        video={selectedVideo}
        onClose={closeVideo}
      />
    )}
  </>
);
}

/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.MemberVideo =
  MemberVideo;

window.Video =
  MemberVideo;

export default MemberVideo;