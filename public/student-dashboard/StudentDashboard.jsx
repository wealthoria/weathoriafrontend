/* global React, ReactDOM, window */
/* =========================================================================
   StudentDashboard.jsx — all four screens + app shell + mount.
   Screens: Overview · MyCourses · CourseDetail · PurchaseFlow (modal).
   Reusable components live in components.jsx; data in data.jsx.
   ========================================================================= */
const { useState, useMemo, useEffect, useRef, useCallback } = React;
const { USER, COURSES, STATS, REVIEWS } = window.SD_DATA;
const { Icon, Avatar, StatCard, ProgressBar, Stars, CourseCard, NavItem } = window;

const NAV = [
  { id: "overview", icon: "home", label: "Overview" },
  { id: "courses", icon: "grid", label: "My courses" },
];

/* ===================== 1. OVERVIEW ===================== */
function Overview({ courses, onOpen }) {
  const headingRef = useRef(null);
  useEffect(() => { if (headingRef.current) { headingRef.current.setAttribute("tabindex", "-1"); headingRef.current.focus({ preventScroll: true }); } }, []);

  const enrolled = courses.filter((c) => c.isEnrolled);
  const last = enrolled.find((c) => c.status === "in-progress") || enrolled[0];
  const recommended = courses.filter((c) => !c.isEnrolled).slice(0, 4);
  const now = new Date();
  const hr = now.getHours();
  const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section aria-labelledby="ov-h">
      <p className="eyebrow">{dateStr}</p>
      <h1 className="page-h1" id="ov-h" ref={headingRef}>{greet}, {USER.name.split(" ")[0]}</h1>
      <p className="page-sub">You have {enrolled.filter((c) => c.status === "in-progress").length} courses in progress. Keep the momentum going.</p>

      <div className="stat-row block" style={{ marginTop: 32 }}>
        {STATS.map((s) => <StatCard key={s.id} icon={s.icon} label={s.label} value={s.value} trend={s.trend} />)}
      </div>

      {last && (
        <div className="block">
          <div className="continue">
            <div className="thumb" style={{ background: last.thumb }} />
            <div className="body">
              <p className="ey">Continue learning</p>
              <h3>{last.title}</h3>
              <p className="ch">Up next &middot; {last.lastChapter}</p>
              <div className="pr"><ProgressBar percent={last.progress} size="lg" onDark /></div>
              <button className="btn btn-grad" onClick={() => onOpen(last)}>Resume<Icon name="play" size={14} /></button>
            </div>
          </div>
        </div>
      )}

      <div className="block">
        <div className="section-h"><h2>Recommended for you</h2></div>
        <div className="card-row">
          {recommended.map((c) => <CourseCard key={c.id} course={c} variant="recommend" onOpen={onOpen} />)}
        </div>
      </div>
    </section>
  );
}

/* ===================== 2. MY COURSES ===================== */
const FILTERS = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "bookmarked", label: "Bookmarked" },
];

