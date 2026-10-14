import { useEffect, useRef } from "react";

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
        "Content-Type": "application/json",
        "x-client-tracked": "true"
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

const PENDING_EVENT = "wealthoria:pending-content";

// In-app click on a notification (list item or popup slide).
// Queues the PDF and returns the page to switch to ("" if the
// link is not a member-dashboard link).
export function queueNotificationLink(url) {
  try {
    const parsed = new URL(String(url || ""), window.location.origin);

    const isWealthoria =
      parsed.origin === window.location.origin ||
      parsed.hostname.endsWith("wealthoria.in");

    if (!isWealthoria || !parsed.pathname.startsWith("/members")) return "";

    const page = parsed.searchParams.get("open");
    if (!page || !NOTIFICATION_PAGES.includes(page)) return "";

    const contentId = parsed.searchParams.get("content");

    if (contentId) {
      window.sessionStorage.setItem(PENDING_CONTENT_KEY, contentId);
    } else {
      window.sessionStorage.removeItem(PENDING_CONTENT_KEY);
    }

    // Lets an already-open page react (it will not remount).
    window.dispatchEvent(new Event(PENDING_EVENT));

    return page;
  } catch {
    return "";
  }
}

// Content pages: opens the notification's item once the list is loaded.
export function usePendingContent(items, open) {
  const latest = useRef({ items, open });
  latest.current = { items, open };

  useEffect(() => {
    const tryOpen = () => {
      const { items: list, open: openItem } = latest.current;
      const pendingId = window.sessionStorage.getItem(PENDING_CONTENT_KEY);

      if (!pendingId || !Array.isArray(list) || list.length === 0) return;

      const item = list.find((entry) => String(entry.id) === pendingId);
      if (!item) return;

      window.sessionStorage.removeItem(PENDING_CONTENT_KEY);
      openItem(item);
    };

    tryOpen();
    window.addEventListener(PENDING_EVENT, tryOpen);

    return () => window.removeEventListener(PENDING_EVENT, tryOpen);
  }, [items]);
}

/* ---------------------------------------------------------
   DAY-BY-DAY USAGE TRACKING
--------------------------------------------------------- */

export function getCurrentMemberInfo() {
  try {
    const raw =
      window.sessionStorage.getItem("wealthoria-current-member") ||
      window.localStorage.getItem("wealthoria-current-member");
    let uid = "";
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        uid = typeof parsed === "string" ? parsed : parsed?.uid || "";
      } catch {
        uid = raw;
      }
    }

    let sessions = {};
    try {
      sessions = {
        ...JSON.parse(window.localStorage.getItem("wealthoria-member-sessions") || "{}"),
        ...JSON.parse(window.sessionStorage.getItem("wealthoria-member-sessions") || "{}")
      };
    } catch {}

    let session = uid ? sessions[uid] || {} : {};

    // Fallback: If no uid found yet, check sessions
    if (!uid && Object.keys(sessions).length > 0) {
      const firstKey = Object.keys(sessions)[0];
      session = sessions[firstKey] || {};
      uid = session.uid || firstKey;
    }

    // Fallback: Check wealthoria-user or user
    if (!uid) {
      try {
        const userRaw =
          window.sessionStorage.getItem("wealthoria-user") ||
          window.localStorage.getItem("wealthoria-user") ||
          window.sessionStorage.getItem("user") ||
          window.localStorage.getItem("user");
        if (userRaw) {
          const userObj = JSON.parse(userRaw);
          if (userObj?.uid || userObj?.id) {
            uid = userObj.uid || userObj.id;
            session = { ...session, ...userObj };
          }
        }
      } catch {}
    }

    // Fallback: Firebase Auth
    if (!uid && window.firebase && typeof window.firebase.auth === "function") {
      try {
        const fbUser = window.firebase.auth().currentUser;
        if (fbUser) {
          uid = fbUser.uid;
          session = {
            ...session,
            name: session.name || fbUser.displayName,
            email: session.email || fbUser.email,
            phone: session.phone || fbUser.phoneNumber
          };
        }
      } catch {}
    }

    if (!uid) {
      let guestId = window.sessionStorage.getItem("wealthoria-guest-id");
      if (!guestId) {
        guestId = "guest_" + Math.random().toString(36).substring(2, 9);
        window.sessionStorage.setItem("wealthoria-guest-id", guestId);
      }
      return {
        uid: guestId,
        name: "Active Member",
        email: "",
        phone: ""
      };
    }

    return {
      uid,
      name:
        session.name ||
        session.displayName ||
        session.fullName ||
        session.email ||
        session.phone ||
        "Member",
      email: session.email || "",
      phone: session.phone || session.phoneNumber || session.mobile || ""
    };
  } catch (e) {
    return {
      uid: "member_guest",
      name: "Member",
      email: "",
      phone: ""
    };
  }
}

