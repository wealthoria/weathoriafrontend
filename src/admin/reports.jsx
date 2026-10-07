import React from "react";
import * as XLSX from "xlsx";

/* global React, window */

const {
  useState,
  useMemo,
  useEffect,
  useCallback
} = React;

/* =========================================================
   WEALTHORIA EXECUTIVE REPORTS & PLAN ANALYTICS
   ========================================================= */

const getAdmin = (name) => window[name];

const fmtINR0 = (value) =>
  "₹" + Math.round(Number(value || 0)).toLocaleString("en-IN");

const fmtINRDec = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const toMillis = (value) => {
  if (!value) return 0;
  try {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  } catch (error) {
    return 0;
  }
};

const formatDate = (value) => {
  const time = toMillis(value);
  if (!time) return "—";
  return new Date(time).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatDateTime = (value) => {
  const time = toMillis(value);
  if (!time) return "—";
  return new Date(time).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const startOfMonth = (date) => {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
};

const endOfPeriod = (start, period) => {
  const d = new Date(start);
  if (period === "week") {
    d.setDate(d.getDate() + 7);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
};

const addMonths = (ms, n) => {
  const d = new Date(ms);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d.getTime();
};

const firstNumber = (...values) => {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const getPurchaseAmount = (item) =>
  firstNumber(item?.amount, item?.totalAmount, item?.price);

const getPurchaseDate = (item) =>
  item?.paidAt || item?.createdAt || item?.updatedAt || null;

const getMemberDate = (item) =>
  item?.joinedAt || item?.registeredAt || item?.createdAt || item?.createdOn || null;

const getSubscriptionDate = (item) =>
  item?.paidAt || item?.subscriptionStartDate || item?.startDate || item?.createdAt || null;

const isSuccessfulSubscription = (item) => {
  if (!item) return false;
  const status = String(item?.status || item?.razorpayStatus || "").trim().toLowerCase();
  if (["pending", "created", "failed", "attempted", "initiated", ""].includes(status)) {
    return false;
  }
  const paidCount = Number(item?.paidCount);
  if (item?.paidCount !== undefined && item?.paidCount !== null && Number.isFinite(paidCount)) {
    return paidCount > 0;
  }
  if (item?.razorpayPaymentId || item?.paymentId) return true;
  return (
    ["active", "paid", "completed", "cancelled", "halted", "paused", "expired"].includes(status) &&
    Boolean(item?.paidAt || item?.subscriptionStartDate)
  );
};

const isPaidPurchase = (item) =>
  String(item?.status || "paid").toLowerCase() === "paid";

const getSubscriptionCharges = (row) => {
  if (!isSuccessfulSubscription(row)) return [];
  const amount = firstNumber(row?.amount, row?.totalAmount, row?.price, row?.planAmount);
  if (amount <= 0) return [];
  const paidCount = Math.floor(Number(row?.paidCount) || 0);
  const effectiveCount = paidCount > 0 ? paidCount : 1;
  const periodEnd = toMillis(row?.nextBillingDate);
  const latest =
    toMillis(row?.paidAt) ||
    toMillis(row?.subscriptionStartDate) ||
    (periodEnd ? addMonths(periodEnd, -1) : 0) ||
    toMillis(getSubscriptionDate(row));

  if (!latest) return [];
  return Array.from({ length: effectiveCount }, (_, k) => ({
    time: Math.min(addMonths(latest, -k), Date.now()),
    amount
  }));
};

/* =========================================================
   DATA LOADER
   ========================================================= */

function getCollectionRows(name) {
  if (!window.db || typeof window.db.collection !== "function") {
    return Promise.resolve([]);
  }
  return window.db
    .collection(name)
    .get()
    .then((snapshot) =>
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    )
    .catch((error) => {
      console.warn(`Reports could not load ${name}:`, error);
      return [];
    });
}

function useReportsData() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    members: [],
    purchases: [],
    subscriptions: []
  });

  const load = useCallback(async () => {
    if (!window.db || typeof window.db.collection !== "function") {
      setState({
        loading: false,
        error: "Firestore database is currently not connected.",
        members: [],
        purchases: [],
        subscriptions: []
      });
      return;
    }

    setState((current) => ({
      ...current,
      loading: true,
      error: ""
    }));

    try {
      const [members, purchases, subscriptions] = await Promise.all([
        getCollectionRows("members"),
        getCollectionRows("coursePurchases"),
        getCollectionRows("subscriptions")
      ]);

      setState({
        loading: false,
        error: "",
        members,
        purchases,
        subscriptions
      });
    } catch (err) {
      setState((current) => ({
        ...current,
        loading: false,
        error: err?.message || "Failed to load reports."
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    reload: load
  };
}

/* =========================================================
   MODERN SVG ICONS
   ========================================================= */

function ReportIcon({ name, size = 18, color = "currentColor" }) {
  const style = { width: size, height: size, strokeWidth: 2, fill: "none", stroke: color, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "rupee":
      return (
        <svg style={style} viewBox="0 0 24 24">
          <path d="M6 3h12M6 8h12M6 13l7.5 8M6 8h4.5a4.5 4.5 0 0 0 0-9H6" />
        </svg>
      );
    case "wallet":
      return (
        <svg style={style} viewBox="0 0 24 24">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
        </svg>
      );
    case "trend-up":
      return (
        <svg style={style} viewBox="0 0 24 24">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case "users":
      return (
        <svg style={style} viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "badge-check":
      return (
        <svg style={style} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "package":
      return (
        <svg style={style} viewBox="0 0 24 24">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "download":
      return (
        <svg style={style} viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "refresh":
      return (
        <svg style={style} viewBox="0 0 24 24">
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      );
    case "calendar":
      return (
        <svg style={style} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    default:
      return (
        <svg style={style} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

/* =========================================================
   CHART COMPONENT
   ========================================================= */

function RevenueAreaChart({ data, selectedPoint, onSelectPoint }) {
  const W = 800;
  const H = 240;
  const pad = { l: 60, r: 20, t: 20, b: 40 };

  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  const maxVal = Math.max(1, ...data.map((d) => Number(d.totalRevenue || 0)));

  const getX = (idx) => pad.l + (idx / Math.max(1, data.length - 1)) * chartW;
  const getY = (val) => H - pad.b - (Number(val || 0) / maxVal) * chartH;

  const totalPoints = data.map((d, i) => `${getX(i)},${getY(d.totalRevenue)}`).join(" ");
  const subPoints = data.map((d, i) => `${getX(i)},${getY(d.subscriptionRevenue)}`).join(" ");

  const totalArea = data.length ? `${pad.l},${H - pad.b} ${totalPoints} ${getX(data.length - 1)},${H - pad.b}` : "";

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ minWidth: 540, display: "block" }}>
        <defs>
          <linearGradient id="repAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8473f" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#e8473f" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="repSubGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const val = maxVal * ratio;
          const y = getY(val);
          return (
            <g key={i}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.5">
                {val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${Math.round(val)}`}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {totalArea && <polygon fill="url(#repAreaGrad)" points={totalArea} />}

        {/* Total line */}
        <polyline fill="none" stroke="#e8473f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={totalPoints} />

        {/* Subscription line */}
        <polyline fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" points={subPoints} />

        {/* Interactive dots */}
        {data.map((item, idx) => {
          const x = getX(idx);
          const y = getY(item.totalRevenue);
          const isSelected = selectedPoint?.key === item.key;
          return (
            <g key={item.key} onClick={() => onSelectPoint?.(item)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={14} fill="transparent" />
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4}
                fill="#e8473f"
                stroke="var(--canvas, #fff)"
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              {idx % Math.ceil(data.length / 7) === 0 && (
                <text x={x} y={H - 12} textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.6">
                  {item.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* =========================================================
   MAIN REPORTS PAGE
   ========================================================= */

function ReportsPage() {
  const useAdminRouter = getAdmin("useAdminRouter");
  const useMToast = getAdmin("useMToast");
  const router = typeof useAdminRouter === "function" ? useAdminRouter() || {} : {};
  const navigate = router.navigate || (() => {});
  const toast = typeof useMToast === "function" ? useMToast() || {} : {};
  const pushToast = toast.push || (() => {});

  const backend = useReportsData();
  const { loading, error, members, purchases, subscriptions } = backend;

  // Filter & Tab states
  const [timeFilter, setTimeFilter] = useState("all"); // "7d", "30d", "90d", "all", "custom"
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tableTab, setTableTab] = useState("monthly"); // "monthly", "weekly"
  const [txFilter, setTxFilter] = useState("all"); // "all", "subscription", "course"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChartPoint, setSelectedChartPoint] = useState(null);

  /* ---------------------------------------------------------
     CLEANING DATA — STRICTLY CAPTURED PAYMENTS ONLY
     --------------------------------------------------------- */

  const paidPurchases = useMemo(
    () => purchases.filter(isPaidPurchase),
    [purchases]
  );

  const paidSubscriptions = useMemo(
    () => subscriptions.filter(isSuccessfulSubscription),
    [subscriptions]
  );

  const subscriptionCharges = useMemo(
    () => paidSubscriptions.flatMap(getSubscriptionCharges),
    [paidSubscriptions]
  );

  const activeSubscriptions = useMemo(
    () =>
      paidSubscriptions.filter((sub) => {
        const status = String(sub.status || sub.razorpayStatus || "").toLowerCase();
        if (status !== "active") return false;
        const until = toMillis(sub.nextBillingDate);
        return !until || until > Date.now();
      }),
    [paidSubscriptions]
  );

  // Time window bounds
  const now = Date.now();
  const filterStart = useMemo(() => {
    if (timeFilter === "7d") return now - 7 * 86400000;
    if (timeFilter === "30d") return now - 30 * 86400000;
    if (timeFilter === "90d") return now - 90 * 86400000;
    if (timeFilter === "custom" && customFrom) return new Date(customFrom).getTime();
    return 0; // all time
  }, [timeFilter, customFrom, now]);

  const filterEnd = useMemo(() => {
    if (timeFilter === "custom" && customTo) {
      const d = new Date(customTo);
      d.setHours(23, 59, 59, 999);
      return d.getTime();
    }
    return now + 86400000;
  }, [timeFilter, customTo, now]);

  const inFilteredPeriod = useCallback(
    (time) => {
      const t = toMillis(time);
      if (!t) return false;
      return t >= filterStart && t <= filterEnd;
    },
    [filterStart, filterEnd]
  );

  /* ---------------------------------------------------------
     TOTAL AGGREGATED METRICS
     --------------------------------------------------------- */

  const filteredPurchases = useMemo(
    () => paidPurchases.filter((p) => inFilteredPeriod(getPurchaseDate(p))),
    [paidPurchases, inFilteredPeriod]
  );

  const filteredCharges = useMemo(
    () => subscriptionCharges.filter((c) => inFilteredPeriod(c.time)),
    [subscriptionCharges, inFilteredPeriod]
  );

  const totalCourseRevenue = useMemo(
    () => filteredPurchases.reduce((sum, p) => sum + getPurchaseAmount(p), 0),
    [filteredPurchases]
  );

  const totalSubscriptionRevenue = useMemo(
    () => filteredCharges.reduce((sum, c) => sum + c.amount, 0),
    [filteredCharges]
  );

  const totalNetRevenue = totalCourseRevenue + totalSubscriptionRevenue;
  const totalTransactionsCount = filteredPurchases.length + filteredCharges.length;

  // Total unique paying members
  const uniquePayingMemberIds = useMemo(() => {
    const set = new Set();
    filteredPurchases.forEach((p) => set.add(p.memberId || p.email || p.userEmail));
    paidSubscriptions.forEach((s) => set.add(s.memberId || s.email));
    set.delete(undefined);
    set.delete("");
    set.delete(null);
    return set;
  }, [filteredPurchases, paidSubscriptions]);

  const arpu = uniquePayingMemberIds.size > 0 ? totalNetRevenue / uniquePayingMemberIds.size : 0;
  const subSharePercent = totalNetRevenue > 0 ? Math.round((totalSubscriptionRevenue / totalNetRevenue) * 100) : 0;
  const courseSharePercent = totalNetRevenue > 0 ? 100 - subSharePercent : 0;

  /* ---------------------------------------------------------
     PLAN-WISE BREAKDOWN
     --------------------------------------------------------- */

  const planBreakdown = useMemo(() => {
    // 1. ₹99 Wealthoria Monthly Subscription
    const monthlySubs = paidSubscriptions.filter((s) => {
      const amount = firstNumber(s.amount, s.planAmount, s.price);
      return amount <= 500; // standard ₹99 plan
    });
    const monthlyActive = monthlySubs.filter((s) => {
      const status = String(s.status || "").toLowerCase();
      const until = toMillis(s.nextBillingDate);
      return status === "active" && (!until || until > Date.now());
    });
    const monthlyCharges = monthlySubs.flatMap(getSubscriptionCharges).filter((c) => inFilteredPeriod(c.time));
    const monthlyRev = monthlyCharges.reduce((sum, c) => sum + c.amount, 0);

    // 2. Course Pre-books / Purchases (₹999 / High Tier)
    const courses = filteredPurchases;
    const coursesRev = totalCourseRevenue;

    return [
      {
        id: "monthly_99",
        name: "Wealthoria Premium Membership",
        tier: "Monthly Recurring",
        priceLabel: "₹99 / month",
        activeCount: monthlyActive.length,
        totalPurchases: monthlyCharges.length,
        revenue: monthlyRev,
        share: totalNetRevenue > 0 ? Math.round((monthlyRev / totalNetRevenue) * 100) : 0,
        badgeColor: "#6366f1",
        accent: "linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.02) 100%)",
        borderColor: "rgba(99,102,241,0.25)"
      },
      {
        id: "course_999",
        name: "Full Financial Masterclass & Pre-books",
        tier: "One-time Course / Pre-order",
        priceLabel: "₹999 / purchase",
        activeCount: courses.length,
        totalPurchases: courses.length,
        revenue: coursesRev,
        share: totalNetRevenue > 0 ? Math.round((coursesRev / totalNetRevenue) * 100) : 0,
        badgeColor: "#e8473f",
        accent: "linear-gradient(135deg, rgba(232,71,63,0.14) 0%, rgba(232,71,63,0.02) 100%)",
        borderColor: "rgba(232,71,63,0.25)"
      }
    ];
  }, [paidSubscriptions, filteredPurchases, totalCourseRevenue, totalNetRevenue, inFilteredPeriod]);

  /* ---------------------------------------------------------
     PERIODIC BREAKDOWN (WEEKLY & MONTHLY)
     --------------------------------------------------------- */

  const weeklyRows = useMemo(() => {
    const rows = [];
    const today = new Date();
    const currentWeekStart = startOfWeek(today);

    for (let i = 0; i < 8; i += 1) {
      const start = new Date(currentWeekStart);
      start.setDate(start.getDate() - i * 7);
      const end = endOfPeriod(start, "week");

      const sPurchases = paidPurchases.filter((p) => {
        const t = toMillis(getPurchaseDate(p));
        return t >= start.getTime() && t < end.getTime();
      });

      const sCharges = subscriptionCharges.filter((c) => c.time >= start.getTime() && c.time < end.getTime());

      const cRev = sPurchases.reduce((sum, p) => sum + getPurchaseAmount(p), 0);
      const sRev = sCharges.reduce((sum, c) => sum + c.amount, 0);
      const tot = cRev + sRev;

      const sMembers = members.filter((m) => {
        const t = toMillis(getMemberDate(m));
        return t >= start.getTime() && t < end.getTime();
      });

      rows.push({
        key: `week-${i}`,
        label: `${formatDate(start)} – ${formatDate(new Date(end.getTime() - 86400000))}`,
        purchasesCount: sPurchases.length,
        subscriptionsCount: sCharges.length,
        newMembers: sMembers.length,
        courseRevenue: cRev,
        subscriptionRevenue: sRev,
        totalRevenue: tot
      });
    }
    return rows;
  }, [paidPurchases, subscriptionCharges, members]);

  const monthlyRows = useMemo(() => {
    const rows = [];
    const today = new Date();
    const currentMonthStart = startOfMonth(today);

    for (let i = 0; i < 6; i += 1) {
      const start = new Date(currentMonthStart);
      start.setMonth(start.getMonth() - i);
      const end = endOfPeriod(start, "month");

      const sPurchases = paidPurchases.filter((p) => {
        const t = toMillis(getPurchaseDate(p));
        return t >= start.getTime() && t < end.getTime();
      });

      const sCharges = subscriptionCharges.filter((c) => c.time >= start.getTime() && c.time < end.getTime());

      const cRev = sPurchases.reduce((sum, p) => sum + getPurchaseAmount(p), 0);
      const sRev = sCharges.reduce((sum, c) => sum + c.amount, 0);
      const tot = cRev + sRev;

      const sMembers = members.filter((m) => {
        const t = toMillis(getMemberDate(m));
        return t >= start.getTime() && t < end.getTime();
      });

      rows.push({
        key: `month-${i}`,
        label: start.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        purchasesCount: sPurchases.length,
        subscriptionsCount: sCharges.length,
        newMembers: sMembers.length,
        courseRevenue: cRev,
        subscriptionRevenue: sRev,
        totalRevenue: tot
      });
    }
    return rows;
  }, [paidPurchases, subscriptionCharges, members]);

  const chartData = useMemo(() => {
    return [...(tableTab === "weekly" ? weeklyRows : monthlyRows)].reverse();
  }, [tableTab, weeklyRows, monthlyRows]);

  /* ---------------------------------------------------------
     TRANSACTIONS LEDGER (FILTERED & SEARCHABLE)
     --------------------------------------------------------- */

  const transactionsList = useMemo(() => {
    const list = [];

    // Add Course purchases
    if (txFilter === "all" || txFilter === "course") {
      filteredPurchases.forEach((p) => {
        list.push({
          id: p.id || p.paymentId || `course-${p.createdAt}`,
          type: "course",
          planName: p.courseTitle || p.courseName || "Wealthoria Course Pre-book",
          customerName: p.userName || p.name || p.userEmail || p.email || "Customer",
          email: p.userEmail || p.email || "—",
          amount: getPurchaseAmount(p),
          status: "Captured",
          date: getPurchaseDate(p),
          paymentId: p.paymentId || p.razorpayPaymentId || "—"
        });
      });
    }

    // Add Subscription payments
    if (txFilter === "all" || txFilter === "subscription") {
      paidSubscriptions.forEach((sub) => {
        const charges = getSubscriptionCharges(sub).filter((c) => inFilteredPeriod(c.time));
        charges.forEach((charge, idx) => {
          list.push({
            id: `${sub.id}-${idx}`,
            type: "subscription",
            planName: sub.plan || "Wealthoria Premium (₹99/mo)",
            customerName: sub.name || sub.email || "Subscriber",
            email: sub.email || "—",
            amount: charge.amount,
            status: "Captured",
            date: charge.time,
            paymentId: sub.razorpayPaymentId || sub.razorpaySubscriptionId || "—"
          });
        });
      });
    }

    return list
      .filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.customerName.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          String(item.paymentId).toLowerCase().includes(q) ||
          item.planName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => toMillis(b.date) - toMillis(a.date));
  }, [filteredPurchases, paidSubscriptions, txFilter, searchQuery, inFilteredPeriod]);

  /* ---------------------------------------------------------
     EXPORT TO EXCEL
     --------------------------------------------------------- */

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Executive Summary Sheet
      const summaryRows = [
        ["Wealthoria Financial & Plan Performance Report"],
        ["Generated At", new Date().toLocaleString("en-IN")],
        ["Time Filter", timeFilter],
        [],
        ["Metric", "Value"],
        ["Total Net Revenue", fmtINR0(totalNetRevenue)],
        ["Subscription Revenue", fmtINR0(totalSubscriptionRevenue)],
        ["Course Purchase Revenue", fmtINR0(totalCourseRevenue)],
        ["Active Subscribers", activeSubscriptions.length],
        ["Total Captured Transactions", totalTransactionsCount],
        ["Unique Paying Customers", uniquePayingMemberIds.size],
        ["Average Revenue Per User (ARPU)", fmtINRDec(arpu)]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // 2. Plan Breakdown Sheet
      const planRows = [
        ["Plan / Product", "Tier", "Pricing", "Active Subscribers", "Transactions", "Revenue (INR)", "Share (%)"],
        ...planBreakdown.map((p) => [p.name, p.tier, p.priceLabel, p.activeCount, p.totalPurchases, p.revenue, `${p.share}%`])
      ];
      const planSheet = XLSX.utils.aoa_to_sheet(planRows);
      XLSX.utils.book_append_sheet(wb, planSheet, "Plan Breakdown");

      // 3. Transactions Sheet
      const txRows = [
        ["Transaction ID", "Type", "Plan / Product", "Customer Name", "Email", "Amount (INR)", "Status", "Date", "Payment Ref"],
        ...transactionsList.map((t) => [t.id, t.type, t.planName, t.customerName, t.email, t.amount, t.status, formatDate(t.date), t.paymentId])
      ];
      const txSheet = XLSX.utils.aoa_to_sheet(txRows);
      XLSX.utils.book_append_sheet(wb, txSheet, "Captured Transactions");

      XLSX.writeFile(wb, `wealthoria-financial-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      pushToast("Financial report successfully exported to Excel!", "success");
    } catch (err) {
      console.error("Export error:", err);
      pushToast("Export failed: " + err.message, "error");
    }
  };

  return (
    <div className="wealthoria-report-root reveal-fade" style={{ padding: "4px 0 32px" }}>
      {/* SCOPED MODERN CSS ENHANCEMENTS */}
      <style>{`
        .rep-header {
          display: flex;
          justifyContent: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .rep-title-group h2 {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 4px;
          color: var(--fg, #111827);
        }
        .rep-sub {
          font-size: 13px;
          color: var(--mute, #6b7280);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rep-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
          display: inline-block;
        }
        .rep-actions-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .rep-pill-btn {
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 600;
          border: 1px solid var(--line, #e5e7eb);
          background: var(--surface, #ffffff);
          color: var(--fg, #374151);
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .rep-pill-btn:hover {
          border-color: #e8473f;
          color: #e8473f;
          background: rgba(232, 71, 63, 0.04);
        }
        .rep-pill-btn.active {
          background: #e8473f;
          color: #ffffff;
          border-color: #e8473f;
          box-shadow: 0 2px 8px rgba(232, 71, 63, 0.28);
        }
        .rep-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .rep-kpi-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 16px;
          padding: 18px 20px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .rep-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }
        .rep-kpi-top {
          display: flex;
          justifyContent: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .rep-kpi-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rep-kpi-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .rep-kpi-val {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--fg, #111827);
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .rep-kpi-label {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--mute, #6b7280);
        }
        .rep-plans-container {
          background: var(--surface, #ffffff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 18px;
          padding: 22px 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }
        .rep-plan-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        .rep-plan-card {
          border-radius: 14px;
          padding: 20px;
          border: 1px solid;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
        }
        .rep-progress-bar {
          height: 10px;
          border-radius: 20px;
          background: rgba(0,0,0,0.06);
          display: flex;
          overflow: hidden;
          margin: 14px 0 8px;
        }
        .rep-table-container {
          background: var(--surface, #ffffff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 18px;
          padding: 20px 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }
        .rep-data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .rep-data-table th {
          text-align: left;
          padding: 12px 14px;
          font-weight: 700;
          color: var(--mute, #6b7280);
          border-bottom: 1px solid var(--line, #e5e7eb);
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .rep-data-table td {
          padding: 14px;
          border-bottom: 1px solid var(--line, #f3f4f6);
          color: var(--fg, #1f2937);
        }
        .rep-data-table tr:hover td {
          background: rgba(232, 71, 63, 0.02);
        }
        .rep-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }
        .rep-tag-green {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }
        .rep-tag-indigo {
          background: rgba(99, 102, 241, 0.12);
          color: #4f46e5;
        }
        .rep-tag-coral {
          background: rgba(232, 71, 63, 0.12);
          color: #e8473f;
        }
      `}</style>

      {/* =======================================================
          EXECUTIVE HEADER & CONTROLS
          ======================================================= */}
      <div className="rep-header">
        <div className="rep-title-group">
          <h2>Financial & Plan Analytics</h2>
          <div className="rep-sub">
            <span className="rep-live-dot" />
            <span>
              {activeSubscriptions.length} Active Subscribers · {paidPurchases.length} Course Sales · Strictly Captured Payments
            </span>
          </div>
        </div>

        <div className="rep-actions-bar">
          {/* Time filters */}
          {["7d", "30d", "90d", "all"].map((tf) => (
            <button
              key={tf}
              type="button"
              className={`rep-pill-btn ${timeFilter === tf ? "active" : ""}`}
              onClick={() => setTimeFilter(tf)}
            >
              {tf === "7d" ? "Last 7 Days" : tf === "30d" ? "This Month" : tf === "90d" ? "Last Quarter" : "All Time"}
            </button>
          ))}

          {/* Export to Excel */}
          <button
            type="button"
            className="rep-pill-btn"
            style={{ background: "rgba(16, 185, 129, 0.08)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.3)" }}
            onClick={handleExportExcel}
            title="Download full financial spreadsheet (.xlsx)"
          >
            <ReportIcon name="download" size={15} color="#059669" />
            Export Excel
          </button>

          {/* Refresh */}
          <button
            type="button"
            className="rep-pill-btn"
            onClick={() => backend.reload()}
            disabled={loading}
            title="Sync latest Firestore data"
          >
            <ReportIcon name="refresh" size={14} />
            {loading ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="notice notice-error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      ) : null}

      {/* =======================================================
          TOP KPI EXECUTIVE METRIC CARDS
          ======================================================= */}
      <div className="rep-kpi-grid">
        {/* Card 1: Total Net Revenue */}
        <div className="rep-kpi-card" style={{ borderLeft: "4px solid #e8473f" }}>
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon" style={{ background: "rgba(232, 71, 63, 0.12)", color: "#e8473f" }}>
              <ReportIcon name="rupee" size={20} color="#e8473f" />
            </div>
            <span className="rep-kpi-badge" style={{ background: "rgba(232, 71, 63, 0.1)", color: "#e8473f" }}>
              {totalTransactionsCount} txns
            </span>
          </div>
          <div className="rep-kpi-val">{loading ? "—" : fmtINR0(totalNetRevenue)}</div>
          <div className="rep-kpi-label">Total Net Revenue</div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--mute, #6b7280)" }}>
            Subscriptions ({subSharePercent}%) + Courses ({courseSharePercent}%)
          </div>
        </div>

        {/* Card 2: Subscription Revenue (MRR) */}
        <div className="rep-kpi-card" style={{ borderLeft: "4px solid #6366f1" }}>
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>
              <ReportIcon name="wallet" size={20} color="#6366f1" />
            </div>
            <span className="rep-kpi-badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#4f46e5" }}>
              ₹99 / mo
            </span>
          </div>
          <div className="rep-kpi-val">{loading ? "—" : fmtINR0(totalSubscriptionRevenue)}</div>
          <div className="rep-kpi-label">Subscription Revenue</div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--mute, #6b7280)" }}>
            {activeSubscriptions.length} active recurring subscribers
          </div>
        </div>

        {/* Card 3: Course / Pre-book Revenue */}
        <div className="rep-kpi-card" style={{ borderLeft: "4px solid #10b981" }}>
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <ReportIcon name="package" size={20} color="#10b981" />
            </div>
            <span className="rep-kpi-badge" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
              {filteredPurchases.length} sales
            </span>
          </div>
          <div className="rep-kpi-val">{loading ? "—" : fmtINR0(totalCourseRevenue)}</div>
          <div className="rep-kpi-label">Course & Pre-book Sales</div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--mute, #6b7280)" }}>
            High-ticket Masterclass courses (₹999)
          </div>
        </div>

        {/* Card 4: Total Members & Paid Base */}
        <div className="rep-kpi-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <ReportIcon name="users" size={20} color="#f59e0b" />
            </div>
            <span className="rep-kpi-badge" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
              {members.length} registered
            </span>
          </div>
          <div className="rep-kpi-val">{loading ? "—" : uniquePayingMemberIds.size.toLocaleString("en-IN")}</div>
          <div className="rep-kpi-label">Unique Paying Members</div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--mute, #6b7280)" }}>
            {members.length > 0 ? Math.round((uniquePayingMemberIds.size / members.length) * 100) : 0}% paid customer conversion
          </div>
        </div>

        {/* Card 5: ARPU (Average Revenue per Customer) */}
        <div className="rep-kpi-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
              <ReportIcon name="trend-up" size={20} color="#8b5cf6" />
            </div>
            <span className="rep-kpi-badge" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#7c3aed" }}>
              ARPU
            </span>
          </div>
          <div className="rep-kpi-val">{loading ? "—" : fmtINRDec(arpu)}</div>
          <div className="rep-kpi-label">Avg. Revenue / Paying User</div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--mute, #6b7280)" }}>
            Across all subscription & course purchases
          </div>
        </div>
      </div>

      {/* =======================================================
          PLAN-ACCORDING PERFORMANCE SECTION (KEY USER REQUIREMENT)
          ======================================================= */}
      <div className="rep-plans-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px", color: "var(--fg, #111827)" }}>
              Plan & Product Performance Breakdown
            </h3>
            <span style={{ fontSize: 12.5, color: "var(--mute, #6b7280)" }}>
              Distribution of revenue and active subscriber base by offering
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1" }} />
              ₹99 Monthly ({subSharePercent}%)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e8473f" }} />
              ₹999 Courses ({courseSharePercent}%)
            </span>
          </div>
        </div>

        {/* Visual Revenue Share Bar */}
        <div className="rep-progress-bar">
          <div
            style={{
              width: `${subSharePercent}%`,
              background: "linear-gradient(90deg, #6366f1, #818cf8)",
              transition: "width 0.4s ease"
            }}
            title={`₹99 Subscription: ${subSharePercent}% (₹${totalSubscriptionRevenue.toLocaleString("en-IN")})`}
          />
          <div
            style={{
              width: `${courseSharePercent}%`,
              background: "linear-gradient(90deg, #e8473f, #fb7185)",
              transition: "width 0.4s ease"
            }}
            title={`Course Pre-orders: ${courseSharePercent}% (₹${totalCourseRevenue.toLocaleString("en-IN")})`}
          />
        </div>

        {/* Plan Cards Grid */}
        <div className="rep-plan-card-grid">
          {planBreakdown.map((plan) => (
            <div
              key={plan.id}
              className="rep-plan-card"
              style={{
                background: plan.accent,
                borderColor: plan.borderColor
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span className="rep-tag" style={{ background: "rgba(255,255,255,0.85)", color: plan.badgeColor, border: `1px solid ${plan.borderColor}` }}>
                    {plan.tier}
                  </span>
                  <b style={{ fontSize: 16, color: "var(--fg, #111827)" }}>{plan.priceLabel}</b>
                </div>

                <h4 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px", color: "var(--fg, #111827)" }}>
                  {plan.name}
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                  <div style={{ background: "var(--surface, #ffffff)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line, #e5e7eb)" }}>
                    <div style={{ fontSize: 11, color: "var(--mute, #6b7280)", fontWeight: 600 }}>Active Members</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--fg, #111827)", marginTop: 2 }}>
                      {plan.activeCount.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div style={{ background: "var(--surface, #ffffff)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line, #e5e7eb)" }}>
                    <div style={{ fontSize: 11, color: "var(--mute, #6b7280)", fontWeight: 600 }}>Total Collected</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: plan.badgeColor, marginTop: 2 }}>
                      {fmtINR0(plan.revenue)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ color: "var(--mute, #6b7280)" }}>
                  Total Completed Charges: <b>{plan.totalPurchases}</b>
                </span>
                <span className="rep-tag" style={{ background: "rgba(0,0,0,0.05)", fontWeight: 800 }}>
                  {plan.share}% of Total Revenue
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =======================================================
          REVENUE TRAJECTORY CHART & TRENDS
          ======================================================= */}
      <div className="rep-table-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px", color: "var(--fg, #111827)" }}>
              Revenue Trajectory Over Time
            </h3>
            <span style={{ fontSize: 12.5, color: "var(--mute, #6b7280)" }}>
              Continuous timeline of verified subscription & course cashflow
            </span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className={`rep-pill-btn ${tableTab === "weekly" ? "active" : ""}`}
              onClick={() => { setTableTab("weekly"); setSelectedChartPoint(null); }}
            >
              Weekly Trend
            </button>
            <button
              type="button"
              className={`rep-pill-btn ${tableTab === "monthly" ? "active" : ""}`}
              onClick={() => { setTableTab("monthly"); setSelectedChartPoint(null); }}
            >
              Monthly Trend
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11.5, color: "var(--mute, #6b7280)", margin: "8px 0 16px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 3, background: "#e8473f", borderRadius: 2 }} />
            Total Net Revenue (INR)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 3, background: "#6366f1", borderRadius: 2 }} />
            Subscription Only (₹99)
          </span>
        </div>

        <RevenueAreaChart
          data={chartData}
          selectedPoint={selectedChartPoint}
          onSelectPoint={setSelectedChartPoint}
        />

        {selectedChartPoint && (
          <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12, background: "rgba(232, 71, 63, 0.05)", border: "1px solid rgba(232, 71, 63, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <span style={{ fontSize: 11, color: "var(--mute, #6b7280)" }}>Selected Period:</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--fg, #111827)" }}>{selectedChartPoint.label}</div>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <span style={{ fontSize: 11, color: "var(--mute, #6b7280)" }}>Total Revenue</span>
                <div style={{ fontWeight: 800, color: "#e8473f" }}>{fmtINR0(selectedChartPoint.totalRevenue)}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "var(--mute, #6b7280)" }}>Subscriptions</span>
                <div style={{ fontWeight: 700, color: "#6366f1" }}>{fmtINR0(selectedChartPoint.subscriptionRevenue)} ({selectedChartPoint.subscriptionsCount} charges)</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "var(--mute, #6b7280)" }}>Courses</span>
                <div style={{ fontWeight: 700, color: "#10b981" }}>{fmtINR0(selectedChartPoint.courseRevenue)} ({selectedChartPoint.purchasesCount} orders)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================
          PERIODIC BREAKDOWN AUDIT TABLE
          ======================================================= */}
      <div className="rep-table-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px", color: "var(--fg, #111827)" }}>
              {tableTab === "weekly" ? "Weekly Financial Audit (Last 8 Weeks)" : "Monthly Financial Audit (Last 6 Months)"}
            </h3>
            <span style={{ fontSize: 12.5, color: "var(--mute, #6b7280)" }}>
              Detailed ledger breakdown with product segregation
            </span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="rep-data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th style={{ textAlign: "right" }}>Course Orders</th>
                <th style={{ textAlign: "right" }}>Subscription Charges</th>
                <th style={{ textAlign: "right" }}>New Signups</th>
                <th style={{ textAlign: "right" }}>Course Revenue</th>
                <th style={{ textAlign: "right" }}>Subscription Revenue</th>
                <th style={{ textAlign: "right" }}>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(tableTab === "weekly" ? weeklyRows : monthlyRows).map((row) => (
                <tr key={row.key}>
                  <td style={{ fontWeight: 700 }}>{row.label}</td>
                  <td style={{ textAlign: "right" }}>{row.purchasesCount}</td>
                  <td style={{ textAlign: "right" }}>{row.subscriptionsCount}</td>
                  <td style={{ textAlign: "right" }}>{row.newMembers}</td>
                  <td style={{ textAlign: "right", color: "#10b981", fontWeight: 600 }}>{fmtINR0(row.courseRevenue)}</td>
                  <td style={{ textAlign: "right", color: "#6366f1", fontWeight: 600 }}>{fmtINR0(row.subscriptionRevenue)}</td>
                  <td style={{ textAlign: "right", fontWeight: 800, color: "var(--fg, #111827)" }}>{fmtINR0(row.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =======================================================
          CAPTURED TRANSACTIONS LEDGER (SEARCHABLE)
          ======================================================= */}
      <div className="rep-table-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px", color: "var(--fg, #111827)" }}>
              Captured Transactions Ledger
            </h3>
            <span style={{ fontSize: 12.5, color: "var(--mute, #6b7280)" }}>
              Search and filter every confirmed payment receipt
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { id: "all", label: "All Types" },
                { id: "subscription", label: "₹99 Subscriptions" },
                { id: "course", label: "Course Purchases" }
              ].map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  className={`rep-pill-btn ${txFilter === tb.id ? "active" : ""}`}
                  style={{ padding: "5px 11px", fontSize: 12 }}
                  onClick={() => setTxFilter(tb.id)}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <input
              type="text"
              placeholder="Search customer, email, payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "7px 12px",
                borderRadius: 10,
                border: "1px solid var(--line, #e5e7eb)",
                fontSize: 12.5,
                width: 230,
                outline: "none",
                background: "var(--surface, #fff)",
                color: "var(--fg, #111827)"
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          {transactionsList.length ? (
            <table className="rep-data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Plan / Offering</th>
                  <th>Payment ID</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "right" }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {transactionsList.slice(0, 30).map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: tx.type === "subscription" ? "rgba(99,102,241,0.15)" : "rgba(232,71,63,0.15)",
                            color: tx.type === "subscription" ? "#4f46e5" : "#e8473f",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          {String(tx.customerName || "U").charAt(0).toUpperCase()}
                        </span>
                        <b>{tx.customerName}</b>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--mute, #6b7280)" }}>{tx.email}</td>
                    <td>
                      <span className={`rep-tag ${tx.type === "subscription" ? "rep-tag-indigo" : "rep-tag-coral"}`}>
                        {tx.planName}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--mute, #6b7280)" }}>
                      {tx.paymentId}
                    </td>
                    <td>
                      <span className="rep-tag rep-tag-green">
                        ● {tx.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "var(--fg, #111827)" }}>
                      {fmtINR0(tx.amount)}
                    </td>
                    <td style={{ textAlign: "right", fontSize: 12, color: "var(--mute, #6b7280)", whiteSpace: "nowrap" }}>
                      {formatDateTime(tx.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "var(--mute, #6b7280)" }}>
              No transactions match your search or filter criteria.
            </div>
          )}
        </div>

        {transactionsList.length > 30 && (
          <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: "var(--mute, #6b7280)" }}>
            Showing 30 of {transactionsList.length} captured transactions. Export Excel for complete raw ledger.
          </div>
        )}
      </div>

      {/* Back to Dashboard link */}
      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          className="rep-pill-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          ← Back to Control Panel
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PUBLIC EXPORT
   ========================================================= */

window.AdminReports = ReportsPage;
