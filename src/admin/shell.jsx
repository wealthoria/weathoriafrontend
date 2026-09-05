import React from "react";

/* global React, window */

/* =========================================================================
   Admin Portal — Shell
   Sidebar + topbar + AdminGuard + AccessDenied
   ========================================================================= */

const { useState } = React;

const { useApp, Icon } = window;
const { useAdminAuth, useRole } = window;

/* =========================================================================
   ADMIN ROUTER HELPER
   ========================================================================= */

function getAdminRouter() {
  if (typeof window.useAdminRouter !== "function") {
    throw new Error(
      "Admin router is not initialized. window.useAdminRouter is unavailable."
    );
  }

  return window.useAdminRouter();
}

/* =========================================================================
   ADMIN GUARD
   ========================================================================= */

function AdminGuard({ children }) {

  const auth =
    useAdminAuth();

  const { navigate } =
    getAdminRouter();

  React.useEffect(() => {

    if (
      !auth.loading &&
      !auth.isAuthenticated
    ) {

      navigate(
        "/admin/login"
      );

    }

  }, [
    auth.loading,
    auth.isAuthenticated,
    navigate
  ]);

  if (
    auth.loading ||
    !auth.isAuthenticated
  ) {

    return (
      <div className="psplash2">
        <div className="spinner2" />
      </div>
    );

  }

  return children;
}


/* =========================================================================
   ACCESS DENIED
   ========================================================================= */

function AccessDenied() {

  const { navigate } =
    getAdminRouter();

  return (

    <div className="denied">

      <div className="dic">

        <MIcon
          name="lock"
          size={30}
        />

      </div>

      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          color: "var(--ink)",
          margin: "0 0 8px"
        }}
      >
        Admins only
      </h3>

      <p
        className="muted"
        style={{
          maxWidth: 360,
          margin: "0 auto 18px"
        }}
      >
        You need an Admin role to view
        this page. Your current role does
        not have access.
      </p>

      <button
        className="btn btn-green btn-sm"
        onClick={() =>
          navigate(
            "/admin/dashboard"
          )
        }
      >
        Back to dashboard
      </button>

    </div>

  );
}


/* =========================================================================
   ADMIN SIDEBAR NAVIGATION
   ========================================================================= */

const NAV = [

  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: "dashboard"
  },

  {
    to: "/admin/content",
    label: "Content",
    icon: "content"
  },

  {
    to: "/admin/uploads",
    label: "Uploads",
    icon: "upload"
  },

  {
    to: "/admin/courses",
    label: "Courses",
    icon: "courses"
  },

  {
    to: "/admin/youtube",
    label: "YouTube",
    icon: "youtube"
  },

  {
  to: "/admin/reports",
  label: "Reports",
  icon: "reports"
},{ to: "/admin/enquiries", label: "Enquiries", icon: "enquiries" },



  {
    to: "/admin/notifications",
    label: "Send Push Notification",
    icon: "send"
  },

  {
    to: "/admin/users",
    label: "Members",
    icon: "users"
  }

];


/* =========================================================================
   SHELL
   ========================================================================= */

function Shell({
  title,
  subtitle,
  actions,
  children,
  wide
}) {

  const {
    theme,
    toggleTheme
  } =
    useApp();

  const {
    user,
    logout
  } =
    useAdminAuth();

  const {
    isAdmin
  } =
    useRole();

  const {
    path,
    navigate
  } =
    getAdminRouter();

  const [open, setOpen] =
    useState(false);


  /* =======================================================
     USER INITIAL
  ======================================================= */

  const initial =
    (
      user?.name ||
      "M"
    )
      .charAt(0)
      .toUpperCase();


  /* =======================================================
     ACTIVE ROUTE
  ======================================================= */

  const isActive =
    (to) => {

      return (
        path === to ||
        (
          to !== "/admin/dashboard" &&
          path.startsWith(to)
        )
      );

    };


  /* =======================================================
     NAVIGATION
  ======================================================= */

  const go =
    (to) => {

      setOpen(false);

      navigate(to);

    };


  return (

    <div className="mportal">

      {/* ===================================================
          SIDEBAR SCRIM
      =================================================== */}

      <div
        className={
          `sb-scrim ${
            open
              ? "open"
              : ""
          }`
        }
        onClick={() =>
          setOpen(false)
        }
      />


      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={
          `sidebar ${
            open
              ? "open"
              : ""
          }`
        }
      >

        {/* BRAND */}

        <div className="sb-brand">

          <img
            src="assets/logo-mark.png"
            alt=""
            style={{
              height: 28
            }}
          />

          <span className="w">
            Wealthoria
          </span>

        </div>


        {/* TAG */}

        <div className="sb-tag">
          admin workspace
        </div>


        {/* NAVIGATION */}

        <nav className="sb-nav">

          <div className="sb-sec">
            Manage
          </div>

          {NAV.map(
            (item) => (

              <button
                key={item.to}
                type="button"
                className={
                  `sb-link ${
                    isActive(item.to)
                      ? "on"
                      : ""
                  }`
                }
                onClick={() =>
                  go(item.to)
                }
              >

                <MIcon
                  name={item.icon}
                  size={18}
                />

                <span>
                  {item.label}
                </span>

              </button>

            )
          )}

        </nav>


        {/* USER FOOTER */}
{/* USER FOOTER */}
<div className="sb-foot">
  <div className="sb-user">
    <div className="meta">
      <div className="n">Admin</div>

      <div className="r">
        {user?.email || ""}
      </div>
    </div>

    <button
      className="row-act"
      title="Log out"
      onClick={() => {
        logout();
        navigate("/admin/login");
      }}
    >
      <MIcon name="logout" size={18} />
    </button>
  </div>
</div>

      </aside>


      {/* ===================================================
          MAIN
      =================================================== */}

      <div className="mmain">

        {/* TOPBAR */}

        <div className="topbar">

          <button
            className="menu-btn"
            type="button"
            onClick={() =>
              setOpen(true)
            }
            aria-label="Open menu"
          >

            <MIcon
              name="menu"
              size={20}
            />

          </button>


          <div className="tb-title">

            <h1>
              {title}
            </h1>

            {subtitle && (

              <div className="tb-sub">
                {subtitle}
              </div>

            )}

          </div>


          <div className="tb-right">

            {actions}

            <button
              className="iconbtn"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >

              <Icon
                name={
                  theme === "dark"
                    ? "sun"
                    : "moon"
                }
                size={18}
              />

            </button>

          </div>

        </div>


        {/* CONTENT */}

        <div
          className={
            `mcontent ${
              wide
                ? ""
                : ""
            }`
          }
        >

          {children}

        </div>

      </div>

    </div>

  );

}


/* =========================================================================
   EXPORT
   ========================================================================= */

Object.assign(
  window,
  {
    AdminGuard,
    AccessDenied,
    Shell
  }
);