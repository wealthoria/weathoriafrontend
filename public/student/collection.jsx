/* global React, window */
/* =========================================================================
   Student Portal — My Collection (/student/collection) + Purchase modal
   ========================================================================= */
const { useState, useMemo } = React;
const { useApp, Icon } = window;
const { useCourses } = window;
const { useRouter, PIcon, ThumbArt, ProgressBar } = window;
const { CATEGORIES } = window.STUDENT_DATA;

function CollectionScreen({ onResume }) {
  const { theme } = useApp();
  const { purchased, getProgress } = useCourses();
  const { navigate } = useRouter();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return purchased.filter((c) => {
      const okCat = cat === "All" || c.category === cat;
      const okQ = !q.trim() || c.title.toLowerCase().includes(q.trim().toLowerCase());
      return okCat && okQ;
    });
  }, [purchased, cat, q]);

  const catCounts = useMemo(() => {
    const m = { All: purchased.length };
    purchased.forEach((c) => { m[c.category] = (m[c.category] || 0) + 1; });
    return m;
  }, [purchased]);

  return (
    <div className="pwrap">
      <div className="col-head reveal-up">
        <span className="eyebrow">My collection</span>
        <h1 className="disp" style={{ fontSize: "clamp(28px,4vw,38px)", marginTop: 6 }}>Your courses</h1>
        <p style={{ font: "var(--body-md)", color: "var(--body)", margin: "8px 0 0" }}>
          {purchased.length} course{purchased.length !== 1 ? "s" : ""} in your library. Pick one up where you left off.
        </p>
      </div>

      <div className="col-toolbar">
        <div className="search-field">
          <span className="ic"><PIcon name="search" size={18} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your courses" aria-label="Search courses" />
        </div>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
              {c}{catCounts[c] ? ` (${catCounts[c]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {purchased.length === 0 ? (
        <div className="empty">
          <div className="eic"><PIcon name="cap" size={32} /></div>
          <h3>Your collection is empty</h3>
          <p>You have not enrolled in any courses yet. Browse the library to find your first one.</p>
          <button className="btn btn-green" onClick={() => navigate("/student/dashboard")}>Browse courses<Icon name="arrow" size={17} /></button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="eic"><PIcon name="search" size={30} /></div>
          <h3>No matches</h3>
          <p>No courses match your search and filter. Try a different term or category.</p>
          <button className="btn btn-ghost" onClick={() => { setQ(""); setCat("All"); }}>Clear filters</button>
        </div>
      ) : (
        <div className="course-grid" style={{ paddingBottom: 72 }}>
          {filtered.map((c) => (
            <window.CourseCard key={c.id} course={c} variant="owned" progress={getProgress(c.id)} onResume={onResume} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- purchase modal (confirmation + success) ---------------------------- */
function PurchaseModal({ course, onClose, onConfirm }) {
  const { theme } = useApp();
  const [stage, setStage] = useState("confirm"); // confirm | processing | done
  const open = !!course;
  const dialogRef = React.useRef(null);
  window.useModalA11y(open, () => { if (stage !== "processing") onClose(); }, dialogRef);

  React.useEffect(() => { if (course) setStage("confirm"); }, [course]);

  const confirm = () => {
    setStage("processing");
    setTimeout(() => { setStage("done"); onConfirm(course); }, 1100);
  };

  const gst = course ? Math.round(course.price * 0.18) : 0;
  const total = course ? course.price + gst : 0;

  return (
    <div className={`scrim ${open ? "open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget && stage !== "processing") onClose(); }}>
      {course && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Course enrollment" ref={dialogRef} tabIndex={-1}>
          {stage === "done" ? (
            <div className="purchase-ok">
              <div className="okc"><Icon name="check" size={34} stroke={3} /></div>
              <h3>You are enrolled</h3>
              <p>{course.title} is now in your collection. Time to start learning.</p>
              <div className="modal-actions">
                <button className="btn btn-ghost btn-block" onClick={onClose}>Keep browsing</button>
                <button className="btn btn-green btn-block" onClick={() => onClose("collection")}>Go to collection</button>
              </div>
            </div>
          ) : (
            <React.Fragment>
              <div className="modal-thumb"><ThumbArt course={course} theme={theme} /><span style={{ position: "relative", zIndex: 1, width: 54, height: 54, borderRadius: "50%", background: "rgba(255,255,255,.82)", display: "grid", placeItems: "center", color: "var(--ink-deep)" }}><Icon name={course.icon} size={26} /></span></div>
              <h3>{course.title}</h3>
              <p className="msub">{course.lessons} lessons &middot; {course.hours} hours &middot; {course.level}</p>
              <div className="mrow">Course price <span className="v">&#8377;{course.price.toLocaleString("en-IN")}</span></div>
              <div className="mrow">GST (18%) <span className="v">&#8377;{gst.toLocaleString("en-IN")}</span></div>
              <div className="mrow total">Total <span className="v">&#8377;{total.toLocaleString("en-IN")}</span></div>
              <div className="modal-actions">
                <button className="btn btn-ghost btn-block" onClick={onClose} disabled={stage === "processing"}>Cancel</button>
                <button className="btn btn-green btn-block" onClick={confirm} disabled={stage === "processing"}>
                  {stage === "processing" ? "Processing..." : <React.Fragment><PIcon name="lock" size={16} />Pay now</React.Fragment>}
                </button>
              </div>
              <p style={{ font: "var(--caption)", color: "var(--mute)", textAlign: "center", margin: "14px 0 0" }}>Payment is simulated in this prototype. No card is charged.</p>
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CollectionScreen, PurchaseModal });
