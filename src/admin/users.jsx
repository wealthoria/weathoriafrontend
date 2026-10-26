import React from "react";

/* global React, window */

/* =========================================================================
   Wealthoria Admin — Members
   Clean members table + search + CSV/Excel export
   ========================================================================= */

const {
  useState,
  useEffect,
  useMemo
} = React;

const {
  Shell,
  MIcon
} = window;


/* =========================================================================
   HELPERS
   ========================================================================= */

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


function displayValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}


function formatMemberDate(value) {

  if (!value) {
    return "—";
  }

  try {

    if (
      typeof value.toDate ===
      "function"
    ) {

      return value
        .toDate()
        .toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }
        );

    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  } catch (error) {
    return "—";
  }
}

function safeTimestamp(value) {
  if (!value) return 0;
  if (typeof value === "number") {
    return value < 1e11 ? value * 1000 : value;
  }
  if (value instanceof Date) return value.getTime();
  if (value?.toDate && typeof value.toDate === "function") {
    try {
      return value.toDate().getTime();
    } catch {
      return 0;
    }
  }
  if (value?.seconds !== undefined) return Number(value.seconds) * 1000;
  if (value?._seconds !== undefined) return Number(value._seconds) * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMemberTime(member) {
  if (!member) return 0;
  return (
    safeTimestamp(member.joinedAt) ||
    safeTimestamp(member.createdAt) ||
    safeTimestamp(member.registeredAt) ||
    safeTimestamp(member.createdOn) ||
    safeTimestamp(member.subscriptionStartDate) ||
    safeTimestamp(member.updatedAt) ||
    0
  );
}

function getMemberPaymentTime(member) {
  if (!member) return 0;
  return (
    safeTimestamp(member.lastPaymentDate) ||
    safeTimestamp(member.paidAt) ||
    safeTimestamp(member.lastPaymentAt) ||
    safeTimestamp(member.lastChargedAt) ||
    safeTimestamp(member.subscriptionStartDate) ||
    safeTimestamp(member.startDate) ||
    safeTimestamp(member.joinedAt) ||
    safeTimestamp(member.createdAt) ||
    0
  );
}

function toDateInputValue(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDayInLocalOrUTC(value, targetDate = new Date()) {
  if (!value) return false;
  const time = safeTimestamp(value);
  if (!time) return false;
  const d = new Date(time);

  // 1. Same calendar day in local timezone
  const isLocalDay = (
    d.getFullYear() === targetDate.getFullYear() &&
    d.getMonth() === targetDate.getMonth() &&
    d.getDate() === targetDate.getDate()
  );
  if (isLocalDay) return true;

  // 2. Same calendar day in UTC
  const isUtcDay = (
    d.getUTCFullYear() === targetDate.getUTCFullYear() &&
    d.getUTCMonth() === targetDate.getUTCMonth() &&
    d.getUTCDate() === targetDate.getUTCDate()
  );
  if (isUtcDay) return true;

  // 3. Same calendar day in Indian Standard Time (IST = UTC + 5:30)
  const IST_OFFSET = 5.5 * 3600 * 1000;
  const dIST = new Date(d.getTime() + IST_OFFSET);
  const targetIST = new Date(targetDate.getTime() + IST_OFFSET);
  if (
    dIST.getUTCFullYear() === targetIST.getUTCFullYear() &&
    dIST.getUTCMonth() === targetIST.getUTCMonth() &&
    dIST.getUTCDate() === targetIST.getUTCDate()
  ) {
    return true;
  }

  return false;
}

function formatMemberDateTime(value) {
  const ts = safeTimestamp(value);
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return "—";
  }
}

function formatDebitSummary(value) {
  const ts = safeTimestamp(value);
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();
  const timeStr = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

  if (isSameDayInLocalOrUTC(d, now)) {
    return `Today, ${timeStr}`;
  }

  const yesterday = new Date(now.getTime() - 86400000);
  if (isSameDayInLocalOrUTC(d, yesterday)) {
    return `Yesterday, ${timeStr}`;
  }

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + `, ${timeStr}`;
}

function checkSubRenewalFailed(sub) {
  if (!sub) return false;
  const rzStatus = normalizeValue(sub.razorpayStatus);
  const syncSource = String(sub.lastSyncSource || "");
  return rzStatus === "pending" || syncSource.includes("subscription.pending");
}

function checkSubAutoRenewedToday(sub, member) {
  if (!sub) return false;

  // CRITICAL: If Razorpay status is pending (charge attempt failed), it is NOT renewed!
  if (checkSubRenewalFailed(sub)) {
    return false;
  }

  const paidCount = Number(sub.paidCount || sub.paid_count);
  const isRecurringRenewal = Number.isFinite(paidCount) && paidCount > 1;

  // Auto-renewal event date (strictly payment / charge timestamp from Razorpay)
  const chargeDate =
    sub.paidAt ||
    sub.lastPaymentAt ||
    sub.lastChargedAt ||
    null;

  if (!chargeDate) return false;

  const isChargedToday = isSameDayInLocalOrUTC(chargeDate);
  if (!isChargedToday) return false;

  // Must have a confirmed paid renewal (paidCount > 1, isAutoRenewal, or subscription.charged)
  return isRecurringRenewal || sub.isAutoRenewal === true || String(sub.lastSyncSource || "").includes("subscription.charged");
}

function checkSubCancelledToday(sub) {
  if (!sub) return false;
  const st = normalizeValue(sub.status || sub.razorpayStatus);
  if (st !== "cancelled" && st !== "halted") return false;

  // 1. Explicit cancellation timestamp (handles Unix seconds & Firestore timestamps)
  const cancelDate =
    sub.cancelledAt ||
    sub.ended_at ||
    sub.cancelled_at ||
    sub.endedAt ||
    null;

  if (cancelDate && isSameDayInLocalOrUTC(cancelDate)) {
    return true;
  }

  // 2. Cancellation webhook source arrived today
  const sourceHasCancelled = String(sub.lastSyncSource || "").includes("cancelled");
  if (sourceHasCancelled && isSameDayInLocalOrUTC(sub.lastSyncedAt)) {
    return true;
  }

  // 3. Subscription status is cancelled and sync arrived today with today's cycle start
  if (st === "cancelled" && isSameDayInLocalOrUTC(sub.lastSyncedAt) && isSameDayInLocalOrUTC(sub.subscriptionStartDate)) {
    return true;
  }

  return false;
}

function checkSubPausedToday(sub) {
  if (!sub) return false;
  const st = normalizeValue(sub.status || sub.razorpayStatus);
  if (st !== "paused") return false;

  // STRICTLY pause timestamp (NEVER updatedAt)
  const pauseDate =
    sub.pausedAt ||
    sub.pause_at ||
    null;

  if (!pauseDate) return false;

  return isSameDayInLocalOrUTC(pauseDate);
}

function checkSubCurrentlyPaused(sub) {
  if (!sub) return false;
  const st = normalizeValue(sub.status || sub.razorpayStatus);
  return st === "paused";
}

function isSameDateAsTomorrow(value) {
  if (!value) return false;
  const time = safeTimestamp(value);
  if (!time) return false;
  const d = new Date(time);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Same calendar day in local timezone
  const isLocalTomorrow = (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
  if (isLocalTomorrow) return true;

  // 2. Same calendar day in UTC
  const isUtcTomorrow = (
    d.getUTCFullYear() === tomorrow.getUTCFullYear() &&
    d.getUTCMonth() === tomorrow.getUTCMonth() &&
    d.getUTCDate() === tomorrow.getUTCDate()
  );
  if (isUtcTomorrow) return true;

  // 3. Same calendar day in Indian Standard Time (IST = UTC + 5:30)
  const IST_OFFSET = 5.5 * 3600 * 1000;
  const dIST = new Date(d.getTime() + IST_OFFSET);
  const nowInIST = new Date(Date.now() + IST_OFFSET);
  const tomorrowIST = new Date(nowInIST);
  tomorrowIST.setUTCDate(tomorrowIST.getUTCDate() + 1);
  if (
    dIST.getUTCFullYear() === tomorrowIST.getUTCFullYear() &&
    dIST.getUTCMonth() === tomorrowIST.getUTCMonth() &&
    dIST.getUTCDate() === tomorrowIST.getUTCDate()
  ) {
    return true;
  }

  return false;
}

function checkSubScheduledTomorrow(sub, member) {
  if (!sub) return false;
  const st = normalizeValue(sub.status || sub.razorpayStatus);
  // Must be active (not cancelled, not paused)
  if (st !== "active" && st !== "authenticated") return false;

  // Candidate renewal dates: check all potential future billing/charge dates
  const candidateDates = [
    sub.nextBillingDate,
    sub.nextBilling,
    sub.charge_at,
    sub.next_charge_at,
    sub.currentEnd,
    sub.current_end,
    member?.nextBillingDate,
    sub.current_start,
    sub.subscriptionStartDate
  ].filter(Boolean);

  const isTomorrow = candidateDates.some((dateVal) => isSameDateAsTomorrow(dateVal));
  if (!isTomorrow) return false;

  // Must not be a brand-new subscription created today
  const createdTime = safeTimestamp(sub.createdAt || member?.createdAt || member?.joinedAt);
  if (createdTime > 0 && isSameDayInLocalOrUTC(createdTime)) {
    return false;
  }

  return true;
}

function subscriptionIsPaid(sub) {
  if (!sub) return false;
  if (sub.paidAt || sub.lastPaymentAt || sub.lastChargedAt) return true;
  if (sub.paidCount && Number(sub.paidCount) > 0) return true;
  if (sub.razorpayPaymentId) return true;
  const st = normalizeValue(sub.status || sub.razorpayStatus);
  return ["active", "completed", "cancelled", "halted", "authenticated"].includes(st);
}

/* =========================================================================
   CSV HELPER
   ========================================================================= */

function csvCell(value) {

  const text =
    value === null ||
      value === undefined
      ? ""
      : String(value);

  return `"${text
    .replace(/"/g, '""')
    .replace(/\r?\n/g, " ")
    }"`;

}


function downloadBlob(
  blob,
  filename
) {

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    filename;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  setTimeout(() => {

    URL.revokeObjectURL(
      url
    );

  }, 1000);

}


/* =========================================================================
   EXPORT CSV
   ========================================================================= */
function exportMembersCSV(members) {
  const headers = [
    "Member Name",
    "Email",
    "Phone Number",
    "Member ID",
    "Role",
    "Member Status",
    "Subscription Status",
    "Subscription Plan",
    "Subscription Amount",
    "Last Debited Date",
    "Current Billing Cycle",
    "Next Billing Date",
    "Razorpay Subscription ID",
    "Joined Date"
  ];

  const rows = members.map((member) => [
    member.name,
    member.email,
    member.phone,
    member.uid,
    member.role,
    member.status,
    member.subscriptionStatusDisplay,
    member.subscriptionPlanDisplay,
    member.subscriptionAmount !== null &&
      member.subscriptionAmount !== undefined &&
      member.subscriptionAmount !== ""
      ? `${member.subscriptionCurrency === "INR" ? "₹" : ""}${member.subscriptionAmount}`
      : "",
    formatMemberDateTime(member.lastPaymentDate),
    formatMemberDate(member.subscriptionStartDate),
    formatMemberDate(member.nextBillingDate),
    member.razorpaySubscriptionId,
    formatMemberDate(member.joinedAt)
  ]);

  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(","))
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  downloadBlob(
    blob,
    "wealthoria-members.csv"
  );
}

/* =========================================================================
   EXPORT EXCEL
   ========================================================================= */

function exportMembersExcel(members) {
  const headers = [
    "Member Name",
    "Email",
    "Phone Number",
    "Member ID",
    "Role",
    "Member Status",
    "Subscription Status",
    "Subscription Plan",
    "Subscription Amount",
    "Last Debited Date",
    "Current Billing Cycle",
    "Next Billing Date",
    "Razorpay Subscription ID",
    "Joined Date"
  ];

  const rows = members.map((member) => [
    member.name,
    member.email,
    member.phone,
    member.uid,
    member.role,
    member.status,
    member.subscriptionStatusDisplay,
    member.subscriptionPlanDisplay,
    member.subscriptionAmount !== null &&
      member.subscriptionAmount !== undefined &&
      member.subscriptionAmount !== ""
      ? `${member.subscriptionCurrency === "INR" ? "₹" : ""}${member.subscriptionAmount}`
      : "",
    formatMemberDateTime(member.lastPaymentDate),
    formatMemberDate(member.subscriptionStartDate),
    formatMemberDate(member.nextBillingDate),
    member.razorpaySubscriptionId,
    formatMemberDate(member.joinedAt)
  ]);

  const escapeHtml = (value) => {
    return String(
      value === null || value === undefined ? "" : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const headerHtml = headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("");

  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; }
  th {
    background: #e8473f;
    color: #ffffff;
    font-weight: bold;
    border: 1px solid #d9d9d9;
    padding: 8px;
    text-align: left;
  }
  td {
    border: 1px solid #d9d9d9;
    padding: 8px;
    vertical-align: top;
  }
</style>
</head>
<body>
<table>
<thead><tr>${headerHtml}</tr></thead>
<tbody>${bodyHtml}</tbody>
</table>
</body>
</html>`;

  const blob = new Blob(
    ["\uFEFF", html],
    { type: "application/vnd.ms-excel;charset=utf-8;" }
  );

  downloadBlob(
    blob,
    "wealthoria-members.xls"
  );
}

/* =========================================================================
   EXPORT RECURRING PAYMENTS CSV
   ========================================================================= */
function exportRecurringCSV(members) {
  const headers = [
    "Customer Name",
    "Email",
    "Phone Number",
    "Member ID",
    "Razorpay Subscription ID",
    "Plan",
    "Cycles Paid",
    "Total Paid Amount",
    "Last Debited Date & Time",
    "Last Payment ID",
    "Next Auto-Debit Date",
    "Recurring Status",
    "Cancelled Date",
    "Cancellation Summary",
    "Dashboard Login Access"
  ];

  const rows = members.map((m) => {
    const isCancelled = ["cancelled", "halted", "expired"].includes(m.subscriptionStatusPrimary);
    const paidCount = Number(m.paidCount || 1);
    const isBlocked = isCancelled || m.status === "inactive" || m.isRenewalFailed;
    const accessText = isBlocked ? "Blocked / Inactive (Unpaid)" : "Active (Paid access allowed)";

    let cancelSummary = "";
    if (isCancelled) {
      cancelSummary = (m.isRenewalFailed || paidCount <= 1)
        ? "Cancelled before 2nd payment (Renewal unpaid)"
        : `Cancelled after ${paidCount} cycle(s)`;
    }

    return [
      m.name,
      m.email,
      m.phone,
      m.uid,
      m.razorpaySubscriptionId,
      m.subscriptionPlanDisplay,
      `${paidCount} cycle(s)`,
      `₹${paidCount * (m.subscriptionAmount || 99)}`,
      formatMemberDateTime(m.lastPaymentDate),
      m.razorpayPaymentId || "",
      isCancelled ? "None (Cancelled)" : formatMemberDate(m.nextBillingDate),
      m.isRenewalFailed ? "Debit Failed (Retrying)" : m.subscriptionStatusDisplay,
      m.cancelledAt ? formatMemberDateTime(m.cancelledAt) : "",
      cancelSummary,
      accessText
    ];
  });

  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(","))
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  downloadBlob(blob, "wealthoria-recurring-payments.csv");
}

/* =========================================================================
   EXPORT RECURRING PAYMENTS EXCEL
   ========================================================================= */
function exportRecurringExcel(members) {
  const headers = [
    "Customer Name",
    "Email",
    "Phone Number",
    "Member ID",
    "Razorpay Subscription ID",
    "Plan",
    "Cycles Paid",
    "Total Paid Amount",
    "Last Debited Date & Time",
    "Last Payment ID",
    "Next Auto-Debit Date",
    "Recurring Status",
    "Cancelled Date",
    "Cancellation Summary",
    "Dashboard Login Access"
  ];

  const escapeHtml = (value) => {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const rows = members.map((m) => {
    const isCancelled = ["cancelled", "halted", "expired"].includes(m.subscriptionStatusPrimary);
    const paidCount = Number(m.paidCount || 1);
    const isBlocked = isCancelled || m.status === "inactive" || m.isRenewalFailed;
    const accessText = isBlocked ? "Blocked / Inactive (Unpaid)" : "Active (Paid access allowed)";

    let cancelSummary = "";
    if (isCancelled) {
      cancelSummary = (m.isRenewalFailed || paidCount <= 1)
        ? "Cancelled before 2nd payment (Renewal unpaid)"
        : `Cancelled after ${paidCount} cycle(s)`;
    }

    return [
      m.name,
      m.email,
      m.phone,
      m.uid,
      m.razorpaySubscriptionId,
      m.subscriptionPlanDisplay,
      `${paidCount} cycle(s)`,
      `₹${paidCount * (m.subscriptionAmount || 99)}`,
      formatMemberDateTime(m.lastPaymentDate),
      m.razorpayPaymentId || "",
      isCancelled ? "None (Cancelled)" : formatMemberDate(m.nextBillingDate),
      m.isRenewalFailed ? "Debit Failed (Retrying)" : m.subscriptionStatusDisplay,
      m.cancelledAt ? formatMemberDateTime(m.cancelledAt) : "",
      cancelSummary,
      accessText
    ];
  });

  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyHtml = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; }
  th {
    background: #2563eb;
    color: #ffffff;
    font-weight: bold;
    border: 1px solid #d9d9d9;
    padding: 8px;
    text-align: left;
  }
  td {
    border: 1px solid #d9d9d9;
    padding: 8px;
    vertical-align: top;
  }
</style>
</head>
<body>
<table>
<thead><tr>${headerHtml}</tr></thead>
<tbody>${bodyHtml}</tbody>
</table>
</body>
</html>`;

  const blob = new Blob(["\uFEFF", html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  downloadBlob(blob, "wealthoria-recurring-payments.xls");
}

/* =========================================================================
   MEMBERS SCREEN
   ========================================================================= */

function UsersScreen() {

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [memberStatusFilter, setMemberStatusFilter] =
    useState("all");

  const [subscriptionStatusFilter, setSubscriptionStatusFilter] =
    useState("all");

  const [subscriptionPlanFilter, setSubscriptionPlanFilter] =
    useState("all");

  const [datePreset, setDatePreset] =
    useState("all");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  // "joined" (default) | "payment" (last debited) | "either"
  const [dateFilterType, setDateFilterType] =
    useState("joined");

  // Sign-ups who opened checkout but never paid are hidden by default.
  const [showUnpaid, setShowUnpaid] =
    useState(false);

  // Today's Subscription Activity Filter: "all" | "renewed_today" | "cancelled_today" | "paused"
  const [activityCardFilter, setActivityCardFilter] =
    useState("all");

  // View selector: "directory" (Active / All Members Directory) | "recurring" (Recurring Payments & Subscriptions)
  const [viewTab, setViewTab] =
    useState("directory");

  // Recurring Payments View filters
  const [recurringSearch, setRecurringSearch] =
    useState("");

  const [recurringDatePreset, setRecurringDatePreset] =
    useState("all");

  const [recurringStartDate, setRecurringStartDate] =
    useState("");

  const [recurringEndDate, setRecurringEndDate] =
    useState("");

  const [recurringStatusFilter, setRecurringStatusFilter] =
    useState("all");

  const [subscriptions, setSubscriptions] =
    useState([]);

  const [memberUsageMap, setMemberUsageMap] =
    useState({});

  const [actionLoading, setActionLoading] =
    useState("");

  const API_BASE_URL =
    "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

  const todayDateLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }, []);

  const tomorrowDateLabel = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }, []);

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = toDateInputValue(now);

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toDateInputValue(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setStartDate(toDateInputValue(past));
      setEndDate(todayStr);
    } else if (preset === "30days") {
      const past = new Date();
      past.setDate(past.getDate() - 29);
      setStartDate(toDateInputValue(past));
      setEndDate(todayStr);
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toDateInputValue(firstDay));
      setEndDate(todayStr);
    }
  };

  const handleRecurringDatePresetChange = (preset) => {
    setRecurringDatePreset(preset);
    const now = new Date();
    const todayStr = toDateInputValue(now);

    if (preset === "all") {
      setRecurringStartDate("");
      setRecurringEndDate("");
    } else if (preset === "today") {
      setRecurringStartDate(todayStr);
      setRecurringEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toDateInputValue(y);
      setRecurringStartDate(yStr);
      setRecurringEndDate(yStr);
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setRecurringStartDate(toDateInputValue(past));
      setRecurringEndDate(todayStr);
    } else if (preset === "30days") {
      const past = new Date();
      past.setDate(past.getDate() - 29);
      setRecurringStartDate(toDateInputValue(past));
      setRecurringEndDate(todayStr);
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setRecurringStartDate(toDateInputValue(firstDay));
      setRecurringEndDate(todayStr);
    }
  };



  /* =======================================================
     LOAD MEMBERS
  ======================================================= */

  useEffect(() => {

    if (!window.db) {

      setError(
        "Firebase Firestore is not available."
      );

      setLoading(false);

      return;
    }

    let unsubscribeMembers = null;
    let unsubscribeSubscriptions = null;
    let unsubscribeUsage = null;

    try {

      unsubscribeMembers =
        window.db
          .collection("members")
          .onSnapshot(

            (snapshot) => {

              const rows =
                snapshot.docs.map(
                  (doc) => {

                    const data =
                      doc.data() || {};

                    return {

                      id:
                        doc.id,

                      uid:
                        data.uid ||
                        data.userId ||
                        doc.id,

                      name:
                        data.name ||
                        data.fullName ||
                        data.displayName ||
                        data.username ||
                        "—",

                      email:
                        data.email ||
                        data.emailAddress ||
                        "—",

                      phone:
                        data.phone ||
                        data.phoneNumber ||
                        data.mobile ||
                        data.mobileNumber ||
                        "—",

                      role:
                        data.role ||
                        "member",

                      status:
                        data.status ||
                        (
                          data.active === false
                            ? "inactive"
                            : "active"
                        ),

                      joinedAt:
                        data.createdAt ||
                        data.joinedAt ||
                        data.registeredAt ||
                        data.createdOn ||
                        null,

                      city:
                        data.city ||
                        "",

                      state:
                        data.state ||
                        "",

                      country:
                        data.country ||
                        "",

                      occupation:
                        data.occupation ||
                        data.job ||
                        "",

                      company:
                        data.company ||
                        "",

                      gender:
                        data.gender ||
                        "",

                      dateOfBirth:
                        data.dateOfBirth ||
                        data.dob ||
                        "",

                      complimentary:
                        Boolean(
                          data.complimentary ||
                          data.isLifetime
                        ),

                      notificationEnabled:
                        Boolean(
                          data.fcmToken
                        )

                    };

                  }
                );

              rows.sort(
                (a, b) => {

                  return String(a.name)
                    .toLowerCase()
                    .localeCompare(
                      String(b.name).toLowerCase()
                    );

                }
              );

              setMembers(rows);
              setLoading(false);
              setError("");

            },

            (firebaseError) => {

              console.error(
                "Members Firestore error:",
                firebaseError
              );

              setError(
                firebaseError?.message ||
                "Unable to load members."
              );

              setLoading(false);

            }

          );

      /*
       * Load the complete subscriptions collection and join it
       * with members in the browser. This allows cancelled,
       * halted, paused, active and historical subscription records
       * to remain visible without changing the subscription data.
       */
      unsubscribeSubscriptions =
        window.db
          .collection("subscriptions")
          .onSnapshot(

            (snapshot) => {

              const subscriptionRows =
                snapshot.docs.map(
                  (doc) => ({
                    id: doc.id,
                    ...(doc.data() || {})
                  })
                );

              setSubscriptions(
                subscriptionRows
              );

            },

            (firebaseError) => {

              console.error(
                "Subscriptions Firestore error:",
                firebaseError
              );

              setSubscriptions([]);

              setError(
                firebaseError?.message ||
                "Unable to load subscriptions."
              );

            }

          );

      unsubscribeUsage =
        window.db
          .collection("member_usage_summary")
          .onSnapshot(
            (snapshot) => {
              const map = {};
              snapshot.forEach((doc) => {
                map[doc.id] = doc.data();
              });
              setMemberUsageMap(map);
            },
            (err) => {
              console.warn("member_usage_summary error:", err);
            }
          );

    } catch (error) {

      console.error(
        "Members initialization error:",
        error
      );

      setError(
        error?.message ||
        "Unable to load members."
      );

      setLoading(false);

    }

    return () => {

      if (
        typeof unsubscribeMembers ===
        "function"
      ) {
        unsubscribeMembers();
      }

      if (
        typeof unsubscribeSubscriptions ===
        "function"
      ) {
        unsubscribeSubscriptions();
      }

      if (
        typeof unsubscribeUsage ===
        "function"
      ) {
        unsubscribeUsage();
      }

    };

  }, []);



  /* =======================================================
     SEARCH
  ======================================================= */

  const joinedMembers = useMemo(() => {

    function toMillis(value) {
      if (!value) return 0;

      try {
        if (typeof value.toDate === "function") {
          return value.toDate().getTime();
        }

        const date = new Date(value);
        const time = date.getTime();

        return Number.isNaN(time)
          ? 0
          : time;
      } catch {
        return 0;
      }
    }

    function subscriptionMatches(member, subscription) {
      const memberUid = normalizeValue(member.uid);
      const memberEmail = normalizeValue(member.email);

      const subscriptionUid = normalizeValue(subscription.uid);

      const subscriptionUserId = normalizeValue(subscription.userId);

      const subscriptionMemberId = normalizeValue(subscription.memberId);

      const subscriptionEmail = normalizeValue(subscription.email);

      return Boolean(
        (memberUid &&
          (
            subscriptionUid === memberUid ||
            subscriptionUserId === memberUid ||
            subscriptionMemberId === memberUid
          )) ||
        (
          memberEmail &&
          memberEmail !== "—" &&
          subscriptionEmail === memberEmail
        )
      );
    }

    // True when Razorpay took at least one payment for this record.
    function subscriptionIsPaid(subscription) {
      const status = normalizeValue(subscription.status);
      const paidCount = Number(subscription.paidCount);

      if (subscription.razorpayPaymentId) return true;

      // Records synced from Razorpay carry paidCount.
      if (
        subscription.paidCount !== undefined &&
        subscription.paidCount !== null &&
        Number.isFinite(paidCount)
      ) {
        return paidCount > 0;
      }

      // Older records: these statuses were only set after payment.
      return [
        "active",
        "cancelled",
        "halted",
        "paused",
        "inactive"
      ].includes(status);
    }

    // Same order the member API uses (memberRoutes subscriptionRank).
    function subscriptionRank(subscription) {
      const status = normalizeValue(subscription.status);

      if (!subscriptionIsPaid(subscription)) return 0;
      if (status === "active") return 5;
      if (status === "cancelled" || status === "halted") return 4;
      if (status === "paused") return 3;
      if (status === "expired") return 2;
      return 1;
    }

    const matchedSubscriptionIds = new Set();

    const joined = members.map((member) => {

      const memberSubscriptions =
        subscriptions
          .filter((subscription) => {
            const matches = subscriptionMatches(
              member,
              subscription
            );
            if (matches && subscription.id) {
              matchedSubscriptionIds.add(subscription.id);
            }
            return matches;
          })
          .sort(
            (a, b) =>
              subscriptionRank(b) - subscriptionRank(a) ||
              toMillis(
                b.updatedAt ||
                b.createdAt ||
                b.subscriptionStartDate
              ) -
              toMillis(
                a.updatedAt ||
                a.createdAt ||
                a.subscriptionStartDate
              )
          );

      const hasPaid =
        memberSubscriptions.some(subscriptionIsPaid);

      const statusSource =
        hasPaid
          ? memberSubscriptions.filter(subscriptionIsPaid)
          : memberSubscriptions;

      const statuses = [
        ...new Set(
          statusSource
            .flatMap((subscription) => [
              subscription.status,
              subscription.razorpayStatus
            ])
            .map((value) =>
              String(value || "")
                .trim()
                .toLowerCase()
            )
            .filter(Boolean)
        )
      ];

      const plans = [
        ...new Set(
          memberSubscriptions
            .map(
              (subscription) =>
                String(
                  subscription.plan ||
                  subscription.planName ||
                  subscription.planId ||
                  ""
                ).trim()
            )
            .filter(Boolean)
        )
      ];

      const latestSubscription =
        memberSubscriptions[0] || null;

      return {
        ...member,

        subscriptions:
          memberSubscriptions,

        subscriptionStatuses:
          statuses,

        subscriptionPlans:
          plans,

        subscriptionStatusDisplay:
          latestSubscription
            ? checkSubRenewalFailed(latestSubscription)
              ? "Pending Retry"
              : String(
                latestSubscription.status ||
                latestSubscription.razorpayStatus ||
                "unknown"
              )
                .trim()
                .toLowerCase()
                .replace(
                  /^./,
                  (char) => char.toUpperCase()
                )
            : "No subscription",

        subscriptionPlanDisplay:
          latestSubscription
            ? String(
              latestSubscription.plan ||
              latestSubscription.planName ||
              latestSubscription.planId ||
              "—"
            ).trim()
            : "—",

        subscriptionStatusPrimary:
          checkSubRenewalFailed(latestSubscription)
            ? "pending"
            : (statuses[0] || "none"),

        subscriptionPlanPrimary:
          normalizeValue(
            latestSubscription?.plan ||
            latestSubscription?.planName ||
            latestSubscription?.planId ||
            ""
          ),

        subscriptionAmount:
          latestSubscription?.amount ??
          latestSubscription?.price ??
          null,

        subscriptionCurrency:
          latestSubscription?.currency ||
          "INR",

        subscriptionStartDate:
          latestSubscription?.subscriptionStartDate ||
          latestSubscription?.startDate ||
          latestSubscription?.createdAt ||
          null,

        nextBillingDate:
          latestSubscription?.nextBillingDate ||
          latestSubscription?.nextBilling ||
          null,

        razorpaySubscriptionId:
          latestSubscription?.razorpaySubscriptionId ||
          "",

        razorpayPaymentId:
          latestSubscription?.razorpayPaymentId ||
          "",

        lastPaymentDate:
          latestSubscription?.paidAt ||
          latestSubscription?.lastPaymentAt ||
          latestSubscription?.lastChargedAt ||
          null,

        subscriptionCount:
          memberSubscriptions.length,

        paidCount:
          latestSubscription?.paidCount ??
          latestSubscription?.paid_count ??
          null,

        cancelledAt:
          latestSubscription?.cancelledAt ||
          (latestSubscription?.status === "cancelled" ? latestSubscription?.updatedAt : null) ||
          null,

        hasPaid,

        isAutoRenewedToday:
          memberSubscriptions.some((sub) => checkSubAutoRenewedToday(sub, member)),

        isRenewalFailed:
          memberSubscriptions.some(checkSubRenewalFailed),

        isCancelledToday:
          memberSubscriptions.some(checkSubCancelledToday),

        isPausedToday:
          memberSubscriptions.some(checkSubPausedToday),

        isCurrentlyPaused:
          memberSubscriptions.some(checkSubCurrentlyPaused),

        isScheduledTomorrow:
          memberSubscriptions.some((sub) => checkSubScheduledTomorrow(sub, member)),

        // Never paid and not a manual / free / admin-managed account.
        isUnpaidSignup:
          !hasPaid &&
          !member.complimentary &&
          ![
            "active",
            "deactivated",
            "disabled",
            "blocked",
            "suspended",
            "deleted"
          ].includes(
            normalizeValue(member.status || "active")
          ),

      };

    });


    const unmatchedPaidSubs = subscriptions.filter(
      (sub) => subscriptionIsPaid(sub) && sub.id && !matchedSubscriptionIds.has(sub.id)
    );

    unmatchedPaidSubs.forEach((sub) => {
      joined.push({
        id: sub.memberId || sub.userId || sub.id,
        uid: sub.memberId || sub.userId || sub.id,
        name: sub.name || sub.customerName || sub.customer?.name || "Subscriber",
        email: sub.email || sub.customerEmail || sub.customer?.email || "—",
        phone: sub.phone || sub.phoneNumber || sub.customerPhone || sub.customer?.phone || "—",
        role: "member",
        status: normalizeValue(sub.status || "active"),
        joinedAt: sub.subscriptionStartDate || sub.startDate || sub.createdAt || sub.paidAt || null,
        city: sub.city || "",
        state: sub.state || "",
        country: sub.country || "India",
        occupation: "",
        company: "",
        gender: "",
        dateOfBirth: "",
        complimentary: false,
        notificationEnabled: false,
        subscriptions: [sub],
        subscriptionStatuses: [normalizeValue(sub.status || "active")],
        subscriptionPlans: [sub.plan || sub.planName || "Wealthoria Premium"],
        subscriptionStatusDisplay: checkSubRenewalFailed(sub) ? "Pending Retry" : String(sub.status || "active").replace(/^./, (c) => c.toUpperCase()),
        subscriptionPlanDisplay: String(sub.plan || sub.planName || "Wealthoria Premium"),
        subscriptionStatusPrimary: checkSubRenewalFailed(sub) ? "pending" : normalizeValue(sub.status || "active"),
        subscriptionPlanPrimary: normalizeValue(sub.plan || sub.planName || ""),
        subscriptionAmount: sub.amount ?? sub.price ?? 99,
        subscriptionCurrency: sub.currency || "INR",
        subscriptionStartDate: sub.subscriptionStartDate || sub.startDate || sub.createdAt || null,
        nextBillingDate: sub.nextBillingDate || null,
        razorpaySubscriptionId: sub.razorpaySubscriptionId || sub.id || "",
        razorpayPaymentId: sub.razorpayPaymentId || "",
        lastPaymentDate:
          sub.paidAt ||
          sub.lastPaymentAt ||
          sub.lastChargedAt ||
          null,
        subscriptionCount: 1,
        paidCount: sub.paidCount ?? sub.paid_count ?? 1,
        cancelledAt: sub.cancelledAt || (sub.status === "cancelled" ? sub.updatedAt : null) || null,
        hasPaid: true,
        isUnpaidSignup: false,
        isAutoRenewedToday: checkSubAutoRenewedToday(sub, sub),
        isRenewalFailed: checkSubRenewalFailed(sub),
        isCancelledToday: checkSubCancelledToday(sub),
        isPausedToday: checkSubPausedToday(sub),
        isCurrentlyPaused: checkSubCurrentlyPaused(sub),
        isScheduledTomorrow: checkSubScheduledTomorrow(sub, sub)
      });
    });

    return joined;

  }, [
    members,
    subscriptions
  ]);


  const filteredMembers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return joinedMembers
        .filter((member) => {
          // Date filtering
          if (startDate || endDate) {
            const startMs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
            const endMs = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Infinity;

            const joinedMs = getMemberTime(member);
            const paymentMs = getMemberPaymentTime(member);

            const joinedMatches = joinedMs > 0 && joinedMs >= startMs && joinedMs <= endMs;
            const paymentMatches = paymentMs > 0 && paymentMs >= startMs && paymentMs <= endMs;

            if (dateFilterType === "payment") {
              if (!paymentMatches) return false;
            } else if (dateFilterType === "either") {
              if (!joinedMatches && !paymentMatches) return false;
            } else {
              // default "joined"
              if (!joinedMatches) return false;
            }
          }

          const searchable =
            [

              member.uid,

              member.name,

              member.email,

              member.phone,

              member.role,

              member.status,

              member.city,

              member.state,

              member.country,

              member.occupation,

              member.company,

              member.gender,

              member.dateOfBirth,

              member.subscriptionStatusDisplay,

              member.subscriptionPlanDisplay,

              member.subscriptionAmount,

              member.razorpaySubscriptionId,

              member.razorpayPaymentId

            ]
              .map(
                (value) =>
                  String(value || "")
                    .toLowerCase()
              );

          const matchesSearch =
            !query ||
            searchable.some(
              (value) =>
                value.includes(query)
            );

          const normalizedMemberStatus = normalizeValue(member.status || "active");

          const matchesMemberStatus =
            memberStatusFilter === "all" ||
            normalizedMemberStatus ===
            memberStatusFilter;

          const matchesSubscriptionStatus =
            subscriptionStatusFilter === "all" ||
            (
              subscriptionStatusFilter === "none"
                ? member.subscriptionStatuses.length === 0
                : member.subscriptionStatuses.includes(
                  subscriptionStatusFilter
                )
            );

          const matchesSubscriptionPlan =
            subscriptionPlanFilter === "all" ||
            member.subscriptionPlans.some(
              (plan) =>
                normalizeValue(plan) ===
                subscriptionPlanFilter
            );

          const matchesPaid =
            showUnpaid ||
            !member.isUnpaidSignup;

          const matchesActivityCard =
            activityCardFilter === "all" ||
            (activityCardFilter === "renewed_today" && member.isAutoRenewedToday) ||
            (activityCardFilter === "scheduled_tomorrow" && member.isScheduledTomorrow) ||
            (activityCardFilter === "failed_renewal" && member.isRenewalFailed) ||
            (activityCardFilter === "cancelled_today" && member.isCancelledToday) ||
            (activityCardFilter === "paused" && (member.isCurrentlyPaused || member.isPausedToday));

          return (
            matchesPaid &&
            matchesSearch &&
            matchesMemberStatus &&
            matchesSubscriptionStatus &&
            matchesSubscriptionPlan &&
            matchesActivityCard
          );

        })
        .sort((a, b) => {
          if (dateFilterType === "payment") {
            return (getMemberPaymentTime(b) || getMemberTime(b)) - (getMemberPaymentTime(a) || getMemberTime(a));
          }
          return getMemberTime(b) - getMemberTime(a);
        });

    }, [
      joinedMembers,
      search,
      memberStatusFilter,
      subscriptionStatusFilter,
      subscriptionPlanFilter,
      showUnpaid,
      startDate,
      endDate,
      dateFilterType,
      activityCardFilter
    ]);

  const autoRenewedTodayCount = useMemo(() => {
    return joinedMembers.filter((m) => m.isAutoRenewedToday).length;
  }, [joinedMembers]);

  const scheduledTomorrowCount = useMemo(() => {
    return joinedMembers.filter((m) => m.isScheduledTomorrow).length;
  }, [joinedMembers]);

  const failedRenewalCount = useMemo(() => {
    return joinedMembers.filter((m) => m.isRenewalFailed).length;
  }, [joinedMembers]);

  const cancelledTodayCount = useMemo(() => {
    return joinedMembers.filter((m) => m.isCancelledToday).length;
  }, [joinedMembers]);

  const pausedTodayCount = useMemo(() => {
    return joinedMembers.filter((m) => m.isPausedToday).length;
  }, [joinedMembers]);

  const pausedCount = useMemo(() => {
    return joinedMembers.filter((m) => m.isCurrentlyPaused || m.isPausedToday).length;
  }, [joinedMembers]);


  // Members who never paid (hidden unless "Show unpaid sign-ups" is on).
  const unpaidSignupCount =
    useMemo(
      () =>
        joinedMembers.filter(
          (member) => member.isUnpaidSignup
        ).length,
      [joinedMembers]
    );

  const listedMemberCount =
    showUnpaid
      ? joinedMembers.length
      : joinedMembers.length - unpaidSignupCount;


  const subscriptionStatusOptions =
    useMemo(() => {

      const values = new Set();

      joinedMembers.forEach(
        (member) => {
          member.subscriptionStatuses.forEach(
            (status) => values.add(status)
          );
        }
      );

      return Array.from(values).sort();

    }, [joinedMembers]);


  const subscriptionPlanOptions =
    useMemo(() => {

      const values = new Map();

      joinedMembers.forEach(
        (member) => {
          member.subscriptionPlans.forEach(
            (plan) => {
              const key = normalizeValue(plan);

              if (!values.has(key)) {
                values.set(
                  key,
                  String(plan).trim()
                );
              }
            }
          );
        }
      );

      return Array.from(
        values.entries()
      )
        .sort((a, b) =>
          a[1].localeCompare(b[1])
        );

    }, [joinedMembers]);


  /* =======================================================
     MEMBER ACCESS VALIDATION (Strict Dashboard Login Access)
     A member can ONLY access the dashboard if:
     1. Status is not deactivated/blocked/inactive.
     2. Subscription is active OR if cancelled/failed, paid period
        has not expired (i.e., within 30 days of last payment).
  ======================================================= */
  const isMemberAccessActive = (member) => {
    if (!member) return false;
    const normStatus = normalizeValue(member.status || "");
    if (["deactivated", "disabled", "blocked", "suspended", "inactive"].includes(normStatus)) {
      return false;
    }
    const subStatus = normalizeValue(member.subscriptionStatusPrimary || "");
    if (subStatus === "cancelled" || normStatus === "cancelled" || member.isRenewalFailed) {
      const paymentTime = getMemberPaymentTime(member);
      if (!paymentTime) return false;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      return (paymentTime + thirtyDaysMs) > Date.now();
    }
    return Boolean(member.hasPaid);
  };

  /* =======================================================
     RECURRING SUBSCRIBERS LIST & FILTERING
     Every subscription mandate is tracked individually so
     that multi-subscription customers and total payment counts
     match the revenue dashboard exactly (1:1).
  ======================================================= */
  const recurringMembersList = useMemo(() => {
    const list = [];
    const memberMap = new Map();
    (members || []).forEach((m) => {
      if (m.id) memberMap.set(String(m.id).trim(), m);
      if (m.uid) memberMap.set(String(m.uid).trim(), m);
      if (m.email) memberMap.set(String(m.email).toLowerCase().trim(), m);
    });

    (subscriptions || []).forEach((sub) => {
      if (!subscriptionIsPaid(sub) && !sub.paidCount && !sub.razorpayPaymentId) {
        return;
      }

      const member =
        memberMap.get(String(sub.memberId || "").trim()) ||
        memberMap.get(String(sub.userId || "").trim()) ||
        memberMap.get(String(sub.email || sub.customerEmail || "").toLowerCase().trim()) ||
        null;

      const subStatus = normalizeValue(sub.status || "active");
      const lastPaymentDate =
        sub.paidAt ||
        sub.lastPaymentAt ||
        sub.lastChargedAt ||
        null;

      list.push({
        id: sub.id,
        uid: member?.uid || sub.memberId || sub.userId || sub.id,
        name: member?.name || sub.name || sub.customerName || sub.customer?.name || "Subscriber",
        email: member?.email || sub.email || sub.customerEmail || sub.customer?.email || "—",
        phone: member?.phone || sub.phone || sub.phoneNumber || sub.customerPhone || sub.customer?.phone || "—",
        role: member?.role || "member",
        status: member ? normalizeValue(member.status || "active") : subStatus,
        joinedAt: sub.subscriptionStartDate || sub.startDate || sub.createdAt || sub.paidAt || null,
        complimentary: member?.complimentary || false,
        subscriptions: [sub],
        subscriptionStatuses: [subStatus],
        subscriptionPlans: [sub.plan || sub.planName || "Wealthoria Premium"],
        subscriptionStatusDisplay: checkSubRenewalFailed(sub)
          ? "Pending Retry"
          : String(sub.status || "active").replace(/^./, (c) => c.toUpperCase()),
        subscriptionPlanDisplay: String(sub.plan || sub.planName || "Wealthoria Premium"),
        subscriptionStatusPrimary: checkSubRenewalFailed(sub) ? "pending" : subStatus,
        subscriptionPlanPrimary: normalizeValue(sub.plan || sub.planName || ""),
        subscriptionAmount: sub.amount ?? sub.price ?? 99,
        subscriptionCurrency: sub.currency || "INR",
        subscriptionStartDate: sub.subscriptionStartDate || sub.startDate || sub.createdAt || null,
        nextBillingDate: sub.nextBillingDate || null,
        razorpaySubscriptionId: sub.razorpaySubscriptionId || sub.id || "",
        razorpayPaymentId: sub.razorpayPaymentId || "",
        lastPaymentDate,
        paidCount: sub.paidCount ?? sub.paid_count ?? 1,
        cancelledAt: sub.cancelledAt || (sub.status === "cancelled" ? sub.updatedAt : null) || null,
        hasPaid: true,
        isAutoRenewedToday: checkSubAutoRenewedToday(sub, member || sub),
        isRenewalFailed: checkSubRenewalFailed(sub),
        isCancelledToday: checkSubCancelledToday(sub),
        isPausedToday: checkSubPausedToday(sub),
        isCurrentlyPaused: checkSubCurrentlyPaused(sub),
        isScheduledTomorrow: checkSubScheduledTomorrow(sub, member || sub)
      });
    });

    return list;
  }, [members, subscriptions]);

  const filteredRecurringMembers = useMemo(() => {
    const query = recurringSearch.trim().toLowerCase();

    return recurringMembersList.filter((m) => {
      // Date filtering on payment / debit date
      if (recurringStartDate || recurringEndDate) {
        if (recurringStatusFilter !== "blocked" && recurringStatusFilter !== "failed") {
          const startMs = recurringStartDate ? new Date(`${recurringStartDate}T00:00:00`).getTime() : 0;
          const endMs = recurringEndDate ? new Date(`${recurringEndDate}T23:59:59.999`).getTime() : Infinity;
          const payTime = getMemberPaymentTime(m);
          if (!payTime || payTime < startMs || payTime > endMs) {
            return false;
          }
        }
      }

      // Search filtering
      if (query) {
        const name = String(m.name || "").toLowerCase();
        const email = String(m.email || "").toLowerCase();
        const phone = String(m.phone || "").toLowerCase();
        const subId = String(m.razorpaySubscriptionId || "").toLowerCase();
        const payId = String(m.razorpayPaymentId || "").toLowerCase();
        if (
          !name.includes(query) &&
          !email.includes(query) &&
          !phone.includes(query) &&
          !subId.includes(query) &&
          !payId.includes(query)
        ) {
          return false;
        }
      }

      // Status filtering
      if (recurringStatusFilter === "debited_today") {
        if (!m.isAutoRenewedToday) return false;
      } else if (recurringStatusFilter === "active") {
        const subStatus = normalizeValue(m.subscriptionStatusPrimary || "");
        if (subStatus !== "active" && subStatus !== "authenticated") return false;
      } else if (recurringStatusFilter === "cancelled") {
        const subStatus = normalizeValue(m.subscriptionStatusPrimary || "");
        if (subStatus !== "cancelled") return false;
      } else if (recurringStatusFilter === "failed") {
        if (!m.isRenewalFailed) return false;
      } else if (recurringStatusFilter === "blocked") {
        if (isMemberAccessActive(m)) return false;
      }

      return true;
    }).sort((a, b) => {
      return (getMemberPaymentTime(b) || 0) - (getMemberPaymentTime(a) || 0);
    });
  }, [
    recurringMembersList,
    recurringSearch,
    recurringStartDate,
    recurringEndDate,
    recurringStatusFilter
  ]);

  const recurringDebitedCount = useMemo(() => {
    return recurringMembersList.filter((m) => m.isAutoRenewedToday).length;
  }, [recurringMembersList]);

  const recurringActiveCount = useMemo(() => {
    return recurringMembersList.filter((m) => {
      const s = normalizeValue(m.subscriptionStatusPrimary || "");
      return s === "active" || s === "authenticated";
    }).length;
  }, [recurringMembersList]);

  const recurringFailedCount = useMemo(() => {
    return recurringMembersList.filter((m) => m.isRenewalFailed).length;
  }, [recurringMembersList]);

  const recurringCancelledCount = useMemo(() => {
    return recurringMembersList.filter((m) => {
      const s = normalizeValue(m.subscriptionStatusPrimary || "");
      return s === "cancelled";
    }).length;
  }, [recurringMembersList]);

  const recurringBlockedCount = useMemo(() => {
    return recurringMembersList.filter((m) => !isMemberAccessActive(m)).length;
  }, [recurringMembersList]);

  /* =======================================================
     EXPORT CURRENT FILTERED RESULTS
  ======================================================= */

  const handleCSVExport =
    () => {

      if (viewTab === "recurring") {
        exportRecurringCSV(filteredRecurringMembers);
      } else {
        exportMembersCSV(
          filteredMembers
        );
      }

    };


  const handleExcelExport =
    () => {

      if (viewTab === "recurring") {
        exportRecurringExcel(filteredRecurringMembers);
      } else {
        exportMembersExcel(
          filteredMembers
        );
      }

    };


  /* =======================================================
     MEMBER ACTIONS
  ======================================================= */

  async function getAdminToken() {
    const currentUser = window.auth?.currentUser;

    if (!currentUser) {
      throw new Error(
        "Admin session not found. Please login again."
      );
    }

    return currentUser.getIdToken(true);
  }


  async function handleDeactivate(member) {
    const uid = String(member.uid || "").trim();

    if (!uid) {
      setError("Member UID is missing.");
      return;
    }

    const currentStatus =
      String(member.status || "active")
        .trim()
        .toLowerCase();

    if (currentStatus === "deactivated") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${member.name || member.email || "this member"
      }?\n\nThe member will not be able to log in.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`deactivate:${uid}`);
      setError("");

      const token =
        await getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/members/deactivate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uid,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Unable to deactivate member."
        );
      }

      /*
       * Firestore onSnapshot will update the
       * table automatically.
       */
      setError("");

    } catch (error) {
      console.error(
        "Deactivate member error:",
        error
      );

      setError(
        error?.message ||
        "Unable to deactivate member."
      );
    } finally {
      setActionLoading("");
    }
  }


  async function handleActivate(member) {
    const uid = String(member.uid || "").trim();

    if (!uid) {
      setError("Member UID is missing.");
      return;
    }

    const currentStatus =
      String(member.status || "active")
        .trim()
        .toLowerCase();

    if (currentStatus !== "deactivated") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to activate ${member.name || member.email || "this member"
      }?\n\nThe member will be able to log in again.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`activate:${uid}`);
      setError("");

      const token = await getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/members/activate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uid }),
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to activate member."
        );
      }

      setError("");
    } catch (error) {
      console.error("Activate member error:", error);

      setError(
        error?.message || "Unable to activate member."
      );
    } finally {
      setActionLoading("");
    }
  }


  async function handleDelete(member) {
    const uid = String(member.uid || "").trim();

    if (!uid) {
      setError("Member UID is missing.");
      return;
    }

    const displayName =
      member.name ||
      member.email ||
      "this member";

    const confirmed = window.confirm(
      `PERMANENT DELETE\n\n` +
      `Are you sure you want to permanently delete ${displayName}?\n\n` +
      `This will delete the member account, subscriptions, ` +
      `course purchases, notifications, student records and ` +
      `Firebase Authentication account.\n\n` +
      `THIS ACTION CANNOT BE UNDONE.`
    );

    if (!confirmed) {
      return;
    }

    /*
     * Second confirmation for the destructive action.
     */
    const finalConfirmation =
      window.confirm(
        `Final confirmation:\n\n` +
        `Delete ${displayName} permanently?`
      );

    if (!finalConfirmation) {
      return;
    }

    try {
      setActionLoading(`delete:${uid}`);
      setError("");

      const token =
        await getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/members/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uid,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Unable to delete member."
        );
      }

      /*
       * The Firestore onSnapshot listener will
       * remove the deleted member from the table.
       */
      setError("");

    } catch (error) {
      console.error(
        "Delete member error:",
        error
      );

      setError(
        error?.message ||
        "Unable to delete member."
      );
    } finally {
      setActionLoading("");
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <Shell
      title="Members"
      subtitle={
        `${listedMemberCount} registered members`
      }
    >

      <div
        className="members-admin-page"
        style={{
          width: "100%"
        }}
      >


        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-end",

            justifyContent:
              "space-between",

            gap:
              20,

            marginBottom:
              22,

            flexWrap:
              "wrap"
          }}
        >


          <div>

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  10,

                marginBottom:
                  6
              }}
            >

              <h2
                style={{
                  margin: 0,

                  fontSize:
                    26,

                  lineHeight:
                    1.2,

                  fontWeight:
                    800,

                  color:
                    "var(--ink, #111827)"
                }}
              >
                Members
              </h2>


              <span
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  minWidth:
                    32,

                  height:
                    24,

                  padding:
                    "0 8px",

                  borderRadius:
                    999,

                  background:
                    "#fde9e5",

                  color:
                    "#c94337",

                  fontSize:
                    12,

                  fontWeight:
                    800
                }}
              >
                {listedMemberCount}
              </span>

            </div>


            <p
              style={{
                margin:
                  0,

                fontSize:
                  14,

                color:
                  "var(--muted, #6b7280)"
              }}
            >
              View, search and export your
              registered members.
            </p>

          </div>


          {/* =================================================
              EXPORT BUTTONS
          ================================================= */}

          <div
            style={{
              display:
                "flex",

              gap:
                10,

              flexWrap:
                "wrap"
            }}
          >

            <button
              type="button"
              onClick={
                handleCSVExport
              }
              disabled={
                loading ||
                filteredMembers.length === 0
              }
              style={{
                height:
                  42,

                padding:
                  "0 15px",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                gap:
                  8,

                border:
                  "1px solid #d9dde3",

                borderRadius:
                  10,

                background:
                  "#ffffff",

                color:
                  "#25313f",

                fontSize:
                  13,

                fontWeight:
                  700,

                cursor:
                  loading ||
                    filteredMembers.length === 0
                    ? "not-allowed"
                    : "pointer",

                opacity:
                  loading ||
                    filteredMembers.length === 0
                    ? 0.5
                    : 1
              }}
            >

              <MIcon
                name="download"
                size={16}
              />

              Export CSV

            </button>


            <button
              type="button"
              onClick={
                handleExcelExport
              }
              disabled={
                loading ||
                filteredMembers.length === 0
              }
              style={{
                height:
                  42,

                padding:
                  "0 15px",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                gap:
                  8,

                border:
                  "1px solid #d7e6db",

                borderRadius:
                  10,

                background:
                  "#edf8ef",

                color:
                  "#217a36",

                fontSize:
                  13,

                fontWeight:
                  700,

                cursor:
                  loading ||
                    filteredMembers.length === 0
                    ? "not-allowed"
                    : "pointer",

                opacity:
                  loading ||
                    filteredMembers.length === 0
                    ? 0.5
                    : 1
              }}
            >

              <MIcon
                name="download"
                size={16}
              />

              Export Excel

            </button>

          </div>

        </div>

        {/* =================================================
            VIEW TAB SELECTOR (Directory vs Recurring)
        ================================================= */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: 0,
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setViewTab("directory")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                background: "transparent",
                color: viewTab === "directory" ? "#b42318" : "#64748b",
                borderBottom: viewTab === "directory" ? "3px solid #b42318" : "3px solid transparent",
                cursor: "pointer",
                marginBottom: -2,
                transition: "all 0.15s ease"
              }}
            >
              <MIcon name="group" size={18} />
              <span>Active & All Members Directory</span>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: viewTab === "directory" ? "#fee2e2" : "#f1f5f9",
                  color: viewTab === "directory" ? "#b42318" : "#64748b",
                  fontSize: 12,
                  fontWeight: 800
                }}
              >
                {filteredMembers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab("recurring")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                background: "transparent",
                color: viewTab === "recurring" ? "#0284c7" : "#64748b",
                borderBottom: viewTab === "recurring" ? "3px solid #0284c7" : "3px solid transparent",
                cursor: "pointer",
                marginBottom: -2,
                transition: "all 0.15s ease"
              }}
            >
              <MIcon name="autorenew" size={18} />
              <span>Recurring Subscriptions & Payments</span>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: viewTab === "recurring" ? "#e0f2fe" : "#f1f5f9",
                  color: viewTab === "recurring" ? "#0284c7" : "#64748b",
                  fontSize: 12,
                  fontWeight: 800
                }}
              >
                {filteredRecurringMembers.length}
              </span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 6 }}>
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
                background: "#f9fafb",
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb"
              }}
            >
              {viewTab === "directory"
                ? `Directory view showing ${filteredMembers.length} of ${listedMemberCount} registered accounts`
                : `Tracking ${recurringMembersList.length} total recurring mandates & auto-debit cycles`}
            </span>
          </div>
        </div>

        {viewTab === "directory" && (
          <>
            {/* =================================================
            TODAY'S SUBSCRIPTION ACTIVITY METRIC CARDS
        ================================================= */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 12,
                marginBottom: 16
              }}
            >
              {/* CARD 1: AUTO-RENEWED TODAY */}
              <div
                onClick={() =>
                  setActivityCardFilter((prev) =>
                    prev === "renewed_today" ? "all" : "renewed_today"
                  )
                }
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: activityCardFilter === "renewed_today" ? "#f0fdf4" : "#ffffff",
                  border: activityCardFilter === "renewed_today" ? "2px solid #22c55e" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: activityCardFilter === "renewed_today" ? "0 4px 14px rgba(34, 197, 94, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>🔄</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      Auto-Renewed Today
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: activityCardFilter === "renewed_today" ? "#15803d" : "#6b7280",
                      background: activityCardFilter === "renewed_today" ? "#bbf7d0" : "#f3f4f6",
                      padding: "2px 7px",
                      borderRadius: 999
                    }}
                  >
                    {activityCardFilter === "renewed_today" ? "Filtering ✓" : "Click to view"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
                    {autoRenewedTodayCount}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                    {autoRenewedTodayCount === 1 ? "member renewed" : "members renewed"}
                  </span>
                </div>
              </div>

              {/* CARD 2: SCHEDULED TOMORROW (25 OCT) */}
              <div
                onClick={() =>
                  setActivityCardFilter((prev) =>
                    prev === "scheduled_tomorrow" ? "all" : "scheduled_tomorrow"
                  )
                }
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: activityCardFilter === "scheduled_tomorrow" ? "#eff6ff" : "#ffffff",
                  border: activityCardFilter === "scheduled_tomorrow" ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: activityCardFilter === "scheduled_tomorrow" ? "0 4px 14px rgba(37, 99, 235, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>⏰</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      Scheduled Tomorrow ({tomorrowDateLabel})
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: activityCardFilter === "scheduled_tomorrow" ? "#1d4ed8" : "#6b7280",
                      background: activityCardFilter === "scheduled_tomorrow" ? "#bfdbfe" : "#f3f4f6",
                      padding: "2px 7px",
                      borderRadius: 999
                    }}
                  >
                    {activityCardFilter === "scheduled_tomorrow" ? "Filtering ✓" : "Click to view"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
                    {scheduledTomorrowCount}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                    {scheduledTomorrowCount === 1 ? "auto-debit due" : "auto-debits due"}
                  </span>
                </div>
              </div>

              {/* CARD: AUTO-DEBIT FAILED / RETRYING */}
              <div
                onClick={() =>
                  setActivityCardFilter((prev) =>
                    prev === "failed_renewal" ? "all" : "failed_renewal"
                  )
                }
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: activityCardFilter === "failed_renewal" ? "#fef2f2" : "#ffffff",
                  border: activityCardFilter === "failed_renewal" ? "2px solid #ef4444" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: activityCardFilter === "failed_renewal" ? "0 4px 14px rgba(239, 68, 68, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      Auto-Debit Failed (Retry)
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: activityCardFilter === "failed_renewal" ? "#b91c1c" : "#6b7280",
                      background: activityCardFilter === "failed_renewal" ? "#fecaca" : "#f3f4f6",
                      padding: "2px 7px",
                      borderRadius: 999
                    }}
                  >
                    {activityCardFilter === "failed_renewal" ? "Filtering ✓" : "Click to view"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#dc2626", lineHeight: 1.1 }}>
                    {failedRenewalCount}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                    {failedRenewalCount === 1 ? "member payment retrying" : "members payment retrying"}
                  </span>
                </div>
              </div>

              {/* CARD 3: CANCELLED TODAY */}
              <div
                onClick={() =>
                  setActivityCardFilter((prev) =>
                    prev === "cancelled_today" ? "all" : "cancelled_today"
                  )
                }
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: activityCardFilter === "cancelled_today" ? "#fef2f2" : "#ffffff",
                  border: activityCardFilter === "cancelled_today" ? "2px solid #ef4444" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: activityCardFilter === "cancelled_today" ? "0 4px 14px rgba(239, 68, 68, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>🚫</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      Cancelled Today
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: activityCardFilter === "cancelled_today" ? "#b91c1c" : "#6b7280",
                      background: activityCardFilter === "cancelled_today" ? "#fecaca" : "#f3f4f6",
                      padding: "2px 7px",
                      borderRadius: 999
                    }}
                  >
                    {activityCardFilter === "cancelled_today" ? "Filtering ✓" : "Click to view"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
                    {cancelledTodayCount}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                    {cancelledTodayCount === 1 ? "member cancelled" : "members cancelled"}
                  </span>
                </div>
              </div>

              {/* CARD 3: PAUSED */}
              <div
                onClick={() =>
                  setActivityCardFilter((prev) =>
                    prev === "paused" ? "all" : "paused"
                  )
                }
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: activityCardFilter === "paused" ? "#fffbeb" : "#ffffff",
                  border: activityCardFilter === "paused" ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: activityCardFilter === "paused" ? "0 4px 14px rgba(245, 158, 11, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>⏸️</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      Paused Subscriptions
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: activityCardFilter === "paused" ? "#b45309" : "#6b7280",
                      background: activityCardFilter === "paused" ? "#fde68a" : "#f3f4f6",
                      padding: "2px 7px",
                      borderRadius: 999
                    }}
                  >
                    {activityCardFilter === "paused" ? "Filtering ✓" : "Click to view"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
                    {pausedCount}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                    {pausedTodayCount > 0 ? `(${pausedTodayCount} today)` : "members paused"}
                  </span>
                </div>
              </div>
            </div>

            {/* ACTIVE ACTIVITY FILTER BANNER */}
            {activityCardFilter !== "all" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  marginBottom: 14,
                  borderRadius: 9,
                  background:
                    activityCardFilter === "renewed_today"
                      ? "#f0fdf4"
                      : activityCardFilter === "scheduled_tomorrow"
                        ? "#eff6ff"
                        : activityCardFilter === "failed_renewal"
                          ? "#fef2f2"
                          : activityCardFilter === "cancelled_today"
                            ? "#fef2f2"
                            : "#fffbeb",
                  border: `1px solid ${activityCardFilter === "renewed_today"
                      ? "#86efac"
                      : activityCardFilter === "scheduled_tomorrow"
                        ? "#93c5fd"
                        : activityCardFilter === "failed_renewal"
                          ? "#fca5a5"
                          : activityCardFilter === "cancelled_today"
                            ? "#fca5a5"
                            : "#fcd34d"
                    }`,
                  fontSize: 13,
                  color: "#1f2937"
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  Showing:{" "}
                  <strong style={{ fontWeight: 800 }}>
                    {activityCardFilter === "renewed_today"
                      ? `🔄 Auto-Renewed Today (${todayDateLabel})`
                      : activityCardFilter === "scheduled_tomorrow"
                        ? `⏰ Auto-Debits Scheduled for Tomorrow (${tomorrowDateLabel})`
                        : activityCardFilter === "failed_renewal"
                          ? "⚠️ Auto-Debit Renewal Payments Failed (Pending Razorpay Retry)"
                          : activityCardFilter === "cancelled_today"
                            ? "🚫 Cancelled Today"
                            : "⏸️ Paused Subscriptions"}
                  </strong>{" "}
                  ({filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"})
                </span>
                <button
                  type="button"
                  onClick={() => setActivityCardFilter("all")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#c2410c",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 12,
                    textDecoration: "underline"
                  }}
                >
                  Reset to All Members ✕
                </button>
              </div>
            )}

            {/* =================================================
            TOOLBAR + FILTERS
        ================================================= */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                marginBottom: 16,
                padding: 14,
                background: "var(--surface, #ffffff)",
                border: "1px solid var(--line, #e5e7eb)",
                borderRadius: 12,
                flexWrap: "wrap"
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flex: "1 1 520px",
                  flexWrap: "wrap"
                }}
              >

                {/* SEARCH */}

                <div
                  style={{
                    position: "relative",
                    flex: "1 1 360px",
                    minWidth: 260
                  }}
                >

                  <MIcon
                    name="search"
                    size={17}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#8a939e",
                      pointerEvents: "none"
                    }}
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder={
                      "Search name, email, phone number, member ID, payment ID or subscription..."
                    }
                    aria-label="Search members"
                    style={{
                      width: "100%",
                      height: 44,
                      padding: "0 42px",
                      border: "1px solid #dfe3e8",
                      borderRadius: 9,
                      outline: "none",
                      background: "#ffffff",
                      color: "#202833",
                      fontSize: 14
                    }}
                  />

                </div>

                {/* MEMBER STATUS */}

                <select
                  value={memberStatusFilter}
                  onChange={(event) =>
                    setMemberStatusFilter(
                      event.target.value
                    )
                  }
                  aria-label="Filter member status"
                  style={{
                    height: 44,
                    minWidth: 150,
                    padding: "0 12px",
                    border: "1px solid #dfe3e8",
                    borderRadius: 9,
                    background: "#ffffff",
                    color: "#202833",
                    fontSize: 13,
                    outline: "none"
                  }}
                >
                  <option value="all">
                    All member status
                  </option>
                  <option value="active">
                    Active
                  </option>
                  <option value="deactivated">
                    Deactivated
                  </option>
                  <option value="inactive">
                    Inactive
                  </option>
                  <option value="disabled">
                    Disabled
                  </option>
                  <option value="blocked">
                    Blocked
                  </option>
                  <option value="suspended">
                    Suspended
                  </option>
                </select>

                {/* SUBSCRIPTION STATUS */}

                <select
                  value={subscriptionStatusFilter}
                  onChange={(event) =>
                    setSubscriptionStatusFilter(
                      event.target.value
                    )
                  }
                  aria-label="Filter subscription status"
                  style={{
                    height: 44,
                    minWidth: 170,
                    padding: "0 12px",
                    border: "1px solid #dfe3e8",
                    borderRadius: 9,
                    background: "#ffffff",
                    color: "#202833",
                    fontSize: 13,
                    outline: "none"
                  }}
                >
                  <option value="all">
                    All subscription status
                  </option>
                  <option value="none">
                    No subscription
                  </option>
                  {subscriptionStatusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status.charAt(0).toUpperCase() +
                          status.slice(1)}
                      </option>
                    )
                  )}
                </select>

                {/* PLAN */}

                <select
                  value={subscriptionPlanFilter}
                  onChange={(event) =>
                    setSubscriptionPlanFilter(
                      event.target.value
                    )
                  }
                  aria-label="Filter subscription plan"
                  style={{
                    height: 44,
                    minWidth: 160,
                    padding: "0 12px",
                    border: "1px solid #dfe3e8",
                    borderRadius: 9,
                    background: "#ffffff",
                    color: "#202833",
                    fontSize: 13,
                    outline: "none"
                  }}
                >
                  <option value="all">
                    All plans
                  </option>
                  {subscriptionPlanOptions.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>

                {/* DATE PRESET FILTER */}
                <select
                  value={datePreset}
                  onChange={(event) =>
                    handleDatePresetChange(event.target.value)
                  }
                  aria-label="Filter by date"
                  style={{
                    height: 44,
                    minWidth: 140,
                    padding: "0 12px",
                    border: "1px solid #dfe3e8",
                    borderRadius: 9,
                    background: "#ffffff",
                    color: "#202833",
                    fontSize: 13,
                    outline: "none"
                  }}
                >
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="this_month">This month</option>
                  <option value="custom">Custom date range...</option>
                </select>

                {/* DATE FIELD TARGET (Joined vs Payment vs Either) */}
                {(datePreset !== "all" || startDate || endDate) && (
                  <select
                    value={dateFilterType}
                    onChange={(e) => setDateFilterType(e.target.value)}
                    aria-label="Date field to filter"
                    style={{
                      height: 44,
                      minWidth: 155,
                      padding: "0 12px",
                      border: "1px solid #86efac",
                      borderRadius: 9,
                      background: "#f0fdf4",
                      color: "#166534",
                      fontSize: 12.5,
                      fontWeight: 650,
                      outline: "none"
                    }}
                  >
                    <option value="joined">📅 Filter: Joined Date</option>
                    <option value="payment">💳 Filter: Payment / Debit</option>
                    <option value="either">🔄 Filter: Either (Joined/Paid)</option>
                  </select>
                )}

                {/* CUSTOM DATE RANGE PICKERS */}
                {(datePreset === "custom" || startDate || endDate) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f8fafc",
                      padding: "4px 10px",
                      borderRadius: 9,
                      border: "1px solid #dfe3e8"
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDatePreset("custom");
                      }}
                      style={{
                        height: 34,
                        border: "1px solid #dfe3e8",
                        borderRadius: 7,
                        padding: "0 8px",
                        fontSize: 12,
                        background: "#fff",
                        color: "#202833"
                      }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>To</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDatePreset("custom");
                      }}
                      style={{
                        height: 34,
                        border: "1px solid #dfe3e8",
                        borderRadius: 7,
                        padding: "0 8px",
                        fontSize: 12,
                        background: "#fff",
                        color: "#202833"
                      }}
                    />
                  </div>
                )}

              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}
              >

                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted, #6b7280)",
                    whiteSpace: "nowrap"
                  }}
                >
                  {search ||
                    memberStatusFilter !== "all" ||
                    subscriptionStatusFilter !== "all" ||
                    subscriptionPlanFilter !== "all" ||
                    startDate ||
                    endDate ||
                    datePreset !== "all"
                    ? `${filteredMembers.length} result${filteredMembers.length === 1 ? "" : "s"}`
                    : `${listedMemberCount} members`}
                </div>

                {unpaidSignupCount > 0 && (
                  <label
                    title="People who opened the payment page but never paid"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      color: "var(--muted, #6b7280)",
                      whiteSpace: "nowrap",
                      cursor: "pointer"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showUnpaid}
                      onChange={(event) =>
                        setShowUnpaid(event.target.checked)
                      }
                    />
                    Show unpaid sign-ups ({unpaidSignupCount})
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setMemberStatusFilter("all");
                    setSubscriptionStatusFilter("all");
                    setSubscriptionPlanFilter("all");
                    setDatePreset("all");
                    setStartDate("");
                    setEndDate("");
                    setActivityCardFilter("all");
                  }}
                  disabled={
                    !search &&
                    memberStatusFilter === "all" &&
                    subscriptionStatusFilter === "all" &&
                    subscriptionPlanFilter === "all" &&
                    !startDate &&
                    !endDate &&
                    datePreset === "all" &&
                    activityCardFilter === "all"
                  }
                  style={{
                    height: 38,
                    padding: "0 12px",
                    border: "1px solid #dfe3e8",
                    borderRadius: 8,
                    background: "#ffffff",
                    color: "#59636e",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor:
                      !search &&
                        memberStatusFilter === "all" &&
                        subscriptionStatusFilter === "all" &&
                        subscriptionPlanFilter === "all" &&
                        !startDate &&
                        !endDate &&
                        datePreset === "all" &&
                        activityCardFilter === "all"
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      !search &&
                        memberStatusFilter === "all" &&
                        subscriptionStatusFilter === "all" &&
                        subscriptionPlanFilter === "all" &&
                        !startDate &&
                        !endDate &&
                        datePreset === "all" &&
                        activityCardFilter === "all"
                        ? 0.5
                        : 1
                  }}
                >
                  Clear filters
                </button>

              </div>

            </div>


            {/* =================================================
            ERROR
        ================================================= */}

            {error && (

              <div
                style={{
                  marginBottom:
                    16,

                  padding:
                    "13px 15px",

                  borderRadius:
                    10,

                  border:
                    "1px solid #f1c5c0",

                  background:
                    "#fff3f1",

                  color:
                    "#b42318",

                  fontSize:
                    13
                }}
              >

                {error}

              </div>

            )}


            {/* =================================================
            TABLE
        ================================================= */}

            <div
              style={{
                background:
                  "var(--surface, #ffffff)",

                border:
                  "1px solid var(--line, #e5e7eb)",

                borderRadius:
                  14,

                overflow:
                  "hidden",

                boxShadow:
                  "0 4px 16px rgba(25,35,45,0.04)"
              }}
            >


              {loading ? (

                <div
                  style={{
                    minHeight:
                      240,

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    color:
                      "var(--muted, #6b7280)",

                    fontSize:
                      14
                  }}
                >

                  Loading members...

                </div>


              ) : filteredMembers.length === 0 ? (

                <div
                  style={{
                    minHeight:
                      240,

                    display:
                      "flex",

                    flexDirection:
                      "column",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    padding:
                      30,

                    textAlign:
                      "center"
                  }}
                >

                  <div
                    style={{
                      width:
                        48,

                      height:
                        48,

                      borderRadius:
                        "50%",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      background:
                        "#f3f5f7",

                      marginBottom:
                        12
                    }}
                  >

                    <MIcon
                      name="search"
                      size={20}
                    />

                  </div>


                  <strong
                    style={{
                      fontSize:
                        15,

                      marginBottom:
                        5
                    }}
                  >
                    No members found
                  </strong>


                  <span
                    style={{
                      fontSize:
                        13,

                      color:
                        "var(--muted, #6b7280)"
                    }}
                  >
                    Try another name, email,
                    phone number or member ID.
                  </span>

                </div>


              ) : (

                <div
                  style={{
                    width:
                      "100%",

                    overflowX:
                      "auto"
                  }}
                >

                  <table
                    style={{
                      width:
                        "100%",

                      minWidth:
                        1750,

                      borderCollapse:
                        "collapse"
                    }}
                  >


                    {/* =================================================
                    HEAD
                ================================================= */}

                    <thead>

                      <tr
                        style={{
                          background:
                            "#f8fafb",

                          borderBottom:
                            "1px solid #e4e7eb"
                        }}
                      >

                        {[
                          "#",
                          "MEMBER",
                          "EMAIL",
                          "PHONE",
                          "MEMBER ID",
                          "ROLE",
                          "MOST USED CONTENT",
                          "MEMBER STATUS",
                          "SUBSCRIPTION STATUS",
                          "PLAN",
                          "AMOUNT",
                          "BILLING CYCLE",
                          "NEXT BILLING",
                          "RAZORPAY SUBSCRIPTION ID",
                          "JOINED",
                          "ACTIONS"
                        ].map(
                          (heading) => (

                            <th
                              key={
                                heading
                              }
                              style={{
                                padding:
                                  "13px 14px",

                                textAlign:
                                  "left",

                                fontSize:
                                  11,

                                fontWeight:
                                  800,

                                letterSpacing:
                                  "0.04em",

                                color:
                                  "#6b7280",

                                whiteSpace:
                                  "nowrap"
                              }}
                            >
                              {heading}
                            </th>

                          )
                        )}

                      </tr>

                    </thead>


                    {/* =================================================
                    BODY
                ================================================= */}

                    <tbody>

                      {filteredMembers.map(
                        (
                          member,
                          index
                        ) => (

                          <tr
                            key={
                              member.id
                            }
                            style={{
                              borderBottom:
                                "1px solid #eef0f2"
                            }}
                          >


                            {/* INDEX */}

                            <td
                              style={{
                                padding:
                                  "15px 14px",

                                color:
                                  "#8a939e",

                                fontSize:
                                  12
                              }}
                            >
                              {index + 1}
                            </td>


                            {/* MEMBER */}

                            <td
                              style={{
                                padding:
                                  "15px 14px"
                              }}
                            >

                              <div
                                style={{
                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  gap:
                                    10
                                }}
                              >

                                <div
                                  style={{
                                    width:
                                      38,

                                    height:
                                      38,

                                    flex:
                                      "0 0 38px",

                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    justifyContent:
                                      "center",

                                    borderRadius:
                                      "50%",

                                    background:
                                      "#fde9e5",

                                    color:
                                      "#c94337",

                                    fontWeight:
                                      800,

                                    fontSize:
                                      14
                                  }}
                                >

                                  {String(
                                    member.name
                                  )
                                    .charAt(0)
                                    .toUpperCase()}

                                </div>


                                <div
                                  style={{
                                    minWidth:
                                      140
                                  }}
                                >

                                  <div
                                    style={{
                                      fontSize:
                                        13,

                                      fontWeight:
                                        750,

                                      color:
                                        "#202833"
                                    }}
                                  >
                                    {displayValue(
                                      member.name
                                    )}
                                  </div>


                                  <div
                                    style={{
                                      marginTop:
                                        3,

                                      fontSize:
                                        11,

                                      color:
                                        "#89929d"
                                    }}
                                  >
                                    Member
                                  </div>

                                </div>

                              </div>

                            </td>


                            {/* EMAIL */}

                            <td
                              style={{
                                padding:
                                  "15px 14px",

                                fontSize:
                                  13,

                                color:
                                  "#374151",

                                whiteSpace:
                                  "nowrap"
                              }}
                            >
                              {displayValue(
                                member.email
                              )}
                            </td>


                            {/* PHONE */}

                            <td
                              style={{
                                padding:
                                  "15px 14px",

                                fontSize:
                                  13,

                                color:
                                  "#374151",

                                whiteSpace:
                                  "nowrap"
                              }}
                            >
                              {displayValue(
                                member.phone
                              )}
                            </td>


                            {/* MEMBER ID */}

                            <td
                              style={{
                                padding:
                                  "15px 14px",

                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, monospace",

                                fontSize:
                                  11,

                                color:
                                  "#59636e",

                                maxWidth:
                                  190,

                                wordBreak:
                                  "break-all"
                              }}
                            >
                              {displayValue(
                                member.uid
                              )}
                            </td>


                            {/* ROLE */}

                            <td
                              style={{
                                padding:
                                  "15px 14px",

                                fontSize:
                                  12,

                                color:
                                  "#4b5563"
                              }}
                            >
                              {displayValue(
                                member.role
                              )}
                            </td>

                            {/* MOST USED CONTENT */}
                            <td
                              style={{
                                padding: "15px 14px",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {(() => {
                                const usage =
                                  memberUsageMap[member.uid] ||
                                  memberUsageMap[member.id] ||
                                  member.contentUsage ||
                                  {};
                                const roundup = Number(usage.weekly_roundup || 0);
                                const news = Number(usage.newsletter || 0);
                                const report = Number(usage.weekly_report || 0);
                                const video = Number(usage.video || 0);
                                const total =
                                  Number(usage.total || 0) ||
                                  roundup + news + report + video;

                                let topType = "None";
                                let topCount = 0;
                                if (roundup > topCount) {
                                  topCount = roundup;
                                  topType = "Weekly Roundup";
                                }
                                if (news > topCount) {
                                  topCount = news;
                                  topType = "Newsletter";
                                }
                                if (report > topCount) {
                                  topCount = report;
                                  topType = "Articles & Reports";
                                }
                                if (video > topCount) {
                                  topCount = video;
                                  topType = "Videos";
                                }

                                if (total === 0) {
                                  return (
                                    <span style={{ fontSize: 11.5, color: "#9ca3af" }}>
                                      No activity yet
                                    </span>
                                  );
                                }

                                const isRoundup = topType === "Weekly Roundup";
                                const isNews = topType === "Newsletter";
                                const isReport = topType === "Articles & Reports";
                                const bg = isRoundup
                                  ? "rgba(37, 99, 235, 0.1)"
                                  : isNews
                                    ? "rgba(124, 58, 237, 0.1)"
                                    : isReport
                                      ? "rgba(5, 150, 105, 0.1)"
                                      : "rgba(217, 119, 6, 0.1)";
                                const color = isRoundup
                                  ? "#2563eb"
                                  : isNews
                                    ? "#7c3aed"
                                    : isReport
                                      ? "#059669"
                                      : "#d97706";
                                const icon = isRoundup
                                  ? "📈"
                                  : isNews
                                    ? "📰"
                                    : isReport
                                      ? "📑"
                                      : "🎥";

                                return (
                                  <div>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        padding: "3px 8px",
                                        borderRadius: 6,
                                        fontSize: 11.5,
                                        fontWeight: 750,
                                        background: bg,
                                        color: color
                                      }}
                                      title={`Total: ${total} (Roundup: ${roundup}, News: ${news}, Reports: ${report}, Videos: ${video})`}
                                    >
                                      {icon} {topType} ({topCount})
                                    </span>
                                    <div
                                      style={{
                                        fontSize: 10.5,
                                        color: "#6b7280",
                                        marginTop: 2
                                      }}
                                    >
                                      Total {total} opens
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* STATUS */}


                            <td
                              style={{
                                padding:
                                  "15px 14px"
                              }}
                            >

                              {(() => {
                                const accessActive = isMemberAccessActive(member);
                                const rawStatus = String(member.status || "active").toLowerCase();
                                const effectiveStatus = (rawStatus === "deactivated" || !accessActive) ? "inactive" : "active";
                                const isActive = effectiveStatus === "active";

                                return (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      padding: "5px 9px",
                                      borderRadius: 999,
                                      background: isActive ? "#eaf7ed" : "#f1f3f5",
                                      color: isActive ? "#217a36" : "#69727c",
                                      fontSize: 11,
                                      fontWeight: 750
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: isActive ? "#2ead4b" : "#9aa1a8"
                                      }}
                                    />
                                    {displayValue(effectiveStatus)}
                                  </span>
                                );
                              })()}

                            </td>


                            {/* SUBSCRIPTION STATUS */}

                            <td
                              style={{
                                padding: "15px 14px",
                                whiteSpace: "nowrap"
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "5px 9px",
                                  borderRadius: 999,
                                  background:
                                    member.subscriptionStatusPrimary === "active"
                                      ? "#eaf7ed"
                                      : member.subscriptionStatusPrimary === "cancelled"
                                        ? "#fff3f1"
                                        : member.subscriptionStatusPrimary === "halted"
                                          ? "#fff3f1"
                                          : member.subscriptionStatusPrimary === "paused"
                                            ? "#fff9e8"
                                            : member.subscriptionStatusPrimary === "pending"
                                              ? "#fef3c7"
                                              : "#f1f3f5",
                                  color:
                                    member.subscriptionStatusPrimary === "active"
                                      ? "#217a36"
                                      : member.subscriptionStatusPrimary === "cancelled"
                                        ? "#b42318"
                                        : member.subscriptionStatusPrimary === "halted"
                                          ? "#b42318"
                                          : member.subscriptionStatusPrimary === "paused"
                                            ? "#8a6410"
                                            : member.subscriptionStatusPrimary === "pending"
                                              ? "#b45309"
                                              : "#69727c",
                                  fontSize: 11,
                                  fontWeight: 750
                                }}
                              >
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background:
                                      member.subscriptionStatusPrimary === "active"
                                        ? "#2ead4b"
                                        : member.subscriptionStatusPrimary === "cancelled"
                                          ? "#d6453d"
                                          : member.subscriptionStatusPrimary === "halted"
                                            ? "#d6453d"
                                            : member.subscriptionStatusPrimary === "paused"
                                              ? "#d8a62a"
                                              : member.subscriptionStatusPrimary === "pending"
                                                ? "#f59e0b"
                                                : "#9aa1a8"
                                  }}
                                />

                                {member.subscriptionStatusDisplay}
                              </span>

                              {member.isAutoRenewedToday && (
                                <span
                                  title={`Billing Cycle: ${formatMemberDate(member.subscriptionStartDate)} – ${formatMemberDate(member.nextBillingDate)}${member.lastPaymentDate ? ` | Payment debited: ${formatMemberDateTime(member.lastPaymentDate)}` : ""}`}
                                  style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: 2,
                                    marginLeft: 6,
                                    padding: "3px 7px",
                                    borderRadius: 5,
                                    background: "#dcfce7",
                                    border: "1px solid #86efac",
                                    color: "#15803d",
                                    fontSize: 10,
                                    fontWeight: 800
                                  }}
                                >
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    ⚡ Renewed Today
                                  </span>
                                  {member.lastPaymentDate && (
                                    <span
                                      style={{
                                        fontSize: 9.5,
                                        color: "#166534",
                                        fontWeight: 650
                                      }}
                                    >
                                      💳 Debited: {formatDebitSummary(member.lastPaymentDate)}
                                    </span>
                                  )}
                                </span>
                              )}

                              {member.isRenewalFailed && (
                                <span
                                  title="Auto-debit recurring charge attempt failed in Razorpay (e.g. Account Blocked / Insufficient Funds). Razorpay is retrying."
                                  style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: 2,
                                    marginLeft: 6,
                                    padding: "3px 7px",
                                    borderRadius: 5,
                                    background: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    color: "#b91c1c",
                                    fontSize: 10,
                                    fontWeight: 800
                                  }}
                                >
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    ⚠️ Auto-Debit Failed (Retry)
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 9.5,
                                      color: "#991b1b",
                                      fontWeight: 650
                                    }}
                                  >
                                    ❌ Charge attempt failed (Account Blocked / Decline)
                                  </span>
                                </span>
                              )}

                              {member.isScheduledTomorrow && (
                                <span
                                  title={`Auto-debit renewal scheduled for tomorrow (${tomorrowDateLabel})`}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    marginLeft: 6,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    fontSize: 10,
                                    fontWeight: 800
                                  }}
                                >
                                  ⏰ Debit Tomorrow ({tomorrowDateLabel})
                                </span>
                              )}

                              {member.isCancelledToday && (
                                <span
                                  title="Cancelled today"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    marginLeft: 6,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#fee2e2",
                                    color: "#b91c1c",
                                    fontSize: 10,
                                    fontWeight: 800
                                  }}
                                >
                                  🚫 Cancelled Today
                                </span>
                              )}

                              {member.isCurrentlyPaused && (
                                <span
                                  title="Subscription currently paused"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    marginLeft: 6,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#fef3c7",
                                    color: "#b45309",
                                    fontSize: 10,
                                    fontWeight: 800
                                  }}
                                >
                                  ⏸️ Paused
                                </span>
                              )}
                            </td>


                            {/* PLAN */}

                            <td
                              style={{
                                padding: "15px 14px",
                                fontSize: 12,
                                color: "#4b5563",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {displayValue(
                                member.subscriptionPlanDisplay
                              )}
                            </td>


                            {/* AMOUNT */}

                            <td
                              style={{
                                padding: "15px 14px",
                                fontSize: 12,
                                color: "#374151",
                                fontWeight: 650,
                                whiteSpace: "nowrap"
                              }}
                            >
                              {member.subscriptionAmount !== null &&
                                member.subscriptionAmount !== undefined &&
                                member.subscriptionAmount !== ""
                                ? `${member.subscriptionCurrency === "INR" ? "₹" : ""}${member.subscriptionAmount}`
                                : "—"}
                            </td>


                            {/* BILLING CYCLE & PAYMENT */}

                            <td
                              style={{
                                padding: "15px 14px",
                                fontSize: 12,
                                whiteSpace: "nowrap"
                              }}
                            >
                              {["cancelled", "halted", "expired", "completed"].includes(member.subscriptionStatusPrimary) ? (
                                <div>
                                  <div style={{ fontWeight: 650, color: "#374151" }}>
                                    {formatMemberDate(member.lastPaymentDate || member.subscriptionStartDate || member.joinedAt)}
                                    {isMemberAccessActive(member) ? (
                                      <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700, marginLeft: 4 }}>
                                        (Paid until {formatMemberDate(safeTimestamp(member.lastPaymentDate) + 30 * 86400000)})
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginLeft: 4 }}>
                                        (Ended)
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 10, color: isMemberAccessActive(member) ? "#b45309" : "#dc2626", marginTop: 3, fontWeight: 650 }}>
                                    {isMemberAccessActive(member)
                                      ? "Mandate cancelled • Access active until cycle ends"
                                      : (member.isRenewalFailed ? "❌ 2nd payment failed • Cancelled" : "Subscription cancelled")}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div style={{ fontWeight: 650, color: "#1f2937" }}>
                                    {formatMemberDate(member.subscriptionStartDate)}
                                    {member.nextBillingDate && (
                                      <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginLeft: 4 }}>
                                        → {formatMemberDate(member.nextBillingDate)}
                                      </span>
                                    )}
                                  </div>
                                  {member.isRenewalFailed ? (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: "#b91c1c",
                                        marginTop: 3,
                                        fontWeight: 650,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 3
                                      }}
                                      title="Auto-debit mandate recurring charge failed in Razorpay. Retrying in Razorpay."
                                    >
                                      <span>❌ Auto-debit failed (Retrying in Razorpay)</span>
                                    </div>
                                  ) : member.lastPaymentDate ? (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: "#059669",
                                        marginTop: 3,
                                        fontWeight: 650,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 3
                                      }}
                                      title={`Payment Captured: ${formatMemberDateTime(member.lastPaymentDate)}${member.razorpayPaymentId ? ` (${member.razorpayPaymentId})` : ""}`}
                                    >
                                      <span>💳 Debited: {formatDebitSummary(member.lastPaymentDate)}</span>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                                      Active cycle
                                    </div>
                                  )}
                                </>
                              )}
                            </td>


                            {/* NEXT BILLING */}

                            <td
                              style={{
                                padding: "15px 14px",
                                fontSize: 12,
                                whiteSpace: "nowrap"
                              }}
                            >
                              {["cancelled", "halted", "expired", "completed"].includes(member.subscriptionStatusPrimary) ? (
                                <div>
                                  <div style={{ color: "#9ca3af", fontWeight: 600 }}>—</div>
                                  <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2, fontWeight: 500 }}>
                                    None (Cancelled)
                                  </div>
                                </div>
                              ) : member.nextBillingDate ? (
                                <div>
                                  <div style={{ fontWeight: 600, color: "#374151" }}>
                                    {formatMemberDate(member.nextBillingDate)}
                                  </div>
                                  {member.subscriptionStatusPrimary === "active" && (
                                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                                      Auto-debit due
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ color: "#9ca3af" }}>—</div>
                              )}
                            </td>


                            {/* RAZORPAY SUBSCRIPTION ID */}

                            <td
                              style={{
                                padding: "15px 14px",
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                                fontSize: 11,
                                color: "#59636e",
                                maxWidth: 220,
                                wordBreak: "break-all"
                              }}
                            >
                              {displayValue(
                                member.razorpaySubscriptionId
                              )}
                            </td>


                            {/* JOINED */}

                            <td
                              style={{
                                padding:
                                  "15px 14px",

                                whiteSpace:
                                  "nowrap",

                                fontSize:
                                  12
                              }}
                            >
                              <div style={{ fontWeight: 600, color: "#374151" }}>
                                {formatMemberDate(member.joinedAt)}
                              </div>
                              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                                Initial signup
                              </div>
                            </td>


                            {/* ACTIONS */}

                            <td
                              style={{
                                padding:
                                  "15px 14px",
                                whiteSpace:
                                  "nowrap"
                              }}
                            >

                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: 8
                                }}
                              >

                                {String(member.status || "")
                                  .trim()
                                  .toLowerCase() === "deactivated" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleActivate(member)
                                    }
                                    disabled={
                                      actionLoading ===
                                      `activate:${member.uid}` ||
                                      actionLoading ===
                                      `delete:${member.uid}`
                                    }
                                    style={{
                                      height: 34,
                                      padding: "0 11px",
                                      border: "1px solid #c9e2ce",
                                      borderRadius: 8,
                                      background: "#edf8ef",
                                      color: "#217a36",
                                      fontSize: 12,
                                      fontWeight: 750,
                                      cursor:
                                        actionLoading ===
                                          `activate:${member.uid}` ||
                                          actionLoading ===
                                          `delete:${member.uid}`
                                          ? "not-allowed"
                                          : "pointer",
                                      opacity:
                                        actionLoading ===
                                          `activate:${member.uid}` ||
                                          actionLoading ===
                                          `delete:${member.uid}`
                                          ? 0.55
                                          : 1
                                    }}
                                  >
                                    {actionLoading ===
                                      `activate:${member.uid}`
                                      ? "Activating..."
                                      : "Activate"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeactivate(member)
                                    }
                                    disabled={
                                      actionLoading ===
                                      `deactivate:${member.uid}` ||
                                      actionLoading ===
                                      `delete:${member.uid}` ||
                                      String(member.status || "")
                                        .trim()
                                        .toLowerCase() === "inactive"
                                    }
                                    style={{
                                      height: 34,
                                      padding: "0 11px",
                                      border: "1px solid #ead6a3",
                                      borderRadius: 8,
                                      background: "#fff9e8",
                                      color: "#8a6410",
                                      fontSize: 12,
                                      fontWeight: 750,
                                      cursor:
                                        actionLoading ===
                                          `deactivate:${member.uid}` ||
                                          actionLoading ===
                                          `delete:${member.uid}` ||
                                          String(member.status || "")
                                            .trim()
                                            .toLowerCase() === "inactive"
                                          ? "not-allowed"
                                          : "pointer",
                                      opacity:
                                        actionLoading ===
                                          `deactivate:${member.uid}` ||
                                          actionLoading ===
                                          `delete:${member.uid}` ||
                                          String(member.status || "")
                                            .trim()
                                            .toLowerCase() === "inactive"
                                          ? 0.55
                                          : 1
                                    }}
                                  >
                                    {actionLoading ===
                                      `deactivate:${member.uid}`
                                      ? "Deactivating..."
                                      : "Deactivate"}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      member
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    `deactivate:${member.uid}` ||
                                    actionLoading ===
                                    `delete:${member.uid}`
                                  }
                                  style={{
                                    height: 34,
                                    padding:
                                      "0 11px",
                                    border:
                                      "1px solid #f0c3bd",
                                    borderRadius: 8,
                                    background:
                                      "#fff3f1",
                                    color:
                                      "#b42318",
                                    fontSize: 12,
                                    fontWeight: 750,
                                    cursor:
                                      actionLoading ===
                                        `deactivate:${member.uid}` ||
                                        actionLoading ===
                                        `delete:${member.uid}`
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      actionLoading ===
                                        `deactivate:${member.uid}` ||
                                        actionLoading ===
                                        `delete:${member.uid}`
                                        ? 0.55
                                        : 1
                                  }}
                                >
                                  {actionLoading ===
                                    `delete:${member.uid}`
                                    ? "Processing..."
                                    : "Disable & Clear Data"}
                                </button>

                              </div>

                            </td>


                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>


            {/* =================================================
            FOOTER
        ================================================= */}

            {!loading &&
              filteredMembers.length > 0 && (

                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",

                    gap:
                      12,

                    marginTop:
                      12,

                    flexWrap:
                      "wrap",

                    fontSize:
                      12,

                    color:
                      "var(--muted, #6b7280)"
                  }}
                >

                  <span>
                    Showing{" "}
                    <strong
                      style={{
                        color:
                          "#374151"
                      }}
                    >
                      {filteredMembers.length}
                    </strong>{" "}
                    of{" "}
                    <strong
                      style={{
                        color:
                          "#374151"
                      }}
                    >
                      {listedMemberCount}
                    </strong>{" "}
                    members
                  </span>


                  <span>
                    Export uses the currently
                    filtered results.
                  </span>

                </div>

              )}
          </>
        )}

        {/* =================================================
            RECURRING SUBSCRIPTIONS & PAYMENTS VIEW
        ================================================= */}
        {viewTab === "recurring" && (
          <div style={{ width: "100%" }}>
            {/* RECURRING METRIC SUMMARY CARDS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: 12,
                marginBottom: 16
              }}
            >
              {/* CARD 1: DEBITED IN PERIOD / TODAY */}
              <div
                onClick={() =>
                  setRecurringStatusFilter((prev) =>
                    prev === "debited_today" ? "all" : "debited_today"
                  )
                }
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: recurringStatusFilter === "debited_today" ? "#f0fdf4" : "#ffffff",
                  border: recurringStatusFilter === "debited_today" ? "2px solid #22c55e" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: recurringStatusFilter === "debited_today" ? "0 4px 14px rgba(34, 197, 94, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>💳</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      {recurringStartDate || recurringEndDate ? "Debited in Date Range" : "Recurring Debited Today"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "#dcfce7",
                      color: "#15803d"
                    }}
                  >
                    {recurringStartDate || recurringEndDate ? "Custom Range" : todayDateLabel}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#15803d", lineHeight: 1 }}>
                    {recurringStartDate || recurringEndDate ? filteredRecurringMembers.length : recurringDebitedCount}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    {recurringStartDate || recurringEndDate ? "payments matched" : "debited & captured today"}
                  </span>
                </div>
              </div>

              {/* CARD 2: ACTIVE MANDATES */}
              <div
                onClick={() => {
                  setRecurringStatusFilter((prev) => (prev === "active" ? "all" : "active"));
                  setRecurringDatePreset("all");
                  setRecurringStartDate("");
                  setRecurringEndDate("");
                }}
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: recurringStatusFilter === "active" ? "#f0fdf4" : "#ffffff",
                  border: recurringStatusFilter === "active" ? "2px solid #16a34a" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: recurringStatusFilter === "active" ? "0 4px 14px rgba(22, 163, 74, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>⚡</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      Active Mandates
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>
                    {recurringActiveCount}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    auto-renewing normally
                  </span>
                </div>
              </div>

              {/* CARD 3: RETRY PENDING / FAILED */}
              <div
                onClick={() => {
                  setRecurringStatusFilter((prev) => (prev === "failed" ? "all" : "failed"));
                  setRecurringDatePreset("all");
                  setRecurringStartDate("");
                  setRecurringEndDate("");
                }}
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: recurringStatusFilter === "failed" ? "#fffbeb" : "#ffffff",
                  border: recurringStatusFilter === "failed" ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: recurringStatusFilter === "failed" ? "0 4px 14px rgba(245, 158, 11, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      Pending Retry
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#b45309", lineHeight: 1 }}>
                    {recurringFailedCount}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    auto-debit failed at bank
                  </span>
                </div>
              </div>

              {/* CARD 4: CANCELLED MANDATES */}
              <div
                onClick={() => {
                  setRecurringStatusFilter((prev) => (prev === "cancelled" ? "all" : "cancelled"));
                  setRecurringDatePreset("all");
                  setRecurringStartDate("");
                  setRecurringEndDate("");
                }}
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: recurringStatusFilter === "cancelled" ? "#fef2f2" : "#ffffff",
                  border: recurringStatusFilter === "cancelled" ? "2px solid #ef4444" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: recurringStatusFilter === "cancelled" ? "0 4px 14px rgba(239, 68, 68, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>🛑</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      Cancelled Mandates
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#b91c1c", lineHeight: 1 }}>
                    {recurringCancelledCount}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    cancelled by user / admin
                  </span>
                </div>
              </div>

              {/* CARD 5: ACCESS BLOCKED / INACTIVE */}
              <div
                onClick={() => {
                  setRecurringStatusFilter((prev) => (prev === "blocked" ? "all" : "blocked"));
                  setRecurringDatePreset("all");
                  setRecurringStartDate("");
                  setRecurringEndDate("");
                }}
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: recurringStatusFilter === "blocked" ? "#faf5ff" : "#ffffff",
                  border: recurringStatusFilter === "blocked" ? "2px solid #9333ea" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: recurringStatusFilter === "blocked" ? "0 4px 14px rgba(147, 51, 234, 0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>🔒</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                      Dashboard Blocked
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#7e22ce", lineHeight: 1 }}>
                    {recurringBlockedCount}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    login blocked (unpaid / expired)
                  </span>
                </div>
              </div>
            </div>

            {/* RECURRING TOOLBAR (SEARCH + DATE PRESETS + CUSTOM DATES + STATUS FILTER) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "16px 18px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                marginBottom: 16
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {/* SEARCH INPUT */}
                <div
                  style={{
                    position: "relative",
                    flex: "1 1 280px",
                    minWidth: 260
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      fontSize: 16
                    }}
                  >
                    🔍
                  </span>
                  <input
                    type="text"
                    value={recurringSearch}
                    onChange={(e) => setRecurringSearch(e.target.value)}
                    placeholder="Search subscriber name, email, phone, sub_xxx, pay_xxx..."
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 14px 0 38px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                  {recurringSearch && (
                    <button
                      type="button"
                      onClick={() => setRecurringSearch("")}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af"
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* STATUS FILTER DROPDOWN */}
                <div style={{ minWidth: 200 }}>
                  <select
                    value={recurringStatusFilter}
                    onChange={(e) => setRecurringStatusFilter(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      background: "#ffffff",
                      cursor: "pointer",
                      fontWeight: 600,
                      color: "#374151"
                    }}
                  >
                    <option value="all">All Mandates & Subscriptions</option>
                    <option value="debited_today">🟢 Debited Today ({recurringDebitedCount})</option>
                    <option value="active">⚡ Active Mandates ({recurringActiveCount})</option>
                    <option value="cancelled">🛑 Cancelled Mandates ({recurringCancelledCount})</option>
                    <option value="failed">⚠️ Pending Retry ({recurringFailedCount})</option>
                    <option value="blocked">🔒 Dashboard Access Blocked ({recurringBlockedCount})</option>
                  </select>
                </div>

                {/* RESET BUTTON */}
                {(recurringSearch || recurringDatePreset !== "all" || recurringStartDate || recurringEndDate || recurringStatusFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecurringSearch("");
                      setRecurringDatePreset("all");
                      setRecurringStartDate("");
                      setRecurringEndDate("");
                      setRecurringStatusFilter("all");
                    }}
                    style={{
                      height: 40,
                      padding: "0 14px",
                      borderRadius: 8,
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#dc2626",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* DATE RANGE FILTERING (PRESETS + CUSTOM DATES) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  paddingTop: 10,
                  borderTop: "1px solid #f3f4f6",
                  flexWrap: "wrap"
                }}
              >
                {/* PRESET PILLS */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginRight: 4 }}>
                    Debit Date:
                  </span>
                  {[
                    { key: "all", label: "All Time" },
                    { key: "today", label: "Today" },
                    { key: "yesterday", label: "Yesterday" },
                    { key: "7days", label: "Last 7 Days" },
                    { key: "30days", label: "Last 30 Days" },
                    { key: "this_month", label: "This Month" }
                  ].map((preset) => {
                    const isSelected = recurringDatePreset === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => handleRecurringDatePresetChange(preset.key)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: isSelected ? "1px solid #0284c7" : "1px solid #e5e7eb",
                          background: isSelected ? "#e0f2fe" : "#ffffff",
                          color: isSelected ? "#0369a1" : "#4b5563",
                          fontSize: 12,
                          fontWeight: isSelected ? 750 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* CUSTOM DATE INPUTS */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Custom:</span>
                  <input
                    type="date"
                    value={recurringStartDate}
                    onChange={(e) => {
                      setRecurringStartDate(e.target.value);
                      setRecurringDatePreset("custom");
                    }}
                    style={{
                      height: 32,
                      padding: "0 8px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 12,
                      color: "#374151"
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>to</span>
                  <input
                    type="date"
                    value={recurringEndDate}
                    onChange={(e) => {
                      setRecurringEndDate(e.target.value);
                      setRecurringDatePreset("custom");
                    }}
                    style={{
                      height: 32,
                      padding: "0 8px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 12,
                      color: "#374151"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* RECURRING TABLE */}
            <div
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflowX: "auto",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
              }}
            >
              {loading ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "#6b7280" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontWeight: 600 }}>Loading recurring subscriptions & payments...</div>
                </div>
              ) : filteredRecurringMembers.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "#6b7280" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🔎</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                    No recurring payments found
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    Try selecting a different date range, status, or search term.
                  </div>
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: 13
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        color: "#475569",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 700
                      }}
                    >
                      <th style={{ padding: "12px 16px" }}>Subscriber</th>
                      <th style={{ padding: "12px 14px" }}>Mandate & Plan</th>
                      <th style={{ padding: "12px 14px" }}>Completed Cycles</th>
                      <th style={{ padding: "12px 14px" }}>Last Debited Payment</th>
                      <th style={{ padding: "12px 14px" }}>Next Auto-Debit</th>
                      <th style={{ padding: "12px 14px" }}>Cancellation Status</th>
                      <th style={{ padding: "12px 14px" }}>Dashboard Login Access</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecurringMembers.map((m, idx) => {
                      const accessActive = isMemberAccessActive(m);
                      const isCancelled = normalizeValue(m.subscriptionStatusPrimary || "") === "cancelled" || normalizeValue(m.status || "") === "cancelled";
                      const relativePayment = formatDebitSummary(m.lastPaymentDate);
                      const fullPaymentDate = formatMemberDateTime(m.lastPaymentDate);
                      const fullCancelDate = formatMemberDateTime(m.cancelledAt);
                      const paidCycles = Number(m.paidCount || 1);
                      const totalAmount = paidCycles * Number(m.subscriptionAmount || 99);

                      return (
                        <tr
                          key={m.id || m.uid || idx}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            background: idx % 2 === 0 ? "#ffffff" : "#fcfcfd",
                            transition: "background 0.12s ease"
                          }}
                        >
                          {/* SUBSCRIBER */}
                          <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 999,
                                  background: "#f1f5f9",
                                  border: "1px solid #e2e8f0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: "#334155",
                                  flexShrink: 0
                                }}
                              >
                                {String(m.name || "U").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
                                  {m.name || "Subscriber"}
                                </div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>
                                  {m.email || "—"}
                                </div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                  {m.phone || "—"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* MANDATE & PLAN */}
                          <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 12 }}>
                              {m.subscriptionPlanDisplay || "Wealthoria Premium"}
                            </div>
                            <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginTop: 1 }}>
                              ₹{m.subscriptionAmount || 99} / mo
                            </div>
                            {m.razorpaySubscriptionId ? (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginTop: 4,
                                  fontFamily: "ui-monospace, monospace",
                                  fontSize: 10,
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  padding: "2px 6px",
                                  borderRadius: 4
                                }}
                              >
                                <span>{m.razorpaySubscriptionId}</span>
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>
                            )}
                          </td>

                          {/* COMPLETED CYCLES */}
                          <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: 6,
                                background: paidCycles > 1 ? "#dbeafe" : "#f1f5f9",
                                color: paidCycles > 1 ? "#1d4ed8" : "#475569",
                                fontSize: 12,
                                fontWeight: 800
                              }}
                            >
                              {paidCycles} {paidCycles === 1 ? "Debit Paid" : "Debits Paid"}
                            </span>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 600 }}>
                              ₹{totalAmount} collected
                            </div>
                          </td>

                          {/* LAST DEBITED PAYMENT */}
                          <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                            {m.lastPaymentDate ? (
                              <div>
                                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 12 }}>
                                  {relativePayment || fullPaymentDate}
                                </div>
                                {m.isAutoRenewedToday && (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      background: "#dcfce7",
                                      color: "#15803d",
                                      fontSize: 10,
                                      fontWeight: 800,
                                      marginTop: 2
                                    }}
                                  >
                                    ⚡ Debited Today
                                  </span>
                                )}
                                {m.razorpayPaymentId && (
                                  <div
                                    style={{
                                      fontFamily: "ui-monospace, monospace",
                                      fontSize: 10,
                                      color: "#64748b",
                                      marginTop: 3
                                    }}
                                  >
                                    {m.razorpayPaymentId}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>—</span>
                            )}
                          </td>

                          {/* NEXT AUTO-DEBIT */}
                          <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                            {isCancelled ? (
                              <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                                Mandate Cancelled
                              </span>
                            ) : m.nextBillingDate ? (
                              <div>
                                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 12 }}>
                                  {formatMemberDate(m.nextBillingDate)}
                                </div>
                                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                                  Scheduled Auto-Debit
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>—</span>
                            )}
                          </td>

                          {/* CANCELLATION STATUS */}
                          <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                            {isCancelled ? (
                              <div>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    background: "#fee2e2",
                                    color: "#b91c1c",
                                    fontSize: 11,
                                    fontWeight: 800
                                  }}
                                >
                                  🛑 Cancelled
                                </span>
                                {m.isCancelledToday && (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      marginLeft: 4,
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      background: "#fef3c7",
                                      color: "#92400e",
                                      fontSize: 10,
                                      fontWeight: 800
                                    }}
                                  >
                                    Today
                                  </span>
                                )}
                                {m.cancelledAt && (
                                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>
                                    {fullCancelDate}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "#f0fdf4",
                                  color: "#16a34a",
                                  fontSize: 11,
                                  fontWeight: 700
                                }}
                              >
                                Active & Renewing
                              </span>
                            )}
                          </td>

                          {/* DASHBOARD LOGIN ACCESS */}
                          <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                            {accessActive ? (
                              <div>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    background: "#dcfce7",
                                    color: "#15803d",
                                    fontSize: 11,
                                    fontWeight: 800
                                  }}
                                >
                                  <span>🟢</span> Access Active
                                </span>
                                <div style={{ fontSize: 10, color: "#166534", marginTop: 2 }}>
                                  Can log in & access dashboard
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    background: "#fee2e2",
                                    color: "#991b1b",
                                    fontSize: 11,
                                    fontWeight: 800
                                  }}
                                >
                                  <span>🔒</span> Access Blocked
                                </span>
                                <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2, fontWeight: 600 }}>
                                  Inactive • Login rejected
                                </div>
                              </div>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td style={{ padding: "14px 14px", verticalAlign: "top", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 6 }}>
                              {normalizeValue(m.status || "") === "deactivated" ? (
                                <button
                                  type="button"
                                  onClick={() => handleActivate(m)}
                                  disabled={actionLoading === `activate:${m.uid}`}
                                  style={{
                                    height: 28,
                                    padding: "0 8px",
                                    borderRadius: 6,
                                    border: "1px solid #bbf7d0",
                                    background: "#f0fdf4",
                                    color: "#16a34a",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer"
                                  }}
                                >
                                  Activate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeactivate(m)}
                                  disabled={actionLoading === `deactivate:${m.uid}`}
                                  style={{
                                    height: 28,
                                    padding: "0 8px",
                                    borderRadius: 6,
                                    border: "1px solid #fed7aa",
                                    background: "#fff7ed",
                                    color: "#c2410c",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer"
                                  }}
                                >
                                  Deactivate
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(m)}
                                disabled={actionLoading === `delete:${m.uid}`}
                                style={{
                                  height: 28,
                                  padding: "0 8px",
                                  borderRadius: 6,
                                  border: "1px solid #fecaca",
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer"
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* RECURRING FOOTER */}
            {!loading && filteredRecurringMembers.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 12,
                  flexWrap: "wrap",
                  fontSize: 12,
                  color: "#6b7280"
                }}
              >
                <span>
                  Showing <strong style={{ color: "#374151" }}>{filteredRecurringMembers.length}</strong> of{" "}
                  <strong style={{ color: "#374151" }}>{recurringMembersList.length}</strong> recurring mandates
                </span>
                <span>Export uses the currently filtered recurring subscriptions.</span>
              </div>
            )}
          </div>
        )}

      </div>

    </Shell>

  );

}


/* =========================================================================
   EXPORT
   ========================================================================= */

window.UsersScreen =
  UsersScreen;
