/* global React, window */
/* =========================================================================
   Member Portal — Control Panel dashboard (/member/dashboard)
   Stat cards + charts + activity feed + quick actions, all driven by a global
   date-range picker. Replaces the simple welcome dashboard.
   ========================================================================= */
const { useState, useMemo, useEffect, useCallback } = React;
const { useMemberAuth, useRole } = window;
const { useMemberData } = window;
const { useMRouter, MIcon, useMToast } = window;
const { Shell } = window;
const A = window.ANALYTICS;
const { WLineChart, WHBarChart, WAreaChart, WDonutChart, WFunnelChart, WSparkline } = window;

const fmtINR0 = (n) => "\u20B9" + Math.round(n).toLocaleString("en-IN");

function MetricCard({ icon, label, value, delta, spark, sparkKey, sparkColor }) {
  return (
    <div className="metric">
      <div className="m-top">
        <span className="m-ic"><MIcon name={icon} size={17} /></span>
        <span className="m-label">{label}</span>
      </div>
      <div className="m-value">{value}</div>
      <div className="m-foot">
        {delta != null ? (
          <span className={`delta ${delta >= 0 ? "up" : "down"}`}>
            <MIcon name={delta >= 0 ? "arrow" : "arrow"} size={12} style={{ transform: delta >= 0 ? "rotate(-45deg)" : "rotate(45deg)" }} />
            {Math.abs(delta)}%
          </span>
        ) : <span />}
        {spark && <WSparkline data={spark} dataKey={sparkKey} color={sparkColor} width={108} height={32} />}
      </div>
    </div>
  );
}

function ControlPanel() {
  const { user } = useMemberAuth();
  const { role } = useRole();
  const data = useMemberData();
  const { navigate } = useMRouter();
  const { push } = useMToast();

  // a11y: after the dashboard mounts (e.g. right after login), move focus to
  // the page heading so keyboard/screen-reader users land in the right place.
  useEffect(() => {
    const h = document.querySelector(".topbar h1");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }, []);

  const [rangeId, setRangeId] = useState("30d");
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [grain, setGrain] = useState("daily");

  // resolve number of days from the chosen range (custom uses date diff)
  const days = useMemo(() => {
    if (custom && from && to) {
      const d = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
      return Math.max(2, Math.min(365, d));
    }
    return (A.RANGES.find((r) => r.id === rangeId) || A.RANGES[1]).days;
  }, [custom, from, to, rangeId]);

  // ALL chart data derives from `days` so every chart re-filters together
  const series = useMemo(() => A.buildSeries(days), [days]);
  const bucketed = useMemo(() => A.bucketize(series, grain), [series, grain]);
  const enrollByCourse = useMemo(() => A.enrollmentsByCourse(days), [days]);
  const funnel = useMemo(() => A.completionFunnel(days), [days]);
  const traffic = useMemo(() => A.trafficSources(days), [days]);
  const metrics = useMemo(() => A.headlineMetrics(series), [series]);

  const activeCourses = data.courses.filter((c) => c.status === "published").length;
  const completionRate = funnel.length ? Math.round((funnel[3].value / funnel[0].value) * 100) : 0;

  // when grain becomes invalid for the range (e.g. monthly on 7d), reset
  useEffect(() => { if (days < 14 && grain !== "daily") setGrain("daily"); if (days < 60 && grain === "monthly") setGrain("weekly"); }, [days]);

  const setRange = (id) => { setCustom(false); setRangeId(id); };

  return (
    <Shell title="Control panel" subtitle={`Signed in as ${role} \u00b7 ${data.students.length} students`}
      actions={<button className="btn btn-green btn-sm" onClick={() => navigate("/member/courses/new")}><MIcon name="plus" size={16} />New course</button>}>
      <div className="reveal-fade">
        {/* date range + quick actions */}
        <div className="cp-bar">
          <div className="range-pick">
            {A.RANGES.map((r) => (
              <button key={r.id} className={!custom && rangeId === r.id ? "on" : ""} onClick={() => setRange(r.id)}>{r.label}</button>
            ))}
            <button className={custom ? "on" : ""} onClick={() => setCustom(true)}>Custom</button>
          </div>
          <div className="cp-actions">
            <QuickAction icon="send" label="Publish draft" onClick={() => { navigate("/member/content"); }} />
            <QuickAction icon="eye" label="Pending reviews" onClick={() => push("3 reviews pending (stubbed)")} />
            <QuickAction icon="download" label="Export CSV" onClick={() => exportCsv(data.students, push)} />
            <QuickAction icon="plus" label="Add course" onClick={() => navigate("/member/courses/new")} />
          </div>
        </div>

        {custom && (
          <div className="cp-customrow">
            <span className="muted" style={{ font: "var(--caption)" }}>From</span>
            <input className="dateinput" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="muted" style={{ font: "var(--caption)" }}>to</span>
            <input className="dateinput" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <span className="muted" style={{ font: "var(--caption)" }}>{from && to ? `${days} days` : "pick both dates"}</span>
          </div>
        )}

        <div className="cp-layout" style={{ marginTop: 18 }}>
          {/* MAIN COLUMN */}
          <div style={{ minWidth: 0 }}>
            {/* metric cards */}
            <div className="metric-grid">
              <MetricCard icon="users" label="Students enrolled" value={(2400 + metrics.totalEnroll).toLocaleString("en-IN")} delta={metrics.enrollDelta} spark={series} sparkKey="enrollments" sparkColor="#e8473f" />
              <MetricCard icon="rupee" label="Total revenue" value={fmtINR0(metrics.totalRevenue)} delta={metrics.revDelta} spark={series} sparkKey="gross" sparkColor="#f4823c" />
              <MetricCard icon="courses" label="Active courses" value={activeCourses + 18} />
              <MetricCard icon="cert" label="Avg. completion" value={completionRate + "%"} delta={4} />
              <MetricCard icon="upload" label="New signups (7d)" value={metrics.week} delta={11} spark={series.slice(-7)} sparkKey="signups" sparkColor="#2ead4b" />
            </div>

            {/* revenue line chart */}
            <div className="chart-grid">
              <div className="chart-card span2">
                <div className="chart-head">
                  <div className="ch-title"><h3>Revenue over time</h3><span className="ch-sub">Gross vs net, last {days} days</span></div>
                  <div className="ch-right">
                    <div className="legend">
                      <span className="li"><span className="sw" style={{ background: "#e8473f" }} />Gross</span>
                      <span className="li"><span className="sw" style={{ background: "#f3b14e" }} />Net</span>
                    </div>
                    <div className="seg">
                      <button className={grain === "daily" ? "on" : ""} onClick={() => setGrain("daily")}>Daily</button>
                      <button className={grain === "weekly" ? "on" : ""} onClick={() => setGrain("weekly")} disabled={days < 14}>Weekly</button>
                      <button className={grain === "monthly" ? "on" : ""} onClick={() => setGrain("monthly")} disabled={days < 60}>Monthly</button>
                    </div>
                  </div>
                </div>
                <WLineChart data={bucketed} keys={[{ key: "gross", color: "#e8473f" }, { key: "net", color: "#f3b14e" }]} height={250}
                  aria={`Revenue over time, gross versus net, last ${days} days. Gross total ${fmtINR0(metrics.totalRevenue)}.`} />
              </div>
            </div>

            {/* two-up: enrollments + traffic */}
            <div className="chart-grid two">
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>Enrollments by course</h3><span className="ch-sub">Top 10</span></div></div>
                <WHBarChart data={enrollByCourse} aria={`Top ${enrollByCourse.length} courses by enrollment. Highest: ${enrollByCourse[0] ? enrollByCourse[0].name + " with " + enrollByCourse[0].value + " enrollments" : "none"}.`} />
              </div>
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>Traffic sources</h3><span className="ch-sub">Where students come from</span></div></div>
                <div style={{ paddingTop: 8 }}><WDonutChart data={traffic} size={188} aria={`Traffic sources: ${traffic.map((t) => t.name + " " + t.pct + " percent").join(", ")}.`} /></div>
              </div>
            </div>

            {/* two-up: funnel + area */}
            <div className="chart-grid two">
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>Completion funnel</h3><span className="ch-sub">Enrolled to finished</span></div></div>
                <div style={{ paddingTop: 6 }}><WFunnelChart data={funnel} aria={`Completion funnel: ${funnel.map((f) => f.stage + " " + f.value).join(", ")}.`} /></div>
              </div>
              <div className="chart-card">
                <div className="chart-head"><div className="ch-title"><h3>New students per day</h3><span className="ch-sub">Last {days} days</span></div></div>
                <WAreaChart data={series} dataKey="signups" height={210} aria={`New students per day over the last ${days} days. ${metrics.week} signups in the last 7 days.`} />
              </div>
            </div>
          </div>

          {/* ACTIVITY SIDEBAR */}
          <ActivityFeed />
        </div>
      </div>
    </Shell>
  );
}

