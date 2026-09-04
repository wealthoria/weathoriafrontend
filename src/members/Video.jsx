import React from "react";

const { useState, useEffect } = React;

const MEMBER_API =
  "https://webinar-registration-backend.onrender.com";

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
   VIDEO PLAYER MODAL
========================================================= */

function MemberVideoPlayer({
  video,
  onClose
}) {
  if (!video) {
    return null;
  }

  const embedUrl = getVideoEmbedUrl(
    video.vdocipherUrl
  );

  const directVideoUrl =
    video.videoUrl || "";

  return (
    <div
      className="member-video-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
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

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedVideo, setSelectedVideo] =
    useState(null);

  const [searchQuery, setSearchQuery] =
    useState("");

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

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredVideos =
    videos.filter((video) => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

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

  /* =======================================================
     OPEN VIDEO
  ======================================================= */

  function openVideo(video) {
    setSelectedVideo(video);
  }

  /* =======================================================
     CLOSE VIDEO
  ======================================================= */

  function closeVideo() {
    setSelectedVideo(null);
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <section className="member-video-page">

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
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
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
            VIDEO GRID
        ================================================= */}

        {!loading &&
          !error &&
          filteredVideos.length > 0 && (
            <div className="member-video-grid">

              {filteredVideos.map(
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
                      aria-label={`Play ${
                        video.title ||
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

                      <button
                        type="button"
                        className="member-video-open"
                        onClick={() =>
                          openVideo(video)
                        }
                      >
                        ▶ Watch Video
                      </button>

                    </div>

                  </article>
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