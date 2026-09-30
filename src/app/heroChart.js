/* =========================================================
   WEALTHORIA HERO ANIMATION

   Glass bar chart rising on a glowing grid, with an upward
   growth line, in front of a soft city skyline.
   Pure canvas, no video file. Adapts to light / dark theme,
   pauses when off screen, and shows a still frame for
   people who prefer reduced motion.

   startHeroChart(canvas) -> stop()
========================================================= */

const CYCLE_MS = 12000;
const MAX_DPR = 1.5;
const FRAME_MS = 1000 / 30; // 30 fps is plenty and saves battery

// Small deterministic random, so the skyline is the same every load.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const easeOutBack = (x) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, t) => a + (b - a) * t;

function mixColor(a, b, t) {
  return [0, 1, 2].map((i) => Math.round(lerp(a[i], b[i], t)));
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const THEMES = {
  dark: {
    skyTop: [5, 10, 22],
    skyBottom: [12, 27, 46],
    building: [16, 30, 52],
    window: [255, 214, 150],
    bokeh: [[255, 190, 110], [120, 190, 255], [255, 110, 90]],
    grid: [60, 200, 255],
    barFrom: [40, 140, 255],
    barTo: [30, 230, 190],
    line: [110, 200, 255],
    label: [200, 240, 255],
    glow: 1
  },
  light: {
    skyTop: [238, 244, 251],
    skyBottom: [222, 233, 245],
    building: [196, 211, 229],
    window: [255, 255, 255],
    bokeh: [[255, 200, 150], [150, 200, 255], [255, 170, 150]],
    grid: [40, 140, 230],
    barFrom: [40, 120, 240],
    barTo: [20, 190, 160],
    line: [30, 120, 240],
    label: [30, 70, 120],
    glow: 0.55
  }
};

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? THEMES.dark
    : THEMES.light;
}

