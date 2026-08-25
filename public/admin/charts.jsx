/* global React, window */
/* =========================================================================
   Member Portal — SVG chart toolkit (no external lib; brand-themed, responsive)
   Each chart reads CSS vars at render so it adapts to light/dark automatically.
   Unique function names to avoid global-scope collisions across babel scripts.
   ========================================================================= */
const { useState, useRef, useEffect, useCallback } = React;

/* read a CSS custom property from :root */
function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/* responsive width hook: measof the container */
function useChartWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => { for (const e of entries) setW(e.contentRect.width); });
    ro.observe(ref.current);
    setW(ref.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const BRAND = "#e8473f";   // coral
const BRAND2 = "#f4823c";  // orange
const fmtINR = (n) => "\u20B9" + Math.round(n).toLocaleString("en-IN");
const fmtK = (n) => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : "" + n;

/* ---------- tooltip helper ---------- */
function useTip() {
  const [tip, setTip] = useState(null);
  const node = tip ? (
    <div style={{ position: "absolute", left: tip.x, top: tip.y, transform: "translate(-50%,-115%)", background: "var(--ink)", color: "var(--canvas)", padding: "7px 11px", borderRadius: 10, font: "var(--caption)", fontWeight: 600, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5, boxShadow: "0 8px 22px rgba(8,10,7,.25)" }}>
      {tip.label}
    </div>
  ) : null;
  return [node, setTip];
}

/* ================= LINE CHART (gross vs net) ================= */
function WLineChart({ data, keys, height = 240, aria }) {
  const [ref, w] = useChartWidth();
  const [tipNode, setTip] = useTip();
  const padL = 48, padR = 16, padT = 16, padB = 28;
  const iw = Math.max(40, w - padL - padR), ih = height - padT - padB;
  const grid = "var(--hair)", text = "var(--mute)";

  const maxV = Math.max(...data.flatMap((d) => keys.map((k) => d[k.key])), 1);
  const stepX = data.length > 1 ? iw / (data.length - 1) : 0;
  const X = (i) => padL + i * stepX;
  const Y = (v) => padT + ih - (v / maxV) * ih;
  const path = (key) => data.map((d, i) => `${i ? "L" : "M"}${X(i)},${Y(d[key])}`).join(" ");
  const ticks = 4;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {tipNode}
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label={aria || "Line chart"}>
        {Array.from({ length: ticks + 1 }).map((_, t) => {
          const v = (maxV / ticks) * t, y = Y(v);
          return <g key={t}><line x1={padL} y1={y} x2={w - padR} y2={y} stroke={grid} strokeWidth="1" /><text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill={text}>{fmtK(v)}</text></g>;
        })}
        {keys.map((k) => <path key={k.key} d={path(k.key)} fill="none" stroke={k.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />)}
        {keys.map((k) => data.map((d, i) => (
          <circle key={k.key + i} cx={X(i)} cy={Y(d[k.key])} r="3.5" fill={k.color}
            onMouseEnter={() => setTip({ x: X(i), y: Y(d[k.key]), label: `${d.label}: ${fmtINR(d[k.key])}` })}
            onMouseLeave={() => setTip(null)} style={{ cursor: "pointer" }} />
        )))}
        {data.map((d, i) => (i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
          <text key={"x" + i} x={X(i)} y={height - 8} textAnchor="middle" fontSize="11" fill={text}>{d.label}</text>
        ))}
      </svg>
    </div>
  );
}

/* ================= HORIZONTAL BAR (top courses) ================= */
function WHBarChart({ data, height, aria }) {
  const [ref, w] = useChartWidth();
  const [tipNode, setTip] = useTip();
  const rowH = 30, gap = 10, labelW = Math.min(190, Math.max(120, w * 0.32));
  const barArea = Math.max(60, w - labelW - 56);
  const maxV = Math.max(...data.map((d) => d.value), 1);
  const text = "var(--body)", track = "var(--canvas-soft)";
  const H = data.length * (rowH + gap);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {tipNode}
      <svg width="100%" height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={aria || "Bar chart"}>
        {data.map((d, i) => {
          const y = i * (rowH + gap), bw = (d.value / maxV) * barArea;
          return (
            <g key={d.name}>
              <text x={0} y={y + rowH / 2 + 4} fontSize="12.5" fontWeight="600" fill={text}>{d.name.length > 24 ? d.name.slice(0, 22) + "\u2026" : d.name}</text>
              <rect x={labelW} y={y} width={barArea} height={rowH} rx="8" fill={track} />
              <rect x={labelW} y={y} width={bw} height={rowH} rx="8" fill="url(#barGrad)"
                onMouseEnter={() => setTip({ x: labelW + bw, y: y + rowH / 2, label: `${d.value} enrollments` })}
                onMouseLeave={() => setTip(null)} style={{ cursor: "pointer" }} />
              <text x={labelW + bw + 8} y={y + rowH / 2 + 4} fontSize="12" fontWeight="700" fill={text}>{d.value}</text>
            </g>
          );
        })}
        <defs><linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={BRAND} /><stop offset="1" stopColor={BRAND2} /></linearGradient></defs>
      </svg>
    </div>
  );
}

