/* global React, window */
/* =========================================================================
   Wealthoria — GSAP animation layer
   ---------------------------------------------------------------------------
   Adapts a Next.js-style GSAP checklist to this single-file React (Babel) app.
   Everything runs inside ONE gsap.context() scoped to <body>, split by
   gsap.matchMedia() into desktop / mobile / reduced-motion branches. Each
   branch returns its own cleanup (removes DOM listeners); ctx.revert() + the
   matchMedia revert undo all GSAP state on unmount and on language change.

   Honours the brand's calm-motion guidance:
   - prefers-reduced-motion: NOTHING animates, content renders fully visible.
   - mobile (<1024px): lightweight fades only; no pin / horizontal / blob.
   ========================================================================= */
const { useApp } = window;

/* Tell <Reveal> to stand down — GSAP owns entrances now (base state stays
   visible if GSAP fails to load, so content is never stranded at opacity:0). */
if (window.gsap) window.__GSAP_ON__ = true;

/* split a headline into per-word mask spans; idempotent */
function splitWords(el) {
  if (!el) return [];
  if (el.querySelector(".w-inner")) return el.querySelectorAll(".w-inner");
  const segs = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = segs
    .map((seg) =>
      seg.trim().split(/\s+/).map((w) => `<span class="w-word"><span class="w-inner">${w}</span></span>`).join(" ")
    )
    .join("<br>");
  return el.querySelectorAll(".w-inner");
}

