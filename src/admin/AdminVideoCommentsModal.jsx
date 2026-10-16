import React from "react";
import { createPortal } from "react-dom";

const { useState, useEffect, useRef } = React;

function getTime(value) {
  if (!value) return 0;
  try {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (value?._seconds) return value._seconds * 1000;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  } catch {
    return 0;
  }
}

function formatRelativeTime(timestamp) {
  const t = getTime(timestamp);
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

export default function AdminVideoCommentsModal({
  video,
  likesCount = 0,
  onClose
}) {
  if (!video) return null;

  const { user } = (typeof window.useAdminAuth === "function" ? window.useAdminAuth() : {}) || {};
  const { push } = (typeof window.useMToast === "function" ? window.useMToast() : {}) || {};

  const [comments, setComments] = useState([]);
  const [liveLikes, setLiveLikes] = useState(likesCount);
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, userName, userId }
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentSaving, setNewCommentSaving] = useState(false);
  const commentsEndRef = useRef(null);

  // Real-time listener for comments of this video
  useEffect(() => {
    if (!window.db || !video?.id) return;

    const unsubscribe = window.db
      .collection("videocomments")
      .where("videoId", "==", String(video.id))
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) return;
          const list = [];
          snapshot.docs.forEach((doc) => {
            const data = doc.data() || {};
            list.push({
              id: doc.id,
              videoId: data.videoId,
              userName: data.userName || "Member",
              comment: data.comment || "",
              createdAt: data.createdAt,
              userId: data.userId,
              parentId: data.parentId || null,
              replyToUser: data.replyToUser || "",
              replyToUserId: data.replyToUserId || "",
              isAdminReply: Boolean(data.isAdminReply || data.role === "admin"),
              role: data.role || (data.isAdminReply ? "admin" : "member")
            });
          });

          list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
          setComments(list);
        },
        (error) => {
          console.warn("videocomments live listener error:", error);
        }
      );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [video?.id]);

  // Real-time listener for likes count of this video
  useEffect(() => {
    if (!window.db || !video?.id) return;

    const unsubscribe = window.db
      .collection("videolikes")
      .where("videoId", "==", String(video.id))
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) return;
          setLiveLikes(snapshot.docs.length);
        },
        (err) => console.warn("videolikes live listener error:", err)
      );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [video?.id]);

  // Group top-level comments and replies
  const topComments = comments.filter((c) => !c.parentId);
  const repliesByParent = {};
  comments.forEach((c) => {
    if (c.parentId) {
      if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
      repliesByParent[c.parentId].push(c);
    }
  });

  // Sort replies chronologically (oldest first so conversation reads downward)
  Object.keys(repliesByParent).forEach((pid) => {
    repliesByParent[pid].sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt));
  });

  // Keep orphan replies visible if parent was deleted
  const orphanReplies = comments.filter(
    (c) => c.parentId && !topComments.some((top) => top.id === c.parentId)
  );
  const displayComments = [...topComments, ...orphanReplies];

  // Submit reply to a specific comment
  const handlePostReply = async (parentComment) => {
    const text = replyText.trim();
    if (!text || !parentComment || replySaving) return;

    setReplySaving(true);
    const parentId = parentComment.id;
    const replyToUser = parentComment.userName || "Member";
    const replyToUserId = parentComment.userId || "";
    const adminName = user?.displayName || user?.name || "Wealthoria Admin";
    const adminUid = user?.uid || user?.id || "admin";

    const newReply = {
      id: `temp-reply-${Date.now()}`,
      videoId: video.id,
      userId: adminUid,
      userName: adminName,
      comment: text,
      createdAt: Date.now(),
      parentId,
      replyToUser,
      replyToUserId,
      isAdminReply: true,
      role: "admin"
    };

    // Optimistic update
    setComments((prev) => [...prev, newReply]);
    setReplyText("");
    setReplyingTo(null);

    try {
      if (window.db) {
        await window.db.collection("videocomments").add({
          videoId: String(video.id),
          userId: adminUid,
          userName: adminName,
          comment: text,
          parentId,
          replyToUser,
          replyToUserId,
          isAdminReply: true,
          role: "admin",
          createdAt: window.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date()
        });
      }
      if (typeof push === "function") {
        push(`Reply posted to @${replyToUser}`);
      }
    } catch (error) {
      console.error("Admin reply save error:", error);
      if (typeof push === "function") {
        push(error?.message || "Unable to save reply.");
      }
    } finally {
      setReplySaving(false);
    }
  };

  // Submit a top-level admin comment
  const handlePostNewComment = async () => {
    const text = newCommentText.trim();
    if (!text || newCommentSaving) return;

    setNewCommentSaving(true);
    const adminName = user?.displayName || user?.name || "Wealthoria Admin";
    const adminUid = user?.uid || user?.id || "admin";

    const newComment = {
      id: `temp-${Date.now()}`,
      videoId: video.id,
      userId: adminUid,
      userName: adminName,
      comment: text,
      createdAt: Date.now(),
      isAdminReply: true,
      role: "admin"
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");

    try {
      if (window.db) {
        await window.db.collection("videocomments").add({
          videoId: String(video.id),
          userId: adminUid,
          userName: adminName,
          comment: text,
          isAdminReply: true,
          role: "admin",
          createdAt: window.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date()
        });
      }
      if (typeof push === "function") {
        push("Comment posted.");
      }
    } catch (error) {
      console.error("Admin comment save error:", error);
      if (typeof push === "function") {
        push(error?.message || "Unable to save comment.");
      }
    } finally {
      setNewCommentSaving(false);
    }
  };

  const modalContent = (
    <div
      className="mscrim open"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 12, 16, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: 20,
        boxSizing: "border-box"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="mmodal"
        style={{
          width: "94vw",
          maxWidth: 720,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--hair, #e2e8f0)",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.22)"
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--hair, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface-muted, #f8fafc)",
            flexShrink: 0
          }}
        >
          <div style={{ minWidth: 0, flex: 1, marginRight: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: 4,
                  letterSpacing: 0.4
                }}
              >
                VIDEO COMMENTS
              </span>
              <span style={{ fontSize: 11, color: "var(--mute, #64748b)" }}>
                {video.category || "Recorded Video"}
              </span>
            </div>

            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "var(--ink, #1e293b)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {video.title || video.name || "Video"}
            </h3>

            {/* STATS BAR */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, fontSize: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#e11d48", fontWeight: 700 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                </svg>
                {liveLikes} {liveLikes === 1 ? "Like" : "Likes"}
              </span>

              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#2563eb", fontWeight: 700 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" />
                </svg>
                {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
              </span>

              <span style={{ fontSize: 11, color: "var(--mute, #64748b)" }}>
                • Reply to any member comment below as <b>Admin 🛡️</b>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="row-act"
            onClick={onClose}
            title="Close"
            style={{ width: 34, height: 34, fontSize: 18 }}
          >
            ×
          </button>
        </div>

        {/* COMMENTS LIST */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}
        >
          {displayComments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 12px", color: "var(--mute, #64748b)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>No comments on this video yet</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.75 }}>
                When members comment on this video, they will appear here in real-time.
              </p>
            </div>
          ) : (
            displayComments.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--hair, #edf2f7)"
                }}
              >
                {/* PARENT COMMENT CARD */}
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: c.isAdminReply
                        ? "linear-gradient(135deg, #10b981, #059669)"
                        : "linear-gradient(135deg, #3b82f6, #6366f1)",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {c.isAdminReply ? "★" : (c.userName || "M").charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink, #1e293b)" }}>
                        {c.userName || "Member"}
                      </span>
                      {c.isAdminReply && (
                        <span
                          style={{
                            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                            color: "#ffffff",
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 9999,
                            textTransform: "uppercase"
                          }}
                        >
                          Admin
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--mute, #94a3b8)", marginLeft: "auto" }}>
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.45,
                        color: "var(--ink, #334155)",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap"
                      }}
                    >
                      {c.comment}
                    </p>

                    {/* REPLY ACTION BUTTON */}
                    <div style={{ marginTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (replyingTo?.commentId === c.id) {
                            setReplyingTo(null);
                            setReplyText("");
                          } else {
                            setReplyingTo({
                              commentId: c.id,
                              userName: c.userName || "Member",
                              userId: c.userId || ""
                            });
                            setReplyText("");
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: replyingTo?.commentId === c.id ? "rgba(37, 99, 235, 0.12)" : "transparent",
                          border: "none",
                          color: "#2563eb",
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "3px 8px",
                          borderRadius: 6,
                          transition: "background 0.15s ease"
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="9 17 4 12 9 7" />
                          <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                        </svg>
                        <span>{replyingTo?.commentId === c.id ? "Cancel Reply" : `Reply to ${c.userName || "Member"}`}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* INLINE REPLY FORM */}
                {replyingTo?.commentId === c.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePostReply(c);
                    }}
                    style={{
                      marginLeft: 42,
                      marginTop: 4,
                      padding: "10px 12px",
                      background: "var(--surface-muted, #f8fafc)",
                      border: "1px solid #cbd5e1",
                      borderRadius: 10
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 11,
                        color: "var(--mute, #64748b)",
                        marginBottom: 6
                      }}
                    >
                      <span>
                        Replying to <b style={{ color: "#2563eb" }}>@{c.userName}</b> as Admin 🛡️
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type="text"
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${c.userName}...`}
                        maxLength={1000}
                        disabled={replySaving}
                        style={{
                          flex: 1,
                          padding: "7px 10px",
                          fontSize: 12.5,
                          border: "1px solid #cbd5e1",
                          borderRadius: 6,
                          outline: "none",
                          background: "#ffffff"
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim() || replySaving}
                        className="btn btn-green btn-sm"
                        style={{ padding: "6px 14px", fontSize: 12 }}
                      >
                        {replySaving ? "Sending..." : "Reply"}
                      </button>
                    </div>
                  </form>
                )}

                {/* THREADED REPLIES */}
                {(repliesByParent[c.id] || []).length > 0 && (
                  <div
                    style={{
                      marginLeft: 32,
                      paddingLeft: 12,
                      borderLeft: "2px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginTop: 4
                    }}
                  >
                    {repliesByParent[c.id].map((r) => (
                      <div
                        key={r.id}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-start",
                          background: r.isAdminReply ? "rgba(37, 99, 235, 0.04)" : "transparent",
                          padding: "6px 8px",
                          borderRadius: 8
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: r.isAdminReply
                              ? "linear-gradient(135deg, #10b981, #059669)"
                              : "linear-gradient(135deg, #3b82f6, #6366f1)",
                            color: "#ffffff",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          {r.isAdminReply ? "★" : (r.userName || "M").charAt(0).toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink, #1e293b)" }}>
                              {r.userName || "Admin"}
                            </span>
                            {r.isAdminReply && (
                              <span
                                style={{
                                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                  color: "#ffffff",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: "1px 5px",
                                  borderRadius: 9999
                                }}
                              >
                                Admin
                              </span>
                            )}
                            {r.replyToUser && (
                              <span style={{ fontSize: 10.5, color: "var(--mute, #64748b)" }}>
                                replied to <b style={{ color: "#2563eb" }}>@{r.replyToUser}</b>
                              </span>
                            )}
                            <span style={{ fontSize: 10.5, color: "var(--mute, #94a3b8)", marginLeft: "auto" }}>
                              {formatRelativeTime(r.createdAt)}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4, color: "var(--ink, #334155)", wordBreak: "break-word" }}>
                            {r.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* BOTTOM ADMIN DIRECT COMMENT BOX */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePostNewComment();
          }}
          style={{
            padding: "12px 18px",
            borderTop: "1px solid var(--hair, #e2e8f0)",
            background: "var(--surface-muted, #f8fafc)",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexShrink: 0
          }}
        >
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a comment on this video as Admin..."
            maxLength={1000}
            disabled={newCommentSaving}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: 13,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              outline: "none",
              background: "#ffffff"
            }}
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || newCommentSaving}
            className="btn btn-green btn-sm"
            style={{ padding: "8px 16px" }}
          >
            {newCommentSaving ? "Posting..." : "Post Comment"}
          </button>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