// In-memory deduplication cache to prevent duplicate tracking within rapid succession
const recentTrackCache = new Map();
const TRACK_DEDUP_WINDOW_MS = 4000;

export function trackMemberContentOpen({ type, contentId, contentTitle }) {
  try {
    const t = String(type || "").toLowerCase();
    const normType =
      t.includes("roundup")
        ? "weekly_roundup"
        : t.includes("news")
        ? "newsletter"
        : (t.includes("video") || t.includes("vedio") || t.includes("course") || t.includes("watch"))
        ? "video"
        : "weekly_report";

    const member = getCurrentMemberInfo();
    const token = getMemberToken();

    // Deduplicate rapid duplicate clicks / component mounts within 4 seconds
    const dedupKey = `${member?.uid || "guest"}_${normType}_${String(contentId || "")}`;
    const now = Date.now();
    const lastTrackTime = recentTrackCache.get(dedupKey);
    if (lastTrackTime && now - lastTrackTime < TRACK_DEDUP_WINDOW_MS) {
      console.log(`[Wealthoria Track] ⏱️ Suppressing duplicate tracking for ${dedupKey} within ${TRACK_DEDUP_WINDOW_MS}ms`);
      return;
    }
    recentTrackCache.set(dedupKey, now);

    console.log(`[Wealthoria Track] 🚀 Tracking ${normType} for member:`, member?.name, member?.uid, "Content:", contentTitle);

    // 1. Google Analytics
    if (typeof window.gtag === "function") {
      try {
        window.gtag("event", `${normType}_opened`, {
          content_id: String(contentId || ""),
          content_title: contentTitle || "",
          member_id: member?.uid || ""
        });
      } catch {}
    }

    // Helper to send to Cloud Functions API fallback
    const sendToBackendApi = () => {
      fetch(`${API_BASE_URL}/api/members/track-usage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: normType,
          contentId: String(contentId || ""),
          title: contentTitle || "",
          member
        })
      })
      .then((res) => res.json())
      .then((data) => {
        console.log(`[Wealthoria Track] 🌐 Backend tracking response:`, data);
      })
      .catch((err) => {
        console.warn(`[Wealthoria Track] ⚠️ Backend tracking request failed:`, err);
      });
    };

    // 2. Direct Firestore log for real-time reactivity (preferred)
    const hasDirectDb = Boolean(window.db && window.firebase);

    if (hasDirectDb) {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date());

      // Update daily aggregated counts
      window.db
        .collection("member_usage_daily")
        .doc(today)
        .set(
          {
            date: today,
            [normType]: window.firebase.firestore.FieldValue.increment(1),
            total: window.firebase.firestore.FieldValue.increment(1),
            lastUpdated: window.firebase.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        )
        .then(() => {
          console.log(`[Wealthoria Track] ✅ Daily stats updated for ${today} (${normType})`);
        })
        .catch((err) => {
          console.warn("[Wealthoria Track] ⚠️ Direct Firestore daily stats failed, invoking backend API fallback:", err);
          sendToBackendApi();
        });

      // Add to activity stream
      window.db
        .collection("member_activity_logs")
        .add({
          contentType: normType,
          contentId: String(contentId || ""),
          contentTitle: contentTitle || "",
          memberId: member?.uid || "",
          memberName: member?.name || member?.phone || member?.email || "Member",
          date: today,
          timestamp: window.firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          console.log("[Wealthoria Track] ✅ Activity log recorded");
        })
        .catch((err) => {
          console.warn("[Wealthoria Track] ⚠️ Direct Firestore activity log failed:", err);
        });

      // Update per-member summary
      if (member?.uid) {
        window.db
          .collection("member_usage_summary")
          .doc(member.uid)
          .set(
            {
              memberId: member.uid,
              memberName: member?.name || member?.phone || member?.email || "Member",
              memberEmail: member?.email || "",
              memberPhone: member?.phone || "",
              [normType]: window.firebase.firestore.FieldValue.increment(1),
              total: window.firebase.firestore.FieldValue.increment(1),
              lastActive: window.firebase.firestore.FieldValue.serverTimestamp(),
              lastContent: contentTitle || ""
            },
            { merge: true }
          )
          .then(() => {
            console.log("[Wealthoria Track] ✅ Member summary updated for:", member.uid);
          })
          .catch((err) => {
            console.warn("[Wealthoria Track] ⚠️ Member summary write failed:", err);
          });
      }
    } else {
      // Direct Firestore not available, use backend API
      sendToBackendApi();
    }
  } catch (err) {
    console.error("[Wealthoria Track] ❌ Error in trackMemberContentOpen:", err);
  }
}
