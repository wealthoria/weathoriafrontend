/* global React, window */
/* =========================================================================
   Student Portal — shared UI primitives
   ========================================================================= */
const { createContext, useContext, useState, useCallback, useEffect } = React;
const BaseIcon = window.Icon; // reuse the marketing-site icon set

/* ---- supplemental icons not in the marketing set ------------------------ */
const PORTAL_ICONS = {
  lock: <><rect x="4.5" y="10" width="15" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15" r="1.4" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.2-4.2" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 12h10" /><path d="M14 8l-4 4 4 4" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  cap: <><path d="M12 4 2 9l10 5 10-5-10-5z" /><path d="M6 11v5c0 1.4 2.7 3 6 3s6-1.6 6-3v-5" /></>,
  eyeoff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A10 10 0 0 1 12 6c6 0 10 6 10 6a18 18 0 0 1-3.2 3.6" /><path d="M6.2 6.3A18 18 0 0 0 2 12s4 6 10 6a10 10 0 0 0 3.3-.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.5 12.5a1.5 1.5 0 0 0 1.5 1.2h8a1.5 1.5 0 0 0 1.5-1.2L21 7H6" /></>,
  rupee: <><path d="M7 5h10M7 9h10M16 5c0 5-4 6-7 6l6 8" /></>,
  award: <><circle cx="12" cy="9" r="5" /><path d="M9 13.5L8 21l4-2.2L16 21l-1-7.5" /></>,
};

function PIcon({ name, size = 22, stroke = 2, ...rest }) {
  if (PORTAL_ICONS[name]) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
        {PORTAL_ICONS[name]}
      </svg>
    );
  }
  return <BaseIcon name={name} size={size} stroke={stroke} {...rest} />;
}

/* ---- branded course thumbnail (placeholder the user can swap for art) ---- */
const CAT_TINT = {
  Foundations: "linear-gradient(135deg, #fde7e1, #f9d2c4)",
  Markets: "linear-gradient(135deg, #ffe9d4, #f7c9a8)",
  Mindset: "linear-gradient(135deg, #fbe0dc, #f3c7be)",
};
const CAT_TINT_DARK = {
  Foundations: "linear-gradient(135deg, #3a201c, #25160f)",
  Markets: "linear-gradient(135deg, #3d2410, #241405)",
  Mindset: "linear-gradient(135deg, #34201d, #221210)",
};
function ThumbArt({ course, theme }) {
  const bg = (theme === "dark" ? CAT_TINT_DARK : CAT_TINT)[course.category] || CAT_TINT.Foundations;
  return (
    <div style={{ position: "absolute", inset: 0, background: bg }} aria-hidden="true">
      <div style={{ position: "absolute", right: -28, bottom: -28, width: 130, height: 130, borderRadius: "50%", background: "rgba(232,71,63,.14)" }} />
      <div style={{ position: "absolute", left: 14, bottom: 12, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-deep)", opacity: .55 }}>{course.category}</div>
    </div>
  );
}

/* ---- progress bar -------------------------------------------------------- */
function ProgressBar({ value, showPct = true, dark = false }) {
  const done = value >= 100;
  return (
    <div className="prog-row">
      <div className="prog-bar"><div className={`prog-fill ${done ? "done" : ""}`} style={{ width: `${Math.max(2, value)}%` }} /></div>
      {showPct && <span className="p-pct" style={dark ? { color: "var(--primary)" } : null}>{value}%</span>}
    </div>
  );
}

/* ---- router context (hash-based, set up in app.jsx) --------------------- */
const RouterContext = createContext({ path: "/student/login", navigate: () => {} });
function useRouter() { return useContext(RouterContext); }

/* ---- toast --------------------------------------------------------------- */
const ToastContext = createContext({ push: () => {} });
function useToast() { return useContext(ToastContext); }
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, icon = "check") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <span className="tic"><PIcon name={t.icon} size={18} /></span>{t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ---- private route ------------------------------------------------------- */
function PrivateRoute({ auth, children }) {
  const { navigate } = useRouter();
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) navigate("/student/login");
  }, [auth.loading, auth.isAuthenticated, navigate]);

  if (auth.loading) {
    return <div className="psplash"><div className="spinner" /></div>;
  }
  if (!auth.isAuthenticated) {
    return <div className="psplash"><div className="spinner" /></div>;
  }
  return children;
}

Object.assign(window, { PIcon, ThumbArt, ProgressBar, RouterContext, useRouter, ToastContext, useToast, ToastProvider, PrivateRoute });
