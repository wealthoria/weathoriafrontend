import React from "react";

/* global React, window */

const {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} = React;


/* =========================================================
   ADMIN AUTH CONTEXT
========================================================= */

const AdminAuthContext = createContext(null);


/* =========================================================
   ADMIN SESSION PERSISTENCE (LOCAL STORAGE)
========================================================= */

const ADMIN_CACHE_KEY = "wealthoria-admin-session";

function readCachedAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.isAdmin === true && (parsed.uid || parsed.id)) {
      return parsed;
    }
  } catch (e) {}
  return null;
}

function saveCachedAdmin(admin) {
  try {
    if (admin) {
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(admin));
    } else {
      localStorage.removeItem(ADMIN_CACHE_KEY);
    }
  } catch (e) {}
}


/* =========================================================
   INITIAL STATE
========================================================= */

const adminAuthInitial = {
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  admin: null,
  error: null
};


/* =========================================================
   ADMIN PROFILE
   Firebase Authentication + custom claim
========================================================= */

async function getAdminProfile(user, forceRefresh = false) {
  if (!user) {
    return null;
  }

  try {
    /*
      Read Firebase ID token. Avoid forced refresh on routine checks
      so transient network hiccups do not log the admin out.
    */
    const tokenResult = await user.getIdTokenResult(forceRefresh).catch(async (err) => {
      console.warn("getIdTokenResult failed:", err?.message || err);
      if (forceRefresh) {
        return await user.getIdTokenResult(false).catch(() => null);
      }
      return null;
    });

    // If tokenResult couldn't be fetched (e.g. offline, tab asleep, network glitch), fall back to cached session
    if (!tokenResult) {
      const cached = readCachedAdmin();
      if (cached && (cached.uid === user.uid || cached.email === user.email || !user.email)) {
        return cached;
      }
      return null;
    }

    const claims = tokenResult?.claims || {};

    /*
      Admin access comes ONLY from Firebase
      Authentication custom claim.
    */
    if (claims.admin !== true) {
      // Confirmed by Firebase: not an admin account
      return false;
    }

    const profile = {
      uid: user.uid,
      id: user.uid,
      name: user.displayName || "Admin",
      email: user.email || "",
      role: "admin",
      status: "active",
      isAdmin: true
    };

    saveCachedAdmin(profile);
    return profile;
  } catch (error) {
    console.warn("Unable to read Firebase Admin claim:", error);
    const cached = readCachedAdmin();
    if (cached && (cached.uid === user.uid || cached.email === user.email || !user.email)) {
      return cached;
    }
    return null;
  }
}


/* =========================================================
   CHECK ADMIN ACCESS
   Firebase Authentication custom claim
========================================================= */

function checkAdminAccess(admin) {
  return (
    !!admin &&
    admin.isAdmin === true
  );
}


/* =========================================================
   ADMIN AUTH PROVIDER
========================================================= */

