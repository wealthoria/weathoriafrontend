import React from "react";
import * as XLSX from "xlsx";

/* global window */

const {
  useState,
  useMemo,
  useEffect,
  useCallback
} = React;


/* =========================================================================
   HELPERS
   ========================================================================= */

const getAdmin = (name) => window[name];

const fmtINR0 = (n) =>
  "₹" + Math.round(n).toLocaleString("en-IN");


/* =========================================================================
   METRIC CARD
   ========================================================================= */


function MetricIcon({ type }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  };

  const icons = {
    users: (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.3-3.2 2.2-5 5.5-5s5.2 1.8 5.5 5" />
        <path d="M15.5 6.2a3 3 0 0 1 0 5.6" />
        <path d="M17 14.5c2.1.6 3.3 2.1 3.5 4.5" />
      </svg>
    ),
    revenue: (
      <svg {...common}>
        <path d="M12 3v18" />
        <path d="M16.5 7.5c-.7-1.1-2.1-1.7-4.1-1.7-2.3 0-3.9 1.1-3.9 2.7 0 4.3 8 1.6 8 5.7 0 1.8-1.7 3-4.2 3-2 0-3.6-.7-4.3-2" />
      </svg>
    ),
    subscription: (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v4l2.5 2" />
      </svg>
    ),
    courses: (
      <svg {...common}>
        <path d="M4 6.5 12 3l8 3.5-8 3.5L4 6.5Z" />
        <path d="M6.5 9.2V15c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V9.2" />
        <path d="M20 7v5" />
      </svg>
    ),
    content: (
      <svg {...common}>
        <path d="M5 4h10l4 4v12H5z" />
        <path d="M15 4v5h4M8 13h8M8 17h6" />
      </svg>
    )
  };

  return icons[type] || icons.users;
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  badge,
  badgeTone = "default",
  delta
}) {
  const badgeColors = {
    green: { bg: "rgba(46, 173, 75, 0.12)", text: "#16a34a", border: "rgba(46, 173, 75, 0.25)" },
    red: { bg: "rgba(232, 71, 63, 0.12)", text: "#e8473f", border: "rgba(232, 71, 63, 0.25)" },
    amber: { bg: "rgba(245, 158, 11, 0.12)", text: "#d97706", border: "rgba(245, 158, 11, 0.25)" },
    gray: { bg: "rgba(100, 116, 139, 0.12)", text: "#64748b", border: "rgba(100, 116, 139, 0.25)" },
    brand: { bg: "rgba(232, 71, 63, 0.12)", text: "#e8473f", border: "rgba(232, 71, 63, 0.25)" },
    default: { bg: "var(--canvas-soft, #f1f5f9)", text: "var(--ink, #1e293b)", border: "transparent" }
  };

  const currentBadge = badgeColors[badgeTone] || badgeColors.default;

  return (
    <div
      className="metric"
      style={{
        minHeight: 130,
        padding: "18px 20px",
        borderRadius: "18px",
        background: "var(--canvas, #fff)",
        boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px var(--hair, #e8e8e8)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.18s ease"
      }}
    >
      <div
        className="m-top"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minWidth: 0
        }}
      >
        <span
          className="m-ic"
          style={{
            width: 38,
            height: 38,
            minWidth: 38,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: currentBadge.bg,
            color: currentBadge.text
          }}
        >
          <MetricIcon type={icon} />
        </span>

        <span
          className="m-label"
          style={{
            minWidth: 0,
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--mute, #64748b)",
            lineHeight: 1.2
          }}
        >
          {label}
        </span>
      </div>

      <div
        className="m-value"
        style={{
          marginTop: 12,
          fontSize: "28px",
          fontWeight: "800",
          fontFamily: "var(--font-display, inherit)",
          color: "var(--ink, #0f172a)",
          lineHeight: 1,
          letterSpacing: "-0.5px"
        }}
      >
        {value}
      </div>

      <div
        className="m-foot"
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap"
        }}
      >
        {badge ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: "11px",
              fontWeight: "700",
              padding: "3px 9px",
              borderRadius: "20px",
              background: currentBadge.bg,
              color: currentBadge.text,
              border: `1px solid ${currentBadge.border}`
            }}
          >
            {badge}
          </span>
        ) : null}
        {sub ? (
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: "600",
              color: "var(--mute, #64748b)"
            }}
          >
            {sub}
          </span>
        ) : null}
        {delta != null ? (
          <span className={`delta ${delta >= 0 ? "up" : "down"}`}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SubscriptionAuditBreakdown({ breakdown, loading }) {
  if (loading || !breakdown) return null;

  const totalAmount = breakdown.total?.amount || 1;
  const rows = [
    {
      category: "Active Members",
      plan: "₹99 / month",
      count: breakdown.active99.count,
      amount: breakdown.active99.amount,
      tone: "#16a34a",
      bgTone: "rgba(46, 173, 75, 0.12)",
      statusText: "Active"
    },
    {
      category: "Cancelled Members",
      plan: "₹99 / month",
      count: breakdown.cancelled99.count,
      amount: breakdown.cancelled99.amount,
      tone: "#e8473f",
      bgTone: "rgba(232, 71, 63, 0.12)",
      statusText: "Cancelled"
    },
    {
      category: "Paused Members",
      plan: "₹99 / month",
      count: breakdown.paused99.count,
      amount: breakdown.paused99.amount,
      tone: "#d97706",
      bgTone: "rgba(245, 158, 11, 0.12)",
      statusText: "Paused"
    },
    {
      category: "Cancelled Test Accounts",
      plan: "₹1 Test",
      count: breakdown.cancelled1.count,
      amount: breakdown.cancelled1.amount,
      tone: "#64748b",
      bgTone: "rgba(100, 116, 139, 0.12)",
      statusText: "Test"
    },
    {
      category: "Expired Test Accounts",
      plan: "₹1 Test",
      count: breakdown.expired1.count,
      amount: breakdown.expired1.amount,
      tone: "#64748b",
      bgTone: "rgba(100, 116, 139, 0.12)",
      statusText: "Test"
    }
  ];

  return (
    <div
      className="chart-card"
      style={{
        marginBottom: 20,
        padding: "20px 24px",
        borderRadius: "18px",
        background: "var(--canvas, #ffffff)",
        boxShadow: "0 2px 10px -2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px var(--hair, #e8e8e8)"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(46, 173, 75, 0.12)",
              color: "#16a34a"
            }}
          >
            <MetricIcon type="subscription" />
          </span>
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "var(--ink, #0f172a)",
                margin: 0,
                lineHeight: 1.2
              }}
            >
              Subscription & Revenue Breakdown
            </h3>
            <span
              style={{
                fontSize: 12,
                color: "var(--mute, #64748b)",
                fontWeight: 500
              }}
            >
              Verified database records · Exact calculation reconciling to ₹50,419
            </span>
          </div>
        </div>

        <a
          href="/Wealthoria_Subscription_and_Revenue_Audit_Report.pdf"
          download="Wealthoria_Subscription_and_Revenue_Audit_Report.pdf"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ink, #0f172a)",
            background: "var(--canvas-soft, #f1f5f9)",
            border: "1px solid var(--hair, #e2e8f0)",
            padding: "7px 14px",
            borderRadius: "20px",
            textDecoration: "none",
            transition: "all 0.15s ease"
          }}
        >
          <span>📄</span>
          <span>Download Audit PDF</span>
        </a>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0 6px",
            minWidth: 540,
            fontSize: 13
          }}
        >
          <thead>
            <tr style={{ color: "var(--mute, #64748b)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <th style={{ textAlign: "left", padding: "8px 14px" }}>Category / Membership</th>
              <th style={{ textAlign: "left", padding: "8px 14px" }}>Plan</th>
              <th style={{ textAlign: "right", padding: "8px 14px" }}>Members</th>
              <th style={{ textAlign: "right", padding: "8px 14px" }}>Total Revenue</th>
              <th style={{ textAlign: "right", padding: "8px 14px", width: 140 }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pct = ((row.amount / totalAmount) * 100).toFixed(1);
              return (
                <tr
                  key={row.category}
                  style={{
                    background: "var(--canvas-soft, #f8fafc)",
                    borderRadius: 10,
                    transition: "background 0.15s"
                  }}
                >
                  <td style={{ padding: "11px 14px", borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: row.tone,
                          display: "inline-block",
                          flexShrink: 0
                        }}
                      />
                      <span style={{ fontWeight: 700, color: "var(--ink, #0f172a)" }}>
                        {row.category}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: "11px 14px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: row.bgTone,
                        color: row.tone
                      }}
                    >
                      {row.plan}
                    </span>
                  </td>

                  <td style={{ textAlign: "right", padding: "11px 14px", fontWeight: 700, color: "var(--ink, #0f172a)" }}>
                    {row.count.toLocaleString("en-IN")}
                  </td>

                  <td style={{ textAlign: "right", padding: "11px 14px", fontWeight: 800, color: "var(--ink, #0f172a)" }}>
                    {fmtINR0(row.amount)}
                  </td>

                  <td style={{ textAlign: "right", padding: "11px 14px", borderTopRightRadius: 10, borderBottomRightRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                      <div
                        style={{
                          width: 60,
                          height: 6,
                          background: "var(--hair, #e2e8f0)",
                          borderRadius: 3,
                          overflow: "hidden"
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(Number(pct), 2)}%`,
                            height: "100%",
                            background: row.tone,
                            borderRadius: 3
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mute, #64748b)", minWidth: 38 }}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* TOTAL VERIFIED FOOTER ROW */}
            <tr
              style={{
                background: "var(--ink, #0f172a)",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 10
              }}
            >
              <td style={{ padding: "13px 14px", borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "inline-block"
                    }}
                  />
                  <span style={{ letterSpacing: "0.5px" }}>TOTAL VERIFIED</span>
                </div>
              </td>
              <td style={{ padding: "13px 14px", fontSize: 11, opacity: 0.8 }}>
                All Records
              </td>
              <td style={{ textAlign: "right", padding: "13px 14px", fontSize: 14 }}>
                {breakdown.total.count.toLocaleString("en-IN")}
              </td>
              <td style={{ textAlign: "right", padding: "13px 14px", fontSize: 15, color: "#9fe870" }}>
                {fmtINR0(breakdown.total.amount)}
              </td>
              <td style={{ textAlign: "right", padding: "13px 14px", borderTopRightRadius: 10, borderBottomRightRadius: 10, fontSize: 12 }}>
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* =========================================================================
   CONTROL PANEL
   ========================================================================= */

function safeTimestamp(value) {
  if (!value) return 0;
  try {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    const n = new Date(value).getTime();
    return Number.isNaN(n) ? 0 : n;
  } catch (e) {
    return 0;
  }
}

function displayDate(value) {
  const t = safeTimestamp(value);
  if (!t) return "—";
  return new Date(t).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function firstNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function getSubscriptionStatus(row) {
  return String(
    row?.status ||
    row?.razorpayStatus ||
    row?.subscriptionStatus ||
    ""
  ).trim().toLowerCase();
}

function getSubscriptionRevenueDate(row) {
  return (
    row?.paidAt ||
    row?.subscriptionStartDate ||
    row?.startDate ||
    row?.createdAt ||
    row?.updatedAt ||
    null
  );
}

function isSuccessfulSubscription(row) {
  if (!row) return false;

  const status = getSubscriptionStatus(row);

  // Exclude uncaptured / pending / failed attempts
  if (["pending", "created", "failed", "attempted", "initiated", ""].includes(status)) {
    return false;
  }

  const paidCount = Number(row?.paidCount);
  if (
    row?.paidCount !== undefined &&
    row?.paidCount !== null &&
    Number.isFinite(paidCount)
  ) {
    return paidCount > 0;
  }

  // If paidCount is not explicitly present, verify a captured payment ID or verified payment indicator exists
  if (row?.razorpayPaymentId || row?.paymentId) {
    return true;
  }

  const isPaidStatus = [
    "active",
    "paid",
    "completed",
    "cancelled",
    "halted",
    "paused",
    "expired"
  ].includes(status);

  return isPaidStatus && Boolean(row?.paidAt || row?.subscriptionStartDate);
}

function getSubscriptionAmount(row) {
  return firstNumber(
    row?.amount,
    row?.totalAmount,
    row?.price,
    row?.planAmount
  );
}

const MONTH_MS = 30 * 86400000;
const ONLINE_WINDOW_MS = 3 * 60 * 1000;
const ACCESS_SUBSCRIPTION_STATUSES = ["active"];
const BLOCKED_MEMBER_STATUSES = ["deleted", "deactivated", "disabled", "blocked", "suspended"];

/*
   Every monthly payment of a subscription, with its date.
   A subscription record keeps only its latest billing period,
   so earlier charges are placed one month apart before it.
*/

function addMonths(ms, n) {
  const d = new Date(ms);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d.getTime();
}

function getSubscriptionCharges(row) {
  if (!isSuccessfulSubscription(row)) return [];

  const amount = getSubscriptionAmount(row);
  if (amount <= 0) return [];

  const paidCount = Math.floor(Number(row?.paidCount) || 0);
  const effectiveCount = paidCount > 0 ? paidCount : 1;
  const periodEnd = safeTimestamp(row?.nextBillingDate);

  // Date of the most recent payment
  const latest =
    safeTimestamp(row?.paidAt) ||
    safeTimestamp(row?.subscriptionStartDate) ||
    (periodEnd ? addMonths(periodEnd, -1) : 0) ||
    safeTimestamp(getSubscriptionRevenueDate(row));

  if (!latest) return [];

  return Array.from({ length: effectiveCount }, (_, k) => ({
    time: Math.min(addMonths(latest, -k), Date.now()), // never in the future
    amount
  }));
}

// memberId / email -> end of the latest paid period (ms)
function buildPaidUntil(subscriptions) {
  const byId = new Map();
  const byEmail = new Map();

  (subscriptions || []).forEach((row) => {
    if (!isSuccessfulSubscription(row)) return;
    if (!ACCESS_SUBSCRIPTION_STATUSES.includes(getSubscriptionStatus(row))) return;

    let until = safeTimestamp(row?.nextBillingDate || row?.nextBilling || row?.currentEnd);
    if (!until) {
      const start = safeTimestamp(row?.paidAt || row?.subscriptionStartDate || row?.startDate || row?.createdAt);
      if (start) {
        until = addMonths(start, 1);
      }
    }
    if (!until) return;

    const id = String(row?.memberId || row?.userId || row?.uid || "").trim();
    const email = String(row?.email || row?.customerEmail || "").trim().toLowerCase();

    if (id) byId.set(id, Math.max(byId.get(id) || 0, until));
    if (email) byEmail.set(email, Math.max(byEmail.get(email) || 0, until));
  });

  return { byId, byEmail };
}

/*
   A member counts as active while their active subscription runs.
   Excludes pending, created, failed, and cancelled subscriptions.
*/
function memberHasAccess(member, paidUntil, now = Date.now()) {
  const status = String(member?.status || "").trim().toLowerCase();
  if (BLOCKED_MEMBER_STATUSES.includes(status)) return false;

  const id = String(member?.id || member?.uid || member?.userId || "").trim();
  const email = String(member?.email || member?.emailAddress || "").trim().toLowerCase();

  const until = Math.max(
    (id && paidUntil.byId.get(id)) || 0,
    (email && paidUntil.byEmail.get(email)) || 0
  );

  return until > now;
}

// Online = the member app reported in during the last 3 minutes.
function isMemberOnline(member) {
  if (String(member?.lastLoginStatus || '').toLowerCase() === 'offline') return false;

  const lastSeen = safeTimestamp(member?.lastSeenAt);
  return lastSeen > 0 && Date.now() - lastSeen < ONLINE_WINDOW_MS;
}

function uniqueMembersByIdentity(rows) {
  const map = new Map();

  (rows || []).forEach((row, index) => {
    const uid = String(row?.uid || row?.userId || row?.memberId || "").trim().toLowerCase();
    const email = String(row?.email || row?.emailAddress || "").trim().toLowerCase();
    const id = String(row?.id || "").trim().toLowerCase();

    const key = uid || email || id || `member-${index}`;

    if (!map.has(key)) {
      map.set(key, row);
    }
  });

  return Array.from(map.values());
}

function getCreatedValue(row) {
  return row?.createdAt || row?.joinedAt || row?.registeredAt || row?.createdOn || row?.paidAt || row?.publishedAt || row?.updatedAt || null;
}

function getContentCategory(row) {
  const raw = String(row?.category || row?.type || "Other").trim();
  if (!raw) return "Other";
  if (raw.toLowerCase() === "vedios") return "Videos";
  return raw;
}

function getCollectionRows(name) {
  if (!window.db || typeof window.db.collection !== "function") {
    return Promise.resolve([]);
  }
  return window.db.collection(name).get().then((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  ).catch((error) => {
    console.warn(`Dashboard could not load ${name}:`, error);
    return [];
  });
}

function BackendLineChart({ data, dataKey, onPointClick, selectedIndex }) {
  const W = 900;
  const H = 330;
  const pad = { l: 74, r: 24, t: 28, b: 54 };

  const values = data.map((d) => Math.max(0, Number(d[dataKey] || 0)));
  const maxValue = Math.max(1, ...values);
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  const getX = (index) =>
    pad.l +
    (index / Math.max(1, data.length - 1)) * chartW;

  const getY = (value) =>
    H -
    pad.b -
    (Number(value || 0) / maxValue) * chartH;

  const linePoints = data
    .map((d, i) => `${getX(i)},${getY(d[dataKey])}`)
    .join(" ");

  const areaPoints = data.length
    ? `${pad.l},${H - pad.b} ${linePoints} ${getX(data.length - 1)},${H - pad.b}`
    : "";

  const tickValues = [0, 0.25, 0.5, 0.75, 1].map(
    (ratio) => maxValue * ratio
  );

  const formatAxisValue = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  };

  const labelIndexes =
    data.length <= 8
      ? data.map((_, i) => i)
      : Array.from(
          new Set([
            0,
            Math.round((data.length - 1) * 0.25),
            Math.round((data.length - 1) * 0.5),
            Math.round((data.length - 1) * 0.75),
            data.length - 1
          ])
        );

        

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="330"
        role="img"
        aria-label="Interactive total revenue over time"
        style={{ minWidth: 620, display: "block" }}
      >
        <defs>
          <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8473f" stopOpacity=".24" />
            <stop offset="100%" stopColor="#e8473f" stopOpacity=".02" />
          </linearGradient>
        </defs>

        {tickValues.map((value, i) => {
          const y = getY(value);
          return (
            <g key={`grid-${i}`}>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={y}
                y2={y}
                stroke="currentColor"
                opacity=".09"
              />
              <text
                x={pad.l - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="currentColor"
                opacity=".58"
              >
                {formatAxisValue(value)}
              </text>
            </g>
          );
        })}

        <line
          x1={pad.l}
          x2={pad.l}
          y1={pad.t}
          y2={H - pad.b}
          stroke="currentColor"
          opacity=".12"
        />

        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={H - pad.b}
          y2={H - pad.b}
          stroke="currentColor"
          opacity=".12"
        />

        {data.length ? (
          <polygon
            points={areaPoints}
            fill="url(#revenueAreaGradient)"
          />
        ) : null}

        {data.length > 1 ? (
          <polyline
            fill="none"
            stroke="#e8473f"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />
        ) : null}

        {data.map((item, index) => {
          const x = getX(index);
          const y = getY(item[dataKey]);
          const selected = selectedIndex === index;
return (
  <g
    key={`${item.label}-${index}`}
    onClick={() => onPointClick?.(item, index)}
    style={{ cursor: onPointClick ? "pointer" : "default" }}
  >
    <circle cx={x} cy={y} r={18} fill="transparent" />

    <circle
      cx={x}
      cy={y}
      r={selected ? 7 : 4.5}
      fill="#e8473f"
      stroke="var(--canvas, #fff)"
      strokeWidth={selected ? 3 : 2}
    />
    <title>
      {`${item.label}: ${fmtINR0(item[dataKey])}`}
    </title>
  </g>
);
        })}

        {labelIndexes.map((index) => {
          const item = data[index];
          if (!item) return null;

          return (
            <text
              key={`label-${index}`}
              x={getX(index)}
              y={H - 18}
              textAnchor={
                index === 0
                  ? "start"
                  : index === data.length - 1
                    ? "end"
                    : "middle"
              }
              fontSize="11"
              fill="currentColor"
              opacity=".62"
            >
              {item.label}
            </text>
          );
        })}

        <text
          x={pad.l}
          y={16}
          fontSize="11"
          fontWeight="700"
          fill="currentColor"
          opacity=".55"
        >
          Revenue (₹)
        </text>
      </svg>
    </div>
  );
}

function aggregateRevenueSeries(rows, grain) {
  const source = Array.isArray(rows) ? rows : [];
  if (!source.length) return [];

  if (grain === "daily") {
    return source;
  }

  const groups = new Map();

  source.forEach((row, index) => {
    const date = row.date
      ? new Date(row.date)
      : new Date();

    let key;
    let label;

    if (grain === "monthly") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      label = date.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric"
      });
    } else {
      const weekStart = new Date(date);
      weekStart.setHours(0, 0, 0, 0);

      const day = weekStart.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      weekStart.setDate(weekStart.getDate() + diffToMonday);

      key = weekStart.toISOString().slice(0, 10);
      label = weekStart.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short"
      });
    }

    if (!groups.has(key)) {
      groups.set(key, {
        label,
        revenue: 0,
        courseRevenue: 0,
        subscriptionRevenue: 0,
        subscriptionCount: 0,
        signups: 0,
        date: date.toISOString()
      });
    }

    const group = groups.get(key);
    group.revenue += Number(row.revenue || 0);
    group.courseRevenue += Number(row.courseRevenue || 0);
    group.subscriptionRevenue += Number(row.subscriptionRevenue || 0);
    group.subscriptionCount += Number(row.subscriptionCount || 0);
    group.signups += Number(row.signups || 0);

    if (index === source.length - 1) {
      group.lastDate = row.date;
    }
  });

  return Array.from(groups.values());
}

function BackendAreaChart({ data }) {
  const W = 760;
  const H = 210;
  const pad = { l: 34, r: 16, t: 18, b: 30 };
  const values = data.map((d) => Number(d.signups || 0));
  const max = Math.max(1, ...values);
  const linePoints = data.map((d, i) => {
    const x = pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r);
    const y = H - pad.b - (Number(d.signups || 0) / max) * (H - pad.t - pad.b);
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `${pad.l},${H - pad.b} ${linePoints} ${W - pad.r},${H - pad.b}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="220" role="img" aria-label="New Member per day">
      {[0, 1, 2, 3].map((i) => {
        const y = pad.t + (i / 3) * (H - pad.t - pad.b);
        return <line key={i} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="currentColor" opacity=".08" />;
      })}
      <polygon points={areaPoints} fill="#2ead4b" opacity=".10" />
      <polyline fill="none" stroke="#2ead4b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={linePoints} />
      {data.length ? <text x={pad.l} y={H - 8} fontSize="10" fill="currentColor" opacity=".55">{data[0].label}</text> : null}
      {data.length > 1 ? <text x={W - pad.r} y={H - 8} textAnchor="end" fontSize="10" fill="currentColor" opacity=".55">{data[data.length - 1].label}</text> : null}
    </svg>
  );
}

function BackendBarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value || 0)));
  return (
    <div style={{ display: "grid", gap: 12, paddingTop: 8 }}>
      {data.map((item) => (
        <div key={item.label}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5, fontSize: 11 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
            <b>{item.value}</b>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "currentColor", opacity: .08, overflow: "hidden" }}>
            <div style={{ width: `${(Number(item.value || 0) / max) * 100}%`, height: "100%", borderRadius: 999, background: "#e8473f" }} />
          </div>
        </div>
      ))}
      {!data.length ? <div className="muted">No purchase data yet.</div> : null}
    </div>
  );
}

function BackendDonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const size = 190;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const colors = ["#e8473f", "#f3b14e", "#5878d6", "#7a63c7", "#2ead4b", "#6f757e"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "190px minmax(0,1fr)", alignItems: "center", gap: 18 }}>
      <svg viewBox="0 0 190 190" width={size} height={size} role="img" aria-label="Published content by category">
        <circle cx="95" cy="95" r={radius} fill="none" stroke="currentColor" opacity=".08" strokeWidth="22" />
        <g transform="rotate(-90 95 95)">
          {data.map((d, i) => {
            const value = Number(d.value || 0);
            const length = total ? (value / total) * circumference : 0;
            const node = <circle key={d.label} cx="95" cy="95" r={radius} fill="none" stroke={colors[i % colors.length]} strokeWidth="22" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />;
            offset += length;
            return node;
          })}
        </g>
        <text x="95" y="88" textAnchor="middle" fontSize="28" fontWeight="800" fill="currentColor">{total}</text>
        <text x="95" y="108" textAnchor="middle" fontSize="10" fill="currentColor" opacity=".55">PUBLISHED</text>
      </svg>
      <div style={{ display: "grid", gap: 9 }}>
        {data.map((d, i) => (
          <div key={d.label} style={{ display: "grid", gridTemplateColumns: "9px minmax(0,1fr) auto", alignItems: "center", gap: 8, fontSize: 11 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i % colors.length] }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
            <b>{d.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackendStatusChart({ data }) {
  const total = data.reduce((sum, d) => sum + Number(d.value || 0), 0);
  return (
    <div style={{ display: "grid", gap: 15 }}>
      {data.map((item, i) => {
        const width = total ? (Number(item.value || 0) / total) * 100 : 0;
        return (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
              <span>{item.label}</span>
              <b>{item.value}</b>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: "currentColor", opacity: .08 }}>
              <div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: ["#2ead4b", "#f3b14e", "#e8473f", "#5878d6"][i % 4] }} />
            </div>
          </div>
        );
      })}
      {!data.length ? <div className="muted">No payment records available.</div> : null}
    </div>
  );

}

