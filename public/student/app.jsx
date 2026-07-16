/* global React, ReactDOM, window */
/* =========================================================================
   Student Portal — app shell: theme/lang provider, hash router, auth-gated
   routes, purchase modal + resume wiring.
   ========================================================================= */
const { useState, useEffect, useCallback, useMemo } = React;
const { AppCtx } = window;
const { AuthProvider, useAuth } = window;
const { CourseProvider, useCourses } = window;
const { RouterContext, useRouter, ToastProvider, useToast, PrivateRoute } = window;
const { RegisterScreen,LoginScreen, DashboardScreen, CollectionScreen, PurchaseModal, PortalNav, ForgotPasswordScreen,
 } = window;

const ROUTES = [ "/student/register","/student/login", "/student/dashboard", "/student/collection", "/student/forgot-password",];

/* ---- theme + language provider (shares storage keys with the main site) -- */
function PortalAppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("wl-lang") || "en");
  const [theme, setTheme] = useState(() => localStorage.getItem("wl-theme") || "light");

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("wl-theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("wl-lang", lang); }, [lang]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  const value = { lang, setLang, theme, toggleTheme, t: window.CONTENT ? window.CONTENT[lang] : null };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

/* ---- hash router --------------------------------------------------------- */
function parseHash() {
  const h = (window.location.hash || "").replace(/^#/, "");
  return ROUTES.includes(h) ? h : null;
}
function RouterProvider({ children }) {
  const [path, setPath] = useState(() => parseHash() || "/student/login");

  useEffect(() => {
    const onHash = () => { const p = parseHash(); if (p) setPath(p); };
    window.addEventListener("hashchange", onHash);
    if (!parseHash()) window.location.hash = "#/student/login";
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((to) => {
    if (window.location.hash !== "#" + to) window.location.hash = "#" + to;
    setPath(to);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

/* ---- login gate: redirect to dashboard if already authenticated ---------- */
function LoginGate() {
  const auth = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!auth.loading && auth.isAuthenticated) {
      navigate("/student/dashboard");
    }
  }, [auth.loading, auth.isAuthenticated, navigate]);

  if (auth.loading) {
    return (
      <div className="psplash">
        <div className="spinner" />
      </div>
    );
  }

  return <LoginScreen />;
}

/* ---- protected area: nav + screen + modal + toasts ----------------------- */
function ProtectedShell() {
  const { path, navigate } = useRouter();
  const { enroll, setProgress, getProgress, isEnrolled } = useCourses();
  const { push } = useToast();
  const [modalCourse, setModalCourse] = useState(null);

  const onEnroll = useCallback((course) => {
    if (isEnrolled(course.id)) { navigate("/student/collection"); return; }
    setModalCourse(course);
  }, [isEnrolled, navigate]);

  const onConfirm = useCallback((course) => { enroll(course.id); }, [enroll]);

  const onModalClose = useCallback((dest) => {
    setModalCourse(null);
    if (dest === "collection") navigate("/student/collection");
  }, [navigate]);

  const onResume = useCallback((course) => {
    const next = Math.min(100, getProgress(course.id) + 12);
    setProgress(course.id, next);
    push(next >= 100 ? `Completed ${course.title}` : `Resumed ${course.title}`, next >= 100 ? "award" : "play");
  }, [getProgress, setProgress, push]);

  let screen;
  if (path === "/student/collection") screen = <CollectionScreen onResume={onResume} />;
  else screen = <DashboardScreen onEnroll={onEnroll} onResume={onResume} />;

  return (
    <div className="portal">
      <PortalNav />
      <div className="portal-main">{screen}</div>
      <PurchaseModal course={modalCourse} onClose={onModalClose} onConfirm={onConfirm} />
    </div>
  );
}

/* ---- routed root --------------------------------------------------------- */
function Routed() {
  const auth = useAuth();
  const { path } = useRouter();


    if (path === "/student/register") {
  
    return <RegisterScreen />;
  }

  if (path === "/student/login") {
    return <LoginGate />;
  }

  if (path === "/student/forgot-password") {
    return <ForgotPasswordScreen />;
  }

  return (
    <PrivateRoute auth={auth}>
      <CourseProvider user={auth.user}>
        <ToastProvider>
          <ProtectedShell />
        </ToastProvider>
      </CourseProvider>
    </PrivateRoute>
  );
}
function PortalApp() {
  return (
    <PortalAppProvider>
      <AuthProvider>
        <RouterProvider>
          <Routed />
        </RouterProvider>
      </AuthProvider>
    </PortalAppProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PortalApp />);
