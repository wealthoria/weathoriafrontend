import { useEffect } from "react";

/* =========================================================
   MEMBER CONTENT HELPERS

   - Opening a PDF always goes through the backend, which
     checks the member's membership before returning a
     short-lived link.
   - Push notifications link to
       /members/dashboard?open=<page>&content=<contentId>
     The link is remembered (so it survives the login page),
     the dashboard switches to <page>, and the page opens
     <contentId> once its list has loaded.
========================================================= */

const API_BASE_URL =
  "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

const PENDING_PAGE_KEY = "wealthoria-pending-page";
const PENDING_CONTENT_KEY = "wealthoria-pending-content";

// Member pages a notification may open.
export const NOTIFICATION_PAGES = [
  "dashboard",
  "newsletter",
  "weekly",
  "articles",
  "videos",
  "ratio",
  "courses",
  "notifications"
];

/* ---------------------------------------------------------
   MEMBER TOKEN (same multi-account storage as the portal)
--------------------------------------------------------- */

export function getMemberToken() {
  const readUid = () => {
    const raw =
      window.sessionStorage.getItem("wealthoria-current-member") ||
      window.localStorage.getItem("wealthoria-current-member");

    if (!raw) return "";

    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "string" ? parsed : parsed?.uid || "";
    } catch {
      return raw;
    }
  };

  const readSessions = (storage) => {
    try {
      return JSON.parse(storage.getItem("wealthoria-member-sessions") || "{}") || {};
    } catch {
      return {};
    }
  };

  const uid = readUid();
  if (!uid) return "";

  return (
    readSessions(window.sessionStorage)[uid]?.token ||
    readSessions(window.localStorage)[uid]?.token ||
    ""
  );
}

/* ---------------------------------------------------------
   SECURE PDF LINK
--------------------------------------------------------- */

export async function fetchSecurePdfUrl(contentId) {
  const token = getMemberToken();

  if (!token) {
    throw new Error("Please log in again to open this PDF.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/members/content-pdf-url/${encodeURIComponent(contentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.success || !data?.url) {
    throw new Error(data?.message || "Unable to open PDF.");
  }

  return data.url;
}

/* ---------------------------------------------------------
   NOTIFICATION DEEP LINK
--------------------------------------------------------- */

// Call on every page load (main.jsx): remembers ?open=&content=
// so the link still works after the login page.
export function captureNotificationLink() {
  try {
    const params = new URLSearchParams(window.location.search);
    const page = params.get("open");
    const contentId = params.get("content");

    if (!page || !NOTIFICATION_PAGES.includes(page)) return;

    window.sessionStorage.setItem(PENDING_PAGE_KEY, page);

    if (contentId) {
      window.sessionStorage.setItem(PENDING_CONTENT_KEY, contentId);
    } else {
      window.sessionStorage.removeItem(PENDING_CONTENT_KEY);
    }

    // Clean the address bar.
    params.delete("open");
    params.delete("content");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (query ? `?${query}` : "") + window.location.hash
    );
  } catch (error) {
    console.error("Notification link error:", error);
  }
}

// Dashboard: returns the page to open (once), or "".
export function takePendingPage() {
  const page = window.sessionStorage.getItem(PENDING_PAGE_KEY) || "";
  window.sessionStorage.removeItem(PENDING_PAGE_KEY);
  return NOTIFICATION_PAGES.includes(page) ? page : "";
}

// Content pages: opens the notification's item once the list is loaded.
export function usePendingContent(items, open) {
  useEffect(() => {
    const pendingId = window.sessionStorage.getItem(PENDING_CONTENT_KEY);

    if (!pendingId || !Array.isArray(items) || items.length === 0) return;

    const item = items.find((entry) => String(entry.id) === pendingId);
    if (!item) return;

    window.sessionStorage.removeItem(PENDING_CONTENT_KEY);
    open(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
}
