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
   Firestore collection: admins
========================================================= */

async function getAdminProfile(user) {

  if (!user) {
    return null;
  }

  if (!window.db) {
    throw new Error(
      "Firestore is not initialized."
    );
  }

  const doc =
    await window.db
      .collection("admins")
      .doc(user.uid)
      .get();

  if (!doc.exists) {
    return null;
  }

  const data =
    doc.data() || {};

  return {
    id: doc.id,
    uid: user.uid,

    name:
      data.name ||
      data.fullName ||
      user.displayName ||
      "Admin",

    email:
      data.email ||
      user.email ||
      "",

    role:
      data.role ||
      "Admin",

    status:
      data.status ||
      "active",

    isAdmin:
      data.isAdmin !== false,

    ...data
  };
}


/* =========================================================
   CHECK ADMIN ACCESS
========================================================= */

function checkAdminAccess(admin) {

  if (!admin) {
    return false;
  }

  if (admin.isAdmin === false) {
    return false;
  }

  const status =
    String(
      admin.status || "active"
    ).toLowerCase();

  if (
    status === "disabled" ||
    status === "inactive" ||
    status === "blocked" ||
    status === "suspended"
  ) {
    return false;
  }

  const role =
    String(
      admin.role || "admin"
    ).toLowerCase();

  return (
    role === "admin" ||
    role === "administrator" ||
    role === "superadmin" ||
    role === "super_admin"
  );
}


/* =========================================================
   ADMIN AUTH PROVIDER
========================================================= */

function AdminAuthProvider({
  children
}) {

  const [state, setState] =
    useState(adminAuthInitial);


  /* =======================================================
     FIREBASE AUTH LISTENER
  ======================================================= */

  useEffect(() => {

    if (!window.auth) {

      console.error(
        "Firebase Auth is not initialized."
      );

      setState({
        ...adminAuthInitial,
        loading: false,
        error:
          "Firebase Authentication is not initialized."
      });

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
             NOT LOGGED IN
          ------------------------------------------------ */

          if (!user) {

            setState({
              ...adminAuthInitial,
              loading: false
            });

            return;
          }


          /* -----------------------------------------------
             CHECK ADMIN TABLE
          ------------------------------------------------ */

          try {

            const admin =
              await getAdminProfile(user);


            if (!admin) {

              console.warn(
                "User exists in Firebase Auth but not in admins collection."
              );

              setState({
                ...adminAuthInitial,

                loading: false,

                user,

                error:
                  "This account is not registered as an Admin."
              });

              return;
            }


            /* ---------------------------------------------
               CHECK ROLE
            --------------------------------------------- */

            if (!checkAdminAccess(admin)) {

              console.warn(
                "User is not authorized as Admin."
              );

              setState({
                ...adminAuthInitial,

                loading: false,

                user,

                admin,

                error:
                  "You do not have Admin access."
              });

              return;
            }


            /* ---------------------------------------------
               ADMIN SUCCESS
            --------------------------------------------- */

            setState({

              loading: false,

              isAuthenticated: true,

              isAdmin: true,

              user,

              admin,

              error: null

            });


          } catch (error) {

            console.error(
              "Admin authentication error:",
              error
            );


            setState({

              ...adminAuthInitial,

              loading: false,

              user,

              error:
                error.message ||
                "Unable to verify Admin account."

            });

          }

        }
      );


    return () => {

      mounted = false;

      if (
        typeof unsubscribe ===
        "function"
      ) {
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


        const admin =
          await getAdminProfile(user);


        /* -----------------------------------------------
           USER NOT IN ADMINS TABLE
        ------------------------------------------------ */

        if (!admin) {

          await window.auth.signOut();

          throw new Error(
            "This account is not registered in the Admins table."
          );

        }


        /* -----------------------------------------------
           NOT ADMIN
        ------------------------------------------------ */

        if (!checkAdminAccess(admin)) {

          await window.auth.signOut();

          throw new Error(
            "This account does not have Admin access."
          );

        }


        /* -----------------------------------------------
           SUCCESS
        ------------------------------------------------ */
const appUser = {
  uid: user.uid,
  id: user.uid,
  name: admin.name,
  email: admin.email || user.email,
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


        window.location.hash =
          "#/admin/login";

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

    if (
      window.location.hash !==
      "#/admin/login"
    ) {

      window.location.hash =
        "#/admin/login";

    }

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

      {auth?.admin?.email && (

        <p>
          Signed in as:
          {" "}
          {auth.admin.email}
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


console.log(
  "ADMIN AUTH LOADED"
);

console.log(
  "useAdminAuth:",
  typeof window.useAdminAuth
);

console.log(
  "AdminAuthProvider:",
  typeof window.AdminAuthProvider
);