import React from "react";
import { createRoot } from "react-dom/client";

console.log("[Wealthoria] main.jsx starting...");

// Make React available to the legacy/global-style modules
window.React = React;
window.ReactDOM = {
  createRoot,
};

// ============================================================
// FIREBASE
// ============================================================

import "./firebase.js";

// ============================================================
// MAIN WEBSITE
// ============================================================

import "./app/content.jsx";
import "./app/ui.jsx";
import "./app/sections-a.jsx";
import "./app/sections-b.jsx";
import "./app/calculators.jsx";
import "./app/sections-c.jsx";
import "./app/sections-d.jsx";
import "./app/anim.jsx";
import "./app/EnquiryForm.jsx";
import "./app/app.jsx";

// ============================================================
// MEMBER PORTAL
// ============================================================

import "./members/auth.jsx";
import "./members/login.jsx";
import "./members/ForgotPassword.jsx";
import "./members/CourseVideos.jsx";
import "./members/Video.jsx";
import "./members/MemberArticles.jsx";


import "./members/Newsletter.jsx";
import "./members/MemberHistoryPurchase.jsx";
import "./members/SeminarRegistrations.jsx";
import "./members/WeeklyRoundup.jsx";
import "./members/dashboard.jsx";
import "./members/settings.jsx";
import "./members/subscription.jsx";
import "./members/members-router.jsx";

// ============================================================
// ADMIN CORE
// ============================================================

import "./admin/auth.jsx";
import "./admin/data.jsx";
import "./admin/store.jsx";
import "./admin/analytics-data.jsx";

// ============================================================
// ADMIN UI
// ============================================================

import "./admin/ui.jsx";
import "./admin/charts.jsx";
import "./admin/shell.jsx";

// ============================================================
// ADMIN ROUTER / APPLICATION
// ============================================================
//
// This file creates:
//
//   window.AdminApp
//   window.AdminRouterProvider
//   window.useAdminRouter
//
// The admin screens are loaded below. Since all static imports
// finish before the code at the bottom of this file executes,
// the screens will be available when AdminApp is rendered.
//

import "./admin/app.jsx";

// ============================================================
// ADMIN SCREENS
// ============================================================

import "./admin/content.jsx";
import "./admin/uploads.jsx";
import "./admin/courses.jsx";
import "./admin/users.jsx";
import "./admin/AdminNotifications.jsx";
import "./admin/youtube.jsx";
import "./admin/dashboard.jsx";
import "./admin/reports.jsx";
import "./admin/enquiries.jsx";



import "./admin/login.jsx";


// ============================================================
// ROUTE DETECTION
// ============================================================

const pathname = window.location.pathname || "/";
const hash = window.location.hash || "";

const hashPath = hash.replace(/^#/, "") || "";

console.log("[Wealthoria] Pathname:", pathname);
console.log("[Wealthoria] Hash:", hash);
console.log("[Wealthoria] Hash path:", hashPath);

// ------------------------------------------------------------
// Determine which application should be displayed
// ------------------------------------------------------------

const isAdminRoute =
  pathname.startsWith("/admin") ||
  hashPath.startsWith("/admin");

const isMemberRoute =
  pathname.startsWith("/members") ||
  hashPath.startsWith("/members");

console.log("[Wealthoria] isAdminRoute:", isAdminRoute);
console.log("[Wealthoria] isMemberRoute:", isMemberRoute);

// ============================================================
// ROOT ELEMENT
// ============================================================

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "[Wealthoria] Root element #root was not found."
  );
}

const root = createRoot(rootElement);

// ============================================================
// ADMIN APPLICATION
// ============================================================

if (isAdminRoute) {
  console.log("[Wealthoria] Rendering application: AdminApp");

  if (typeof window.AdminApp !== "function") {
    console.error(
      "[Wealthoria] window.AdminApp is not available."
    );

    root.render(
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>Admin Application Error</h2>

        <p>
          The admin application could not be loaded.
        </p>

        <p>
          Check the browser console for the exact error.
        </p>
      </div>
    );

    throw new Error(
      "[Wealthoria] window.AdminApp is not available."
    );
  }

  root.render(<window.AdminApp />);

  console.log(
    "[Wealthoria] Admin application rendered successfully."
  );
}

// ============================================================
// MEMBER APPLICATION
// ============================================================

else if (isMemberRoute) {
  console.log("[Wealthoria] Rendering application: MembersRouter");

  if (typeof window.MembersRouter !== "function") {
    console.error(
      "[Wealthoria] window.MembersRouter is not available."
    );

    root.render(
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>Members Application Error</h2>

        <p>
          The members application could not be loaded.
        </p>

        <p>
          Check the browser console for the exact error.
        </p>
      </div>
    );

    throw new Error(
      "[Wealthoria] window.MembersRouter is not available."
    );
  }

  root.render(<window.MembersRouter />);

  console.log(
    "[Wealthoria] Members application rendered successfully."
  );
}

// ============================================================
// MAIN WEBSITE
// ============================================================

else {
  console.log("[Wealthoria] Rendering main website");

  const RootApp =
    window.WealthoriaRootApp ||
    window.WealthoriaApp;

  if (typeof RootApp !== "function") {
    console.error(
      "[Wealthoria] Main application is not available."
    );

    root.render(
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>Wealthoria Application Error</h2>

        <p>
          The main application could not be loaded.
        </p>

        <p>
          Check the browser console for the exact error.
        </p>
      </div>
    );

    throw new Error(
      "[Wealthoria] Root application is not available."
    );
  }

  root.render(<RootApp />);

  console.log(
    "[Wealthoria] Main website rendered successfully."
  );
}