function MyCourses({ courses, onOpen }) {
  const headingRef = useRef(null);
  useEffect(() => { if (headingRef.current) { headingRef.current.setAttribute("tabindex", "-1"); headingRef.current.focus({ preventScroll: true }); } }, []);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");

  const rows = useMemo(() => {
    let r = courses.filter((c) => {
      if (filter === "bookmarked") return c.bookmarked;
      if (filter === "in-progress") return c.status === "in-progress";
      if (filter === "completed") return c.status === "completed";
      return true;
    });
    if (q.trim()) r = r.filter((c) => c.title.toLowerCase().includes(q.trim().toLowerCase()) || c.instructor.name.toLowerCase().includes(q.trim().toLowerCase()));
    r = [...r].sort((a, b) => sort === "az" ? a.title.localeCompare(b.title) : sort === "progress" ? b.progress - a.progress : 0);
    return r;
  }, [courses, filter, q, sort]);

  return (
    <section aria-labelledby="mc-h">
      <p className="eyebrow">Your library</p>
      <h1 className="page-h1" id="mc-h" ref={headingRef}>My courses</h1>
      <p className="page-sub">Pick up where you left off, or revisit something you've finished.</p>

      <div className="filterbar block" style={{ marginTop: 32 }}>
        <div className="tabs" role="tablist" aria-label="Filter courses">
          {FILTERS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} className={`tab ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <div className="search">
          <span className="ic"><Icon name="search" size={17} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses" aria-label="Search courses" />
        </div>
        <select className="sortsel" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort courses">
          <option value="recent">Recent</option>
          <option value="az">Title A-Z</option>
          <option value="progress">Progress</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <div className="eic"><Icon name="grid" size={28} /></div>
          <h3>No courses here yet</h3>
          <p>{filter === "bookmarked" ? "You haven't bookmarked any courses." : "Nothing matches this filter and search. Try another tab."}</p>
          <button className="btn btn-ghost" onClick={() => { setFilter("all"); setQ(""); }}>Clear filters</button>
        </div>
      ) : (
        <div className="course-grid">
          {rows.map((c) => <CourseCard key={c.id} course={c} variant="grid" onOpen={onOpen} />)}
        </div>
      )}
    </section>
  );
}

/* ===================== 3. COURSE DETAIL ===================== */
function CourseDetail({ course, onBack, onBuy, onResume }) {
  const headingRef = useRef(null);
  useEffect(() => { if (headingRef.current) { headingRef.current.setAttribute("tabindex", "-1"); headingRef.current.focus({ preventScroll: true }); } window.scrollTo(0, 0); }, [course]);
  const [open, setOpen] = useState(0);
  const [tab, setTab] = useState("overview");
  const lessons = course.curriculum.reduce((n, s) => n + s.lessons.length, 0);
  const doneCount = course.curriculum.reduce((n, s) => n + s.lessons.filter((l) => l.done).length, 0);

  return (
    <section aria-labelledby="cd-h">
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}><Icon name="chevron" size={15} stroke={2.4} /> Back</button>

      <div className="detail-hero" style={{ background: course.thumb }}>
        <div className="ov" />
        <div className="ov-body">
          <div className="badges"><span>{course.category}</span><span>&#9733; {course.rating.toFixed(1)} ({course.ratingCount})</span></div>
          <h1 id="cd-h" ref={headingRef}>{course.title}</h1>
        </div>
      </div>

      <div className="detail-cols">
        <div>
          {course.isEnrolled && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8, fontWeight: 600 }}>
                <span>Your progress</span><span>{doneCount} of {lessons} lessons</span>
              </div>
              <ProgressBar percent={course.progress} size="md" />
            </div>
          )}

          <div className="accordion">
            {course.curriculum.map((sec, i) => (
              <div className="acc-sec" key={sec.id}>
                <button className="acc-head" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                  {sec.title}<span className="cnt">{sec.lessons.length} lessons</span><span className="chev"><Icon name="chevron" size={18} /></span>
                </button>
                {open === i && (
                  <div className="acc-body">
                    {sec.lessons.map((l) => (
                      <div className="lesson-row" key={l.id}>
                        <span className={`check ${l.done ? "done" : "todo"}`}><Icon name="check" size={13} stroke={3} /></span>
                        <span>{l.title}</span>
                        <span className="dur">{l.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="block" style={{ marginTop: 48 }}>
            <div className="tabs-line" role="tablist">
              {["overview", "reviews", "qa"].map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} className={`tab-line ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                  {t === "overview" ? "Overview" : t === "reviews" ? "Reviews" : "Q&A"}
                </button>
              ))}
            </div>
            {tab === "overview" && (
              <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, fontSize: 15 }}>
                A calm, jargon-free path through {course.title.toLowerCase()}. You'll move from the basics to your first real decisions, with short lessons you can finish between everything else. Taught in plain language, with examples grounded in the Indian market.
              </p>
            )}
            {tab === "reviews" && (
              <div>
                {REVIEWS.map((r) => (
                  <div className="review" key={r.id}>
                    <div className="rhead"><Avatar name={r.name} initials={r.initials} size="sm" /><div><div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div><Stars rating={r.rating} /></div></div>
                    <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>{r.text}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === "qa" && <p style={{ color: "var(--color-text-muted)", fontSize: 15 }}>No questions yet. Be the first to ask the instructor about this course.</p>}
          </div>

          <div className="block">
            <div className="instructor-card">
              <Avatar name={course.instructor.name} initials={course.instructor.initials} size="lg" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{course.instructor.name}</div>
                <div style={{ color: "var(--color-primary)", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Wealthoria faculty</div>
                <p className="bio">A SEBI-aware educator focused on financial literacy for first-time investors, teaching in Kannada and English across Karnataka.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="detail-side">
          {course.isEnrolled
            ? <button className="btn btn-grad btn-block" onClick={() => onResume(course)}>{course.progress >= 100 ? "Review course" : "Resume learning"}<Icon name="play" size={14} /></button>
            : (
              <React.Fragment>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 28, marginBottom: 14 }}>&#8377;{course.price.toLocaleString("en-IN")}</div>
                <button className="btn btn-grad btn-block" onClick={() => onBuy(course)}>Enroll now<Icon name="arrow" size={15} /></button>
              </React.Fragment>
            )}
          <div style={{ marginTop: 20 }}>
            <div className="info-row"><span className="k">Instructor</span><span className="v">{course.instructor.name.split(" ")[0]}</span></div>
            <div className="info-row"><span className="k">Last updated</span><span className="v">{course.updated}</span></div>
            <div className="info-row"><span className="k">Students</span><span className="v">{course.students.toLocaleString("en-IN")}</span></div>
            <div className="info-row"><span className="k">Duration</span><span className="v">{course.durationHrs} hrs</span></div>
            <div className="info-row"><span className="k">Certificate</span><span className="v" style={{ color: "var(--color-primary)" }}>Included</span></div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ===================== 4. PURCHASE FLOW (modal) ===================== */
const PAY_METHODS = [
  { id: "card", icon: "card", label: "Card" },
  { id: "upi", icon: "upi", label: "UPI" },
  { id: "wallet", icon: "wallet", label: "Wallet" },
];

function PurchaseModal({ course, onClose, onDone, onGoToCourse }) {
  const open = !!course;
  const [stage, setStage] = useState("pay");
  const [method, setMethod] = useState("upi");
  const dialogRef = useRef(null);
  const prevFocus = useRef(null);

  useEffect(() => { if (course) { setStage("pay"); setMethod("upi"); } }, [course && course.id]);

  // focus trap + Escape + restore
  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    const node = dialogRef.current;
    const SEL = 'a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(node ? node.querySelectorAll(SEL) : []).filter((el) => el.offsetParent !== null);
    const first = focusables()[0]; if (first) first.focus();
    const onKey = (e) => {
      if (e.key === "Escape" && stage !== "processing") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables(); if (!f.length) return;
      const a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => { document.removeEventListener("keydown", onKey, true); if (prevFocus.current && prevFocus.current.focus) { try { prevFocus.current.focus(); } catch (e) {} } };
  }, [open, stage, onClose]);

  if (!course) return <div className="scrim" aria-hidden="true" />;

  const gst = Math.round(course.price * 0.18);
  const total = course.price + gst;

  const pay = () => { setStage("processing"); setTimeout(() => { setStage("done"); onDone(course); }, 1200); };

  return (
    <div className={`scrim ${open ? "open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget && stage !== "processing") onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Enroll in ${course.title}`} ref={dialogRef} tabIndex={-1}>
        {stage === "done" ? (
          <div className="success">
            <svg className="checkmark" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" /><path d="M18 31l8 8 16-18" /></svg>
            <h3>You're enrolled</h3>
            <p>{course.title} is now in your collection. Time to start learning.</p>
            <div style={{ textAlign: "left", background: "var(--color-surface-alt)", borderRadius: 16, padding: 16, marginBottom: 24 }}>
              <div className="line"><span>{course.title}</span><span className="v">&#8377;{course.price.toLocaleString("en-IN")}</span></div>
              <div className="line"><span>GST (18%)</span><span className="v">&#8377;{gst.toLocaleString("en-IN")}</span></div>
              <div className="line total"><span>Paid</span><span>&#8377;{total.toLocaleString("en-IN")}</span></div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-ghost btn-block" onClick={onClose}>Close</button>
              <button className="btn btn-grad btn-block" onClick={() => onGoToCourse(course)}>Go to course<Icon name="arrow" size={14} /></button>
            </div>
          </div>
        ) : (
          <React.Fragment>
            <h3>Complete enrollment</h3>
            <div className="psum">
              <div className="pthumb" style={{ background: course.thumb }} />
              <div><div className="pt">{course.title}</div><div className="pp">&#8377;{course.price.toLocaleString("en-IN")}</div></div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Payment method</div>
            <div className="pay-methods" role="radiogroup" aria-label="Payment method">
              {PAY_METHODS.map((m) => (
                <button key={m.id} role="radio" aria-checked={method === m.id} className={`pay-method ${method === m.id ? "active" : ""}`} onClick={() => setMethod(m.id)}>
                  <Icon name={m.icon} size={20} />{m.label}
                </button>
              ))}
            </div>
            <div className="line"><span>Course price</span><span className="v">&#8377;{course.price.toLocaleString("en-IN")}</span></div>
            <div className="line"><span>GST (18%)</span><span className="v">&#8377;{gst.toLocaleString("en-IN")}</span></div>
            <div className="line total"><span>Total</span><span>&#8377;{total.toLocaleString("en-IN")}</span></div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button className="btn btn-ghost btn-block" onClick={onClose} disabled={stage === "processing"}>Cancel</button>
              <button className="btn btn-grad btn-block" onClick={pay} disabled={stage === "processing"}>{stage === "processing" ? "Processing\u2026" : "Pay now"}</button>
            </div>
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-muted)", marginTop: 14, marginBottom: 0 }}>Payment is simulated in this mockup. No card is charged.</p>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

/* ===================== APP SHELL ===================== */
function App() {
  const [route, setRoute] = useState("overview");      // overview | courses | detail
  const [active, setActive] = useState(null);          // course in detail
  const [modal, setModal] = useState(null);            // course in purchase modal
  const [navOpen, setNavOpen] = useState(false);
  const [courses, setCourses] = useState(COURSES);

  const openCourse = useCallback((c) => { setActive(c); setRoute("detail"); }, []);
  const go = (id) => { setRoute(id); setActive(null); setNavOpen(false); };

  const enroll = (c) => setCourses((cs) => cs.map((x) => x.id === c.id ? { ...x, isEnrolled: true, status: x.progress > 0 ? "in-progress" : "in-progress", progress: x.progress || 2 } : x));
  const resume = (c) => setCourses((cs) => cs.map((x) => x.id === c.id ? { ...x, progress: Math.min(100, x.progress + 10) } : x));

  // keep active/modal course objects in sync with the courses state
  const activeCourse = active ? courses.find((c) => c.id === active.id) : null;
  const modalCourse = modal ? courses.find((c) => c.id === modal.id) : null;

const logout = () => {
  localStorage.removeItem("student");
  localStorage.removeItem("token");

  sessionStorage.removeItem("student");
  sessionStorage.removeItem("token");

  window.location.href = "/student/login";
};

  return (
    <div className="app">
      <div className={`sb-scrim ${navOpen ? "open" : ""}`} onClick={() => setNavOpen(false)} />
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="sb-logo"><img src="assets/logo-mark.png" alt="" /><span className="wm">Wealthoria</span></div>
        <div className="sb-user">
          <Avatar name={USER.name} initials={USER.initials} size="md" />
          <div className="meta"><div className="nm">{USER.name}</div><span className="role-badge">{USER.role}</span></div>
        </div>
        <nav className="sb-nav" aria-label="Main">
          {NAV.map((n) => <NavItem key={n.id} icon={n.icon} label={n.label} active={route === n.id || (route === "detail" && n.id === "courses")} onClick={() => go(n.id)} />)}
        </nav>

<div className="sb-foot">
  <button className="logout" onClick={logout}>
    <Icon name="logout" size={18} />
    <span className="lbl">Log out</span>
  </button>
</div>     
      </aside>

      <main className="main">
        <div className="topbar">
          <button className="ham" onClick={() => setNavOpen(true)} aria-label="Open menu"><Icon name="menu" size={20} /></button>
          <span className="tb-logo">Wealthoria</span>
        </div>
        <div className="main-inner">
          {route === "overview" && <Overview courses={courses} onOpen={openCourse} />}
          {route === "courses" && <MyCourses courses={courses} onOpen={openCourse} />}
          {route === "detail" && activeCourse && (
            <CourseDetail course={activeCourse} onBack={() => go("courses")} onBuy={(c) => setModal(c)} onResume={resume} />
          )}
        </div>
      </main>

      <PurchaseModal
        course={modalCourse}
        onClose={() => setModal(null)}
        onDone={(c) => enroll(c)}
        onGoToCourse={(c) => { setModal(null); openCourse(c); }}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
