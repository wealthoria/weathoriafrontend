/* global React, ReactDOM, window */

/*
=========================================================================
 Wealthoria ADMIN PORTAL
 Admin router + providers + dashboard
=========================================================================
*/

const {
  useState,
  useEffect,
  useCallback,
  useMemo
} = React;


/* =========================================================================
   GET ADMIN COMPONENTS FROM WINDOW
   ========================================================================= */
const {
  AdminAuthProvider,
  useAdminAuth,

  AdminDataProvider,

  AdminGuard,
  AccessDenied,

  AdminLogin,
  AdminDashboard,

  ContentScreen,
  UploadsScreen,

  CoursesList,
  CourseBuilder,

  UsersScreen,
  AdminNotifications,


  AdminYouTube,

  MToastProvider,
  ConfirmProvider,

  Shell,

  AppCtx
} = window;
/* =========================================================================
   FALLBACK CONTEXTS
   ========================================================================= */

const AdminThemeContext =
  window.AdminThemeContext ||
  React.createContext({
    theme: "light",
    toggleTheme: () => {},
    lang: "en",
    setLang: () => {},
    t: (key) => key
  });


const MRouterContext =
  window.MRouterContext ||
  React.createContext({
    path: "/admin/login",
    navigate: () => {}
  });


/* =========================================================================
   SAFE PROVIDER FALLBACKS
   ========================================================================= */

const SafeAdminAuthProvider =
  AdminAuthProvider ||
  function SafeAdminAuthProvider({ children }) {
    return children;
  };


const SafeAdminDataProvider =
  AdminDataProvider ||
  function SafeAdminDataProvider({ children }) {
    return children;
  };


const SafeAdminGuard =
  AdminGuard ||
  function SafeAdminGuard({ children }) {
    return children;
  };


const SafeMToastProvider =
  MToastProvider ||
  function SafeMToastProvider({ children }) {
    return children;
  };


const SafeConfirmProvider =
  ConfirmProvider ||
  function SafeConfirmProvider({ children }) {
    return children;
  };


/* =========================================================================
   THEME PROVIDER
   ========================================================================= */

function ThemeProvider({ children }) {

  const [theme, setTheme] = useState(() => {

    try {

      return (
        localStorage.getItem("wl-theme") ||
        "light"
      );

    } catch (error) {

      return "light";

    }

  });


  useEffect(() => {

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    try {

      localStorage.setItem(
        "wl-theme",
        theme
      );

    } catch (error) {}

  }, [theme]);


  const toggleTheme = useCallback(() => {

    setTheme((current) =>
      current === "dark"
        ? "light"
        : "dark"
    );

  }, []);


  const value = useMemo(() => ({

    theme,

    toggleTheme,

    lang: "en",

    setLang: () => {},

    t: (key) => key

  }), [theme, toggleTheme]);


  /*
   Use existing AppCtx if available.
  */

  if (AppCtx) {

    return (
      <AppCtx.Provider value={value}>
        {children}
      </AppCtx.Provider>
    );

  }


  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );

}


/* =========================================================================
   ROUTER
   ========================================================================= */