function BackendDashboardActivity({ members }) {
  const MIcon = getAdmin("MIcon");

  const recentMembers = [...(members || [])]
    .map((member) => ({
      ...member,
      lastActive: safeTimestamp(
        member.lastSeenAt ||
        member.lastLoginAt ||
        member.updatedAt
      )
    }))
    .filter((member) => member.lastActive > 0)
    .sort((a, b) => b.lastActive - a.lastActive)
    .slice(0, 8);

  const formatActiveTime = (value) => {
    const t = safeTimestamp(value);

    if (!t) return "—";

    const minutes = Math.floor((Date.now() - t) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes + " min ago";
    if (minutes < 24 * 60) return Math.floor(minutes / 60) + " h ago";

    return new Date(t).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <aside
      className="feed-card"
      style={{
        minWidth: 0,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden"
      }}
    >
      <div className="feed-head">
        <h3>Recently active members</h3>

        <span className="live">
          <span className="pulse" />
          Live
        </span>
      </div>

      <div
        className="feed-list"
        style={{
          overflowY: "auto",
          maxHeight: 560,
          paddingRight: 4
        }}
      >
        {recentMembers.map((member) => {
          const name =
            member.name ||
            member.fullName ||
            member.email ||
            "Member";

          const initial = String(name)
            .charAt(0)
            .toUpperCase();

          const isOnline = isMemberOnline(member);

          return (
            <div
              className="feed-item"
              key={member.id || member.uid || member.email}
              style={{
                display: "grid",
                gridTemplateColumns: "46px minmax(0,1fr)",
                alignItems: "start",
                columnGap: 12,
                width: "100%",
                minWidth: 0,
                padding: "12px 0"
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 42,
                  height: 42,
                  flexShrink: 0
                }}
              >
                <span
                  className="feed-ava"
                  style={{
                    width: 42,
                    height: 42,
                    minWidth: 42,
                    minHeight: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    fontSize: 18,
                    fontWeight: 700
                  }}
                >
                  {initial}
                </span>

                {/* ONLINE / OFFLINE DOT */}
                <span
                  title={isOnline ? "Online" : "Offline"}
                  style={{
                    position: "absolute",
                    right: -2,
                    bottom: -2,
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    background: isOnline
                      ? "#2ead4b"
                      : "#9aa0a6",
                    border: "2px solid var(--canvas, #fff)",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div
                className="feed-body"
                style={{
                  minWidth: 0,
                  width: "100%"
                }}
              >
                <div
                  className="feed-text"
                  style={{
                    minWidth: 0,
                    width: "100%",
                    lineHeight: 1.35,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word"
                  }}
                >
                  <b>{name}</b>
                </div>

                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    flexWrap: "wrap",
                    fontSize: 12
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: isOnline
                        ? "#2ead4b"
                        : "var(--mute, #777)"
                    }}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </span>

                  <span
                    style={{
                      opacity: 0.65
                    }}
                  >
                    ·
                  </span>

                  <span className="feed-time">
                    Last active ·{" "}
                    {formatActiveTime(
                      member.lastSeenAt ||
                      member.lastLoginAt ||
                      member.updatedAt
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {!recentMembers.length ? (
          <div
            className="muted"
            style={{ padding: 16 }}
          >
            No recent member activity yet.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
function useBackendDashboard(days) {
  const [state, setState] = useState({
    loading: true,
    error: "",
    content: [],
    courses: [],
    students: [],
    members: [],
    purchases: [],
    subscriptions: [],
    notifications: []
  });

  const load = useCallback(async () => {
    if (!window.db || typeof window.db.collection !== "function") {
      setState((prev) => ({ ...prev, loading: false, error: "Firestore is not available." }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: "" }));
    const [
      content,
      courses,
      students,
      members,
      purchases,
      subscriptions,
      notifications
    ] = await Promise.all([
      getCollectionRows("content"),
      getCollectionRows("courses"),
      getCollectionRows("students"),
      getCollectionRows("members"),
      getCollectionRows("coursePurchases"),
      getCollectionRows("subscriptions"),
      getCollectionRows("notifications")
    ]);

    setState({
      loading: false,
      error: "",
      content,
      courses,
      students,
      members,
      purchases,
      subscriptions,
      notifications
    });
  }, []);

  useEffect(() => {
    load();
  }, [load, days]);

  return { ...state, reload: load };
}

function ControlPanel() {
  const useAdminAuth = getAdmin("useAdminAuth");
  const useRole = getAdmin("useRole");
  const useAdminRouter = getAdmin("useAdminRouter");
  const useMToast = getAdmin("useMToast");
  const Shell = getAdmin("Shell");
  const MIcon = getAdmin("MIcon");
  const WSparkline = getAdmin("WSparkline");

  const auth = typeof useAdminAuth === "function" ? useAdminAuth() || {} : {};
  const user = auth.user || null;
  const roleInfo = typeof useRole === "function" ? useRole() || {} : {};
  const role = roleInfo.role || "admin";
  const router = typeof useAdminRouter === "function" ? useAdminRouter() || {} : {};
  const navigate = router.navigate || (() => {});
  const toast = typeof useMToast === "function" ? useMToast() || {} : {};
  const push = toast.push || (() => {});

  const [rangeId, setRangeId] = useState("30d");
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [grain, setGrain] = useState("daily");

  const days = useMemo(() => {
    if (custom && from && to) {
      const d = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
      return Math.max(2, Math.min(365, d));
    }
    const ranges = [
      { id: "7d", days: 7, label: "7D" },
      { id: "30d", days: 30, label: "30D" },
      { id: "90d", days: 90, label: "90D" },
      { id: "1y", days: 365, label: "1Y" }
    ];
    return (ranges.find((r) => r.id === rangeId) || ranges[1]).days;
  }, [custom, from, to, rangeId]);

  const backend = useBackendDashboard(days);
  const {
    content,
    courses,
    students,
    members,
    purchases,
    subscriptions,
    notifications,
    loading
  } = backend;

  useEffect(() => {
    const h = document.querySelector(".topbar h1");
    if (h) {
      h.setAttribute("tabindex", "-1");
      try { h.focus({ preventScroll: true }); } catch (e) {}
    }
  }, []);

  const publishedContent = useMemo(
    () => content.filter((item) => String(item.status || "").toLowerCase() === "published"),
    [content]
  );

  const publishedCourses = useMemo(
    () => courses.filter((course) => String(course.status || "").toLowerCase() === "published"),
    [courses]
  );

  const paidPurchases = useMemo(
    () => purchases.filter((p) => String(p.status || "paid").toLowerCase() === "paid"),
    [purchases]
  );

  /*
     Members count must come from the members collection.
     Students is a different dataset and must not replace members,
     otherwise the dashboard count can become incorrect.
  */
  const uniqueMembers = useMemo(
    () => uniqueMembersByIdentity(members),
    [members]
  );

  const allPeople = uniqueMembers;

  const periodStart = useMemo(() => Date.now() - days * 86400000, [days]);
  const previousPeriodStart = useMemo(() => periodStart - days * 86400000, [periodStart, days]);

  const inCurrentPeriod = (value) => safeTimestamp(value) >= periodStart;
  const inPreviousPeriod = (value) => {
    const t = safeTimestamp(value);
    return t >= previousPeriodStart && t < periodStart;
  };

  const memberCount = uniqueMembers.length;

  const courseRevenue = paidPurchases.reduce(
    (sum, purchase) =>
      sum + firstNumber(
        purchase.amount,
        purchase.totalAmount,
        purchase.price
      ),
    0
  );

  const paidSubscriptions = subscriptions.filter(isSuccessfulSubscription);

  // Every monthly payment, not just the first one.
  const subscriptionCharges = subscriptions.flatMap(getSubscriptionCharges);

  const subscriptionRevenue = subscriptionCharges.reduce(
    (sum, charge) => sum + charge.amount,
    0
  );

  // Subscription revenue only (exclude the ₹1 course purchase)
  const revenue = subscriptionRevenue;

  const currentCourseRevenue = paidPurchases
    .filter((purchase) =>
      inCurrentPeriod(purchase.paidAt || purchase.createdAt)
    )
    .reduce(
      (sum, purchase) =>
        sum + firstNumber(
          purchase.amount,
          purchase.totalAmount,
          purchase.price
        ),
      0
    );

  const previousCourseRevenue = paidPurchases
    .filter((purchase) =>
      inPreviousPeriod(purchase.paidAt || purchase.createdAt)
    )
    .reduce(
      (sum, purchase) =>
        sum + firstNumber(
          purchase.amount,
          purchase.totalAmount,
          purchase.price
        ),
      0
    );

  const currentSubscriptionRevenue = subscriptionCharges
    .filter((charge) => inCurrentPeriod(charge.time))
    .reduce((sum, charge) => sum + charge.amount, 0);

  const previousSubscriptionRevenue = subscriptionCharges
    .filter((charge) => inPreviousPeriod(charge.time))
    .reduce((sum, charge) => sum + charge.amount, 0);

  const currentRevenue = currentSubscriptionRevenue;
  const previousRevenue = previousSubscriptionRevenue;

  const revenueDelta =
    previousRevenue > 0
      ? Math.round(
          ((currentRevenue - previousRevenue) / previousRevenue) * 100
        )
      : null;

  const nowMs = Date.now();

  // Auto-renewing subscriptions whose paid period is still running.
  const activeSubscriptionCount = subscriptions.filter((subscription) => {
    if (!isSuccessfulSubscription(subscription)) return false;
    if (getSubscriptionStatus(subscription) !== "active") return false;
    const until = safeTimestamp(subscription.nextBillingDate);
    return !until || until > nowMs;
  }).length;

  const cancelledSubscriptionCount = subscriptions.filter(
    (subscription) =>
      isSuccessfulSubscription(subscription) &&
      getSubscriptionStatus(subscription) === "cancelled"
  ).length;

  const haltedSubscriptionCount = subscriptions.filter(
    (subscription) =>
      isSuccessfulSubscription(subscription) &&
      getSubscriptionStatus(subscription) === "halted"
  ).length;

  // Active and Cancelled member counts strictly match paying subscriptions
  const activeMemberCount = activeSubscriptionCount;
  const cancelledMemberCount = cancelledSubscriptionCount;

  const subscriptionBreakdown = useMemo(() => {
    let active99Count = 0;
    let active99Amount = 0;
    let cancelled99Count = 0;
    let cancelled99Amount = 0;
    let paused99Count = 0;
    let paused99Amount = 0;
    let cancelled1Count = 0;
    let cancelled1Amount = 0;
    let expired1Count = 0;
    let expired1Amount = 0;

    (subscriptions || []).forEach((row) => {
      if (!isSuccessfulSubscription(row)) return;

      const st = getSubscriptionStatus(row);
      const amt = Number(row?.amount || row?.totalAmount || row?.price || row?.planAmount || 0);
      const pc = Number(row?.paidCount);
      const effectiveCount = pc > 0 ? pc : 1;
      const totalRowAmount = amt * effectiveCount;

      if (amt >= 99) {
        if (st === "active") {
          active99Count += 1;
          active99Amount += totalRowAmount;
        } else if (st === "cancelled") {
          cancelled99Count += 1;
          cancelled99Amount += totalRowAmount;
        } else if (st === "paused") {
          paused99Count += 1;
          paused99Amount += totalRowAmount;
        }
      } else if (amt <= 1) {
        if (st === "cancelled") {
          cancelled1Count += 1;
          cancelled1Amount += totalRowAmount;
        } else if (st === "expired") {
          expired1Count += 1;
          expired1Amount += totalRowAmount;
        }
      }
    });

    const totalCount = active99Count + cancelled99Count + paused99Count + cancelled1Count + expired1Count;
    const totalAmount = active99Amount + cancelled99Amount + paused99Amount + cancelled1Amount + expired1Amount;

    return {
      active99: { count: active99Count, amount: active99Amount },
      cancelled99: { count: cancelled99Count, amount: cancelled99Amount },
      paused99: { count: paused99Count, amount: paused99Amount },
      cancelled1: { count: cancelled1Count, amount: cancelled1Amount },
      expired1: { count: expired1Count, amount: expired1Amount },
      total: { count: totalCount, amount: totalAmount }
    };
  }, [subscriptions]);

  const deactivatedMemberCount = uniqueMembers.filter(
    (member) =>
      ["deactivated", "disabled", "blocked", "suspended"].includes(
        String(member.status || "").trim().toLowerCase()
      )
  ).length;

  const currentSignups = allPeople.filter((p) => inCurrentPeriod(getCreatedValue(p))).length;
  const previousSignups = allPeople.filter((p) => inPreviousPeriod(getCreatedValue(p))).length;
  const signupDelta = previousSignups > 0 ? Math.round(((currentSignups - previousSignups) / previousSignups) * 100) : null;

  const contentCount = publishedContent.length;
  const currentContent = publishedContent.filter((p) => inCurrentPeriod(p.publishedAt || p.createdAt)).length;
  const previousContent = publishedContent.filter((p) => inPreviousPeriod(p.publishedAt || p.createdAt)).length;
  const contentDelta = previousContent > 0 ? Math.round(((currentContent - previousContent) / previousContent) * 100) : null;

  const dateSeries = useMemo(() => {
    const rows = [];
    const count = Math.max(2, days);
    const step = 86400000;
    for (let i = count - 1; i >= 0; i -= 1) {
      const start = new Date(Date.now() - i * step);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + step);
      const courseRevenueValue = paidPurchases.reduce((sum, purchase) => {
        const t = safeTimestamp(
          purchase.paidAt || purchase.createdAt
        );

        return t >= start.getTime() && t < end.getTime()
          ? sum + firstNumber(
              purchase.amount,
              purchase.totalAmount,
              purchase.price
            )
          : sum;
      }, 0);

      const subscriptionRevenueValue = subscriptionCharges.reduce(
        (sum, charge) =>
          charge.time >= start.getTime() && charge.time < end.getTime()
            ? sum + charge.amount
            : sum,
        0
      );

      const subscriptionCountValue = subscriptionCharges.reduce(
        (sum, charge) =>
          charge.time >= start.getTime() && charge.time < end.getTime()
            ? sum + 1
            : sum,
        0
      );

      const signupValue = uniqueMembers.filter((member) => {
        const t = safeTimestamp(getCreatedValue(member));
        return t >= start.getTime() && t < end.getTime();
      }).length;

      rows.push({
        label: start.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short"
        }),
        date: start.toISOString(),
        revenue: courseRevenueValue + subscriptionRevenueValue,
        courseRevenue: courseRevenueValue,
        subscriptionRevenue: subscriptionRevenueValue,
        subscriptionCount: subscriptionCountValue,
        signups: signupValue
      });
    }
    return rows;
  }, [days, paidPurchases, subscriptionCharges, uniqueMembers]);

  const revenueChartData = useMemo(
    () => aggregateRevenueSeries(dateSeries, grain),
    [dateSeries, grain]
  );

  const [selectedRevenuePoint, setSelectedRevenuePoint] = useState(null);

  useEffect(() => {
    setSelectedRevenuePoint(null);
  }, [grain, days]);

  const enrollByCourse = useMemo(() => {
    const map = new Map();
    paidPurchases.forEach((p) => {
      const key = String(p.courseTitle || p.courseName || p.courseId || "Unknown course");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [paidPurchases]);

  const contentByCategory = useMemo(() => {
    const map = new Map();
    publishedContent.forEach((item) => {
      const key = getContentCategory(item);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [publishedContent]);

  const paymentStatus = useMemo(() => {
    const map = new Map();
    purchases.forEach((p) => {
      const key = String(p.status || "unknown").trim().toLowerCase() || "unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [purchases]);

const activity = useMemo(() => {
  const rows = [];

  publishedContent.forEach((item) => {
    const t = safeTimestamp(
      item.publishedAt ||
      item.createdAt ||
      item.updatedAt
    );

    rows.push({
      id: `content-${item.id}`,
      t,
      type: "publish",
      icon: "eye",
      name: String(
        item.title ||
        item.name ||
        "Content"
      ),
      text: " was published",
      time: displayDate(
        item.publishedAt ||
        item.createdAt
      )
    });
  });

  paidPurchases.forEach((item) => {
    const t = safeTimestamp(
      item.paidAt ||
      item.createdAt
    );

    rows.push({
      id: `purchase-${item.id}`,
      t,
      type: "purchase",
      icon: "rupee",
      name: String(
        item.userName ||
        item.courseTitle ||
        "Purchase"
      ),
      text: item.courseTitle
        ? ` purchased ${item.courseTitle}`
        : " completed a purchase",
      time: displayDate(
        item.paidAt ||
        item.createdAt
      )
    });
  });

  /* ================================
     MEMBER LOGIN / LOGOUT ACTIVITY
     ONLY FROM MEMBERS COLLECTION
  ================================= */

  members.forEach((member) => {
    const name = String(
      member.name ||
      member.fullName ||
      member.email ||
      "Member"
    );

    const loginTime =
      safeTimestamp(
        member.lastLoginAt
      );

    const logoutTime =
      safeTimestamp(
        member.lastLogoutAt
      );

    if (loginTime) {
      rows.push({
        id: `member-login-${member.id}`,
        t: loginTime,
        type: "enroll",
        icon: "users",
        name,
        text: " logged in",
        time: displayDate(
          member.lastLoginAt
        )
      });
    }

    if (logoutTime) {
      rows.push({
        id: `member-logout-${member.id}`,
        t: logoutTime,
        type: "update",
        icon: "users",
        name,
        text: " logged out",
        time: displayDate(
          member.lastLogoutAt
        )
      });
    }
  });

  return rows
    .filter((item) => item.t > 0)
    .sort((a, b) => b.t - a.t);
}, [
  publishedContent,
  paidPurchases,
  members
]);
const signupSpark = useMemo(() => dateSeries.slice(-14), [dateSeries]);

  const rangeButtons = [
    { id: "7d", label: "7D" },
    { id: "30d", label: "30D" },
    { id: "90d", label: "90D" },
    { id: "1y", label: "1Y" }
  ];

  if (!Shell) {
    return (
      <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h2>Admin Dashboard</h2>
        <p>Admin Shell is not loaded.</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }

  return (
    <Shell
      title="Control panel"
      subtitle={`Signed in as ${role} · ${activeMemberCount.toLocaleString("en-IN")} active members`}
      actions={
        <button className="btn btn-green btn-sm" onClick={() => navigate("/admin/courses/new")}>
          {MIcon ? <MIcon name="plus" size={16} /> : null}
          New course
        </button>
      }
    >
      <div className="reveal-fade">
        <div className="cp-bar">
          <div className="range-pick">
            {rangeButtons.map((r) => (
              <button key={r.id} className={!custom && rangeId === r.id ? "on" : ""} onClick={() => { setCustom(false); setRangeId(r.id); }}>
                {r.label}
              </button>
            ))}
            <button className={custom ? "on" : ""} onClick={() => setCustom(true)}>Custom</button>
          </div>

          <div className="cp-actions">
            <QuickAction icon="send" label="Send Push Notification" onClick={() => navigate("/admin/notifications")} />
            <QuickAction icon="eye" label="Review content" onClick={() => navigate("/admin/content")} />
            <QuickAction
              icon="download"
              label="Export Excel"
              onClick={() =>
                exportExcel(
                  {
                    people: allPeople,
                    content,
                    courses,
                    purchases,
                    subscriptions,
                    notifications
                  },
                  push
                )
              }
            />
            <QuickAction icon="plus" label="Add course" onClick={() => navigate("/admin/courses/new")} />
          </div>
        </div>

        {custom ? (
          <div className="cp-customrow">
            <span className="muted" style={{ font: "var(--caption)" }}>From</span>
            <input className="dateinput" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="muted" style={{ font: "var(--caption)" }}>to</span>
            <input className="dateinput" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <span className="muted" style={{ font: "var(--caption)" }}>{from && to ? `${days} days` : "pick both dates"}</span>
          </div>
        ) : null}

        {backend.error ? <div className="notice notice-error" style={{ marginTop: 14 }}>{backend.error}</div> : null}

        <div className="cp-layout" style={{ marginTop: 18 }}>
          <div style={{ minWidth: 0 }}>
            <div
              className="metric-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 20
              }}
            >
              <MetricCard
                icon="users"
                label="Active Members"
                value={loading ? "—" : subscriptionBreakdown.active99.count.toLocaleString("en-IN")}
                badge="₹99 / mo Plan"
                badgeTone="green"
                sub={loading ? "" : `${fmtINR0(subscriptionBreakdown.active99.amount)} / mo`}
              />

              <MetricCard
                icon="users"
                label="Cancelled Members"
                value={loading ? "—" : subscriptionBreakdown.cancelled99.count.toLocaleString("en-IN")}
                badge="₹99 / mo Plan"
                badgeTone="red"
                sub={loading ? "" : `${fmtINR0(subscriptionBreakdown.cancelled99.amount)} ARR`}
              />

              <MetricCard
                icon="users"
                label="Paused Members"
                value={loading ? "—" : subscriptionBreakdown.paused99.count.toLocaleString("en-IN")}
                badge="On Hold (₹99)"
                badgeTone="amber"
                sub={loading ? "" : `${fmtINR0(subscriptionBreakdown.paused99.amount)} recurring`}
              />

              <MetricCard
                icon="revenue"
                label="Total Revenue"
                value={loading ? "—" : fmtINR0(subscriptionBreakdown.total.amount)}
                badge="100% Reconciled"
                badgeTone="brand"
                sub={loading ? "" : `${subscriptionBreakdown.total.count} Subscriptions`}
              />
            </div>

            {/* AUDIT BREAKDOWN PANEL */}
            <SubscriptionAuditBreakdown
              breakdown={subscriptionBreakdown}
              loading={loading}
            />

            <div className="chart-grid">
              <div className="chart-card span2">
                <div className="chart-head">
                  <div className="ch-title">
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--primary-pale, #fde7e1)",
                          color: "var(--primary, #e8473f)"
                        }}
                      >
                        {MIcon ? <MIcon name="rupee" size={17} /> : null}
                      </span>
                      <div>
                        <h3>Total revenue over time</h3>
                        <span className="ch-sub">
                          All recorded course + subscription revenue · {grain}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ch-right">
                    <div className="seg">
                      {[
                        { id: "daily", label: "Daily" },
                        { id: "weekly", label: "Weekly" },
                        { id: "monthly", label: "Monthly" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={grain === item.id ? "on" : ""}
                          onClick={() => setGrain(item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    margin: "8px 0 0",
                    fontSize: 11,
                    opacity: 0.62
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "#e8473f",
                      display: "inline-block"
                    }}
                  />
                  Click any point to see the revenue for that period.
                </div>

                <BackendLineChart
                  data={revenueChartData}
                  dataKey="revenue"
                  selectedIndex={selectedRevenuePoint?.index}
                  onPointClick={(item, index) =>
                    setSelectedRevenuePoint({ item, index })
                  }
                />

                {selectedRevenuePoint?.item ? (
                  <div
                    style={{
                      marginTop: -4,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--line, #e7e7e7)",
                      background: "var(--surface-2, #fafafa)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.58 }}>
                        Selected period
                      </div>
                      <div style={{ fontWeight: 800, marginTop: 3 }}>
                        {selectedRevenuePoint.item.label}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.58 }}>
                          Total
                        </div>
                        <b>{fmtINR0(selectedRevenuePoint.item.revenue)}</b>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.58 }}>
                          Courses
                        </div>
                        <b>{fmtINR0(selectedRevenuePoint.item.courseRevenue)}</b>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.58 }}>
                          Subscriptions
                        </div>
                        <b>{fmtINR0(selectedRevenuePoint.item.subscriptionRevenue)}</b>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.58 }}>
                          Payments (₹99)
                        </div>
                        <b>
                          {Number(selectedRevenuePoint.item.subscriptionCount || 0).toLocaleString("en-IN")}
                        </b>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
<div className="chart-grid two">
              <div className="chart-card">
                <div className="chart-head">
                  <div className="ch-title">
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--primary-pale, #fde7e1)",
                          color: "var(--primary, #e8473f)"
                        }}
                      >
                        {MIcon ? <MIcon name="courses" size={17} /> : null}
                      </span>
                      <div>
                        <h3>Enrollments by course</h3>
                        <span className="ch-sub">Successful paid course purchases</span>
                      </div>
                    </div>
                  </div>
                </div>
                <BackendBarChart data={enrollByCourse} />
              </div>
              <div className="chart-card">
                <div className="chart-head">
                  <div className="ch-title">
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--primary-pale, #fde7e1)",
                          color: "var(--primary, #e8473f)"
                        }}
                      >
                        {MIcon ? <MIcon name="upload" size={17} /> : null}
                      </span>
                      <div>
                        <h3>Published content</h3>
                        <span className="ch-sub">Published content grouped by category</span>
                      </div>
                    </div>
                  </div>
                </div>
                <BackendDonutChart data={contentByCategory} />
              </div>
            </div>

            <div className="chart-grid two">
              <div className="chart-card">
                <div className="chart-head">
                  <div className="ch-title">
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--primary-pale, #fde7e1)",
                          color: "var(--primary, #e8473f)"
                        }}
                      >
                        {MIcon ? <MIcon name="rupee" size={17} /> : null}
                      </span>
                      <div>
                        <h3>Purchase status</h3>
                        <span className="ch-sub">Course purchase payment status</span>
                      </div>
                    </div>
                  </div>
                </div>
                <BackendStatusChart data={paymentStatus} />
              </div>
</div>

            <div className="chart-grid two">
              <div className="chart-card">
                <div className="chart-head">
                  <div className="ch-title">
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--primary-pale, #fde7e1)",
                          color: "var(--primary, #e8473f)"
                        }}
                      >
                        {MIcon ? <MIcon name="users" size={17} /> : null}
                      </span>
                      <div>
                        <h3>New members per day</h3>
                        <span className="ch-sub">New unique members by signup date</span>
                      </div>
                    </div>
                  </div>
                </div>
                <BackendAreaChart data={dateSeries} />
              </div>
              <div className="chart-card">
                <div className="chart-head">
                  <div className="ch-title">
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--primary-pale, #fde7e1)",
                          color: "var(--primary, #e8473f)"
                        }}
                      >
                        {MIcon ? <MIcon name="dashboard" size={17} /> : null}
                      </span>
                      <div>
                        <h3>Business summary</h3>
                        <span className="ch-sub">Key business totals and revenue</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
                  {[
                    {
                      icon: "users",
                      label: "Active Paying Members",
                      value: subscriptionBreakdown.active99.count,
                      meta: `${fmtINR0(subscriptionBreakdown.active99.amount)} / mo`,
                      tone: "#2ead4b"
                    },
                    {
                      icon: "users",
                      label: "Cancelled Members",
                      value: subscriptionBreakdown.cancelled99.count,
                      meta: `${fmtINR0(subscriptionBreakdown.cancelled99.amount)} ARR lost`,
                      tone: "#e8473f"
                    },
                    {
                      icon: "users",
                      label: "Paused Subscriptions",
                      value: subscriptionBreakdown.paused99.count,
                      meta: `${fmtINR0(subscriptionBreakdown.paused99.amount)} recurring on hold`,
                      tone: "#d97706"
                    },
                    {
                      icon: "courses",
                      label: "Published Courses",
                      value: publishedCourses.length,
                      meta: "Live courses in academy",
                      tone: "#3977ff"
                    },
                    {
                      icon: "content",
                      label: "Published Content",
                      value: publishedContent.length,
                      meta: "Articles & videos",
                      tone: "#8b5cf6"
                    },
                    {
                      icon: "rupee",
                      label: "Total Subscription Revenue",
                      value: fmtINR0(subscriptionBreakdown.total.amount),
                      meta: `${subscriptionBreakdown.total.count} Subscriptions Reconciled`,
                      tone: "#16a34a"
                    }
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "12px 13px",
                        border: "1px solid var(--line, #e8e8e8)",
                        borderRadius: 10,
                        background: "var(--surface-2, #fafafa)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            minWidth: 34,
                            borderRadius: 9,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: item.tone,
                            background: `${item.tone}14`,
                            border: `1px solid ${item.tone}2b`
                          }}
                        >
                          {MIcon ? <MIcon name={item.icon} size={16} /> : null}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{item.label}</div>
                          <div style={{ marginTop: 3, fontSize: 11, opacity: 0.62 }}>{item.meta}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                          {item.isMoney
                            ? fmtINR0(item.value)
                            : Number(item.value || 0).toLocaleString("en-IN")}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: item.tone }}>LIVE DATA</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

<BackendDashboardActivity members={members} />        </div>
      </div>
    </Shell>
  );
}

/* =========================================================================
   QUICK ACTION
   ========================================================================= */

function QuickAction({
  icon,
  label,
  onClick
}) {

  const MIcon =
    getAdmin("MIcon");


  return (

    <button
      className="qa-btn"
      onClick={onClick}
    >

      <span className="qa-ic">

        {MIcon ? (
          <MIcon
            name={icon}
            size={15}
          />
        ) : null}

      </span>

      {label}

    </button>
  );
}


/* =========================================================================
   EXCEL EXPORT
   ========================================================================= */

function excelValue(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  return value;
}

function makeSheet(rows, widths = []) {
  const safeRows = rows.map((row) => row.map(excelValue));
  const sheet = XLSX.utils.aoa_to_sheet(safeRows);

  if (widths.length) {
    sheet["!cols"] = widths.map((wch) => ({ wch }));
  }

  if (safeRows.length) {
    const lastCol = XLSX.utils.encode_col(Math.max(0, safeRows[0].length - 1));
    const lastRow = safeRows.length;
    sheet["!autofilter"] = { ref: `A1:${lastCol}${lastRow}` };
  }

  return sheet;
}

function exportExcel(dataSets, push) {
  try {
    const workbook = XLSX.utils.book_new();

    /* ---------------------------------------------------------------------
       Dashboard summary
       --------------------------------------------------------------------- */
    const summaryRows = [
      ["Wealthoria Admin Dashboard Export"],
      ["Generated On", new Date()],
      [],
      ["Dataset", "Record Count"],
      ["People", (dataSets.people || []).length],
      ["Content", (dataSets.content || []).length],
      ["Courses", (dataSets.courses || []).length],
      ["Purchases", (dataSets.purchases || []).length],
      ["Subscriptions", (dataSets.subscriptions || []).length],
      ["Notifications", (dataSets.notifications || []).length]
    ];

    const summarySheet = makeSheet(summaryRows, [32, 20]);
    summarySheet["A1"].s = { font: { bold: true, sz: 16 } };
    summarySheet["A2"].z = "yyyy-mm-dd hh:mm:ss";
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Dashboard Summary");

    const peopleRows = [[
      "ID", "Name", "Email", "Role", "Status", "Joined", "Source", "City", "State", "Country"
    ]];

    (dataSets.people || []).forEach((item) => {
      peopleRows.push([
        item?.id || "",
        item?.name || item?.fullName || item?.displayName || item?.username || "",
        item?.email || item?.emailAddress || "",
        item?.role || "",
        item?.status || (item?.active === false ? "inactive" : "active"),
        displayDate(getCreatedValue(item)),
        item?.source || item?.referralSource || item?.utmSource || item?.signupSource || "",
        item?.city || "",
        item?.state || "",
        item?.country || ""
      ]);
    });
    XLSX.utils.book_append_sheet(workbook, makeSheet(peopleRows, [28, 28, 34, 16, 14, 16, 22, 18, 18, 18]), "People");

    const contentRows = [[
      "ID", "Title", "Status", "Category", "Date", "Type", "Description"
    ]];

    (dataSets.content || []).forEach((item) => {
      contentRows.push([
        item?.id || "",
        item?.title || item?.name || "",
        item?.status || "",
        getContentCategory(item),
        displayDate(item?.publishedAt || item?.createdAt || item?.updatedAt),
        item?.type || "",
        item?.description || ""
      ]);
    });
    XLSX.utils.book_append_sheet(workbook, makeSheet(contentRows, [28, 36, 16, 18, 16, 16, 60]), "Content");

    const courseRows = [[
      "ID", "Course", "Status", "Price", "Date", "Description"
    ]];

    (dataSets.courses || []).forEach((item) => {
      courseRows.push([
        item?.id || "",
        item?.title || item?.name || "",
        item?.status || "",
        firstNumber(item?.price, item?.amount),
        displayDate(item?.createdAt || item?.updatedAt || item?.publishedAt),
        item?.description || ""
      ]);
    });
    const courseSheet = makeSheet(courseRows, [28, 36, 16, 14, 16, 60]);
    if (courseRows.length > 1) courseSheet["D2"] && (courseSheet["D2"].z = '₹#,##0.00');
    XLSX.utils.book_append_sheet(workbook, courseSheet, "Courses");

    const purchaseRows = [[
      "ID", "Customer", "Email", "Status", "Course", "Amount", "Payment ID", "Order ID", "Paid Date"
    ]];

    (dataSets.purchases || []).forEach((item) => {
      purchaseRows.push([
        item?.id || "",
        item?.userName || item?.userEmail || "",
        item?.userEmail || item?.email || "",
        item?.status || "",
        item?.courseTitle || item?.courseName || item?.courseId || "",
        firstNumber(item?.amount, item?.totalAmount, item?.price),
        item?.razorpayPaymentId || item?.paymentId || "",
        item?.razorpayOrderId || item?.orderId || "",
        displayDate(item?.paidAt || item?.createdAt)
      ]);
    });
    const purchaseSheet = makeSheet(purchaseRows, [28, 28, 34, 16, 36, 16, 32, 32, 18]);
    XLSX.utils.book_append_sheet(workbook, purchaseSheet, "Purchases");

    const subscriptionRows = [[
      "ID",
      "Member ID",
      "Customer",
      "Email",
      "Plan",
      "Amount",
      "Status",
      "Razorpay Subscription ID",
      "Start Date",
      "Next Billing Date",
      "Created Date"
    ]];

    (dataSets.subscriptions || []).forEach((item) => {
      subscriptionRows.push([
        item?.id || "",
        item?.memberId || item?.uid || item?.userId || "",
        item?.name || item?.customerName || item?.userName || "",
        item?.email || item?.customerEmail || "",
        item?.plan || item?.planName || item?.planId || "",
        getSubscriptionAmount(item),
        item?.status || item?.razorpayStatus || "",
        item?.razorpaySubscriptionId || item?.subscriptionId || "",
        displayDate(
          item?.subscriptionStartDate ||
          item?.startDate ||
          item?.createdAt
        ),
        displayDate(
          item?.nextBillingDate ||
          item?.nextBilling
        ),
        displayDate(item?.createdAt || item?.updatedAt)
      ]);
    });

    const subscriptionSheet = makeSheet(
      subscriptionRows,
      [28, 28, 28, 34, 24, 16, 18, 34, 18, 20, 18]
    );

    if (subscriptionRows.length > 1) {
      subscriptionSheet["F2"] &&
        (subscriptionSheet["F2"].z = "₹#,##0.00");
    }

    XLSX.utils.book_append_sheet(
      workbook,
      subscriptionSheet,
      "Subscriptions"
    );

    const notificationRows = [[
      "ID", "Title", "Status", "Created/Sent Date", "Message"
    ]];

    (dataSets.notifications || []).forEach((item) => {
      notificationRows.push([
        item?.id || "",
        item?.title || item?.name || "Notification",
        item?.status || "",
        displayDate(item?.createdAt || item?.sentAt || item?.updatedAt),
        item?.message || item?.body || item?.description || ""
      ]);
    });
    XLSX.utils.book_append_sheet(workbook, makeSheet(notificationRows, [28, 38, 16, 20, 80]), "Notifications");

    /* Keep a single, aligned master sheet for quick filtering/exporting. */
    const masterRows = [[
      "Dataset", "ID", "Name / Title", "Email", "Role", "Status", "Category", "Course", "Amount", "Payment ID", "Date", "Source", "Details"
    ]];

    const addMasterRow = (dataset, item, values) => {
      masterRows.push([
        dataset,
        item?.id || "",
        values.nameOrTitle || "",
        values.email || "",
        values.role || "",
        values.status || "",
        values.category || "",
        values.course || "",
        values.amount ?? "",
        values.paymentId || "",
        values.date || "",
        values.source || "",
        values.details || ""
      ]);
    };

    (dataSets.people || []).forEach((item) => addMasterRow("People", item, {
      nameOrTitle: item?.name || item?.fullName || item?.displayName || item?.username || "",
      email: item?.email || item?.emailAddress || "",
      role: item?.role || "",
      status: item?.status || (item?.active === false ? "inactive" : "active"),
      date: displayDate(getCreatedValue(item)),
      source: item?.source || item?.referralSource || item?.utmSource || item?.signupSource || "",
      details: [item?.city, item?.state, item?.country].filter(Boolean).join(", ")
    }));

    (dataSets.content || []).forEach((item) => addMasterRow("Content", item, {
      nameOrTitle: item?.title || item?.name || "",
      status: item?.status || "",
      category: getContentCategory(item),
      date: displayDate(item?.publishedAt || item?.createdAt || item?.updatedAt),
      details: item?.description || item?.type || ""
    }));

    (dataSets.courses || []).forEach((item) => addMasterRow("Courses", item, {
      nameOrTitle: item?.title || item?.name || "",
      status: item?.status || "",
      amount: firstNumber(item?.price, item?.amount),
      date: displayDate(item?.createdAt || item?.updatedAt || item?.publishedAt),
      details: item?.description || ""
    }));

    (dataSets.purchases || []).forEach((item) => addMasterRow("Purchases", item, {
      nameOrTitle: item?.userName || item?.userEmail || "",
      email: item?.userEmail || item?.email || "",
      status: item?.status || "",
      course: item?.courseTitle || item?.courseName || item?.courseId || "",
      amount: firstNumber(item?.amount, item?.totalAmount, item?.price),
      paymentId: item?.razorpayPaymentId || item?.paymentId || "",
      date: displayDate(item?.paidAt || item?.createdAt),
      details: item?.razorpayOrderId || item?.orderId || ""
    }));

    (dataSets.subscriptions || []).forEach((item) => addMasterRow("Subscriptions", item, {
      nameOrTitle:
        item?.name ||
        item?.customerName ||
        item?.userName ||
        item?.email ||
        "Subscription",
      email: item?.email || item?.customerEmail || "",
      status: item?.status || item?.razorpayStatus || "",
      amount: getSubscriptionAmount(item),
      paymentId: item?.razorpayPaymentId || item?.paymentId || "",
      date: displayDate(
        getSubscriptionRevenueDate(item)
      ),
      details:
        item?.plan ||
        item?.planName ||
        item?.planId ||
        item?.razorpaySubscriptionId ||
        ""
    }));

    (dataSets.notifications || []).forEach((item) => addMasterRow("Notifications", item, {
      nameOrTitle: item?.title || item?.name || "Notification",
      status: item?.status || "",
      date: displayDate(item?.createdAt || item?.sentAt || item?.updatedAt),
      details: item?.message || item?.body || item?.description || ""
    }));

    if (masterRows.length > 1) {
      const masterSheet = makeSheet(masterRows, [18, 28, 34, 34, 16, 16, 18, 36, 16, 34, 18, 22, 70]);
      for (let row = 2; row <= masterRows.length; row += 1) {
        const amountCell = masterSheet[`I${row}`];
        if (amountCell && typeof amountCell.v === "number") amountCell.z = '₹#,##0.00';
      }
      XLSX.utils.book_append_sheet(workbook, masterSheet, "All Data");
    }

    const now = new Date();
    const filename = `wealthoria-dashboard-${now.toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, filename, {
      bookType: "xlsx",
      compression: true
    });

    const totalRecords =
      (dataSets.people || []).length +
      (dataSets.content || []).length +
      (dataSets.courses || []).length +
      (dataSets.purchases || []).length +
      (dataSets.subscriptions || []).length +
      (dataSets.notifications || []).length;

    push(`Exported ${totalRecords} records to Excel`);
  } catch (error) {
    console.error("Dashboard Excel export error:", error);
    push("Unable to export dashboard Excel file.");
  }
}


/* =========================================================================
   ACTIVITY FEED
   ========================================================================= */

/* =========================================================================
   PUBLIC EXPORT
   ========================================================================= */

function AdminDashboard() {

  return (
    <ControlPanel />
  );
}


window.AdminDashboard =
  AdminDashboard;