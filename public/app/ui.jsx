/* global React, window */
/* =========================================================================
   Wealthoria - shared UI: app context, icon set, small primitives.
   Exported to window so the section files (separate Babel scripts) can use them.
   ========================================================================= */
const { createContext, useContext, useEffect, useRef, useState } = React;

/* ---- app context: language + theme -------------------------------------- */
const AppCtx = createContext(null);
function useApp() {return useContext(AppCtx);}

/* ---- icon set (Lucide-style: single stroke, rounded joins) -------------- */
const ICON_PATHS = {
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  trending: <><path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" /></>,
  languages: <><path d="M5 8h10" /><path d="M9 4v4" /><path d="M11.5 16c-1.8-1-3.5-2.8-4.5-5" /><path d="M5 14c1.6 1.6 4 3 7 3" /><path d="M13 20l4-9 4 9" /><path d="M14.5 17h5" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  shield: <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  sprout: <><path d="M7 17c0-5 3-7 8-7" /><path d="M7 10c-2 0-4-1.5-4-4 2.5 0 4 1.5 4 4z" /><path d="M15 10c2 0 4-1.5 4-4-2.5 0-4 1.5-4 4z" /><path d="M12 21v-7" /></>,
  pie: <><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M12 3v9" /><path d="M21 12a9 9 0 0 0-9-9" /></>,
  layers: <><path d="M12 2l9 5-9 5-9-5z" /><path d="M3 12l9 5 9-5" /><path d="M3 17l9 5 9-5" /></>,
  wallet: <><path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 7l2.5-3h10L18 7" /><circle cx="16.5" cy="13" r="1.3" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>,
  brain: <><path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 7 17a3 3 0 0 0 5 1 3 3 0 0 0 5-1 3 3 0 0 0 2-5.2A3 3 0 0 0 18 6a3 3 0 0 0-3-3 3 3 0 0 0-3 1.5A3 3 0 0 0 9 3z" /><path d="M12 5v13" /></>,
  scale: <><path d="M12 3v18" /><path d="M5 7h14" /><path d="M5 7l-2.5 5h5z" /><path d="M19 7l-2.5 5h5z" /><path d="M8 21h8" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h6" /></>,
  calc: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M8 6h8" /><path d="M8 11h0M12 11h0M16 11h0M8 15h0M12 15h0M16 15v3" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h0M3 12h0M3 18h0" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  phone: <><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l1 4v2a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></>,
  pin: <><path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  play: <path d="M7 5l11 7-11 7z" fill="currentColor" stroke="none" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  menu: <><path d="M3 6h18M3 12h18M3 18h18" /></>,
  x: <><path d="M6 6l12 12M18 6L6 18" /></>,
  check: <path d="M5 12l5 5 9-11" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  arrow: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="2.5" /></>,
  youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></>,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 10v7M7 7v0M11 17v-4a2 2 0 0 1 4 0v4M11 10v7" /></>,
  whatsapp: <><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.5-1-1 .7c-1-.4-1.8-1.2-2.2-2.2l.7-1-1-1.5c-.5 0-1 .4-1 1z" fill="currentColor" stroke="none" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-3-5.2" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  lock: <><rect x="4.5" y="10" width="15" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  star: <path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.5l1.1-6L3.4 9.3l6-.8z" fill="currentColor" stroke="none" />,
  spark: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /><path d="M6.5 6.5l3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3" /></>
};

function Icon({ name, size = 24, stroke = 2, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}>
      {ICON_PATHS[name] || null}
    </svg>);

}

/* ---- reveal-on-scroll ---------------------------------------------------- */
function Reveal({ children, as = "div", delay = 0, className = "", ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.__GSAP_ON__) return; // GSAP owns entrances; leave content visible
    if (!("IntersectionObserver" in window)) {el.classList.add("in");return;}
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {setTimeout(() => el.classList.add("in"), delay);io.unobserve(el);}
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  const Tag = as;
  return <Tag ref={ref} className={`reveal ${className}`} {...rest}>{children}</Tag>;
}

/* ---- section heading block ---------------------------------------------- */
function SectionHead({ eyebrow, title, sub, center, icon }) {
  return (
    <Reveal className={`shead ${center ? "center" : ""}`}>
      {eyebrow && <span className="eyebrow">{icon && <Icon name={icon} size={16} />}{eyebrow}</span>}
      {title && <h2 className="h2" style={{ lineHeight: "1" }}>{title}</h2>}
      {sub && <p className="sub">{sub}</p>}
    </Reveal>);

}

/* ---- image placeholder --------------------------------------------------- */
function ImagePlaceholder({ label, icon = "spark", style, className = "" }) {
  return (
    <div className={`imgph ${className}`} style={style}>
      <div className="phlbl"><Icon name={icon} size={30} stroke={1.6} /><span>{label}</span></div>
    </div>);

}

/* ---- brand lockup: real logo mark + wordmark ---------------------------- */
function BrandLockup({ markHeight = 34, showSub = false, onClick, href = "#top" }) {
  return (
    <a className="brand" href={href} onClick={onClick}>
      <img className="brand-mark" src="assets/logo-mark.png" alt="Wealthoria" style={{ height: markHeight }} />
      <span className="brand-text">
        <span className="brand-word">Wealthoria</span>
        {showSub && <span className="brand-sub">Education Private Limited</span>}
      </span>
    </a>);

}

Object.assign(window, { AppCtx, useApp, Icon, Reveal, SectionHead, ImagePlaceholder, BrandLockup });