function QuickAction({ icon, label, onClick }) {
  return <button className="qa-btn" onClick={onClick}><span className="qa-ic"><MIcon name={icon} size={15} /></span>{label}</button>;
}

function exportCsv(students, push) {
  const rows = [["Name", "Email", "Enrolled", "Joined", "Status"], ...students.map((s) => [s.name, s.email, s.enrolled, s.joined, s.status])];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  try {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "wealthoria-students.csv"; a.click();
    URL.revokeObjectURL(url);
    push("Exported student CSV");
  } catch (e) { push("Export ready (stubbed)"); }
}

function ActivityFeed() {
  const full = useMemo(() => A.buildFeed(40), []);
  const [count, setCount] = useState(8);
  const faClass = { enroll: "fa-enroll", purchase: "fa-purchase", publish: "fa-publish", comment: "fa-comment", complete: "fa-complete" };
  return (
    <aside className="feed-card">
      <div className="feed-head">
        <h3>Recent activity</h3>
        <span className="live"><span className="pulse" />Live</span>
      </div>
      <div className="feed-list">
        {full.slice(0, count).map((it) => (
          <div className="feed-item" key={it.id}>
            <div>
              <span className={`feed-ava ${faClass[it.type]}`}>{it.name.charAt(0)}</span>
              <span className="feed-ic"><MIcon name={it.icon} size={11} /></span>
            </div>
            <div className="feed-body">
              <div className="feed-text"><b>{it.name}</b>{it.text.replace(it.name, "")}</div>
              <div className="feed-time">{A.relTime(it.minsAgo)}</div>
            </div>
          </div>
        ))}
      </div>
      {count < full.length && (
        <div className="feed-foot">
          <button className="btn btn-ghost btn-sm btn-block" onClick={() => setCount((c) => Math.min(full.length, c + 8))}>Load more</button>
        </div>
      )}
    </aside>
  );
}

/* keep the public name MemberDashboard so the router needs no change */
function MemberDashboard() { return <ControlPanel />; }
window.MemberDashboard = MemberDashboard;