function SiteAnimations() {
  const { lang } = useApp();
  const progressRef = React.useRef(null);

  React.useLayoutEffect(() => {
    const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    let ctx, mm, rafId, t, tWatch, killed = false;
    const onLoad = () => ScrollTrigger.refresh();

    const build = () => {
      if (killed) return;
      const progress = progressRef.current;
      mm = gsap.matchMedia();

      ctx = gsap.context(() => {
      mm.add(
        {
          reduced: "(prefers-reduced-motion: reduce)",
          desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        },
        (c) => {
          const { reduced, desktop } = c.conditions;
          if (reduced) return;                 // calm mode: nothing hidden, nothing moves
          const off = [];                      // DOM-listener removers
          const q = (s) => gsap.utils.toArray(s);

          /* ---- helpers -------------------------------------------------- */
          const revealGroup = (sel, vars = {}) => {
            const els = q(sel);
            if (!els.length) return;
            gsap.set(els, { opacity: 0, y: vars.y ?? 60, rotation: vars.rotation ?? 0, transformOrigin: "center bottom" });
            ScrollTrigger.batch(els, {
              start: "top 85%",
              onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, rotation: 0, duration: 0.8, ease: "power4.out", stagger: vars.stagger ?? 0.1, overwrite: true }),
            });
          };
          const revealHeads = () => q(".shead").forEach((h) =>
            gsap.from(h, { y: 60, opacity: 0, duration: 0.8, ease: "power4.out", scrollTrigger: { trigger: h, start: "top 85%" } })
          );

          /* ---- 1. NAVBAR: intro + velocity hide/show -------------------- */
          gsap.from(".nav", { y: -80, opacity: 0, duration: 1, ease: "power3.out" });
          let shown = true;
          ScrollTrigger.create({
            start: 0, end: "max",
            onUpdate: (self) => {
              const v = self.getVelocity();
              if (self.scroll() < 90) { if (!shown) { gsap.to(".nav", { yPercent: 0, duration: 0.3 }); shown = true; } return; }
              if (v > 400 && shown) { gsap.to(".nav", { yPercent: -100, duration: 0.4, ease: "power2.in" }); shown = false; }
              else if (v < -300 && !shown) { gsap.to(".nav", { yPercent: 0, duration: 0.4, ease: "power3.out" }); shown = true; }
            },
          });

          /* ---- 2. HERO: word stagger + chained fades + cursor blob ------ */
          const words = splitWords(document.querySelector(".hero h1"));
          const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
          if (words.length) tl.from(words, { yPercent: 115, opacity: 0, duration: 1, stagger: 0.08 }, 0.15);
          tl.from(".hero .eyebrow", { y: 18, opacity: 0, duration: 0.6 }, 0.1)
            .from(".hero .lede", { y: 28, opacity: 0, duration: 0.8 }, "-=0.45")
            .from(".hero .ctas", { y: 26, opacity: 0, duration: 0.8 }, "-=0.55")
            .from(".hero .trustline", { y: 18, opacity: 0, duration: 0.6 }, "-=0.55")
            .from(".pathcard", { y: 44, opacity: 0, scale: 0.98, duration: 1 }, "-=0.7");

          if (desktop) {
            const blob = document.querySelector(".hero-blob");
            const hero = document.querySelector(".hero");
            if (blob && hero) {
              gsap.set(blob, { xPercent: -50, yPercent: -50 });
              const xb = gsap.quickTo(blob, "x", { duration: 0.6, ease: "power2" });
              const yb = gsap.quickTo(blob, "y", { duration: 0.6, ease: "power2" });
              const r0 = hero.getBoundingClientRect(); xb(r0.width * 0.62); yb(r0.height * 0.4);
              gsap.to(blob, { opacity: 1, duration: 1.2, delay: 0.5 });
              const move = (e) => { const r = hero.getBoundingClientRect(); xb(e.clientX - r.left); yb(e.clientY - r.top); };
              hero.addEventListener("mousemove", move);
              off.push(() => hero.removeEventListener("mousemove", move));
            }
          }

          /* ---- 3. SECTION HEADINGS + CARD GROUPS ------------------------ */
          revealHeads();
          revealGroup(".feat", { y: 80, rotation: 2, stagger: 0.12 });
          revealGroup(".yt", { y: 80, rotation: 2, stagger: 0.12 });
          revealGroup(".sem", { y: 50, stagger: 0.1 });
          revealGroup(".lib", { y: 70, rotation: 1.5, stagger: 0.1 });
          revealGroup(".faq-item", { y: 30, stagger: 0.06 });
          revealGroup(".consult, .formcard", { y: 50, stagger: 0.12 });
          revealGroup(".tst-slide", { y: 50, stagger: 0.1 });
          revealGroup(".founder-card", { y: 60, stagger: 0.14 });

          /* ---- 4. PINNED PROCESS (desktop) / fade (mobile) -------------- */
          const steps = q("#process .step");
          if (desktop && steps.length) {
            try {
              gsap.set(steps, { opacity: 0, y: 40 });
              const ptl = gsap.timeline({
                scrollTrigger: { trigger: "#process", start: "top top", end: "+=" + steps.length * 230, pin: true, scrub: 1, invalidateOnRefresh: true },
              });
              steps.forEach((s, i) => ptl.to(s, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, i * 0.6));
            } catch (e) { gsap.set(steps, { opacity: 1, y: 0 }); }
          } else {
            revealGroup("#process .step", { y: 50, stagger: 0.12 });
          }

          /* ---- 5. HORIZONTAL PROGRAMS (desktop) / fade (mobile) --------- */
          const programs = document.querySelector("#programs");
          const grid = programs && programs.querySelector(".prog-grid");
          if (desktop && grid && q("#programs .prog").length > 3) {
            try {
              document.documentElement.classList.add("gsap-hscroll");
              off.push(() => document.documentElement.classList.remove("gsap-hscroll"));
              ScrollTrigger.refresh();
              const dist = () => Math.max(0, grid.scrollWidth - programs.clientWidth + 24);
              gsap.to(grid, {
                x: () => -dist(), ease: "none",
                scrollTrigger: { trigger: programs, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true },
              });
            } catch (e) { document.documentElement.classList.remove("gsap-hscroll"); }
          } else {
            revealGroup("#programs .prog", { y: 70, rotation: 2, stagger: 0.1 });
          }

          /* ---- 6. STAT COUNTERS ---------------------------------------- */
          revealGroup(".metric", { y: 40, stagger: 0.08 });
          q(".metric .n").forEach((el) => {
            const raw = (el.dataset.v || el.textContent).trim();
            el.dataset.v = raw;
            const m = raw.match(/^([\d,]+)(.*)$/);
            if (!m) return;
            const target = parseInt(m[1].replace(/,/g, ""), 10);
            const suffix = m[2];
            const obj = { v: 0 };
            const finalText = target.toLocaleString("en-IN") + suffix;
            const snap = () => { el.textContent = finalText; };
            // NOTE: base state keeps the REAL value (e.g. "80+") visible. We only
            // drop to "0" at the instant the count-up starts, so if the trigger
            // never fires (frozen/throttled), the correct number stays on screen.
            ScrollTrigger.create({
              trigger: el, start: "top 92%", once: true,
              onEnter: () => {
                el.textContent = "0" + suffix;
                gsap.to(obj, {
                  v: target, duration: 2, ease: "power1.inOut", overwrite: true,
                  onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString("en-IN") + suffix; },
                  onComplete: snap, onInterrupt: snap,
                });
                setTimeout(snap, 2600);   // guarantee final value
              },
            });
          });

          /* ---- 7. PARALLAX (desktop, subtle) --------------------------- */
          if (desktop) {
            const par = (sel, amt, trig) => { const el = document.querySelector(sel); if (!el) return;
              gsap.to(el, { yPercent: amt, ease: "none", scrollTrigger: { trigger: trig || sel, start: "top bottom", end: "bottom top", scrub: true } }); };
            par(".pathcard", -6, ".hero");
          }

          /* ---- 8. MAGNETIC CTA ----------------------------------------- */
          if (desktop) {
            q(".nav-cta-desktop, .hero .ctas .btn-green").forEach((btn) => {
              const xt = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
              const yt = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
              const move = (e) => { const r = btn.getBoundingClientRect(); xt((e.clientX - (r.left + r.width / 2)) * 0.4); yt((e.clientY - (r.top + r.height / 2)) * 0.4); };
              const leave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
              btn.addEventListener("mousemove", move); btn.addEventListener("mouseleave", leave);
              off.push(() => { btn.removeEventListener("mousemove", move); btn.removeEventListener("mouseleave", leave); });
            });
          }

          /* ---- 9. SCROLL PROGRESS BAR ---------------------------------- */
          if (progress) ScrollTrigger.create({ start: 0, end: "max", onUpdate: (self) => gsap.set(progress, { scaleX: self.progress }) });

          /* ---- 10. FOOTER STAGGER -------------------------------------- */
          const fitems = q(".footer .brand, .footer .blurb, .footer .nl, .footer .social, .footer .footer-col");
          if (fitems.length) {
            gsap.set(fitems, { opacity: 0, y: 40 });
            ScrollTrigger.batch(fitems, { start: "top 92%", onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, stagger: 0.06, duration: 0.6, ease: "power3.out", overwrite: true }) });
          }

          ScrollTrigger.refresh();
          return () => off.forEach((fn) => fn());
        }
      );
      }, document.body);
      window.addEventListener("load", onLoad);
      t = setTimeout(() => ScrollTrigger.refresh(), 400);

      // Watchdog: if the GSAP ticker is not advancing shortly after setup
      // (rAF throttled/frozen, e.g. offscreen or backgrounded), force every
      // animated element to its visible end-state so nothing is stranded
      // hidden. Timers keep firing even when rAF is paused. In a healthy
      // foreground tab the ticker races ahead and this is a no-op.
      const f0 = gsap.ticker.frame;
      tWatch = setTimeout(() => {
        if (gsap.ticker.frame - f0 >= 3) return;        // ticker healthy
        ScrollTrigger.getAll().forEach((st) => st.kill());
        document.querySelectorAll(".pin-spacer").forEach((sp) => {
          const child = sp.firstElementChild;
          if (child) { sp.parentNode.insertBefore(child, sp); sp.remove(); }
        });
        document.documentElement.classList.remove("gsap-hscroll");
        gsap.set(".reveal,.hero h1 .w-inner,.hero .eyebrow,.hero .lede,.hero .ctas,.hero .trustline,.pathcard,.feat,.yt,.sem,.lib,.faq-item,.consult,.formcard,.tst-slide,#process .step,#programs .prog,#programs .prog-grid,.metric,.footer .brand,.footer .blurb,.footer .nl,.footer .social,.footer .footer-col,.scroll-progress,.nav,.hero-blob", { clearProps: "all" });
        document.querySelectorAll(".metric .n").forEach((el) => { if (el.dataset.v) el.textContent = el.dataset.v; });
      }, 1000);
    };

    // Defer setup to the first real animation frame. If rAF never fires
    // (throttled/background tab, offscreen iframe), no hidden from-states get
    // applied and content stays fully visible, never stranded at opacity:0.
    rafId = requestAnimationFrame(build);

    return () => {
      killed = true; cancelAnimationFrame(rafId); clearTimeout(t); clearTimeout(tWatch);
      window.removeEventListener("load", onLoad);
      if (mm) mm.revert(); if (ctx) ctx.revert();
    };
  }, [lang]);

  return <div className="scroll-progress" ref={progressRef} aria-hidden="true"></div>;
}

window.SiteAnimations = SiteAnimations;
