/* global React, window */
/* =========================================================================
   Student Portal — PortalNav + CourseCard
   ========================================================================= */
const { useState, useRef, useEffect } = React;
const { useApp, BrandLockup, Icon } = window;
const { useAuth } = window;
const { useRouter, PIcon, ThumbArt, ProgressBar } = window;

/* ---- top navigation ------------------------------------------------------ */
function PortalNav() {
  const { theme, toggleTheme } = useApp();
  const { user, logout } = useAuth();
  const { path, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initial = (user?.name || "S").trim().charAt(0).toUpperCase();
  const links = [
    { to: "/student/dashboard", label: "Dashboard", icon: "grid" },
    { to: "/student/collection", label: "My collection", icon: "cap" },
  ];

  return (
    <header className="pnav">
      <div className="pnav-in">
        <a className="brand" href="#/student/dashboard" onClick={(e) => { e.preventDefault(); navigate("/student/dashboard"); }} style={{ textDecoration: "none" }}>
          <img className="brand-mark" src="assets/logo-mark.png" alt="Wealthoria" style={{ height: 30 }} />
          <span className="brand-text"><span className="brand-word">Wealthoria</span></span>
        </a>

        <nav className="pnav-links">
          {links.map((l) => (
            <button key={l.to} className={`pnav-link ${path === l.to ? "on" : ""}`} onClick={() => navigate(l.to)}>
              <PIcon name={l.icon} size={17} />{l.label}
            </button>
          ))}
        </nav>

        <div className="pnav-right">
          <button className="theme-toggle port" onClick={toggleTheme} aria-label="Toggle theme">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          <div className="umenu" ref={menuRef}>
            <button className="utrigger" onClick={() => setOpen((o) => !o)}>
              <span className="avatar sm">{initial}</span>
              <span className="uname">{(user?.name || "").split(" ")[0]}</span>
              <Icon name="chevron" size={15} />
            </button>
            {open && (
              <div className="udrop">
                <div className="uhead">
                  <div className="n">{user?.name}</div>
                  <div className="e">{user?.email}</div>
                </div>
                <div className="usep" />
                <button className="uitem" onClick={() => { setOpen(false); navigate("/student/dashboard"); }}><PIcon name="grid" size={18} />Dashboard</button>
                <button className="uitem" onClick={() => { setOpen(false); navigate("/student/collection"); }}><PIcon name="cap" size={18} />My collection</button>
                <button className="uitem" onClick={() => setOpen(false)}><PIcon name="settings" size={18} />Account settings</button>
                <div className="usep" />
                <button className="uitem" onClick={() => { setOpen(false); logout(); navigate("/student/login"); }}><PIcon name="logout" size={18} />Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---- course card --------------------------------------------------------
   variant "owned"  → progress + Resume
   variant "browse" → price + Enroll (opens purchase modal via onEnroll)
   ------------------------------------------------------------------------- */
function CourseCard({ course, variant, progress = 0, onResume, onEnroll, theme }) {
  const owned = variant === "owned";
  const done = progress >= 100;
  return (
    <article className="ccard">
      <div className="thumb">
        <ThumbArt course={course} theme={theme} />
        <span className="badge badge-soft tag">{course.level}</span>
        {owned && <span className="pct-chip">{done ? "Completed" : `${progress}%`}</span>}
        <span className="ic"><Icon name={course.icon} size={26} /></span>
      </div>
      <div className="cbody">
        <div className="cmeta"><span>{course.lessons} lessons</span><span>{course.hours} hrs</span></div>
        <h3>{course.title}</h3>
        {owned ? (
          <React.Fragment>
            <div style={{ marginTop: 2 }}><ProgressBar value={progress} /></div>
            <div className="cfoot">
              <button className="btn btn-green btn-block btn-sm" onClick={() => onResume(course)} style={{ marginTop: 4 }}>
                {done ? "Review course" : progress > 0 ? "Resume" : "Start"}<Icon name="play" size={14} />
              </button>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <p style={{ font: "var(--body-sm)", color: "var(--body)", margin: 0, flex: 1 }}>{course.blurb}</p>
            <div className="cfoot cfoot-row">
              <span className="price">&#8377;{course.price.toLocaleString("en-IN")}<span className="was">&#8377;{course.was.toLocaleString("en-IN")}</span></span>
              <button className="btn btn-green btn-sm" onClick={() => onEnroll(course)}>Enroll<Icon name="arrow" size={15} /></button>
            </div>
          </React.Fragment>
        )}
      </div>
    </article>
  );
}

Object.assign(window, { PortalNav, CourseCard });
