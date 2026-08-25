/* global window */
/* =========================================================================
   Member Portal — analytics mock data
   Deterministic (seeded) generators so the dashboard is stable across renders
   but still responds to the global date range. In production these become
   API calls: GET /analytics/revenue?range=30d etc.
   ========================================================================= */

/* seeded PRNG so charts don't jump on every render */
function seeded(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function dayKey(d) { return d.toISOString().slice(0, 10); }
function labelFor(d) { return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }

/* Build N days of per-day analytics ending today. Deterministic per index. */
function buildSeries(days) {
  const rnd = seeded(days * 1000 + 7);
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const t = (days - i) / days;
    // gentle upward trend + weekly wobble + noise
    const base = 6000 + t * 9000;
    const weekly = Math.sin((i / 7) * Math.PI * 2) * 1400;
    const noise = (rnd() - 0.5) * 2600;
    const gross = Math.max(1500, Math.round(base + weekly + noise));
    const net = Math.round(gross * (0.7 + rnd() * 0.06)); // ~72-76% net
    const signups = Math.max(2, Math.round(8 + t * 16 + Math.sin((i / 5) * Math.PI) * 5 + (rnd() - 0.5) * 7));
    const enrollments = Math.max(1, Math.round(signups * (0.55 + rnd() * 0.25)));
    out.push({ date: dayKey(d), label: labelFor(d), gross, net, signups, enrollments });
  }
  return out;
}

/* aggregate daily series into weekly or monthly buckets for the toggle */
function bucketize(series, grain) {
  if (grain === "daily") return series;
  const step = grain === "weekly" ? 7 : 30;
  const out = [];
  for (let i = 0; i < series.length; i += step) {
    const slice = series.slice(i, i + step);
    if (!slice.length) break;
    out.push({
      date: slice[0].date,
      label: grain === "weekly" ? slice[0].label : new Date(slice[0].date).toLocaleDateString("en-IN", { month: "short" }),
      gross: slice.reduce((a, b) => a + b.gross, 0),
      net: slice.reduce((a, b) => a + b.net, 0),
      signups: slice.reduce((a, b) => a + b.signups, 0),
      enrollments: slice.reduce((a, b) => a + b.enrollments, 0),
    });
  }
  return out;
}

/* top courses by enrollment — scaled by range so longer ranges show more */
const COURSE_ENROLL_BASE = [
  { name: "Stock market fundamentals", base: 312 },
  { name: "Mutual funds & SIPs", base: 268 },
  { name: "Personal finance", base: 241 },
  { name: "Financial planning", base: 187 },
  { name: "Tax saving essentials", base: 156 },
  { name: "Investor psychology", base: 134 },
  { name: "Reading market charts", base: 121 },
  { name: "Asset allocation", base: 98 },
  { name: "Budgeting basics", base: 76 },
  { name: "Compound interest", base: 54 },
];

function enrollmentsByCourse(days) {
  const f = days / 90; // 90d = full base
  return COURSE_ENROLL_BASE.map((c) => ({ name: c.name, value: Math.max(3, Math.round(c.base * f)) }))
    .sort((a, b) => b.value - a.value);
}

/* completion funnel */
function completionFunnel(days) {
  const f = days / 90;
  const enrolled = Math.round(1840 * f);
  return [
    { stage: "Enrolled", value: enrolled },
    { stage: "Started", value: Math.round(enrolled * 0.82) },
    { stage: "50% complete", value: Math.round(enrolled * 0.54) },
    { stage: "Finished", value: Math.round(enrolled * 0.36) },
  ];
}

/* traffic sources (donut) */
function trafficSources(days) {
  const rnd = seeded(days + 3);
  const raw = [
    { name: "Organic", value: 38 + Math.round(rnd() * 6) },
    { name: "Direct", value: 27 + Math.round(rnd() * 5) },
    { name: "Social", value: 21 + Math.round(rnd() * 5) },
    { name: "Referral", value: 12 + Math.round(rnd() * 4) },
  ];
  const total = raw.reduce((a, b) => a + b.value, 0);
  return raw.map((r) => ({ ...r, pct: Math.round((r.value / total) * 100) }));
}

/* headline metrics with deltas */
function headlineMetrics(series) {
  const totalRevenue = series.reduce((a, b) => a + b.gross, 0);
  const totalSignups = series.reduce((a, b) => a + b.signups, 0);
  const totalEnroll = series.reduce((a, b) => a + b.enrollments, 0);
  // last 7 days signups for "this week"
  const week = series.slice(-7).reduce((a, b) => a + b.signups, 0);
  // delta: compare first half vs second half
  const half = Math.floor(series.length / 2);
  const firstRev = series.slice(0, half).reduce((a, b) => a + b.gross, 0) || 1;
  const secondRev = series.slice(half).reduce((a, b) => a + b.gross, 0);
  const revDelta = Math.round(((secondRev - firstRev) / firstRev) * 100);
  const firstEn = series.slice(0, half).reduce((a, b) => a + b.enrollments, 0) || 1;
  const secondEn = series.slice(half).reduce((a, b) => a + b.enrollments, 0);
  const enrollDelta = Math.round(((secondEn - firstEn) / firstEn) * 100);
  return { totalRevenue, totalSignups, totalEnroll, week, revDelta, enrollDelta };
}

/* activity feed — a long list we paginate through */
const FEED_TEMPLATES = [
  { type: "enroll", icon: "users", text: (n, c) => `${n} enrolled in ${c}` },
  { type: "purchase", icon: "rupee", text: (n, c) => `${n} purchased ${c}` },
  { type: "publish", icon: "send", text: (n, c) => `${n} published ${c}` },
  { type: "comment", icon: "content", text: (n, c) => `${n} commented on ${c}` },
  { type: "complete", icon: "cert", text: (n, c) => `${n} completed ${c}` },
];
const FEED_NAMES = ["Priya Rao", "Manjunath S.", "Anita Kumar", "Rahul Desai", "Sahana B.", "Vikram N.", "Deepa R.", "Karthik M.", "Lakshmi P.", "Arjun V.", "Rohan Mehta", "Nisha T."];
const FEED_COURSES = ["Stock market fundamentals", "Mutual funds & SIPs", "Personal finance", "Tax saving essentials", "Investor psychology", "Reading market charts"];

function buildFeed(count) {
  const rnd = seeded(99);
  const out = [];
  let minutes = 2;
  for (let i = 0; i < count; i++) {
    const tpl = FEED_TEMPLATES[Math.floor(rnd() * FEED_TEMPLATES.length)];
    const name = FEED_NAMES[Math.floor(rnd() * FEED_NAMES.length)];
    const course = FEED_COURSES[Math.floor(rnd() * FEED_COURSES.length)];
    out.push({ id: "act" + i, type: tpl.type, icon: tpl.icon, name, text: tpl.text(name, course), minsAgo: minutes });
    minutes += Math.round(3 + rnd() * 90);
  }
  return out;
}

function relTime(mins) {
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

const RANGES = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
];

window.ANALYTICS = {
  buildSeries, bucketize, enrollmentsByCourse, completionFunnel, trafficSources,
  headlineMetrics, buildFeed, relTime, RANGES,
};