function getPath() {

  const hash =
    window.location.hash || "";

  const path =
    hash.replace(/^#/, "");

  return path || "/admin/login";

}


function RouterProvider({ children }) {

  const [path, setPath] =
    useState(getPath);


  useEffect(() => {

    function handleHashChange() {

      setPath(getPath());

    }


    window.addEventListener(
      "hashchange",
      handleHashChange
    );


    if (!window.location.hash) {

      window.location.hash =
        "#/admin/login";

    }


    return () => {

      window.removeEventListener(
        "hashchange",
        handleHashChange
      );

    };

  }, []);


  const navigate = useCallback(
    (to) => {

      const target =
        to.startsWith("/")
          ? to
          : "/" + to;


      if (
        window.location.hash !==
        "#" + target
      ) {

        window.location.hash =
          "#" + target;

      }


      setPath(target);


      window.scrollTo(
        0,
        0
      );

    },
    []
  );


  const value = useMemo(
    () => ({
      path,
      navigate
    }),
    [path, navigate]
  );


  return (
    <MRouterContext.Provider
      value={value}
    >
      {children}
    </MRouterContext.Provider>
  );

}


/* =========================================================================
   ROUTER HOOK
   ========================================================================= */

function useMRouter() {

  return React.useContext(
    MRouterContext
  );

}


/* =========================================================================
   ROUTE RESOLUTION
   ========================================================================= */

function resolve(path) {

  if (
    path === "/admin/login"
  ) {

    return {
      name: "login"
    };

  }


  if (
    path === "/admin" ||
    path === "/admin/" ||
    path === "/admin/dashboard"
  ) {

    return {
      name: "dashboard"
    };

  }


  if (
    path === "/admin/content"
  ) {

    return {
      name: "content"
    };

  }


  if (
    path === "/admin/uploads"
  ) {

    return {
      name: "uploads"
    };

  }


  if (
    path === "/admin/courses"
  ) {

    return {
      name: "courses"
    };

  }


  if (
    path === "/admin/courses/new"
  ) {

    return {
      name: "course-new"
    };

  }


  const courseEditMatch =
    path.match(
      /^\/admin\/courses\/([^/]+)\/edit$/
    );


  if (courseEditMatch) {

    return {

      name: "course-edit",

      id: courseEditMatch[1]

    };

  }
  if (
  path === "/admin/youtube"
) {

  return {
    name: "youtube"
  };

}

if (
  path === "/admin/notifications"
) {
  return {
    name: "notifications"
  };
}


  if (
    path === "/admin/users"
  ) {

    return {
      name: "users"
    };

  }


  return {
    name: "notfound"
  };

}


/* =========================================================================
   SAFE SHELL
   ========================================================================= */

function AdminShell({
  title,
  children
}) {

  if (Shell) {

    return (
      <Shell title={title}>
        {children}
      </Shell>
    );

  }


  return (
    <div className="mportal">

      <main
        style={{
          width: "100%",
          minHeight: "100vh"
        }}
      >

        {children}

      </main>

    </div>
  );

}


/* =========================================================================
   PROTECTED ROUTES
   ========================================================================= */

function ProtectedRoute({
  route
}) {

  let roleInfo = {
    isAdmin: true
  };


  if (
    typeof window.useRole === "function"
  ) {

    try {

      roleInfo =
        window.useRole() ||
        roleInfo;

    } catch (error) {

      console.warn(
        "useRole failed:",
        error
      );

    }

  }


  const isAdmin =
    roleInfo.isAdmin !== false;


  switch (route.name) {


    case "dashboard":

      if (AdminDashboard) {

        return (
          <AdminDashboard />
        );

      }

      return (
        <AdminShell title="Admin Dashboard">

          <div className="page">

            <h1>
              Admin Dashboard
            </h1>

            <p>
              Admin dashboard component is not loaded.
            </p>

          </div>

        </AdminShell>
      );


    case "content":

      if (ContentScreen) {

        return (
          <ContentScreen />
        );

      }

      return (
        <AdminShell title="Content">

          <div className="page">

            <h1>Content</h1>

          </div>

        </AdminShell>
      );


    case "uploads":

      if (UploadsScreen) {

        return (
          <UploadsScreen />
        );

      }

      return (
        <AdminShell title="Uploads">

          <div className="page">

            <h1>Uploads</h1>

          </div>

        </AdminShell>
      );


    case "courses":

      if (CoursesList) {

        return (
          <CoursesList />
        );

      }

      return (
        <AdminShell title="Courses">

          <div className="page">

            <h1>Courses</h1>

          </div>

        </AdminShell>
      );


    case "course-new":

      if (CourseBuilder) {

        return (
          <CourseBuilder
            courseId={null}
          />
        );

      }

      return (
        <AdminShell title="New Course">

          <h1>
            Create Course
          </h1>

        </AdminShell>
      );


    case "course-edit":

      if (CourseBuilder) {

        return (
          <CourseBuilder
            courseId={route.id}
          />
        );

      }

 case "youtube":

  return (
    <AdminShell title="YouTube">
      {AdminYouTube ? (
        <AdminYouTube />
      ) : (
        <div className="page">
          <h1>YouTube</h1>
          <p>YouTube management component is not loaded.</p>
        </div>
      )}
    </AdminShell>
  );

  return (
    <AdminShell title="YouTube">

      <div className="page">

        <h1>
          YouTube
        </h1>

        <p>
          YouTube management component is not loaded.
        </p>

      </div>

    </AdminShell>
  );

      return (
        <AdminShell title="Edit Course">

          <h1>
            Edit Course
          </h1>

        </AdminShell>
      );


    case "users":

      if (!isAdmin) {

        return (
          <AdminShell title="Access Denied">

            {AccessDenied ? (
              <AccessDenied />
            ) : (
              <div className="page">

                <h1>
                  Access Denied
                </h1>

              </div>
            )}

          </AdminShell>
        );

      }


      if (UsersScreen) {

        return (
          <UsersScreen />
        );

      }



      case "notifications":

  return (
    <AdminShell title="Notifications">

      {AdminNotifications ? (
        <AdminNotifications />
      ) : (
        <div className="page">

          <h1>
            Notifications
          </h1>

          <p>
            Admin notification component is not loaded.
          </p>

        </div>
      )}

    </AdminShell>
  );


      return (
        <AdminShell title="Students">

          <div className="page">

            <h1>
              Students
            </h1>

          </div>

        </AdminShell>
      );


    default:

      return (
        <AdminShell title="Admin Dashboard">

          <div className="page">

            <h1>
              Admin Dashboard
            </h1>

          </div>

        </AdminShell>
      );

  }

}


/* =========================================================================
   ROUTED APPLICATION
   ========================================================================= */

function Routed() {

  const {
    path
  } = useMRouter();


  const route =
    resolve(path);


  /*
   Login page must NOT be inside
   AdminGuard/DataProvider.
  */

  if (
    route.name === "login"
  ) {

    if (AdminLogin) {

      return (
        <AdminLogin />
      );

    }


    return (
      <AdminShell title="Admin Login">

        <div className="page">

          <h1>
            Admin Login
          </h1>

          <p>
            Admin login component is not loaded.
          </p>

        </div>

      </AdminShell>
    );

  }


  return (
    <SafeAdminGuard>

      <SafeAdminDataProvider>

        <SafeMToastProvider>

          <SafeConfirmProvider>

            <ProtectedRoute
              route={route}
            />

          </SafeConfirmProvider>

        </SafeMToastProvider>

      </SafeAdminDataProvider>

    </SafeAdminGuard>
  );

}


/* =========================================================================
   LOGIN REDIRECT
   ========================================================================= */

function LoginRedirect({
  children
}) {

  const {
    path,
    navigate
  } = useMRouter();


  let auth = {

    loading: false,

    isAuthenticated: false

  };


  if (
    typeof useAdminAuth === "function"
  ) {

    try {

      auth =
        useAdminAuth() ||
        auth;

    } catch (error) {

      console.warn(
        "useAdminAuth failed:",
        error
      );

    }

  }


  useEffect(() => {

    if (
      !auth.loading &&
      auth.isAuthenticated &&
      path === "/admin/login"
    ) {

      navigate(
        "/admin/dashboard"
      );

    }

  }, [
    auth.loading,
    auth.isAuthenticated,
    path,
    navigate
  ]);


  return children;

}


/* =========================================================================
   ADMIN APP
   ========================================================================= */

function AdminApp() {

  return (

    <ThemeProvider>

      <SafeAdminAuthProvider>

        <RouterProvider>

          <LoginRedirect>

            <Routed />

          </LoginRedirect>

        </RouterProvider>

      </SafeAdminAuthProvider>

    </ThemeProvider>

  );

}


/* =========================================================================
   GLOBAL EXPORT
   ========================================================================= */

window.AdminApp =
  AdminApp;

window.AdminRouterProvider =
  RouterProvider;

window.useMRouter =
  useMRouter;
/* =========================================================================
   MOUNT ADMIN APP ONLY FOR /admin ROUTES
   ========================================================================= */

const adminHash =
  window.location.hash || "";

const isAdminRoute =
  adminHash.startsWith("#/admin");

if (isAdminRoute) {

  const adminRoot =
    document.getElementById("root");

  if (
    adminRoot &&
    !adminRoot.dataset.adminMounted
  ) {

    adminRoot.dataset.adminMounted =
      "true";

    const adminReactRoot =
      ReactDOM.createRoot(adminRoot);

    adminReactRoot.render(
      <AdminApp />
    );

    window.__adminRoot =
      adminReactRoot;
  }
}