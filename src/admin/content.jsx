import React from "react";
import AdminVideoCommentsModal from "./AdminVideoCommentsModal.jsx";
import {
  findInternalExcerptMarkers,
  validatePublishExcerpt
} from "./excerptGuard.js";

const { useState, useMemo, useEffect } = React;
const { useAdminAuth, useRole } = window;
const { useAdminData } = window;
const { useMRouter, MIcon, StatusPill, ExcerptSocialFields, ExcerptPublishError, useMToast, useConfirm } = window;
const { Shell } = window;

function ContentScreen() {
  const { user } = useAdminAuth();
  const { isAdmin } = useRole();
  const data = useAdminData();
  const { navigate } = useMRouter();
  const { push } = useMToast();
  const confirm = useConfirm();

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sel, setSel] = useState([]);
  const [editing, setEditing] = useState(null);

  const [videoLikes, setVideoLikes] = useState({});
  const [videoComments, setVideoComments] = useState({});
  const [activeCommentsVideo, setActiveCommentsVideo] = useState(null);

  useEffect(() => {
    if (!window.db) return;

    const unsubLikes = window.db
      .collection("videolikes")
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) return;
          const counts = {};
          snapshot.docs.forEach((doc) => {
            const data = doc.data() || {};
            const vid = data.videoId;
            if (vid) {
              counts[vid] = (counts[vid] || 0) + 1;
            }
          });
          setVideoLikes(counts);
        },
        (err) => console.warn("Content screen videolikes error:", err)
      );

    const unsubComments = window.db
      .collection("videocomments")
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) return;
          const grouped = {};
          snapshot.docs.forEach((doc) => {
            const data = doc.data() || {};
            const vid = data.videoId;
            if (!vid) return;
            if (!grouped[vid]) grouped[vid] = [];
            grouped[vid].push({
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
          setVideoComments(grouped);
        },
        (err) => console.warn("Content screen videocomments error:", err)
      );

    return () => {
      if (typeof unsubLikes === "function") unsubLikes();
      if (typeof unsubComments === "function") unsubComments();
    };
  }, []);

  const scoped = useMemo(
    () =>
      isAdmin
        ? data.content
        : data.content.filter(
            (c) => c.authorId === (user?.uid || user?.id)
          ),
    [data.content, isAdmin, user]
  );

  const flaggedCount = useMemo(
    () =>
      scoped.filter(
        (c) => findInternalExcerptMarkers(c.description).length > 0
      ).length,
    [scoped]
  );

  const rows = useMemo(
    () =>
      scoped.filter((c) => {
        const searchText = q.trim().toLowerCase();
        if (searchText) {
          const matchesQuery = [
            c.title,
            c.description,
            c.socialCaption,
            c.category
          ]
            .filter(Boolean)
            .some((field) =>
              String(field).toLowerCase().includes(searchText)
            );
          if (!matchesQuery) {
            return false;
          }
        }

        if (onlyFlagged && findInternalExcerptMarkers(c.description).length === 0) {
          return false;
        }

        if (type !== "all" && c.type !== type) {
          return false;
        }

        if (status !== "all" && c.status !== status) {
          return false;
        }

        if (from && c.modified < from) {
          return false;
        }

        if (to && c.modified > to) {
          return false;
        }

        return true;
      }),
    [scoped, q, onlyFlagged, type, status, from, to]
  );

  const allSel = rows.length > 0 && sel.length === rows.length;
  const someSel = sel.length > 0 && !allSel;

  const toggleAll = () =>
    setSel(allSel ? [] : rows.map((r) => r.id));

  const toggleOne = (id) =>
    setSel((s) =>
      s.includes(id)
        ? s.filter((x) => x !== id)
        : [...s, id]
    );

  const clearSel = () => setSel([]);

  const doBulkPublish = async () => {
    const selectedItems = scoped.filter((item) => sel.includes(item.id));
    const blocked = selectedItems.find(
      (item) => !validatePublishExcerpt("published", item.description).ok
    );

    if (blocked) {
      push(
        `Cannot publish "${blocked.title || "Untitled"}": ` +
          validatePublishExcerpt("published", blocked.description).message,
        "err"
      );
      return;
    }

    try {
      await data.setContentStatus(sel, "published");
      push(
        `Published ${sel.length} item${
          sel.length > 1 ? "s" : ""
        }`
      );
      clearSel();
    } catch (err) {
      push(err?.message || "Unable to publish selected items.", "err");
    }
  };

  const doBulkDelete = async () => {
    const ok = await confirm({
      title: `Delete ${sel.length} item${
        sel.length > 1 ? "s" : ""
      }?`,
      message:
        "This cannot be undone. The selected content will be permanently removed.",
      confirm: "Delete",
      danger: true,
      icon: "trash",
    });

    if (ok) {
      data.deleteContent(sel);

      push(
        `Deleted ${sel.length} item${
          sel.length > 1 ? "s" : ""
        }`
      );

      clearSel();
    }
  };

  const togglePublish = async (c) => {
    const next =
      c.status === "published"
        ? "draft"
        : "published";

    const guard = validatePublishExcerpt(next, c.description);
    if (!guard.ok) {
      push(`"${c.title || "Untitled"}": ${guard.message}`, "err");
      return;
    }

    try {
      await data.setContentStatus([c.id], next);

      push(
        next === "published"
          ? `Published "${c.title}"`
          : `Unpublished "${c.title}"`
      );
    } catch (err) {
      push(err?.message || "Unable to update publish status.", "err");
    }
  };

  const removeOne = async (c) => {
    const ok = await confirm({
      title: "Delete content?",
      message: `"${c.title}" will be permanently removed.`,
      confirm: "Delete",
      danger: true,
      icon: "trash",
    });

    if (ok) {
      data.deleteContent([c.id]);
      push(`Deleted "${c.title}"`);
    }
  };

  const resetFilters = () => {
    setQ("");
    setType("all");
    setStatus("all");
    setOnlyFlagged(false);
    setFrom("");
    setTo("");
  };

  return (
    <Shell
      title="Content"
      subtitle={`${rows.length} item${
        rows.length !== 1 ? "s" : ""
      }${isAdmin ? "" : " (yours)"}`}
      actions={
        <button
          className="btn btn-green btn-sm"
          onClick={() =>
            setEditing({
              id: "new",
              title: "",
              type: "video",
              status: "draft",
              category: "",
            })
          }
        >
          <MIcon name="plus" size={16} />
          New content
        </button>
      }
    >
      <div className="reveal-fade">

        {/* =========================================================
            TOOLBAR
        ========================================================= */}

        <div className="toolbar">

          <div className="tb-search">
            <span className="ic">
              <MIcon name="search" size={17} />
            </span>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, excerpt, or caption"
            />
          </div>

          <select
            className="selectmini"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="quiz">Quiz</option>
          </select>

          <select
            className="selectmini"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="under_review">Under Review</option>
            <option value="archived">Archived</option>
          </select>

          <input
            className="dateinput"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="From date"
            title="Modified from"
          />

          <input
            className="dateinput"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="To date"
            title="Modified to"
          />

          <button
            type="button"
            className={`btn btn-sm ${
              onlyFlagged ? "btn-green" : "btn-ghost"
            }`}
            onClick={() => setOnlyFlagged((v) => !v)}
          >
            {onlyFlagged
              ? `Showing flagged notes (${flaggedCount})`
              : `Flagged notes (${flaggedCount})`}
          </button>

          {(q ||
            onlyFlagged ||
            type !== "all" ||
            status !== "all" ||
            from ||
            to) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={resetFilters}
            >
              Clear
            </button>
          )}

        </div>

        {flaggedCount > 0 && (
          <div className="flagged-banner" role="status">
            <span>
              <strong>{flaggedCount}</strong> content item
              {flaggedCount === 1 ? "" : "s"} contain internal excerpt markers (
              <code>One-liner</code>, <code>WhatsApp:</code>, <code>TODO</code>,{" "}
              <code>Note:</code>). Move social captions into the{" "}
              <strong>Social caption</strong> field before publishing.
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setOnlyFlagged((v) => !v)}
            >
              {onlyFlagged ? "Show all" : "Review flagged"}
            </button>
          </div>
        )}


        {/* =========================================================
            BULK BAR
        ========================================================= */}

        {sel.length > 0 && (
          <div className="bulkbar">

            <span
              className="cbx on"
              onClick={clearSel}
            >
              <MIcon
                name="check"
                size={13}
                stroke={3}
              />
            </span>

            <span className="bcount">
              {sel.length} selected
            </span>

            <div className="bspace">

              <button
                className="btn btn-green btn-sm"
                onClick={doBulkPublish}
              >
                <MIcon
                  name="send"
                  size={15}
                />
                Publish
              </button>

              <button
                className="btn btn-sm"
                style={{
                  background:
                    "rgba(255,255,255,.14)",
                  color: "#fff",
                }}
                onClick={doBulkDelete}
              >
                <MIcon
                  name="trash"
                  size={15}
                />
                Delete
              </button>

            </div>
          </div>
        )}


        {/* =========================================================
            TABLE
        ========================================================= */}

        {rows.length === 0 ? (

          <div className="mempty">

            <div className="eic">
              <MIcon
                name="content"
                size={28}
              />
            </div>

            <h3>
              No content found
            </h3>

            <p>
              Nothing matches your filters.
              Try clearing them or create new
              content.
            </p>

            <button
              className="btn btn-ghost btn-sm"
              onClick={resetFilters}
            >
              Clear filters
            </button>

          </div>

        ) : (

          <div className="tablewrap">

            <table className="dt">

              <thead>
                <tr>

                  {/* SELECT */}
                  <th style={{ width: 44 }}>
                    <span
                      className={`cbx ${
                        allSel
                          ? "on"
                          : someSel
                          ? "indet"
                          : ""
                      }`}
                      onClick={toggleAll}
                    >
                      {allSel ? (
                        <MIcon
                          name="check"
                          size={13}
                          stroke={3}
                        />
                      ) : someSel ? (
                        <MIcon
                          name="x"
                          size={11}
                          stroke={3}
                        />
                      ) : null}
                    </span>
                  </th>

                  {/* TITLE */}
                  <th>
                    Title
                  </th>

                  {/* TYPE */}
                  <th>
                    Type
                  </th>

                  {/* CATEGORY — NEW */}
                  <th>
                    Category
                  </th>

                  {/* STATUS */}
                  <th>
                    Status
                  </th>

                  {/* AUTHOR */}
                  <th>
                    Author
                  </th>

                  {/* ENGAGEMENT (LIKES & COMMENTS) */}
                  <th>
                    Engagement
                  </th>

                  {/* LAST MODIFIED */}
                  <th>
                    Last modified
                  </th>

                  {/* ACTIONS */}
                  <th
                    style={{
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>

                </tr>
              </thead>


              <tbody>

                {rows.map((c) => (

                  <tr
                    key={c.id}
                    className={
                      sel.includes(c.id)
                        ? "sel"
                        : ""
                    }
                  >

                    {/* SELECT */}
                    <td>
                      <span
                        className={`cbx ${
                          sel.includes(c.id)
                            ? "on"
                            : ""
                        }`}
                        onClick={() =>
                          toggleOne(c.id)
                        }
                      >
                        {sel.includes(c.id) && (
                          <MIcon
                            name="check"
                            size={13}
                            stroke={3}
                          />
                        )}
                      </span>
                    </td>


                    {/* TITLE */}
                    <td>
                      <span className="t-title">
                        {c.title}
                      </span>
                      {findInternalExcerptMarkers(c.description).length > 0 && (
                        <span
                          className="internal-note-pill"
                          style={{ marginLeft: 8 }}
                          title={`Detected in excerpt: ${findInternalExcerptMarkers(c.description).join(", ")}`}
                        >
                          Internal note: {findInternalExcerptMarkers(c.description).join(", ")}
                        </span>
                      )}
                    </td>


                    {/* TYPE */}
                    <td>
                      <span className="typecell">

                        <span
                          className={`tic ${c.type}`}
                        >
                          <MIcon
                            name={window.typeIcon(
                              c.type
                            )}
                            size={15}
                          />
                        </span>

                        {String(
                          c.type || ""
                        ).toUpperCase()}

                      </span>
                    </td>


                    {/* CATEGORY — NEW */}
                    <td>
                      <span>
                        {c.category ||
                          "Uncategorized"}
                      </span>
                    </td>


                    {/* STATUS */}
                    <td>
                      <StatusPill
                        status={c.status}
                      />
                    </td>


                    {/* AUTHOR */}
                    <td>
                      {c.author}
                    </td>

                    {/* ENGAGEMENT */}
                    <td>
                      {c.type === "video" ? (() => {
                        const commentsCount = (videoComments[c.id] || []).length;
                        const likesCount = videoLikes[c.id] || 0;
                        return (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 8px",
                              borderRadius: 6,
                              background: "var(--canvas-soft, #f8fafc)",
                              border: "1px solid var(--hair, #e2e8f0)",
                              fontSize: 11.5
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3.5,
                                color: likesCount > 0 ? "#e11d48" : "var(--mute, #94a3b8)",
                                fontWeight: 600
                              }}
                              title={`${likesCount} Like${likesCount === 1 ? "" : "s"}`}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill={likesCount > 0 ? "#e11d48" : "none"}
                                stroke={likesCount > 0 ? "#e11d48" : "currentColor"}
                                strokeWidth="2"
                              >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                              </svg>
                              <span>{likesCount}</span>
                            </span>

                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3.5,
                                color: commentsCount > 0 ? "var(--ink, #1e293b)" : "var(--mute, #94a3b8)",
                                fontWeight: commentsCount > 0 ? 600 : 500
                              }}
                              title={`${commentsCount} Comment${commentsCount === 1 ? "" : "s"}`}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ opacity: 0.7 }}
                              >
                                <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" />
                              </svg>
                              <span>{commentsCount}</span>
                            </span>

                            {commentsCount > 0 && (
                              <button
                                type="button"
                                onClick={() => setActiveCommentsVideo(c)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  background: "var(--ink, #0f172a)",
                                  color: "var(--canvas, #ffffff)",
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "2px 7px",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  marginLeft: 2,
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)"
                                }}
                                title="Reply to comments"
                              >
                                <svg
                                  width="9"
                                  height="9"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="9 17 4 12 9 7" />
                                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                </svg>
                                <span>Reply</span>
                              </button>
                            )}
                          </div>
                        );
                      })() : (
                        <span className="muted" style={{ fontSize: 11 }}>—</span>
                      )}
                    </td>

                    {/* LAST MODIFIED */}
                    <td className="muted">
                      {c.modified}
                    </td>


                    {/* ACTIONS */}
                    <td>

                      <div className="actions">

                        {/* PREVIEW */}
                        <button
                          className="row-act"
                          title="Preview"
                          onClick={() =>
                            push(
                              `Preview "${c.title}" (stubbed)`
                            )
                          }
                        >
                          <MIcon
                            name="eye"
                            size={16}
                          />
                        </button>

                        {/* COMMENTS (VIDEO) */}
                        {c.type === "video" && (videoComments[c.id] || []).length > 0 && (
                          <button
                            className="row-act"
                            title="View Comments & Reply"
                            onClick={() => setActiveCommentsVideo(c)}
                            style={{
                              color: "#2563eb"
                            }}
                          >
                            <MIcon
                              name="chat"
                              size={15}
                            />
                          </button>
                        )}


                        {/* PUBLISH / UNPUBLISH */}
                        <button
                          className="row-act"
                          title={
                            c.status ===
                            "published"
                              ? "Unpublish"
                              : "Publish"
                          }
                          onClick={() =>
                            togglePublish(c)
                          }
                        >
                          <MIcon
                            name={
                              c.status ===
                              "published"
                                ? "eyeoff"
                                : "send"
                            }
                            size={16}
                          />
                        </button>


                        {/* DELETE */}
                        <button
                          className="row-act danger"
                          title="Delete"
                          onClick={() =>
                            removeOne(c)
                          }
                        >
                          <MIcon
                            name="trash"
                            size={16}
                          />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =========================================================
          CONTENT EDITOR
      ========================================================= */}

      {editing && (
        <ContentEditor
          item={editing}
          onClose={() =>
            setEditing(null)
          }
          onSave={async (patch) => {
            try {
              if (editing.id === "new") {

                const item = {
                  id:
                    "c" +
                    Date.now(),

                  title:
                    patch.title,

                  description:
                    patch.description,

                  socialCaption:
                    patch.socialCaption,

                  thumbnailUrl:
                    patch.thumbnailUrl,

                  type:
                    patch.type,

                  status:
                    patch.status,

                  category:
                    patch.category,

                  authorId:
                    user?.uid ||
                    user?.id,

                  author:
                    user?.name ||
                    user?.displayName ||
                    user?.email ||
                    "Admin",

                  modified:
                    new Date()
                      .toISOString()
                      .slice(0, 10),
                };

                await data.addContent(item);

                push(
                  `Created "${item.title}"`
                );

              } else {

                await data.updateContent(
                  editing.id,
                  patch
                );

                push(
                  `Saved "${patch.title}"`
                );
              }

              setEditing(null);
            } catch (err) {
              push(err?.message || "Unable to save content.", "err");
            }
          }}
        />
      )}

      {/* ADMIN VIDEO COMMENTS & REPLIES MODAL */}
      {activeCommentsVideo && (
        <AdminVideoCommentsModal
          video={activeCommentsVideo}
          likesCount={videoLikes[activeCommentsVideo.id] || 0}
          onClose={() => setActiveCommentsVideo(null)}
        />
      )}

    </Shell>
  );
}


