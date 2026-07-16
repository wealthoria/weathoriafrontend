/* global React, ReactDOM, window */
/* =========================================================================
   Member Portal — app root: theme provider, hash router (with params),
   provider nesting, role-gated route table.
   ========================================================================= */
const { useState, useEffect, useCallback, useMemo } = React;
const { AppCtx } = window;
const { MemberAuthProvider, useMemberAuth, useRole } = window;
const { MemberDataProvider } = window;
const { MRouterContext, useMRouter, MToastProvider, ConfirmProvider } = window;
const { MemberGuard, AccessDenied } = window;
const { MemberLogin, MemberDashboard, ContentScreen, UploadsScreen, CoursesList, CourseBuilder, UsersScreen } = window;

/* theme provider (shares wl-theme with the rest of the site) */
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("wl-theme") || "light");
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("wl-theme", theme); }, [theme]);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  const value = { theme, toggleTheme, lang: "en", setLang: () => {}, t: null };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

/* router: keeps the raw hash path; exposes navigate */
function RouterProvider({ children }) {
  const norm = () => (window.location.hash || "").replace(/^#/, "") || "/member/login";
  const [path, setPath] = useState(norm);
  useEffect(() => {
    const onHash = () => setPath(norm());
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) window.location.hash = "#/member/login";
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = useCallback((to) => { if (window.location.hash !== "#" + to) window.location.hash = "#" + to; setPath(to); window.scrollTo(0, 0); }, []);
  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <MRouterContext.Provider value={value}>{children}</MRouterContext.Provider>;
}

/* match a path against the route table */
function resolve(path) {
  if (path === "/member/login") return { name: "login" };
  if (path === "/member/dashboard" || path === "/member" || path === "/member/") return { name: "dashboard" };
  if (path === "/member/content") return { name: "content" };
  if (path === "/member/uploads") return { name: "uploads" };
  if (path === "/member/courses") return { name: "courses" };
  if (path === "/member/courses/new") return { name: "course-new" };
  let m = path.match(/^\/member\/courses\/([^/]+)\/edit$/);
  if (m) return { name: "course-edit", id: m[1] };
  if (path === "/member/users") return { name: "users" };
  return { name: "notfound" };
}

function ProtectedRoute({ route }) {
  const { isAdmin } = useRole();
  switch (route.name) {
    case "dashboard": return <MemberDashboard />;
    case "content": return <ContentScreen />;
    case "uploads": return <UploadsScreen />;
    case "courses": return <CoursesList />;
    case "course-new": return <CourseBuilder courseId={null} />;
    case "course-edit": return <CourseBuilder courseId={route.id} />;
    case "users": return isAdmin ? <UsersScreen /> : <window.Shell title="Students"><AccessDenied /></window.Shell>;
    default: return <MemberDashboard />;
  }
}

function Routed() {
  const { path } = useMRouter();
  const route = resolve(path);
  if (route.name === "login") return <MemberLogin />;
  return (
    <MemberGuard>
      <MemberDataProvider>
        <MToastProvider>
          <ConfirmProvider>
            <ProtectedRoute route={route} />
          </ConfirmProvider>
        </MToastProvider>
      </MemberDataProvider>
    </MemberGuard>
  );
}

/* if logged in and on /login, jump to dashboard */
function LoginRedirect({ children }) {
  const auth = useMemberAuth();
  const { path, navigate } = useMRouter();
  useEffect(() => { if (!auth.loading && auth.isAuthenticated && path === "/member/login") navigate("/member/dashboard"); }, [auth.loading, auth.isAuthenticated, path, navigate]);
  return children;
}

function MemberApp() {
  return (
    <ThemeProvider>
      <MemberAuthProvider>
        <RouterProvider>
          <LoginRedirect>
            <Routed />
          </LoginRedirect>
        </RouterProvider>
      </MemberAuthProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MemberApp />);
