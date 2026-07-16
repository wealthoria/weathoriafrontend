/* global React, window */
/* =========================================================================
   Member Portal — Upload manager (/member/uploads)
   Native drag-and-drop (stands in for react-dropzone), per-file progress,
   post-upload metadata, and a filter/sort/paginated asset grid.
   ========================================================================= */
const { useState, useRef, useMemo, useCallback } = React;
const { useMemberAuth, useRole } = window;
const { useMemberData } = window;
const { MIcon, useMToast, useConfirm } = window;
const { Shell } = window;
const { CATEGORIES } = window.MEMBER_DATA;

function fmtSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}
function detectType(file) {
  const n = (file.name || "").toLowerCase();
  if ((file.type || "").startsWith("video") || /\.(mp4|mov|webm)$/.test(n)) return "video";
  if (n.endsWith(".pdf") || (file.type || "").includes("pdf")) return "pdf";
  if (/\.(json|quiz)$/.test(n)) return "quiz";
  return "pdf";
}

function UploadsScreen() {
  const { user } = useMemberAuth();
  const { isAdmin } = useRole();
  const data = useMemberData();
  const { push } = useMToast();
  const confirm = useConfirm();
  const inputRef = useRef(null);

  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState([]); // {id,name,size,type,progress}
  const [metaQueue, setMetaQueue] = useState([]); // finished, awaiting metadata

  const [cat, setCat] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const startUploads = useCallback((fileList) => {
    const files = Array.from(fileList).slice(0, 8);
    files.forEach((file) => {
      const id = "up" + Math.random().toString(36).slice(2, 8);
      const task = { id, name: file.name, size: fmtSize(file.size), type: detectType(file), progress: 0 };
      setUploading((u) => [...u, task]);
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 22 + 8;
        if (p >= 100) {
          p = 100; clearInterval(iv);
          setUploading((u) => u.filter((x) => x.id !== id));
          setMetaQueue((m) => [...m, { ...task, progress: 100 }]);
        } else {
          setUploading((u) => u.map((x) => x.id === id ? { ...x, progress: Math.round(p) } : x));
        }
      }, 220);
    });
  }, []);

  const onDrop = (e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.length) startUploads(e.dataTransfer.files); };

  const scoped = useMemo(() => isAdmin ? data.uploads : data.uploads.filter((u) => u.ownerId === user.id), [data.uploads, isAdmin, user.id]);
  const filtered = useMemo(() => {
    let r = scoped.filter((a) => (cat === "all" || a.category === cat) && (type === "all" || a.type === type));
    r = [...r].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : (a.uploaded < b.uploaded ? 1 : -1));
    return r;
  }, [scoped, cat, type, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);
  React.useEffect(() => { if (page > pages) setPage(1); }, [pages, page]);

  const removeAsset = async (a) => {
    const ok = await confirm({ title: "Delete asset?", message: `"${a.name}" will be removed from the library.`, confirm: "Delete", danger: true, icon: "trash" });
    if (ok) { data.deleteUpload(a.id); push(`Deleted ${a.name}`); }
  };

  return (
    <Shell title="Uploads" subtitle={`${scoped.length} asset${scoped.length !== 1 ? "s" : ""}`}>
      <div className="reveal-fade">
        {/* dropzone */}
        <div className={`dropzone ${drag ? "drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}>
          <div className="dz-ic"><MIcon name="upload" size={26} /></div>
          <h3>{drag ? "Drop files to upload" : "Drag and drop files here"}</h3>
          <p>or click to browse. Videos, PDFs and quiz files.</p>
          <div className="dz-hint">Up to 8 files at a time. Uploads are simulated in this prototype.</div>
          <input ref={inputRef} type="file" multiple hidden onChange={(e) => { if (e.target.files?.length) startUploads(e.target.files); e.target.value = ""; }} />
        </div>

        {/* in-progress */}
        {uploading.length > 0 && (
          <div className="uplist">
            {uploading.map((u) => (
              <div className="upitem" key={u.id}>
                <div className="uic"><MIcon name={window.typeIcon(u.type)} size={20} /></div>
                <div className="ubody">
                  <div className="un">{u.name}</div>
                  <div className="us">{u.size} &middot; {u.progress}%</div>
                  <div className="upbar"><i style={{ width: u.progress + "%" }} /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* toolbar */}
        <div className="toolbar" style={{ marginTop: 24 }}>
          <div style={{ font: "var(--body-md-strong)", color: "var(--ink)", marginRight: "auto" }}>Asset library</div>
          <select className="selectmini" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option><option value="video">Video</option><option value="pdf">PDF</option><option value="quiz">Quiz</option>
          </select>
          <select className="selectmini" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="selectmini" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Newest first</option><option value="name">Name A-Z</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="mempty">
            <div className="eic"><MIcon name="image" size={28} /></div>
            <h3>No assets</h3>
            <p>Upload your first file using the box above, or adjust your filters.</p>
          </div>
        ) : (
          <React.Fragment>
            <div className="asset-grid">
              {pageRows.map((a) => (
                <div className="asset" key={a.id}>
                  <div className="athumb" style={{ background: a.type === "video" ? "linear-gradient(135deg,#ffe9d4,#f7c9a8)" : a.type === "pdf" ? "linear-gradient(135deg,#fde7e1,#f9d2c4)" : "linear-gradient(135deg,#fbe0dc,#f3c7be)" }}>
                    <span className="badge badge-soft tag">{a.type.toUpperCase()}</span>
                    <span style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.82)", display: "grid", placeItems: "center", color: "var(--ink-deep)" }}><MIcon name={window.typeIcon(a.type)} size={22} /></span>
                  </div>
                  <div className="abody">
                    <h4>{a.name}</h4>
                    <div className="am"><span>{a.size}</span><span>{a.category}</span></div>
                    <div className="atags">
                      {a.tags.map((t) => <span className="badge badge-soft" key={t} style={{ fontSize: 11 }}>{t}</span>)}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => push(`Preview ${a.name} (stubbed)`)}><MIcon name="eye" size={15} />Preview</button>
                      <button className="row-act danger" title="Delete" onClick={() => removeAsset(a)} style={{ width: 38, height: 38, boxShadow: "inset 0 0 0 1px var(--hair)" }}><MIcon name="trash" size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pages > 1 && (
              <div className="pager">
                <span>Page {page} of {pages}</span>
                <button className="pbtn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><MIcon name="chevronL" size={16} /></button>
                {Array.from({ length: pages }).map((_, i) => <button key={i} className={`pbtn ${page === i + 1 ? "on" : ""}`} onClick={() => setPage(i + 1)}>{i + 1}</button>)}
                <button className="pbtn" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><MIcon name="chevronR" size={16} /></button>
              </div>
            )}
          </React.Fragment>
        )}
      </div>

      {/* metadata modal for the next finished upload */}
      {metaQueue.length > 0 && (
        <MetadataModal asset={metaQueue[0]} onCancel={() => setMetaQueue((m) => m.slice(1))} onSave={(meta) => {
          const asset = { id: metaQueue[0].id, name: meta.title || metaQueue[0].name, type: metaQueue[0].type, size: metaQueue[0].size, category: meta.category, tags: meta.tags, uploaded: new Date().toISOString().slice(0, 10), ownerId: user.id, description: meta.description };
          data.addUpload(asset);
          push(`Added ${asset.name}`);
          setMetaQueue((m) => m.slice(1));
        }} />
      )}
    </Shell>
  );
}

function MetadataModal({ asset, onCancel, onSave }) {
  const [title, setTitle] = useState(asset.name);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tagsStr, setTagsStr] = useState("");
  return (
    <div className="mscrim open" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="mmodal" role="dialog" aria-modal="true">
        <h3>Add details</h3>
        <p className="mtext" style={{ marginBottom: 16 }}>Uploaded <b>{asset.name}</b> ({asset.size}). Add metadata before it joins the library.</p>
        <div className="field"><label>Title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>Description</label><textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" /></div>
        <div className="field-grid2">
          <div className="field"><label>Category</label><select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="field"><label>Thumbnail</label><button type="button" className="btn btn-ghost btn-block btn-sm" onClick={() => {}}><MIcon name="image" size={15} />Choose</button></div>
        </div>
        <div className="field"><label>Tags (comma separated)</label><input className="input" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="e.g. sip, beginner" /></div>
        <div className="mactions">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Discard</button>
          <button className="btn btn-green btn-sm" onClick={() => onSave({ title: title.trim(), description, category, tags: tagsStr.split(",").map((t) => t.trim()).filter(Boolean) })}>Save to library</button>
        </div>
      </div>
    </div>
  );
}

window.UploadsScreen = UploadsScreen;
