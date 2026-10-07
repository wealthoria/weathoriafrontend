import React from "react";

/* global React, window */

const {
  useState,
  useEffect,
  useMemo,
  useCallback
} = React;

const getAdmin = (name) => window[name];

const API_BASE = "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api";

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

/* =========================================================
   FULLSCREEN REELS & MEDIA PLAYER MODAL
   ========================================================= */

function MediaModal({ item, onClose, onPrev, onNext, hasPrev, hasNext }) {
  if (!item) return null;

  const isVideo = item.media_type === "VIDEO";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "840px",
          width: "100%",
          maxHeight: "90vh",
          background: "var(--surface, #1e1e24)",
          color: "var(--fg, #ffffff)",
          borderRadius: "20px",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: isVideo ? "minmax(280px, 380px) 1fr" : "1fr 1fr",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 10,
            background: "rgba(0,0,0,0.6)",
            border: "none",
            color: "#fff",
            width: 32,
            height: 32,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="Close"
        >
          ✕
        </button>

        {/* Media Preview Player */}
        <div
          style={{
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "420px",
            position: "relative"
          }}
        >
          {isVideo ? (
            <video
              src={item.media_url}
              poster={item.thumbnail_url}
              controls
              autoPlay
              playsInline
              style={{
                width: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                display: "block"
              }}
            />
          ) : (
            <img
              src={item.media_url || item.thumbnail_url}
              alt="Instagram post"
              style={{
                width: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                display: "block"
              }}
            />
          )}

          {/* Prev / Next controls */}
          {hasPrev && (
            <button
              onClick={onPrev}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)",
                border: "none",
                color: "#fff",
                width: 36,
                height: 36,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 18
              }}
            >
              ‹
            </button>
          )}

          {hasNext && (
            <button
              onClick={onNext}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)",
                border: "none",
                color: "#fff",
                width: 36,
                height: 36,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 18
              }}
            >
              ›
            </button>
          )}
        </div>

        {/* Caption & Metadata Side Panel */}
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            maxHeight: "85vh",
            overflowY: "auto",
            background: "var(--surface, #18181b)"
          }}
        >
          <div>
            {/* Account Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 16
                }}
              >
                W
              </div>
              <div>
                <b style={{ fontSize: 14, color: "#fff", display: "block" }}>wealthoria_edu</b>
                <span style={{ fontSize: 11, color: "#a1a1aa" }}>{formatRelativeTime(item.timestamp)}</span>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
              <span
                style={{
                  background: "rgba(244, 63, 94, 0.15)",
                  color: "#f43f5e",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                ❤️ {Number(item.like_count || 0).toLocaleString("en-IN")} Likes
              </span>

              <span
                style={{
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                💬 {Number(item.comments_count || 0).toLocaleString("en-IN")} Comments
              </span>
            </div>

            {/* Caption Text */}
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#e4e4e7",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}
            >
              {item.caption || "No caption provided."}
            </div>
          </div>

          {/* Action Link */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <a
              href={item.permalink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                color: "#ffffff",
                padding: "10px 16px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 13
              }}
            >
              Open on Instagram ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN ADMIN INSTAGRAM COMPONENT
   ========================================================= */

