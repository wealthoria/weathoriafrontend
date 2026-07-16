/* global React, window */
/* =========================================================================
   Student Dashboard — reusable components
     Icon       { name, size, stroke }
     Avatar     { name, initials, src, size }                     sizes xs/sm/md/lg
     StatCard   { icon, label, value, trend }
     ProgressBar{ percent, color, size }                          sizes sm/md/lg
     CourseCard { course, onOpen, variant }   (variant: grid|row|recommend)
     NavItem    { icon, label, active, onClick }
     Stars      { rating, count }
   ========================================================================= */
const { useEffect, useRef, useState } = React;

const ICONS = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M18 19H6a2 2 0 0 0-2 2" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  award: <><circle cx="12" cy="9" r="5" /><path d="M9 13.5L8 21l4-2.2L16 21l-1-7.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  play: <path d="M7 5l12 7-12 7z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.2-4.2" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 12h10" /><path d="M14 8l-4 4 4 4" /></>,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12l5 5 9-11" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  arrow: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  star: <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 17l-5.4 2.6 1-6L3.3 9.4l6-.9z" />,
  clock2: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6" /></>,
  cert: <><circle cx="12" cy="9" r="5" /><path d="M9 13.5L8 21l4-2.2L16 21l-1-7.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /></>,
  upi: <><path d="M12 3v18" /><path d="M7 7l5-4 5 4M7 17l5 4 5-4" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M16 12h3" /><path d="M3 9h13a2 2 0 0 1 0 4H3" /></>,
};

function Icon({ name, size = 20, stroke = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] || null}
    </svg>
  );
}

function Avatar({ name, initials, src, size = "sm" }) {
  const label = initials || (name ? name.trim().charAt(0).toUpperCase() : "?");
  return (
    <span className={`avatar ${size}`} title={name || ""} aria-hidden="true">
      {src ? <img src={src} alt="" /> : label}
    </span>
  );
}

function StatCard({ icon, label, value, trend }) {
  return (
    <div className="stat-card">
      <div className="ic"><Icon name={icon} size={20} /></div>
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
      {trend && <span className="trend up"><Icon name="arrow" size={12} stroke={2.5} />{trend}</span>}
    </div>
  );
}

/* progress bar animates width on mount via CSS transition (no JS lib) */
function ProgressBar({ percent, size = "md", color, onDark = false, showPct = true }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setW(percent)); return () => cancelAnimationFrame(t); }, [percent]);
  const done = percent >= 100;
  return (
    <div className={`progress ${size} ${onDark ? "on-dark" : ""}`}>
      <div className="track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${percent}% complete`}>
        <div className={`fill ${done ? "done" : ""}`} style={{ width: w + "%", ...(color ? { background: color } : null) }} />
      </div>
      {showPct && <span className="pct">{percent}%</span>}
    </div>
  );
}

function Stars({ rating, count }) {
  return (
    <span className="stars" aria-label={`Rated ${rating} out of 5`}>
      <Icon name="star" size={14} stroke={0} />{rating.toFixed(1)}
      {count != null && <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>({count})</span>}
    </span>
  );
}

/* CourseCard — props: course, onOpen, variant (grid | row | recommend) */
function CourseCard({ course, onOpen, variant = "grid" }) {
  const c = course;
  const showProgress = c.isEnrolled && variant !== "recommend";
  return (
    <button className="course-card" onClick={() => onOpen && onOpen(c)} aria-label={`Open ${c.title}`}>
      <div className="thumb" style={{ background: c.thumb }}>
        <span className="cat">{c.category}</span>
        {c.isEnrolled && <span className="enrolled-badge">Enrolled</span>}
      </div>
      <div className="cbody">
        <h3>{c.title}</h3>
        <span className="instr"><Avatar name={c.instructor.name} initials={c.instructor.initials} size="xs" />{c.instructor.name}</span>
        {showProgress ? (
          <ProgressBar percent={c.progress} size="sm" />
        ) : (
          <Stars rating={c.rating} count={c.ratingCount} />
        )}
        <div className="meta-row">
          {c.isEnrolled
            ? <span className="btn btn-sm btn-grad" aria-hidden="true">{c.progress > 0 ? "Continue" : "Start"}<Icon name="play" size={13} /></span>
            : <span className="price">&#8377;{c.price.toLocaleString("en-IN")}</span>}
          {!c.isEnrolled && <span className="btn btn-sm btn-primary" aria-hidden="true">Enroll<Icon name="arrow" size={14} /></span>}
        </div>
      </div>
    </button>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick} aria-current={active ? "page" : undefined}>
      <Icon name={icon} size={19} /><span className="lbl">{label}</span>
    </button>
  );
}

Object.assign(window, { Icon, Avatar, StatCard, ProgressBar, Stars, CourseCard, NavItem });
