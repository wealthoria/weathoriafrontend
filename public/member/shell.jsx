/* global React, window */
/* =========================================================================
   Member Portal — Shell (sidebar + topbar), MemberGuard, AccessDenied
   ========================================================================= */
const { useState } = React;
const { useApp, Icon } = window;
const { useMemberAuth, useRole } = window;
const { useMRouter, MIcon } = window;

function MemberGuard({ children }) {
  const auth = useMemberAuth();
  const { navigate } = useMRouter();
  React.useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) navigate("/member/login");
  }, [auth.loading, auth.isAuthenticated, navigate]);
  if (auth.loading || !auth.isAuthenticated) return <div className="psplash2"><div className="spinner2" /></div>;
  return children;
}

function AccessDenied() {
  const { navigate } = useMRouter();
  return (
    <div className="denied">
      <div className="dic"><MIcon name="lock" size={30} /></div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--ink)", margin: "0 0 8px" }}>Admins only</h3>
      <p className="muted" style={{ maxWidth: 360, margin: "0 auto 18px" }}>You need an Admin role to view this page. Your current role does not have access.</p>
      <button className="btn btn-green btn-sm" onClick={() => navigate("/member/dashboard")}>Back to dashboard</button>
    </div>
  );
}

const NAV = [
  { to: "/member/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/member/content", label: "Content", icon: "content" },
  { to: "/member/uploads", label: "Uploads", icon: "upload" },
  { to: "/member/courses", label: "Courses", icon: "courses" },
];

function Shell({ title, subtitle, actions, children, wide }) {
  const { theme, toggleTheme } = useApp();
  const { user, logout } = useMemberAuth();
  const { isAdmin } = useRole();
  const { path, navigate } = useMRouter();
  const [open, setOpen] = useState(false);

  const initial = (user?.name || "M").charAt(0).toUpperCase();
  const isActive = (to) => path === to || (to !== "/member/dashboard" && path.startsWith(to));
  const go = (to) => { setOpen(false); navigate(to); };

  const nav = isAdmin ? [...NAV, { to: "/member/users", label: "Students", icon: "users", admin: true }] : NAV;

  return (
    <div className="mportal">
      <div className={`sb-scrim ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sb-brand">
          <img src="assets/logo-mark.png" alt="" style={{ height: 28 }} />
          <span className="w">Wealthoria</span>
        </div>
        <div className="sb-tag">Member workspace</div>
        <nav className="sb-nav">
          <div className="sb-sec">Manage</div>
          {nav.map((n) => (
            <button key={n.to} className={`sb-link ${isActive(n.to) ? "on" : ""}`} onClick={() => go(n.to)}>
              <MIcon name={n.icon} size={18} />{n.label}
              {n.admin && <span className="role-badge admin">Admin</span>}
            </button>
          ))}
        </nav>
        <div className="sb-foot">
          <div className="sb-user">
            <span className="avatar sm" style={{ width: 36, height: 36, fontSize: 15 }}>{initial}</span>
            <div className="meta">
              <div className="n">{user?.name}</div>
              <div className="r"><span className={`role-badge ${isAdmin ? "admin" : "editor"}`}>{user?.role}</span></div>
            </div>
            <button className="row-act" title="Log out" onClick={() => { logout(); navigate("/member/login"); }}><MIcon name="logout" size={18} /></button>
          </div>
        </div>
      </aside>

      <div className="mmain">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><MIcon name="menu" size={20} /></button>
          <div className="tb-title">
            <h1>{title}</h1>
            {subtitle && <div className="tb-sub">{subtitle}</div>}
          </div>
          <div className="tb-right">
            {actions}
            <button className="iconbtn" onClick={toggleTheme} aria-label="Toggle theme"><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></button>
          </div>
        </div>
        <div className={`mcontent ${wide ? "" : ""}`}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { MemberGuard, AccessDenied, Shell });
