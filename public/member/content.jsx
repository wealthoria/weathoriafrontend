/* global React, window */
/* =========================================================================
   Member Portal — Content management (/member/content)
   Search, filters (type/status/date), bulk select + bulk publish/delete,
   row actions (Edit/Preview/Publish-Unpublish/Delete). Editors see only their
   own content; Admins see all.
   ========================================================================= */
const { useState, useMemo } = React;
const { useMemberAuth, useRole } = window;
const { useMemberData } = window;
const { useMRouter, MIcon, StatusPill, useMToast, useConfirm } = window;
const { Shell } = window;

function ContentScreen() {
  const { user } = useMemberAuth();
  const { isAdmin } = useRole();
  const data = useMemberData();
  const { navigate } = useMRouter();
  const { push } = useMToast();
  const confirm = useConfirm();

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sel, setSel] = useState([]);
  const [editing, setEditing] = useState(null);

  const scoped = useMemo(() => isAdmin ? data.content : data.content.filter((c) => c.authorId === user.id), [data.content, isAdmin, user.id]);

  const rows = useMemo(() => scoped.filter((c) => {
    if (q.trim() && !c.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (type !== "all" && c.type !== type) return false;
    if (status !== "all" && c.status !== status) return false;
    if (from && c.modified < from) return false;
    if (to && c.modified > to) return false;
    return true;
  }), [scoped, q, type, status, from, to]);

  const allSel = rows.length > 0 && sel.length === rows.length;
  const someSel = sel.length > 0 && !allSel;
  const toggleAll = () => setSel(allSel ? [] : rows.map((r) => r.id));
  const toggleOne = (id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const clearSel = () => setSel([]);

  const doBulkPublish = () => { data.setContentStatus(sel, "published"); push(`Published ${sel.length} item${sel.length > 1 ? "s" : ""}`); clearSel(); };
  const doBulkDelete = async () => {
    const ok = await confirm({ title: `Delete ${sel.length} item${sel.length > 1 ? "s" : ""}?`, message: "This cannot be undone. The selected content will be permanently removed.", confirm: "Delete", danger: true, icon: "trash" });
    if (ok) { data.deleteContent(sel); push(`Deleted ${sel.length} item${sel.length > 1 ? "s" : ""}`); clearSel(); }
  };
  const togglePublish = (c) => {
    const next = c.status === "published" ? "draft" : "published";
    data.setContentStatus([c.id], next);
    push(next === "published" ? `Published "${c.title}"` : `Unpublished "${c.title}"`);
  };
  const removeOne = async (c) => {
    const ok = await confirm({ title: "Delete content?", message: `"${c.title}" will be permanently removed.`, confirm: "Delete", danger: true, icon: "trash" });
    if (ok) { data.deleteContent([c.id]); push(`Deleted "${c.title}"`); }
  };

  const resetFilters = () => { setQ(""); setType("all"); setStatus("all"); setFrom(""); setTo(""); };

  return (
    <Shell title="Content" subtitle={`${rows.length} item${rows.length !== 1 ? "s" : ""}${isAdmin ? "" : " (yours)"}`}
      actions={<button className="btn btn-green btn-sm" onClick={() => setEditing({ id: "new", title: "", type: "video", status: "draft" })}><MIcon name="plus" size={16} />New content</button>}>
      <div className="reveal-fade">
        {/* toolbar */}
        <div className="toolbar">
          <div className="tb-search">
            <span className="ic"><MIcon name="search" size={17} /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title" />
          </div>
          <select className="selectmini" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option><option value="video">Video</option><option value="pdf">PDF</option><option value="quiz">Quiz</option>
          </select>
          <select className="selectmini" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All status</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option>
          </select>
          <input className="dateinput" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" title="Modified from" />
          <input className="dateinput" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" title="Modified to" />
          {(q || type !== "all" || status !== "all" || from || to) && <button className="btn btn-ghost btn-sm" onClick={resetFilters}>Clear</button>}
        </div>

        {/* bulk bar */}
        {sel.length > 0 && (
          <div className="bulkbar">
            <span className="cbx on" onClick={clearSel}><MIcon name="check" size={13} stroke={3} /></span>
            <span className="bcount">{sel.length} selected</span>
            <div className="bspace">
              <button className="btn btn-green btn-sm" onClick={doBulkPublish}><MIcon name="send" size={15} />Publish</button>
              <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }} onClick={doBulkDelete}><MIcon name="trash" size={15} />Delete</button>
            </div>
          </div>
        )}

        {/* table */}
        {rows.length === 0 ? (
          <div className="mempty">
            <div className="eic"><MIcon name="content" size={28} /></div>
            <h3>No content found</h3>
            <p>Nothing matches your filters. Try clearing them or create new content.</p>
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>Clear filters</button>
          </div>
        ) : (
          <div className="tablewrap">
            <table className="dt">
              <thead>
                <tr>
                  <th style={{ width: 44 }}><span className={`cbx ${allSel ? "on" : someSel ? "indet" : ""}`} onClick={toggleAll}>{allSel ? <MIcon name="check" size={13} stroke={3} /> : someSel ? <MIcon name="x" size={11} stroke={3} /> : null}</span></th>
                  <th>Title</th><th>Type</th><th>Status</th><th>Author</th><th>Last modified</th><th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={sel.includes(c.id) ? "sel" : ""}>
                    <td><span className={`cbx ${sel.includes(c.id) ? "on" : ""}`} onClick={() => toggleOne(c.id)}>{sel.includes(c.id) && <MIcon name="check" size={13} stroke={3} />}</span></td>
                    <td><span className="t-title">{c.title}</span></td>
                    <td><span className="typecell"><span className={`tic ${c.type}`}><MIcon name={window.typeIcon(c.type)} size={15} /></span>{c.type.toUpperCase()}</span></td>
                    <td><StatusPill status={c.status} /></td>
                    <td>{c.author}</td>
                    <td className="muted">{c.modified}</td>
                    <td>
                      <div className="actions">
                        <button className="row-act" title="Edit" onClick={() => setEditing(c)}><MIcon name="pencil" size={16} /></button>
                        <button className="row-act" title="Preview" onClick={() => push(`Preview "${c.title}" (stubbed)`)}><MIcon name="eye" size={16} /></button>
                        <button className="row-act" title={c.status === "published" ? "Unpublish" : "Publish"} onClick={() => togglePublish(c)}><MIcon name={c.status === "published" ? "eyeoff" : "send"} size={16} /></button>
                        <button className="row-act danger" title="Delete" onClick={() => removeOne(c)}><MIcon name="trash" size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <ContentEditor item={editing} onClose={() => setEditing(null)} onSave={(patch) => {
        if (editing.id === "new") {
          const item = { id: "c" + Date.now(), title: patch.title, type: patch.type, status: patch.status, authorId: user.id, author: user.name, modified: new Date().toISOString().slice(0, 10) };
          data.addContent(item);
          push(`Created "${item.title}"`);
        } else {
          data.updateContent(editing.id, patch);
          push(`Saved "${patch.title}"`);
        }
        setEditing(null);
      }} />}
    </Shell>
  );
}

/* lightweight edit/create modal */
function ContentEditor({ item, onClose, onSave }) {
  const [title, setTitle] = useState(item.title || "");
  const [type, setType] = useState(item.type || "video");
  const [status, setStatus] = useState(item.status || "draft");
  return (
    <div className="mscrim open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mmodal" role="dialog" aria-modal="true">
        <h3>{item.id === "new" ? "New content" : "Edit content"}</h3>
        <div className="field"><label>Title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Content title" /></div>
        <div className="field-grid2">
          <div className="field"><label>Type</label>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)}><option value="video">Video</option><option value="pdf">PDF</option><option value="quiz">Quiz</option></select>
          </div>
          <div className="field"><label>Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
          </div>
        </div>
        <div className="mactions" style={{ marginTop: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-green btn-sm" onClick={() => onSave({ title: title.trim() || "Untitled", type, status })}>Save</button>
        </div>
      </div>
    </div>
  );
}

window.ContentScreen = ContentScreen;
