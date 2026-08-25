/* global React, window */
/* =========================================================================
   Member Portal — shared UI: icons, hash router, toast, confirm dialog, bits
   ========================================================================= */
const { createContext, useContext, useState, useEffect, useCallback, useRef } = React;

/* ---- icon set ------------------------------------------------------------ */
const M_ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  content: <><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 9v11" /></>,
  upload: <><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  download: <><path d="M12 4v12" /><path d="M7 11l5 5 5-5" /><path d="M4 20h16" /></>,
  courses: <><path d="M4 5h16v14H4z" /><path d="M4 9h16" /><path d="M8 13h8M8 16h5" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-3-5.2" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></>,
  pdf: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 14h1.5a1.5 1.5 0 0 1 0 3H8zM8 14v6" /></>,
  quiz: <><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M10 11v6M14 11v6" /></>,
  pencil: <><path d="M4 20h4l10-10-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="2.5" /></>,
  eyeoff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A10 10 0 0 1 12 6c6 0 10 6 10 6a18 18 0 0 1-3.2 3.6" /><path d="M6.2 6.3A18 18 0 0 0 2 12s4 6 10 6a10 10 0 0 0 3.3-.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  more: <><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></>,
  filter: <><path d="M3 5h18l-7 8v5l-4 2v-7z" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  grip: <><circle cx="9" cy="6" r="1.3" /><circle cx="15" cy="6" r="1.3" /><circle cx="9" cy="12" r="1.3" /><circle cx="15" cy="12" r="1.3" /><circle cx="9" cy="18" r="1.3" /><circle cx="15" cy="18" r="1.3" /></>,
  check: <path d="M5 12l5 5 9-11" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.2-4.2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.8" /><path d="M21 16l-5-5-8 8" /></>,
  tag: <><path d="M3 11l8-8 9 9-8 8z" /><circle cx="8" cy="8" r="1.4" /></>,
  lock: <><rect x="4.5" y="10" width="15" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  alert: <><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.5" /></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" /><circle cx="15" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="13" cy="18" r="2" /></>,
  sort: <><path d="M7 4v16M7 4l-3 3M7 4l3 3" /><path d="M17 20V4M17 20l-3-3M17 20l3-3" /></>,
  send: <><path d="M4 12l16-7-7 16-2-7z" /></>,
  archive: <><rect x="3" y="4" width="18" height="5" rx="1.5" /><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" /><path d="M10 13h4" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 12h10" /><path d="M14 8l-4 4 4 4" /></>,
  chevronL: <path d="M15 6l-6 6 6 6" />,
  chevronR: <path d="M9 6l6 6-6 6" />,
  chevronD: <path d="M6 9l6 6 6-6" />,
  arrow: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  shield: <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  cert: <><circle cx="12" cy="9" r="5" /><path d="M9 13.5L8 21l4-2.2L16 21l-1-7.5" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
};

function MIcon({ name, size = 20, stroke = 2, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {M_ICONS[name] || null}
    </svg>
  );
}
function typeIcon(type) { return type === "video" ? "video" : type === "pdf" ? "pdf" : "quiz"; }

/* ---- router (hash with params) ------------------------------------------ */
const MRouterContext = createContext({ path: "/member/login", navigate: () => {} });
function useMRouter() { return useContext(MRouterContext); }

/* ---- toast --------------------------------------------------------------- */
const MToastContext = createContext({ push: () => {} });
function useMToast() { return useContext(MToastContext); }
function MToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, kind = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setItems((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return (
    <MToastContext.Provider value={{ push }}>
      {children}
      <div className="mtoast-wrap">
        {items.map((t) => (
          <div className={`mtoast ${t.kind}`} key={t.id}>
            <MIcon name={t.kind === "err" ? "alert" : "check"} size={17} />{t.msg}
          </div>
        ))}
      </div>
    </MToastContext.Provider>
  );
}

/* ---- confirm dialog ------------------------------------------------------ */
const ConfirmContext = createContext(() => Promise.resolve(false));
function useConfirm() { return useContext(ConfirmContext); }
function ConfirmProvider({ children }) {
  const [opts, setOpts] = useState(null);
  const resolver = useRef(null);
  const dialogRef = useRef(null);
  const confirm = useCallback((o) => new Promise((resolve) => { resolver.current = resolve; setOpts(o); }), []);
  const close = (val) => { setOpts(null); if (resolver.current) resolver.current(val); };
  window.useModalA11y(!!opts, () => close(false), dialogRef);
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <div className={`mscrim ${opts ? "open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) close(false); }}>
        {opts && (
          <div className="mmodal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg" ref={dialogRef} tabIndex={-1}>
            <div className="mwarn-ic"><MIcon name={opts.icon || "alert"} size={24} /></div>
            <h3 id="confirm-title">{opts.title}</h3>
            <p className="mtext" id="confirm-msg">{opts.message}</p>
            <div className="mactions">
              <button className="btn btn-ghost btn-sm" onClick={() => close(false)}>{opts.cancel || "Cancel"}</button>
              <button className={`btn btn-sm ${opts.danger ? "btn-danger" : "btn-green"}`} onClick={() => close(true)}>{opts.confirm || "Confirm"}</button>
            </div>
          </div>
        )}
      </div>
    </ConfirmContext.Provider>
  );
}

/* ---- small primitives ---------------------------------------------------- */
function Switch({ checked, onChange }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" /><span className="knob" />
    </label>
  );
}
function StatusPill({ status }) {
  return <span className={`pill ${status}`}><span className="dot" />{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

Object.assign(window, { MIcon, typeIcon, MRouterContext, useMRouter, MToastContext, useMToast, MToastProvider, ConfirmContext, useConfirm, ConfirmProvider, Switch, StatusPill });
