import React from "react";
import { createPortal } from "react-dom";

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
   FULLSCREEN REELS & MEDIA PLAYER MODAL (PORTAL)
   ========================================================= */

function MediaModal({ item, onClose, onPrev, onNext, hasPrev, hasNext, pushToast }) {
  if (!item) return null;

  const isVideo = item.media_type === "VIDEO";
  const videoRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Comments State
  const [activeTab, setActiveTab] = useState("comments"); // "comments" | "caption"
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id, username }
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Lock background scrolling when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Fetch comments whenever the active media item changes
  const loadComments = useCallback(async () => {
    if (!item?.id) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE}/instagram/comments/${item.id}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setComments(json.data);
      } else {
        setComments([]);
      }
    } catch (e) {
      console.error("Failed to load Instagram comments:", e);
    } finally {
      setLoadingComments(false);
    }
  }, [item?.id]);

  // Reset video & comments state on item switch
  useEffect(() => {
    setHasEnded(false);
    setIsPlaying(true);
    setReplyingTo(null);
    setReplyText("");
    setNewComment("");
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
    loadComments();
  }, [item?.id, loadComments]);

  // Restart / Replay function
  const handleReplay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setHasEnded(false);
    }
  }, []);

  // Jump backward by 5 seconds
  const handleRewind = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      if (hasEnded) {
        videoRef.current.play();
        setHasEnded(false);
        setIsPlaying(true);
      }
    }
  }, [hasEnded]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input/textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        if (e.key === "Escape") {
          document.activeElement.blur();
        }
        return;
      }

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        onPrev();
      } else if (e.key === "ArrowRight" && hasNext) {
        onNext();
      } else if (e.key === "r" || e.key === "R") {
        if (isVideo) handleReplay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext, hasPrev, hasNext, isVideo, handleReplay]);

  // Post top-level comment as @wealthoria_edu
  const handlePostComment = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE}/instagram/comments/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newComment.trim() })
      });
      const data = await res.json();
      if (data.success) {
        if (typeof pushToast === "function") pushToast("Comment posted on Instagram!", "success");
        const added = {
          id: data.data?.id || `comment-${Date.now()}`,
          text: newComment.trim(),
          username: "wealthoria_edu",
          timestamp: new Date().toISOString(),
          like_count: 0
        };
        setComments((prev) => [added, ...prev]);
        setNewComment("");
      } else {
        if (typeof pushToast === "function") pushToast(data.message || "Failed to post comment", "error");
      }
    } catch (err) {
      if (typeof pushToast === "function") pushToast("Network error posting comment", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Reply to a specific comment as @wealthoria_edu
  const handlePostReply = async (commentId) => {
    if (!replyText.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`${API_BASE}/instagram/comments/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        if (typeof pushToast === "function") pushToast("Reply posted on Instagram!", "success");
        const newReply = {
          id: data.data?.id || `reply-${Date.now()}`,
          text: replyText.trim(),
          username: "wealthoria_edu",
          timestamp: new Date().toISOString(),
          like_count: 0
        };
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              const currentReplies = c.replies?.data || [];
              return {
                ...c,
                replies: {
                  data: [...currentReplies, newReply]
                }
              };
            }
            return c;
          })
        );
        setReplyingTo(null);
        setReplyText("");
      } else {
        if (typeof pushToast === "function") pushToast(data.message || "Failed to post reply", "error");
      }
    } catch (err) {
      if (typeof pushToast === "function") pushToast("Network error posting reply", "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        background: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
        overflow: "hidden"
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          maxWidth: isVideo ? "920px" : "900px",
          width: "100%",
          maxHeight: "88vh",
          height: "auto",
          background: "var(--surface, #18181b)",
          color: "var(--fg, #ffffff)",
          borderRadius: "20px",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: isVideo ? "minmax(280px, 400px) 1fr" : "minmax(320px, 1fr) 1fr",
          boxShadow: "0 25px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.12)",
          margin: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 40,
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            width: 34,
            height: 34,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            backdropFilter: "blur(4px)"
          }}
          title="Close (Esc)"
        >
          ✕
        </button>

        {/* =======================================================
            MEDIA PREVIEW PLAYER COLUMN (LEFT)
            ======================================================= */}
        <div
          style={{
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            maxHeight: "88vh",
            height: "100%",
            overflow: "hidden"
          }}
        >
          {isVideo ? (
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
              <video
                ref={videoRef}
                src={item.media_url}
                poster={item.thumbnail_url}
                controls
                autoPlay
                playsInline
                onPlay={() => {
                  setIsPlaying(true);
                  setHasEnded(false);
                }}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  setHasEnded(true);
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                    setDuration(videoRef.current.duration || 0);
                  }
                }}
                style={{
                  width: "100%",
                  maxHeight: "88vh",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                  background: "#000"
                }}
              />

              {/* Big Replay Overlay when video ends */}
              {hasEnded && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.65)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    zIndex: 15,
                    animation: "fadeIn 0.2s ease"
                  }}
                >
                  <button
                    onClick={handleReplay}
                    style={{
                      background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                      color: "#fff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "30px",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 8px 24px rgba(225, 29, 72, 0.4)",
                      transform: "scale(1)",
                      transition: "transform 0.15s ease"
                    }}
                  >
                    <span style={{ fontSize: 18 }}>↺</span> Replay Reel
                  </button>
                  <span style={{ fontSize: 11.5, color: "#d1d5db" }}>Press 'R' or click to replay</span>
                </div>
              )}

              {/* Floating Quick Action Pill */}
              <div
                style={{
                  position: "absolute",
                  bottom: 52,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 12,
                  display: "flex",
                  gap: 8,
                  background: "rgba(0, 0, 0, 0.78)",
                  backdropFilter: "blur(8px)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.18)"
                }}
              >
                <button
                  onClick={handleRewind}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 6px",
                    display: "flex",
                    alignItems: "center",
                    gap: 3
                  }}
                  title="Rewind 5 seconds"
                >
                  ⏪ -5s
                </button>
                <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
                <button
                  onClick={handleReplay}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f43f5e",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "3px 6px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                  title="Replay from start (R)"
                >
                  ↺ Replay
                </button>
              </div>
            </div>
          ) : (
            <img
              src={item.media_url || item.thumbnail_url}
              alt="Instagram post"
              style={{
                width: "100%",
                maxHeight: "88vh",
                height: "auto",
                objectFit: "contain",
                display: "block",
                background: "#000"
              }}
            />
          )}

          {/* Navigation Arrows */}
          {hasPrev && (
            <button
              onClick={onPrev}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.65)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                width: 38,
                height: 38,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
                transition: "all 0.15s ease"
              }}
              title="Previous (←)"
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
                background: "rgba(0,0,0,0.65)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                width: 38,
                height: 38,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
                transition: "all 0.15s ease"
              }}
              title="Next (→)"
            >
              ›
            </button>
          )}
        </div>

        {/* =======================================================
            SIDE PANEL: HEADER, COMMENTS, CAPTION & REPLIES (RIGHT)
            ======================================================= */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "88vh",
            height: "100%",
            boxSizing: "border-box",
            background: "var(--surface, #18181b)",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 15,
                  flexShrink: 0
                }}
              >
                W
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <b style={{ fontSize: 13.5, color: "#fff", whiteSpace: "nowrap" }}>wealthoria_edu</b>
                  <span
                    style={{
                      background: "rgba(225, 29, 72, 0.2)",
                      color: "#fb7185",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: "6px"
                    }}
                  >
                    {isVideo ? "REEL" : "POST"}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#a1a1aa" }}>{formatRelativeTime(item.timestamp)}</span>
              </div>
            </div>

            {/* View Switcher Tabs: Comments vs Caption */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setActiveTab("comments")}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: activeTab === "comments" ? "1px solid #e11d48" : "1px solid rgba(255,255,255,0.1)",
                  background: activeTab === "comments" ? "rgba(225, 29, 72, 0.15)" : "transparent",
                  color: activeTab === "comments" ? "#fda4af" : "#9ca3af",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5
                }}
              >
                💬 Comments ({comments.length > 0 ? comments.length : item.comments_count || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("caption")}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: activeTab === "caption" ? "1px solid #e11d48" : "1px solid rgba(255,255,255,0.1)",
                  background: activeTab === "caption" ? "rgba(225, 29, 72, 0.15)" : "transparent",
                  color: activeTab === "caption" ? "#fda4af" : "#9ca3af",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5
                }}
              >
                📝 Caption
              </button>
            </div>
          </div>

          {/* =======================================================
              TAB CONTENT (SCROLLABLE BODY)
              ======================================================= */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}
          >
            {activeTab === "caption" ? (
              /* CAPTION VIEW */
              <div>
                <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "rgba(244, 63, 94, 0.15)",
                      color: "#f43f5e",
                      padding: "4px 10px",
                      borderRadius: "16px",
                      fontSize: 11.5,
                      fontWeight: 700
                    }}
                  >
                    ❤️ {Number(item.like_count || 0).toLocaleString("en-IN")} Likes
                  </span>
                  <span
                    style={{
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#818cf8",
                      padding: "4px 10px",
                      borderRadius: "16px",
                      fontSize: 11.5,
                      fontWeight: 700
                    }}
                  >
                    💬 {Number(item.comments_count || 0).toLocaleString("en-IN")} Comments
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: "#e4e4e7",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}
                >
                  {item.caption || "No caption provided."}
                </div>
              </div>
            ) : (
              /* COMMENTS & REPLIES VIEW */
              <div>
                {loadingComments ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#a1a1aa", fontSize: 13 }}>
                    Loading comments from Instagram...
                  </div>
                ) : comments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "36px 14px", color: "#71717a", fontSize: 13 }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>💬</div>
                    <b style={{ color: "#f3f4f6", fontSize: 13.5 }}>
                      {item.comments_count > 0 ? `${item.comments_count} Comments on Instagram` : "No comments yet"}
                    </b>
                    <p style={{ fontSize: 11.5, color: "#a1a1aa", margin: "6px auto 0", maxWidth: "290px", lineHeight: 1.55 }}>
                      {item.comments_count > 0
                        ? "Public visitor comments sync in Live Mode. You can post and reply directly as @wealthoria_edu below!"
                        : "Be the first to post a comment as @wealthoria_edu below!"}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {comments.map((c) => {
                      const isOwner = c.username === "wealthoria_edu";
                      const repliesList = c.replies?.data || [];

                      return (
                        <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {/* Parent Comment Card */}
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "flex-start",
                              background: isOwner ? "rgba(225, 29, 72, 0.08)" : "rgba(255,255,255,0.03)",
                              padding: "10px 12px",
                              borderRadius: "12px",
                              border: isOwner ? "1px solid rgba(225, 29, 72, 0.25)" : "1px solid rgba(255,255,255,0.05)"
                            }}
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: isOwner ? "linear-gradient(45deg, #f09433, #dc2743)" : "#374151",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                flexShrink: 0
                              }}
                            >
                              {(c.username || "U").charAt(0).toUpperCase()}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: isOwner ? "#fda4af" : "#fff" }}>
                                    @{c.username || "user"}
                                  </span>
                                  {isOwner && (
                                    <span style={{ background: "#e11d48", color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                                      ADMIN
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: 10.5, color: "#71717a" }}>
                                  {formatRelativeTime(c.timestamp)}
                                </span>
                              </div>

                              <p style={{ margin: "4px 0 6px", fontSize: 12.5, lineHeight: 1.45, color: "#e4e4e7", wordBreak: "break-word" }}>
                                {c.text}
                              </p>

                              {/* Action Row */}
                              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#9ca3af" }}>
                                {c.like_count > 0 && <span>❤️ {c.like_count}</span>}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo({ id: c.id, username: c.username });
                                    setReplyText(`@${c.username} `);
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#38bdf8",
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    padding: 0
                                  }}
                                >
                                  ↩ Reply
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Nested Replies List */}
                          {repliesList.length > 0 && (
                            <div style={{ marginLeft: "24px", paddingLeft: "12px", borderLeft: "2px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
                              {repliesList.map((r) => {
                                const isReplyOwner = r.username === "wealthoria_edu";
                                return (
                                  <div
                                    key={r.id}
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      background: isReplyOwner ? "rgba(225, 29, 72, 0.08)" : "rgba(255,255,255,0.02)",
                                      padding: "8px 10px",
                                      borderRadius: "10px",
                                      border: isReplyOwner ? "1px solid rgba(225, 29, 72, 0.2)" : "1px solid rgba(255,255,255,0.04)"
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: "50%",
                                        background: isReplyOwner ? "linear-gradient(45deg, #f09433, #dc2743)" : "#4b5563",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        flexShrink: 0
                                      }}
                                    >
                                      {(r.username || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <b style={{ fontSize: 11.5, color: isReplyOwner ? "#fda4af" : "#f3f4f6" }}>@{r.username}</b>
                                        {isReplyOwner && (
                                          <span style={{ background: "#e11d48", color: "#fff", fontSize: 8.5, padding: "0 4px", borderRadius: "3px", fontWeight: 800 }}>
                                            ADMIN
                                          </span>
                                        )}
                                        <span style={{ fontSize: 10, color: "#71717a", marginLeft: "auto" }}>
                                          {formatRelativeTime(r.timestamp)}
                                        </span>
                                      </div>
                                      <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: 1.4, color: "#d1d5db", wordBreak: "break-word" }}>
                                        {r.text}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Inline Reply Input if currently replying to this comment */}
                          {replyingTo?.id === c.id && (
                            <div
                              style={{
                                marginLeft: "24px",
                                padding: "10px 12px",
                                background: "rgba(56, 189, 248, 0.08)",
                                border: "1px solid rgba(56, 189, 248, 0.3)",
                                borderRadius: "10px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>
                                  Replying to @{replyingTo.username} as @wealthoria_edu
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setReplyingTo(null)}
                                  style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: 11, cursor: "pointer" }}
                                >
                                  Cancel
                                </button>
                              </div>

                              <div style={{ display: "flex", gap: 8 }}>
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handlePostReply(c.id);
                                  }}
                                  placeholder="Write a reply..."
                                  autoFocus
                                  style={{
                                    flex: 1,
                                    background: "#09090b",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: "8px",
                                    padding: "6px 10px",
                                    color: "#fff",
                                    fontSize: "12px",
                                    outline: "none"
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handlePostReply(c.id)}
                                  disabled={submittingReply || !replyText.trim()}
                                  style={{
                                    background: "#0284c7",
                                    color: "#fff",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    cursor: "pointer"
                                  }}
                                >
                                  {submittingReply ? "..." : "Send Reply"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =======================================================
              BOTTOM COMMENT INPUT & FOOTER
              ======================================================= */}
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.25)"
            }}
          >
            {/* Top-Level Comment Input */}
            <form onSubmit={handlePostComment} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Post comment as @wealthoria_edu..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  background: "#09090b",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  color: "#fff",
                  fontSize: "12.5px",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                style={{
                  background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  opacity: submittingComment || !newComment.trim() ? 0.6 : 1
                }}
              >
                {submittingComment ? "Posting..." : "Comment"}
              </button>
            </form>

            {/* Bottom Actions Bar */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {isVideo && (
                <button
                  type="button"
                  onClick={handleReplay}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5
                  }}
                  title="Replay Video (R)"
                >
                  ↺ Replay
                </button>
              )}

              <a
                href={item.permalink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: "block",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 12
                }}
              >
                Open on Instagram ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
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
          pushToast={pushToast}
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