export function startHeroChart(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let scene = null;
  let rafId = 0;
  let running = false;
  let lastFrame = 0;
  // manual: draw frames on request (used to export a video file)
  const startTime = options.manual ? 0 : performance.now();

  /* ---------------- SCENE LAYOUT ---------------- */

  function buildScene() {
    const rand = seeded(20260930);

    // Skyline: two layers of buildings with lit windows.
    const buildings = [];
    for (let layer = 0; layer < 2; layer++) {
      let x = -20;
      while (x < W + 20) {
        const w = lerp(28, 70, rand()) * (layer ? 1.2 : 0.9);
        const h = H * lerp(0.18, 0.5, rand()) * (layer ? 0.75 : 1);
        const windows = [];
        const cols = Math.max(1, Math.floor(w / 9));
        const rows = Math.max(1, Math.floor(h / 12));
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (rand() < 0.42) {
              windows.push({ c, r, phase: rand() * Math.PI * 2, speed: lerp(0.2, 1.2, rand()) });
            }
          }
        }
        buildings.push({ x, w, h, layer, windows, cols, rows });
        x += w + lerp(2, 14, rand());
      }
    }

    // Out-of-focus city lights.
    const bokeh = Array.from({ length: 60 }, () => ({
      x: rand() * W,
      y: H * lerp(0.08, 0.58, rand()),
      r: lerp(3, 22, rand()),
      color: Math.floor(rand() * 3),
      phase: rand() * Math.PI * 2,
      drift: lerp(-6, 6, rand())
    }));

    // Floating sparks.
    const sparks = Array.from({ length: 26 }, () => ({
      x: rand(),
      y: rand(),
      speed: lerp(0.02, 0.07, rand()),
      size: lerp(0.8, 2.2, rand()),
      phase: rand() * Math.PI * 2
    }));

    return { buildings, bokeh, sparks };
  }

  /* ---------------- CAMERA ---------------- */

  // Floor coordinates: x (left/right), z (depth, 1 = near).
  function project(x, z, y = 0) {
    // Portrait (phones): zoom in so the chart fills the width.
    const portrait = H > W;
    const horizon = H * (portrait ? 0.56 : 0.5);
    const f = portrait ? W * 0.95 : Math.min(W, H * 1.6) * 0.5;
    const cx = W * (portrait ? 0.58 : 0.64);
    const camHeight = portrait ? W * 0.95 : H * 0.5;
    const scale = f / z;
    return {
      x: cx + x * scale,
      y: horizon + (camHeight / f) * scale - y * scale,
      scale
    };
  }

  /* ---------------- DRAWING ---------------- */

  function drawSky(th) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgba(th.skyTop, 1));
    g.addColorStop(1, rgba(th.skyBottom, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  let skylineCache = null;
  let skylineTheme = null;

  function drawSkyline(th) {
    if (!skylineCache || skylineTheme !== th) {
      skylineCache = document.createElement("canvas");
      skylineCache.width = Math.round(W * dpr);
      skylineCache.height = Math.round(H * dpr);
      const off = skylineCache.getContext("2d");
      off.setTransform(dpr, 0, 0, dpr, 0, 0);
      off.filter = "blur(2.5px)";
      paintSkyline(off, th);
      skylineTheme = th;
    }
    ctx.drawImage(skylineCache, 0, 0, W, H);
  }

  function paintSkyline(ctx, th) {
    const time = 0;
    const base = H * 0.52;
    scene.buildings.forEach((b) => {
      const alpha = b.layer ? 0.35 : 0.6;
      ctx.fillStyle = rgba(b.layer ? mixColor(th.building, th.skyBottom, 0.45) : th.building, alpha);
      ctx.fillRect(b.x, base - b.h, b.w, b.h);

      const cw = b.w / b.cols;
      const ch = b.h / b.rows;
      b.windows.forEach((win) => {
        const flicker = 0.55 + 0.45 * Math.sin(time * 0.001 * win.speed + win.phase);
        ctx.fillStyle = rgba(th.window, (b.layer ? 0.18 : 0.32) * flicker * th.glow + 0.04);
        ctx.fillRect(b.x + win.c * cw + cw * 0.25, base - b.h + win.r * ch + ch * 0.3, cw * 0.5, ch * 0.4);
      });
    });

    // haze over the skyline
    const haze = ctx.createLinearGradient(0, base - H * 0.3, 0, base + 10);
    haze.addColorStop(0, rgba(th.skyBottom, 0));
    haze.addColorStop(1, rgba(th.skyBottom, 0.85));
    ctx.fillStyle = haze;
    ctx.fillRect(0, base - H * 0.3, W, H * 0.3 + 10);
  }

  function drawBokeh(th, time) {
    scene.bokeh.forEach((b) => {
      const pulse = 0.6 + 0.4 * Math.sin(time * 0.0007 + b.phase);
      const x = b.x + Math.sin(time * 0.0002 + b.phase) * b.drift;
      const g = ctx.createRadialGradient(x, b.y, 0, x, b.y, b.r);
      const c = th.bokeh[b.color];
      g.addColorStop(0, rgba(c, 0.55 * pulse * th.glow));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawGrid(th, time) {
    // floor fade
    const floorTop = H * 0.5;
    const fg = ctx.createLinearGradient(0, floorTop, 0, H);
    fg.addColorStop(0, rgba(th.skyBottom, 0));
    fg.addColorStop(1, rgba(mixColor(th.skyTop, th.grid, 0.06), 0.9));
    ctx.fillStyle = fg;
    ctx.fillRect(0, floorTop, W, H - floorTop);

    ctx.lineWidth = 1;

    // lines running into the distance
    for (let i = -14; i <= 14; i++) {
      const near = project(i * 0.5, 0.9);
      const far = project(i * 0.5, 8);
      const g = ctx.createLinearGradient(near.x, near.y, far.x, far.y);
      g.addColorStop(0, rgba(th.grid, 0.35 * th.glow + 0.08));
      g.addColorStop(1, rgba(th.grid, 0));
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(near.x, near.y);
      ctx.lineTo(far.x, far.y);
      ctx.stroke();
    }

    // cross lines, drifting slowly towards the viewer
    const offset = ((time * 0.00008) % 1) * 0.5;
    for (let k = 0; k < 18; k++) {
      const z = 0.9 + k * 0.5 - offset;
      if (z < 0.9) continue;
      const left = project(-7, z);
      const right = project(7, z);
      const a = clamp01(1 - (z - 0.9) / 7) * (0.3 * th.glow + 0.06);
      ctx.strokeStyle = rgba(th.grid, a);
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();
    }
  }

  const BARS = [0.22, 0.3, 0.36, 0.34, 0.52, 0.66, 0.78, 0.92];

  function barLayout(i) {
    // diagonal from front-left to back-right, like the reference
    const t = i / (BARS.length - 1);
    return { x: lerp(-3.4, 2.2, t), z: lerp(3.0, 5.4, t) };
  }

  function drawBar(th, i, grow, fade) {
    const { x, z } = barLayout(i);
    const h = BARS[i] * 3.5 * grow;
    const w = 0.34;
    const d = 0.34;
    const color = mixColor(th.barFrom, th.barTo, i / (BARS.length - 1));
    const light = mixColor(color, [255, 255, 255], 0.5);

    const fl = project(x - w / 2, z);
    const fr = project(x + w / 2, z);
    const br = project(x + w / 2, z + d);
    const bl = project(x - w / 2, z + d);
    const tfl = project(x - w / 2, z, h);
    const tfr = project(x + w / 2, z, h);
    const tbr = project(x + w / 2, z + d, h);
    const tbl = project(x - w / 2, z + d, h);

    const alpha = fade;

    // reflection on the floor
    const rg = ctx.createLinearGradient(0, fl.y, 0, fl.y + (fl.y - tfl.y) * 0.5);
    rg.addColorStop(0, rgba(color, 0.22 * alpha * th.glow + 0.05 * alpha));
    rg.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(fl.x, fl.y);
    ctx.lineTo(fr.x, fr.y);
    ctx.lineTo(fr.x, fr.y + (fr.y - tfr.y) * 0.5);
    ctx.lineTo(fl.x, fl.y + (fl.y - tfl.y) * 0.5);
    ctx.closePath();
    ctx.fill();

    if (h <= 0.001) return;

    ctx.save();
    ctx.shadowColor = rgba(color, 0.8 * th.glow);
    ctx.shadowBlur = 18 * th.glow;

    // side face (right)
    ctx.fillStyle = rgba(mixColor(color, [0, 0, 0], 0.35), 0.45 * alpha);
    ctx.beginPath();
    ctx.moveTo(fr.x, fr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(tbr.x, tbr.y);
    ctx.lineTo(tfr.x, tfr.y);
    ctx.closePath();
    ctx.fill();

    // front face (glass)
    const fg = ctx.createLinearGradient(0, tfl.y, 0, fl.y);
    fg.addColorStop(0, rgba(light, 0.62 * alpha));
    fg.addColorStop(0.5, rgba(color, 0.42 * alpha));
    fg.addColorStop(1, rgba(color, 0.2 * alpha));
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(fl.x, fl.y);
    ctx.lineTo(fr.x, fr.y);
    ctx.lineTo(tfr.x, tfr.y);
    ctx.lineTo(tfl.x, tfl.y);
    ctx.closePath();
    ctx.fill();

    // top face
    ctx.fillStyle = rgba(light, 0.75 * alpha);
    ctx.beginPath();
    ctx.moveTo(tfl.x, tfl.y);
    ctx.lineTo(tfr.x, tfr.y);
    ctx.lineTo(tbr.x, tbr.y);
    ctx.lineTo(tbl.x, tbl.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // bright glass edges
    ctx.strokeStyle = rgba(light, 0.85 * alpha);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tfl.x, tfl.y);
    ctx.lineTo(tfr.x, tfr.y);
    ctx.lineTo(tbr.x, tbr.y);
    ctx.moveTo(tfl.x, tfl.y);
    ctx.lineTo(fl.x, fl.y);
    ctx.moveTo(tfr.x, tfr.y);
    ctx.lineTo(fr.x, fr.y);
    ctx.stroke();

    return { top: project(x, z + d / 2, h) };
  }

  function drawGrowthLine(th, progress, fade, time) {
    // zig-zag rising in front of the bars, ending in an arrow
    const pts = [
      [-4.6, 3.0, 0.35],
      [-3.4, 3.0, 0.85],
      [-2.6, 3.0, 0.62],
      [-1.5, 3.0, 1.25],
      [-0.8, 3.0, 1.02],
      [0.3, 3.0, 1.7],
      [1.25, 3.0, 2.22]
    ].map(([x, z, y]) => project(x, z, y));

    // total length
    const seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      seg.push(l);
      total += l;
    }
    let remaining = total * progress;
    if (remaining <= 0) return;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = rgba(th.line, fade);
    ctx.lineWidth = Math.max(2.5, W / 420);
    ctx.shadowColor = rgba(th.line, 0.9 * th.glow);
    ctx.shadowBlur = 16 * th.glow + 4;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    let tip = pts[0];
    let angle = 0;
    for (let i = 1; i < pts.length && remaining > 0; i++) {
      const l = seg[i - 1];
      const t = Math.min(1, remaining / l);
      tip = { x: lerp(pts[i - 1].x, pts[i].x, t), y: lerp(pts[i - 1].y, pts[i].y, t) };
      angle = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
      ctx.lineTo(tip.x, tip.y);
      remaining -= l;
    }
    ctx.stroke();

    // arrow head at the tip
    const size = Math.max(12, W / 70);
    ctx.fillStyle = rgba(th.line, fade);
    ctx.beginPath();
    ctx.moveTo(tip.x + Math.cos(angle) * size, tip.y + Math.sin(angle) * size);
    ctx.lineTo(tip.x + Math.cos(angle + 2.5) * size * 0.8, tip.y + Math.sin(angle + 2.5) * size * 0.8);
    ctx.lineTo(tip.x + Math.cos(angle - 2.5) * size * 0.8, tip.y + Math.sin(angle - 2.5) * size * 0.8);
    ctx.closePath();
    ctx.fill();

    // pulse of light at the tip
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.006);
    const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, size * 2.4);
    g.addColorStop(0, rgba([255, 255, 255], 0.7 * fade * pulse * th.glow + 0.1 * fade));
    g.addColorStop(1, rgba(th.line, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, size * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const LABELS = ["+15.9%", "+18%", "+24%", "+32%"];

  function drawLabels(th, tops, cycle, fade) {
    ctx.save();
    ctx.font = `600 ${Math.max(11, W / 95)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    [3, 5, 6, 7].forEach((barIndex, k) => {
      const top = tops[barIndex];
      if (!top) return;
      const appear = clamp01((cycle - 0.3 - k * 0.06) / 0.08);
      if (appear <= 0) return;
      const rise = (1 - appear) * 10;
      ctx.fillStyle = rgba(th.label, 0.85 * appear * fade);
      ctx.shadowColor = rgba(th.line, 0.6 * th.glow);
      ctx.shadowBlur = 8 * th.glow;
      ctx.fillText(LABELS[k], top.x, top.y - 12 - rise);
    });
    ctx.restore();
  }

  function drawSparks(th, time) {
    scene.sparks.forEach((s) => {
      const y = (1 - ((s.y + time * 0.00001 * s.speed * 60) % 1)) * H;
      const x = s.x * W + Math.sin(time * 0.001 + s.phase) * 8;
      const a = (0.25 + 0.35 * Math.sin(time * 0.002 + s.phase)) * th.glow + 0.08;
      ctx.fillStyle = rgba(th.line, a);
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function render(time) {
    const th = currentTheme();
    const cycle =
      typeof options.fixedCycle === "number"
        ? options.fixedCycle
        : reduceMotion
          ? 0.7
          : ((time - startTime) % CYCLE_MS) / CYCLE_MS;

    // whole-chart fade at the end of each loop
    const fade = cycle > 0.9 ? 1 - easeInOut((cycle - 0.9) / 0.1) : 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSky(th);
    drawBokeh(th, time);
    drawSkyline(th);
    drawGrid(th, time);

    // bars grow one after another, back ones first so they sit behind
    const tops = [];
    const order = BARS.map((_, i) => i).sort((a, b) => barLayout(b).z - barLayout(a).z);
    order.forEach((i) => {
      const growStart = 0.04 + i * 0.035;
      const grow = easeOutBack(clamp01((cycle - growStart) / 0.16));
      const breathe = 1 + 0.02 * Math.sin(time * 0.0015 + i);
      const result = drawBar(th, i, Math.max(0, grow) * breathe, fade);
      if (result) tops[i] = result.top;
    });

    drawGrowthLine(th, easeInOut(clamp01((cycle - 0.12) / 0.4)), fade, time);
    drawLabels(th, tops, cycle, fade);
    drawSparks(th, time);
  }

  /* ---------------- LOOP / SIZING ---------------- */

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    scene = buildScene();
    skylineCache = null;
    render(performance.now());
  }

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;

    // Size can change without a resize event (e.g. mobile address bar).
    if (Math.abs(canvas.clientWidth - W) > 1 || Math.abs(canvas.clientHeight - H) > 1) {
      resize();
      return;
    }

    render(now);
  }

  function play() {
    if (running || reduceMotion) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  resize();

  if (options.manual) {
    const stopManual = () => {};
    stopManual.renderAt = (ms) => render(ms);
    return stopManual;
  }

  const ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(canvas);
  else window.addEventListener("resize", resize);

  // pause when the hero scrolls away or the tab is hidden
  let visible = true;
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          visible = entries[0].isIntersecting;
          if (visible && !document.hidden) play();
          else pause();
        }, { threshold: 0.02 })
      : null;
  if (io) io.observe(canvas);

  const onVisibility = () => {
    if (document.hidden || !visible) pause();
    else play();
  };
  document.addEventListener("visibilitychange", onVisibility);

  // redraw immediately when the site theme changes
  const mo = new MutationObserver(() => render(performance.now()));
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  play();

  return function stop() {
    pause();
    if (ro) ro.disconnect();
    else window.removeEventListener("resize", resize);
    if (io) io.disconnect();
    mo.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
