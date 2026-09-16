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
  delta
}) {
  return (
    <div
      className="metric"
      style={{
        minHeight: 112,
        padding: "14px 15px",
        overflow: "hidden"
      }}
    >
      <div
        className="m-top"
        style={{
          minWidth: 0,
          gap: 9,
          alignItems: "center"
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
            background: "var(--primary-pale, #fde7e1)",
            color: "var(--primary, #e8473f)"
          }}
        >
          <MetricIcon type={icon} />
        </span>

        <span
          className="m-label"
          style={{
            minWidth: 0,
            lineHeight: 1.15,
            whiteSpace: "normal"
          }}
        >
          {label}
        </span>
      </div>

      <div
        className="m-value"
        style={{
          marginTop: 10,
          lineHeight: 1
        }}
      >
        {value}
      </div>

      {delta != null ? (
        <div
          className="m-foot"
          style={{
            marginTop: 8,
            minHeight: 14
          }}
        >
          <span className={`delta ${delta >= 0 ? "up" : "down"}`}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        </div>
      ) : null}
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
  const status = getSubscriptionStatus(row);
  return [
    "active",
    "paid",
    "completed",
    "cancelled",
    "halted",
    "paused"
  ].includes(status);
}

function getSubscriptionAmount(row) {
  return firstNumber(
    row?.amount,
    row?.totalAmount,
    row?.price,
    row?.planAmount
  );
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
        signups: 0,
        date: date.toISOString()
      });
    }

    const group = groups.get(key);
    group.revenue += Number(row.revenue || 0);
    group.courseRevenue += Number(row.courseRevenue || 0);
    group.subscriptionRevenue += Number(row.subscriptionRevenue || 0);
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

          const isOnline =
            String(member.lastLoginStatus || "").toLowerCase() ===
            "online";

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

  const subscriptionRevenue = paidSubscriptions.reduce(
    (sum, subscription) =>
      sum + getSubscriptionAmount(subscription),
    0
  );

  const revenue = courseRevenue + subscriptionRevenue;

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

  const currentSubscriptionRevenue = paidSubscriptions
    .filter((subscription) =>
      inCurrentPeriod(getSubscriptionRevenueDate(subscription))
    )
    .reduce(
      (sum, subscription) =>
        sum + getSubscriptionAmount(subscription),
      0
    );

  const previousSubscriptionRevenue = paidSubscriptions
    .filter((subscription) =>
      inPreviousPeriod(getSubscriptionRevenueDate(subscription))
    )
    .reduce(
      (sum, subscription) =>
        sum + getSubscriptionAmount(subscription),
      0
    );

  const currentRevenue =
    currentCourseRevenue + currentSubscriptionRevenue;

  const previousRevenue =
    previousCourseRevenue + previousSubscriptionRevenue;

  const revenueDelta =
    previousRevenue > 0
      ? Math.round(
          ((currentRevenue - previousRevenue) / previousRevenue) * 100
        )
      : null;

  const activeSubscriptionCount = subscriptions.filter(
    (subscription) => getSubscriptionStatus(subscription) === "active"
  ).length;

  const cancelledSubscriptionCount = subscriptions.filter(
    (subscription) => getSubscriptionStatus(subscription) === "cancelled"
  ).length;

  const haltedSubscriptionCount = subscriptions.filter(
    (subscription) => getSubscriptionStatus(subscription) === "halted"
  ).length;

  const activeMemberCount = uniqueMembers.filter(
    (member) =>
      !["inactive", "deactivated", "disabled", "blocked", "suspended"].includes(
        String(member.status || "").trim().toLowerCase()
      )
  ).length;

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

      const subscriptionRevenueValue = paidSubscriptions.reduce(
        (sum, subscription) => {
          const t = safeTimestamp(
            getSubscriptionRevenueDate(subscription)
          );

          return t >= start.getTime() && t < end.getTime()
            ? sum + getSubscriptionAmount(subscription)
            : sum;
        },
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
        signups: signupValue
      });
    }
    return rows;
  }, [days, paidPurchases, paidSubscriptions, uniqueMembers]);

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
      subtitle={`Signed in as ${role} · ${memberCount.toLocaleString("en-IN")} members`}
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
            <div className="metric-grid">
              <MetricCard
                icon="users"
                label="Members"
                value={loading ? "—" : memberCount.toLocaleString("en-IN")}
              />

              <MetricCard
                icon="revenue"
                label="Total revenue"
                value={loading ? "—" : fmtINR0(revenue)}
                delta={revenueDelta}
              />

              <MetricCard
                icon="revenue"
                label="Course revenue"
                value={loading ? "—" : fmtINR0(courseRevenue)}
              />

              <MetricCard
                icon="subscription"
                label="Subscription revenue"
                value={loading ? "—" : fmtINR0(subscriptionRevenue)}
              />

              <MetricCard
                icon="users"
                label="Active members"
                value={loading ? "—" : activeMemberCount.toLocaleString("en-IN")}
              />

              <MetricCard
                icon="courses"
                label="Active subscriptions"
                value={loading ? "—" : activeSubscriptionCount.toLocaleString("en-IN")}
              />

              <MetricCard
                icon="courses"
                label="Cancelled subscriptions"
                value={loading ? "—" : cancelledSubscriptionCount.toLocaleString("en-IN")}
              />

              <MetricCard
                icon="courses"
                label="Active courses"
                value={loading ? "—" : publishedCourses.length.toLocaleString("en-IN")}
              />

              <MetricCard
                icon="content"
                label="Published content"
                value={loading ? "—" : contentCount.toLocaleString("en-IN")}
                delta={contentDelta}
              />

              <MetricCard
                icon="users"
                label={`New signups (${days}d)`}
                value={loading ? "—" : currentSignups.toLocaleString("en-IN")}
                delta={signupDelta}
              />
            </div>

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
                      label: "Total members",
                      value: memberCount,
                      meta: "Unique member records",
                      tone: "#3977ff"
                    },
                    {
                      icon: "users",
                      label: "Active members",
                      value: activeMemberCount,
                      meta: "Currently active",
                      tone: "#2ead4b"
                    },
                    {
                      icon: "courses",
                      label: "Active subscriptions",
                      value: activeSubscriptionCount,
                      meta: "Razorpay status active",
                      tone: "#2ead4b"
                    },
                    {
                      icon: "courses",
                      label: "Cancelled subscriptions",
                      value: cancelledSubscriptionCount,
                      meta: "Cancelled subscriptions",
                      tone: "#e8473f"
                    },
                    {
                      icon: "rupee",
                      label: "Course revenue",
                      value: courseRevenue,
                      meta: "Successful course purchases",
                      tone: "#e8473f",
                      isMoney: true
                    },
                    {
                      icon: "rupee",
                      label: "Subscription revenue",
                      value: subscriptionRevenue,
                      meta: "Recorded subscription amounts",
                      tone: "#2ead4b",
                      isMoney: true
                    },
                    {
                      icon: "rupee",
                      label: "Total revenue",
                      value: revenue,
                      meta: "Courses + subscriptions",
                      tone: "#e8473f",
                      isMoney: true
                    },
                    {
                      icon: "upload",
                      label: "Published content",
                      value: publishedContent.length,
                      meta: "Published",
                      tone: "#2ead4b"
                    },
                    {
                      icon: "courses",
                      label: "Published courses",
                      value: publishedCourses.length,
                      meta: "Live courses",
                      tone: "#3977ff"
                    },
                    {
                      icon: "rupee",
                      label: "Paid course sales",
                      value: paidPurchases.length,
                      meta: "Successful payments",
                      tone: "#e8473f"
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