/* ================= AREA CHART (signups/day) ================= */
function WAreaChart({ data, dataKey = "signups", height = 200, aria }) {
  const [ref, w] = useChartWidth();
  const [tipNode, setTip] = useTip();
  const padL = 36, padR = 12, padT = 14, padB = 26;
  const iw = Math.max(40, w - padL - padR), ih = height - padT - padB;
  const grid = "var(--hair)", text = "var(--mute)";
  const maxV = Math.max(...data.map((d) => d[dataKey]), 1);
  const stepX = data.length > 1 ? iw / (data.length - 1) : 0;
  const X = (i) => padL + i * stepX, Y = (v) => padT + ih - (v / maxV) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${X(i)},${Y(d[dataKey])}`).join(" ");
  const area = `${line} L${X(data.length - 1)},${padT + ih} L${X(0)},${padT + ih} Z`;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {tipNode}
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label={aria || "Area chart"}>
        {[0, 0.5, 1].map((t, i) => { const y = padT + ih - t * ih; return <line key={i} x1={padL} y1={y} x2={w - padR} y2={y} stroke={grid} strokeWidth="1" />; })}
        <path d={area} fill="url(#areaGrad)" />
        <path d={line} fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => (
          <rect key={i} x={X(i) - stepX / 2} y={padT} width={Math.max(2, stepX)} height={ih} fill="transparent"
            onMouseEnter={() => setTip({ x: X(i), y: Y(d[dataKey]), label: `${d.label}: ${d[dataKey]} signups` })}
            onMouseLeave={() => setTip(null)} />
        ))}
        {data.map((d, i) => (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && (
          <text key={"x" + i} x={X(i)} y={height - 7} textAnchor="middle" fontSize="11" fill={text}>{d.label}</text>
        ))}
        <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={BRAND} stopOpacity="0.32" /><stop offset="1" stopColor={BRAND} stopOpacity="0" /></linearGradient></defs>
      </svg>
    </div>
  );
}

/* ================= DONUT (traffic sources) ================= */
const DONUT_COLORS = ["#e8473f", "#f4823c", "#f3b14e", "#caa0d8"];
function WDonutChart({ data, size = 200, aria }) {
  const [tipNode, setTip] = useTip();
  const r = size / 2, inner = r * 0.62, cx = r, cy = r;
  let acc = 0;
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const arcs = data.map((d, i) => {
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2; acc += d.value;
    const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (ang, rad) => [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad];
    const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r), [x2, y2] = p(a1, inner), [x3, y3] = p(a0, inner);
    return { d: `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${inner},${inner} 0 ${large} 0 ${x3},${y3} Z`, color: DONUT_COLORS[i % DONUT_COLORS.length], item: d };
  });
  return (
    <div style={{ position: "relative", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
      {tipNode}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={aria || "Donut chart"} style={{ flex: "0 0 auto" }}>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color}
            onMouseEnter={(e) => setTip({ x: cx, y: cy, label: `${a.item.name}: ${a.item.pct}%` })}
            onMouseLeave={() => setTip(null)} style={{ cursor: "pointer" }} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="800" fontFamily="var(--font-display)" fill="var(--ink)">{total >= 1000 ? fmtK(total) : total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--mute)">visitors</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, minWidth: 130 }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 9, font: "var(--body-sm)" }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length], flex: "0 0 auto" }} />
            <span style={{ color: "var(--body)", flex: 1 }}>{d.name}</span>
            <span style={{ color: "var(--ink)", fontWeight: 700 }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= FUNNEL (completion) ================= */
function WFunnelChart({ data, aria }) {
  const [tipNode, setTip] = useTip();
  const maxV = data[0]?.value || 1;
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }} role="img" aria-label={aria || "Funnel chart"}>
      {tipNode}
      {data.map((d, i) => {
        const pct = Math.round((d.value / maxV) * 100);
        return (
          <div key={d.stage} style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, font: "var(--body-sm-strong)" }}>
              <span style={{ color: "var(--ink)" }}>{d.stage}</span>
              <span style={{ color: "var(--mute)" }}>{d.value.toLocaleString("en-IN")} <span style={{ color: "var(--body)", fontWeight: 700 }}>&middot; {pct}%</span></span>
            </div>
            <div style={{ height: 26, borderRadius: 10, background: "var(--canvas-soft)", overflow: "hidden" }}
              onMouseEnter={(e) => setTip({ x: e.currentTarget.offsetLeft + 60, y: e.currentTarget.offsetTop, label: `${d.stage}: ${d.value}` })}
              onMouseLeave={() => setTip(null)}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 10, background: `linear-gradient(90deg, ${BRAND}, ${BRAND2})`, transition: "width .5s var(--ease, ease)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================= SPARKLINE (metric cards) ================= */
function WSparkline({ data, dataKey = "gross", width = 120, height = 36, color = BRAND }) {
  if (!data || data.length < 2) return null;
  const vals = data.map((d) => d[dataKey]);
  const min = Math.min(...vals), max = Math.max(...vals) || 1;
  const stepX = width / (data.length - 1);
  const Y = (v) => height - 2 - ((v - min) / (max - min || 1)) * (height - 4);
  const line = vals.map((v, i) => `${i ? "L" : "M"}${i * stepX},${Y(v)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = "spark" + dataKey + Math.round(width);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    </svg>
  );
}

Object.assign(window, { WLineChart, WHBarChart, WAreaChart, WDonutChart, WFunnelChart, WSparkline });