function AdminInstagram() {
  const useMToast = getAdmin("useMToast");
  const toast = typeof useMToast === "function" ? useMToast() || {} : {};
  const pushToast = toast.push || (() => {});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [filterType, setFilterType] = useState("ALL"); // ALL, VIDEO, IMAGE
  const [search, setSearch] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(null);

  /* ---------------------------------------------------------
     LOAD STATUS & MEDIA
     --------------------------------------------------------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Status
      const statusRes = await fetch(`${API_BASE}/instagram/status`);
      const statusData = await statusRes.json();
      setStatus(statusData);

      // 2. Fetch Media
      const mediaRes = await fetch(`${API_BASE}/instagram/media?limit=50`);
      const mediaData = await mediaRes.json();
      if (mediaData.success && Array.isArray(mediaData.data)) {
        setMediaList(mediaData.data);
      }
    } catch (err) {
      console.error("Failed to load Instagram data:", err);
      pushToast("Failed to load Instagram media feed", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------------------------------------------------
     REFRESH ACCESS TOKEN
     --------------------------------------------------------- */
  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/instagram/refresh`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        pushToast("Instagram Access Token extended for 60 days!", "success");
        fetchData();
      } else {
        pushToast(data.message || "Failed to refresh token", "error");
      }
    } catch (e) {
      pushToast("Network error refreshing token", "error");
    } finally {
      setRefreshing(false);
    }
  };

  /* ---------------------------------------------------------
     FILTER & SEARCH LIST
     --------------------------------------------------------- */
  const filteredList = useMemo(() => {
    return mediaList.filter((item) => {
      // Type filter
      if (filterType === "VIDEO" && item.media_type !== "VIDEO") return false;
      if (filterType === "IMAGE" && item.media_type === "VIDEO") return false;

      // Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(item.caption || "").toLowerCase().includes(q) ||
        String(item.id).toLowerCase().includes(q)
      );
    });
  }, [mediaList, filterType, search]);

  const selectedItem = selectedIdx !== null ? filteredList[selectedIdx] : null;

  return (
    <div className="reveal-fade" style={{ padding: "8px 0 40px" }}>
      {/* SCOPED STYLES */}
      <style>{`
        .ig-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          cursor: pointer;
        }
        .ig-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          border-color: rgba(225, 29, 72, 0.4);
        }
        .ig-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: #fff;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .ig-pill-btn {
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 600;
          border: 1px solid var(--line, #e5e7eb);
          background: var(--surface, #ffffff);
          color: var(--fg, #374151);
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ig-pill-btn.active {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }
      `}</style>

      {/* =======================================================
          ACCOUNT STATUS BANNER
          ======================================================= */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(240, 148, 51, 0.08) 0%, rgba(204, 35, 102, 0.08) 100%)",
          border: "1px solid rgba(204, 35, 102, 0.2)",
          borderRadius: "18px",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 24,
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.3)"
            }}
          >
            📸
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--fg, #111827)" }}>
                @{status?.username || "wealthoria_edu"}
              </h3>
              <span
                style={{
                  background: "#10b981",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "12px",
                  letterSpacing: "0.03em"
                }}
              >
                ● CONNECTED
              </span>
            </div>

            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--mute, #6b7280)" }}>
              Instagram {status?.accountType || "Business"} Account · {mediaList.length} Reels & Posts Synced
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="ig-pill-btn"
            onClick={handleRefreshToken}
            disabled={refreshing}
            title="Extend token for another 60 days"
          >
            🔄 {refreshing ? "Extending..." : "Refresh 60-Day Token"}
          </button>

          <button
            type="button"
            className="ig-pill-btn"
            onClick={fetchData}
            disabled={loading}
          >
            ⚡ {loading ? "Syncing..." : "Sync Latest Reels"}
          </button>

          <a
            href={`https://instagram.com/${status?.username || "wealthoria_edu"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ig-pill-btn"
            style={{ textDecoration: "none", background: "#e11d48", color: "#fff", borderColor: "#e11d48" }}
          >
            View on Instagram ↗
          </a>
        </div>
      </div>

      {/* =======================================================
          FILTERS & SEARCH BAR
          ======================================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px"
        }}
      >
        {/* Type Filter Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "ALL", label: `All Content (${mediaList.length})` },
            { id: "VIDEO", label: `Reels & Videos (${mediaList.filter((i) => i.media_type === "VIDEO").length})` },
            { id: "IMAGE", label: `Images (${mediaList.filter((i) => i.media_type !== "VIDEO").length})` }
          ].map((tb) => (
            <button
              key={tb.id}
              type="button"
              className={`ig-pill-btn ${filterType === tb.id ? "active" : ""}`}
              onClick={() => setFilterType(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search captions or hashtags (#kannada, #investing)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid var(--line, #e5e7eb)",
            fontSize: "13px",
            width: "280px",
            outline: "none",
            background: "var(--surface, #fff)",
            color: "var(--fg, #111827)"
          }}
        />
      </div>

      {/* =======================================================
          REELS & POSTS GRID
          ======================================================= */}
      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--mute, #6b7280)" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📸</div>
          <b>Loading your Instagram content...</b>
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--mute, #6b7280)" }}>
          No Instagram posts found matching your criteria.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "20px"
          }}
        >
          {filteredList.map((item, idx) => {
            const isVideo = item.media_type === "VIDEO";
            const thumb = item.thumbnail_url || item.media_url;

            return (
              <div
                key={item.id}
                className="ig-card"
                onClick={() => setSelectedIdx(idx)}
              >
                {/* Media Thumbnail */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: isVideo ? "140%" : "100%", // 9:16 for reels, 1:1 for images
                    background: "#000",
                    overflow: "hidden"
                  }}
                >
                  <img
                    src={thumb}
                    alt="Reel thumbnail"
                    loading="lazy"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />

                  {/* Video / Reel Badge */}
                  <span className="ig-badge">
                    {isVideo ? "▶ REEL" : "📷 POST"}
                  </span>

                  {/* Play Overlay Icon */}
                  {isVideo && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.25)"
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.9)",
                          color: "#111",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          paddingLeft: 3,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}
                      >
                        ▶
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                  <div>
                    {/* Caption Preview */}
                    <p
                      style={{
                        margin: "0 0 10px",
                        fontSize: 12.5,
                        lineHeight: 1.45,
                        color: "var(--fg, #1f2937)",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {item.caption || "No caption"}
                    </p>
                  </div>

                  {/* Footer Metrics */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11.5,
                      color: "var(--mute, #6b7280)",
                      paddingTop: 8,
                      borderTop: "1px solid var(--line, #f3f4f6)"
                    }}
                  >
                    <div style={{ display: "flex", gap: 10 }}>
                      <span>❤️ {Number(item.like_count || 0).toLocaleString("en-IN")}</span>
                      <span>💬 {Number(item.comments_count || 0).toLocaleString("en-IN")}</span>
                    </div>

                    <span>{formatRelativeTime(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =======================================================
          MEDIA PREVIEW MODAL
          ======================================================= */}
      {selectedItem && (
        <MediaModal
          item={selectedItem}
          onClose={() => setSelectedIdx(null)}
          onPrev={() => setSelectedIdx((prev) => Math.max(0, prev - 1))}
          onNext={() => setSelectedIdx((prev) => Math.min(filteredList.length - 1, prev + 1))}
          hasPrev={selectedIdx > 0}
          hasNext={selectedIdx < filteredList.length - 1}
        />
      )}
    </div>
  );
}

/* =========================================================
   PUBLIC EXPORT
   ========================================================= */

window.AdminInstagram = AdminInstagram;
export default AdminInstagram;