function AdminAuthProvider({
  children
}) {
  // Initialize directly from cached admin session if available (zero flash, instant restore)
  const [state, setState] = useState(() => {
    const cached = readCachedAdmin();
    if (cached) {
      return {
        loading: false,
        isAuthenticated: true,
        isAdmin: true,
        user: cached,
        admin: cached,
        error: null
      };
    }
    return adminAuthInitial;
  });


  /* =======================================================
     FIREBASE AUTH LISTENER
  ======================================================= */

  useEffect(() => {
    if (!window.auth) {
      console.error("Firebase Auth is not initialized.");
      const cached = readCachedAdmin();
      if (!cached) {
        setState({
          ...adminAuthInitial,
          loading: false,
          error: "Firebase Authentication is not initialized."
        });
      }
      return;
    }

    let mounted = true;

    const unsubscribe =
      window.auth.onAuthStateChanged(
        async (user) => {
          if (!mounted) {
            return;
          }

          /* -----------------------------------------------
             NOT LOGGED IN IN FIREBASE
          ------------------------------------------------ */
          if (!user) {
            // Check if we have a valid cached admin first.
            // On tab wake or hot-reload, Firebase auth may take a moment to restore from IndexedDB.
            const cached = readCachedAdmin();
            if (cached) {
              setState({
                loading: false,
                isAuthenticated: true,
                isAdmin: true,
                user: cached,
                admin: cached,
                error: null
              });
              return;
            }
            saveCachedAdmin(null);
            setState({
              ...adminAuthInitial,
              loading: false
            });
            return;
          }

          /* -----------------------------------------------
             CHECK FIREBASE ADMIN CLAIM
          ------------------------------------------------ */
          try {
            let admin = await getAdminProfile(user, false);
            if (!admin && admin !== false) {
              // Network might have momentarily glitched; try refresh
              admin = await getAdminProfile(user, true).catch(() => null);
            }
            if (!mounted) return;

            // ONLY sign out if Firebase explicitly verified that this user is NOT an admin (admin === false)
            // NEVER sign out on null (which means offline, tab wake, network reconnecting)
            if (admin === false) {
              console.warn("Firebase user does not have admin access.");
              saveCachedAdmin(null);
              try {
                await window.auth.signOut();
              } catch (signOutError) {}

              setState({
                ...adminAuthInitial,
                loading: false,
                user,
                error: "This account does not have Admin access."
              });
              return;
            }

            // If admin is null (network glitch / wake from sleep), restore from cache!
            if (!admin) {
              const cached = readCachedAdmin();
              if (cached && (cached.uid === user.uid || cached.email === user.email || !user.email)) {
                admin = cached;
              }
            }

            if (admin) {
              saveCachedAdmin(admin);
              setState({
                loading: false,
                isAuthenticated: true,
                isAdmin: true,
                user: {
                  ...admin,
                  ...(user || {})
                },
                admin,
                error: null
              });
            } else {
              setState({
                loading: false,
                isAuthenticated: false,
                isAdmin: false,
                user,
                admin: null,
                error: "Reconnecting to admin session..."
              });
            }
          } catch (error) {
            console.error("Admin authentication check error:", error);
            const cached = readCachedAdmin();
            if (cached) {
              setState({
                loading: false,
                isAuthenticated: true,
                isAdmin: true,
                user: cached,
                admin: cached,
                error: null
              });
            } else {
              setState({
                ...adminAuthInitial,
                loading: false,
                user,
                error: error.message || "Unable to verify Admin account."
              });
            }
          }
        }
      );

    return () => {
      mounted = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);


  /* =======================================================
     LOGIN
  ======================================================= */

  const login =
    useCallback(
      async (
        email,
        password
      ) => {

        if (!window.auth) {

          throw new Error(
            "Firebase Authentication is not initialized."
          );

        }


        if (!email) {

          throw new Error(
            "Please enter your email."
          );

        }


        if (!password) {

          throw new Error(
            "Please enter your password."
          );

        }


        const result =
          await window.auth
            .signInWithEmailAndPassword(
              email.trim(),
              password
            );


        const user =
          result.user;


        /*
          Check Firebase custom claim with force refresh on explicit login.
        */
        const admin =
          await getAdminProfile(user, true);

        /* -----------------------------------------------
           NOT AN ADMIN
        ------------------------------------------------ */

        if (admin === false || !admin) {
          saveCachedAdmin(null);
          await window.auth.signOut();
          throw new Error(
            "This account does not have Admin access."
          );
        }

        /* -----------------------------------------------
           CHECK ADMIN ACCESS
        ------------------------------------------------ */

        if (!checkAdminAccess(admin)) {
          saveCachedAdmin(null);
          await window.auth.signOut();
          throw new Error(
            "This account does not have Admin access."
          );
        }

        /* -----------------------------------------------
           SUCCESS
        ------------------------------------------------ */

        saveCachedAdmin(admin);

        const appUser = {
          uid: user.uid,
          id: user.uid,
          name: admin.name,
          email:
            admin.email ||
            user.email,
          role: admin.role,
          status: admin.status,
          isAdmin: admin.isAdmin
        };

        setState({
          loading: false,
          isAuthenticated: true,
          isAdmin: true,
          user: appUser,
          admin,
          error: null
        });

        return {
          user,
          admin
        };

      },
      []
    );


  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout =
    useCallback(
      async () => {
        saveCachedAdmin(null);

        try {
          if (window.auth) {
            await window.auth.signOut();
          }
        } catch (error) {
          console.error(
            "Logout error:",
            error
          );
        }

        setState({
          ...adminAuthInitial,
          loading: false
        });

        window.location.replace(
          "/members/login"
        );
      },
      []
    );


  /* =======================================================
     REFRESH ADMIN
  ======================================================= */

  const refreshAdmin =
    useCallback(
      async () => {

        if (
          !window.auth ||
          !window.auth.currentUser
        ) {

          return null;

        }


        const user =
          window.auth.currentUser;


        const admin =
          await getAdminProfile(user);


        if (
          !admin ||
          !checkAdminAccess(admin)
        ) {

          await logout();

          return null;

        }


        setState({

          loading: false,

          isAuthenticated: true,

          isAdmin: true,

          user,

          admin,

          error: null

        });


        return admin;

      },
      [logout]
    );


  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = {

    loading:
      state.loading,

    isAuthenticated:
      state.isAuthenticated,

    isAdmin:
      state.isAdmin,

    user:
      state.user,

    admin:
      state.admin,

    error:
      state.error,

    login,

    logout,

    refreshAdmin

  };


  return (

    <AdminAuthContext.Provider
      value={value}
    >

      {children}

    </AdminAuthContext.Provider>

  );

}


/* =========================================================
   HOOK
========================================================= */

function useAdminAuth() {

  return useContext(
    AdminAuthContext
  );

}


/* =========================================================
   ROLE HOOK
========================================================= */

function useRole() {

  const auth =
    useAdminAuth();


  return {

    role:
      auth?.admin?.role ||
      "Admin",

    isAdmin:
      auth?.isAdmin === true,

    isAuthenticated:
      auth?.isAuthenticated === true

  };

}


/* =========================================================
   ADMIN GUARD
========================================================= */

function AdminGuard({
  children
}) {

  const auth =
    useAdminAuth();


  if (auth?.loading) {

    return (

      <div
        className="mportal"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center"
        }}
      >

        <div
          style={{
            textAlign: "center"
          }}
        >

          <h2>
            Wealthoria
          </h2>

          <p>
            Checking Admin access...
          </p>

        </div>

      </div>

    );

  }


  if (
    !auth?.isAuthenticated ||
    !auth?.isAdmin
  ) {
    const cached = readCachedAdmin();
    if (cached) {
      return children;
    }

    window.location.replace(
      "/members/login"
    );

    return null;
  }


  return children;

}


/* =========================================================
   ACCESS DENIED
========================================================= */

function AccessDenied() {

  const auth =
    useAdminAuth();


  return (

    <div
      className="page"
      style={{
        padding: 40,
        textAlign: "center"
      }}
    >

      <h1>
        Access Denied
      </h1>

      <p>
        You don't have permission
        to access this page.
      </p>


      {auth?.user?.email && (

        <p>

          Signed in as:
          {" "}
          {auth.user.email}

        </p>

      )}


      <button
        className="btn"
        onClick={() => {

          auth.logout();

        }}
      >

        Back to Login

      </button>

    </div>

  );

}


/* =========================================================
   EXPORT EVERYTHING
========================================================= */

window.AdminAuthContext =
  AdminAuthContext;

window.AdminAuthProvider =
  AdminAuthProvider;

window.useAdminAuth =
  useAdminAuth;

window.useRole =
  useRole;

window.AdminGuard =
  AdminGuard;

window.AccessDenied =
  AccessDenied;