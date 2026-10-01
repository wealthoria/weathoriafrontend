/* =========================================================================
   Wealthoria — soft ripple cursor (lime)
   A lime ring + dot that eases toward the pointer, emits subtle ripples
   as you move, and grows over interactive elements.
   No-ops on touch / reduced-motion.
   ========================================================================= */
(function () {
  if (typeof window === "undefined") return;
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reduced) return;

  var LIME = "#84cc16";
  var LIME_SOFT = "rgba(132,204,22,.14)";
  var LIME_SOFT_DOWN = "rgba(132,204,22,.28)";

  // ---- styles ----
  var css =
    "html.wl-cursor, html.wl-cursor * { cursor: none !important; }" +
    ".wl-cur-ring{position:fixed;top:0;left:0;width:30px;height:30px;border:1.5px solid " + LIME + ";" +
      "border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);" +
      "transition:width .18s ease,height .18s ease,background-color .18s ease,border-color .18s ease,opacity .25s ease;" +
      "will-change:transform;opacity:0}" +
    ".wl-cur-dot{position:fixed;top:0;left:0;width:7px;height:7px;background:" + LIME + ";" +
      "border-radius:50%;pointer-events:none;z-index:100000;transform:translate(-50%,-50%);will-change:transform;opacity:0;" +
      "transition:opacity .25s ease,width .18s ease,height .18s ease}" +
    ".wl-cur-ring.is-hot{width:52px;height:52px;background:" + LIME_SOFT + ";border-color:" + LIME + "}" +
    ".wl-cur-ring.is-down{width:20px;height:20px;background:" + LIME_SOFT_DOWN + "}" +
    ".wl-ripple{position:fixed;top:0;left:0;border:1.5px solid " + LIME + ";border-radius:50%;" +
      "pointer-events:none;z-index:99998;transform:translate(-50%,-50%) scale(.4);opacity:.5;" +
      "will-change:transform,opacity}" +
    "@keyframes wl-ripple-anim{to{transform:translate(-50%,-50%) scale(1);opacity:0}}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- elements ----
  var ring = document.createElement("div"); ring.className = "wl-cur-ring";
  var dot = document.createElement("div"); dot.className = "wl-cur-dot";
  function mount() {
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.documentElement.classList.add("wl-cursor");
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  // ---- follow with easing ----
  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var rx = mx, ry = my;
  var visible = false;
  var lastRipple = 0, lastX = mx, lastY = my;

  function onMove(e) {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    if (!visible) { visible = true; ring.style.opacity = "1"; dot.style.opacity = "1"; }

    var now = e.timeStamp || performance.now();
    var dx = mx - lastX, dy = my - lastY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 6 && now - lastRipple > 90) {
      spawnRipple(mx, my, dist);
      lastRipple = now; lastX = mx; lastY = my;
    }
  }

  function spawnRipple(x, y, dist) {
    var size = Math.min(46, 18 + dist * 0.8);
    var r = document.createElement("div");
    r.className = "wl-ripple";
    r.style.left = x + "px"; r.style.top = y + "px";
    r.style.width = size + "px"; r.style.height = size + "px";
    r.style.animation = "wl-ripple-anim " + (620 + Math.random() * 180) + "ms cubic-bezier(.22,1,.36,1) forwards";
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 850);
  }

  function raf() {
    rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
    ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("mousedown", function () { ring.classList.add("is-down"); });
  window.addEventListener("mouseup", function () { ring.classList.remove("is-down"); });
  window.addEventListener("mouseleave", function () { ring.style.opacity = "0"; dot.style.opacity = "0"; visible = false; });

  // ---- grow over interactive elements ----
  var HOT = "a,button,input,select,textarea,label,[role=button],[role=tab],summary,.btn,.nav-login,.footer-login";
  document.addEventListener("mouseover", function (e) {
    if (e.target && e.target.closest && e.target.closest(HOT)) ring.classList.add("is-hot");
  });
  document.addEventListener("mouseout", function (e) {
    if (e.target && e.target.closest && e.target.closest(HOT)) ring.classList.remove("is-hot");
  });
})();