/* =========================================================================
   CONTENT EDITOR
   ========================================================================= */

function ContentEditor({
  item,
  onClose,
  onSave,
}) {
  const [title, setTitle] =
    useState(item.title || "");

  const [description, setDescription] =
    useState(item.description || "");

  const [socialCaption, setSocialCaption] =
    useState(item.socialCaption || "");

  const [type, setType] =
    useState(item.type || "video");

  const [category, setCategory] =
    useState(item.category || "");

  const [status, setStatus] =
    useState(item.status || "draft");

  const [thumbnailUrl, setThumbnailUrl] =
    useState(item.thumbnailUrl || "");

  const [publishError, setPublishError] =
    useState("");


  return (

    <div
      className="mscrim open"
      onClick={(e) => {
        if (
          e.target ===
          e.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className="mmodal"
        role="dialog"
        aria-modal="true"
      >

        <h3>
          {item.id === "new"
            ? "New content"
            : "Edit content"}
        </h3>


        {/* TITLE */}
        <div className="field">

          <label>
            Title
          </label>

          <input
            className="input"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            placeholder="Content title"
          />

        </div>


        {/* TYPE + CATEGORY */}
        <div className="field-grid2">

          <div className="field">

            <label>
              Type
            </label>

            <select
              className="select"
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value
                )
              }
            >

              <option value="video">
                Video
              </option>

              <option value="pdf">
                PDF
              </option>

              <option value="quiz">
                Quiz
              </option>

            </select>

          </div>


          {/* CATEGORY */}
          <div className="field">

            <label>
              Category
            </label>

            <input
              className="input"
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              placeholder="Category"
            />

          </div>

        </div>


        {/* THUMBNAIL URL */}
        <div className="field">

          <label>
            Thumbnail URL
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
            placeholder="https://... or /members/..."
          />

        </div>


        {/* DESCRIPTION & SOCIAL CAPTION */}
        <ExcerptSocialFields
          description={description}
          onDescriptionChange={(val) => {
            setDescription(val);
            setPublishError("");
          }}
          socialCaption={socialCaption}
          onSocialCaptionChange={setSocialCaption}
          descriptionPlaceholder="Short description / excerpt shown to members"
        />


        {/* STATUS */}
        <div className="field">

          <label>
            Status
          </label>

          <select
            className="select"
            value={status}
            onChange={(e) => {
              setStatus(
                e.target.value
              );
              setPublishError("");
            }}
          >

            <option value="draft">
              Draft
            </option>

            <option value="under_review">
              Under Review
            </option>

            <option value="published">
              Published
            </option>

            <option value="archived">
              Archived
            </option>

          </select>

        </div>


        <ExcerptPublishError error={publishError} />


        {/* ACTIONS */}
        <div
          className="mactions"
          style={{
            marginTop: 8,
          }}
        >

          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn btn-green btn-sm"
            onClick={() => {
              const cleanDescription = description.trim();
              const check = validatePublishExcerpt(
                status,
                cleanDescription
              );
              if (!check.ok) {
                setPublishError(check.message);
                return;
              }
              setPublishError("");
              onSave({
                title:
                  title.trim() ||
                  "Untitled",

                description: cleanDescription,

                socialCaption: socialCaption.trim(),

                type,

                category:
                  category.trim(),

                thumbnailUrl:
                  thumbnailUrl.trim(),

                status,
              });
            }}
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================================================================
   EXPORT
   ========================================================================= */

window.ContentScreen =
  ContentScreen;