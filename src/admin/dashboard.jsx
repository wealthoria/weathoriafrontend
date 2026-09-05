import React from "react";

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

function MetricCard({
  icon,
  label,
  value,
  delta,
  spark,
  sparkKey,
  sparkColor
}) {

  const MIcon = getAdmin("MIcon");
  const WSparkline = getAdmin("WSparkline");

  return (
    <div className="metric">

      <div className="m-top">

        <span className="m-ic">
          {MIcon ? (
            <MIcon
              name={icon}
              size={17}
            />
          ) : null}
        </span>

        <span className="m-label">
          {label}
        </span>

      </div>


      <div className="m-value">
        {value}
      </div>


      <div className="m-foot">

        {delta != null ? (

          <span
            className={`delta ${
              delta >= 0 ? "up" : "down"
            }`}
          >

            {MIcon ? (
              <MIcon
                name="arrow"
                size={12}
                style={{
                  transform:
                    delta >= 0
                      ? "rotate(-45deg)"
                      : "rotate(45deg)"
                }}
              />
            ) : null}

            {Math.abs(delta)}%

          </span>

        ) : (
          <span />
        )}


        {spark && WSparkline ? (
          <WSparkline
            data={spark}
            dataKey={sparkKey}
            color={sparkColor}
            width={108}
            height={32}
          />
        ) : null}

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

function BackendLineChart({ data, dataKey }) {
  const W = 760;
  const H = 240;
  const pad = { l: 38, r: 18, t: 18, b: 30 };
  const values = data.map((d) => Math.max(0, Number(d[dataKey] || 0)));
  const max = Math.max(1, ...values);
  const points = data.map((d, i) => {
    const x = pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r);
    const y = H - pad.b - (Number(d[dataKey] || 0) / max) * (H - pad.t - pad.b);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="250" role="img" aria-label="Revenue over time">
      {[0, 1, 2, 3, 4].map((i) => {
        const y = pad.t + (i / 4) * (H - pad.t - pad.b);
        return <line key={i} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="currentColor" opacity=".08" />;
      })}
      <polyline fill="none" stroke="#e8473f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
      {data.map((d, i) => {
        const x = pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r);
        const y = H - pad.b - (Number(d[dataKey] || 0) / max) * (H - pad.t - pad.b);
        return <circle key={i} cx={x} cy={y} r="3" fill="#e8473f" />;
      })}
      {data.length ? <text x={pad.l} y={H - 8} fontSize="10" fill="currentColor" opacity=".55">{data[0].label}</text> : null}
      {data.length > 1 ? <text x={W - pad.r} y={H - 8} textAnchor="end" fontSize="10" fill="currentColor" opacity=".55">{data[data.length - 1].label}</text> : null}
      <text x={W - pad.r} y={18} textAnchor="end" fontSize="10" fill="currentColor" opacity=".55">Max ₹{Math.round(max).toLocaleString("en-IN")}</text>
    </svg>
  );
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
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="220" role="img" aria-label="New students per day">
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

function BackendDashboardActivity({ activity }) {
  const MIcon = getAdmin("MIcon");
  const faClass = {
    purchase: "fa-purchase",
    publish: "fa-publish",
    enroll: "fa-enroll",
    update: "fa-comment"
  };

  return (
    <aside className="feed-card">
      <div className="feed-head">
        <h3>Recent activity</h3>
        <span className="live"><span className="pulse" /> Live</span>
      </div>
      <div className="feed-list">
        {activity.slice(0, 8).map((it) => (
          <div className="feed-item" key={it.id}>
            <div>
              <span className={`feed-ava ${faClass[it.type] || ""}`}>{it.name.charAt(0).toUpperCase()}</span>
              <span className="feed-ic">
                {MIcon ? <MIcon name={it.icon || "eye"} size={11} /> : null}
              </span>
            </div>
            <div className="feed-body">
              <div className="feed-text"><b>{it.name}</b>{it.text}</div>
              <div className="feed-time">{it.time}</div>
            </div>
          </div>
        ))}
        {!activity.length ? <div className="muted" style={{ padding: 16 }}>No recent activity.</div> : null}
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
    notifications: []
  });

  const load = useCallback(async () => {
    if (!window.db || typeof window.db.collection !== "function") {
      setState((prev) => ({ ...prev, loading: false, error: "Firestore is not available." }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: "" }));
    const [content, courses, students, members, purchases, notifications] = await Promise.all([
      getCollectionRows("content"),
      getCollectionRows("courses"),
      getCollectionRows("students"),
      getCollectionRows("members"),
      getCollectionRows("coursePurchases"),
      getCollectionRows("notifications")
    ]);

    setState({ loading: false, error: "", content, courses, students, members, purchases, notifications });
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
  const { content, courses, students, members, purchases, notifications, loading } = backend;

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

  const allPeople = useMemo(() => {
    const source = students.length ? students : members;
    return source;
  }, [students, members]);

  const periodStart = useMemo(() => Date.now() - days * 86400000, [days]);
  const previousPeriodStart = useMemo(() => periodStart - days * 86400000, [periodStart, days]);

  const inCurrentPeriod = (value) => safeTimestamp(value) >= periodStart;
  const inPreviousPeriod = (value) => {
    const t = safeTimestamp(value);
    return t >= previousPeriodStart && t < periodStart;
  };

  const memberCount = allPeople.length;
  const revenue = paidPurchases.reduce((sum, p) => sum + firstNumber(p.amount, p.totalAmount, p.price), 0);
  const currentRevenue = paidPurchases.filter((p) => inCurrentPeriod(p.paidAt || p.createdAt)).reduce((sum, p) => sum + firstNumber(p.amount, p.totalAmount, p.price), 0);
  const previousRevenue = paidPurchases.filter((p) => inPreviousPeriod(p.paidAt || p.createdAt)).reduce((sum, p) => sum + firstNumber(p.amount, p.totalAmount, p.price), 0);
  const revenueDelta = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : null;

  const currentSignups = allPeople.filter((p) => inCurrentPeriod(getCreatedValue(p))).length;
  const previousSignups = allPeople.filter((p) => inPreviousPeriod(getCreatedValue(p))).length;
  const signupDelta = previousSignups > 0 ? Math.round(((currentSignups - previousSignups) / previousSignups) * 100) : null;

  const contentCount = publishedContent.length;
  const currentContent = publishedContent.filter((p) => inCurrentPeriod(p.publishedAt || p.createdAt)).length;
  const previousContent = publishedContent.filter((p) => inPreviousPeriod(p.publishedAt || p.createdAt)).length;
  const contentDelta = previousContent > 0 ? Math.round(((currentContent - previousContent) / previousContent) * 100) : null;

  const dateSeries = useMemo(() => {
    const rows = [];
    const count = Math.min(days, 60);
    const step = 86400000;
    for (let i = count - 1; i >= 0; i -= 1) {
      const start = new Date(Date.now() - i * step);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + step);
      const revenueValue = paidPurchases.reduce((sum, p) => {
        const t = safeTimestamp(p.paidAt || p.createdAt);
        return t >= start.getTime() && t < end.getTime() ? sum + firstNumber(p.amount, p.totalAmount, p.price) : sum;
      }, 0);
      const signupValue = allPeople.filter((p) => {
        const t = safeTimestamp(getCreatedValue(p));
        return t >= start.getTime() && t < end.getTime();
      }).length;
      rows.push({
        label: start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        revenue: revenueValue,
        signups: signupValue
      });
    }
    return rows;
  }, [days, paidPurchases, allPeople]);

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

  const trafficSources = useMemo(() => {
    const map = new Map();
    allPeople.forEach((p) => {
      const key = String(p.source || p.referralSource || p.utmSource || p.signupSource || "Unknown").trim() || "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [allPeople]);

  const activity = useMemo(() => {
    const rows = [];
    publishedContent.forEach((item) => {
      const t = safeTimestamp(item.publishedAt || item.createdAt || item.updatedAt);
      rows.push({ id: `content-${item.id}`, t, type: "publish", icon: "eye", name: String(item.title || item.name || "Content"), text: " was published", time: displayDate(item.publishedAt || item.createdAt) });
    });
    paidPurchases.forEach((item) => {
      const t = safeTimestamp(item.paidAt || item.createdAt);
      rows.push({ id: `purchase-${item.id}`, t, type: "purchase", icon: "rupee", name: String(item.userName || item.courseTitle || "Purchase"), text: item.courseTitle ? ` purchased ${item.courseTitle}` : " completed a purchase", time: displayDate(item.paidAt || item.createdAt) });
    });
    allPeople.forEach((item) => {
      const t = safeTimestamp(getCreatedValue(item));
      rows.push({ id: `member-${item.id}`, t, type: "enroll", icon: "users", name: String(item.name || item.fullName || item.email || "Student"), text: " joined", time: displayDate(getCreatedValue(item)) });
    });
    return rows.sort((a, b) => b.t - a.t);
  }, [publishedContent, paidPurchases, allPeople]);

  const studentSpark = useMemo(() => dateSeries.slice(-14), [dateSeries]);
  const revenueSpark = useMemo(() => dateSeries.slice(-14), [dateSeries]);
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
      subtitle={`Signed in as ${role} · ${memberCount.toLocaleString("en-IN")} students`}
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
            <QuickAction icon="download" label="Export CSV" onClick={() => exportCsv(allPeople, push)} />
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
              <MetricCard icon="users" label="Students / members" value={loading ? "—" : memberCount.toLocaleString("en-IN")} spark={studentSpark} sparkKey="signups" sparkColor="#2ead4b" />
              <MetricCard icon="rupee" label="Total revenue" value={loading ? "—" : fmtINR0(revenue)} delta={revenueDelta} spark={revenueSpark.map((d) => ({ ...d, gross: d.revenue }))} sparkKey="gross" sparkColor="#e8473f" />
              <MetricCard icon="courses" label="Active courses" value={loading ? "—" : publishedCourses.length.toLocaleString("en-IN")} />
              <MetricCard icon="upload" label="Published content" value={loading ? "—" : contentCount.toLocaleString("en-IN")} delta={contentDelta} />
              <MetricCard icon="users" label={`New signups (${days}d)`} value={loading ? "—" : currentSignups.toLocaleString("en-IN")} delta={signupDelta} spark={signupSpark} sparkKey="signups" sparkColor="#2ead4b" />
            </div>

            <div className="chart-grid">
              <div className="chart-card span2">
                <div className="chart-head">
                  <div className="ch-title">
                    <h3>Revenue over time</h3>
                    <span className="ch-sub">Real paid purchases · last {days} days</span>
                  </div>
                  <div className="ch-right">
                    <div className="legend"><span className="li"><span className="sw" style={{ background: "#e8473f" }} />Paid revenue</span></div>
                    <div className="seg">
                      <button className={grain === "daily" ? "on" : ""} onClick={() => setGrain("daily")}>Daily</button>
                      <button className={grain === "weekly" ? "on" : ""} onClick={() => setGrain("weekly")} disabled={days < 14}>Weekly</button>
                      <button className={grain === "monthly" ? "on" : ""} onClick={() => setGrain("monthly")} disabled={days < 60}>Monthly</button>
                    </div>
                  </div>
                </div>
                <BackendLineChart data={dateSeries} dataKey="revenue" />
              </div>
            </div>

            <div className="chart-grid two">
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>Enrollments by course</h3><span className="ch-sub">Paid course purchases</span></div></div>
                <BackendBarChart data={enrollByCourse} />
              </div>
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>Published content</h3><span className="ch-sub">By category</span></div></div>
                <BackendDonutChart data={contentByCategory} />
              </div>
            </div>

            <div className="chart-grid two">
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>Purchase status</h3><span className="ch-sub">From coursePurchases</span></div></div>
                <BackendStatusChart data={paymentStatus} />
              </div>
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>Traffic sources</h3><span className="ch-sub">Backend profile source fields</span></div></div>
                <BackendBarChart data={trafficSources} />
              </div>
            </div>

            <div className="chart-grid two">
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>New students per day</h3><span className="ch-sub">Last {Math.min(days, 60)} days</span></div></div>
                <BackendAreaChart data={dateSeries} />
              </div>
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>Data summary</h3><span className="ch-sub">Current Firestore records</span></div></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
                  <div className="qa-card"><b>{publishedContent.length}</b><span>Published content</span></div>
                  <div className="qa-card"><b>{publishedCourses.length}</b><span>Published courses</span></div>
                  <div className="qa-card"><b>{paidPurchases.length}</b><span>Paid purchases</span></div>
                  <div className="qa-card"><b>{notifications.length}</b><span>Notifications</span></div>
                </div>
              </div>
            </div>
          </div>

          <BackendDashboardActivity activity={activity} />
        </div>
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
   CSV EXPORT
   ========================================================================= */

function exportCsv(
  students,
  push
) {

  const rows = [
    [
      "Name",
      "Email",
      "Enrolled",
      "Joined",
      "Status"
    ],
    ...students.map(
      (s) => [
        s.name,
        s.email,
        s.enrolled,
        s.joined,
        s.status
      ]
    )
  ];


  const csv =
    rows
      .map((r) =>
        r
          .map(
            (c) =>
              `"${c}"`
          )
          .join(",")
      )
      .join("\n");


  try {

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      "wealthoria-students.csv";

    a.click();


    URL.revokeObjectURL(
      url
    );


    push(
      "Exported student CSV"
    );

  } catch (e) {

    push(
      "Export ready (stubbed)"
    );

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