/* global React, window */
const { useState, useRef, useEffect } = React;
const { useApp, Icon, Reveal, SectionHead, ImagePlaceholder } = window;

/* =========================================================================
   TESTIMONIALS - slider
   ========================================================================= */
function Testimonials() {
  const { t, lang } = useApp();
  const items = t.testimonials.items;
  const [idx, setIdx] = useState(0);
  const [perView, setPerView] = useState(3);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPerView(w < 760 ? 1 : w < 1040 ? 2 : 3);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const maxIdx = Math.max(0, items.length - perView);
  useEffect(() => { setIdx((i) => Math.min(i, maxIdx)); }, [maxIdx]);
  useEffect(() => { setIdx(0); }, [lang]);

  const initials = (n) => n.trim().charAt(0);

  return (
    <section className="band band-soft" id="testimonials">
      <div className="wrap">
        <SectionHead eyebrow={t.testimonials.eyebrow} title={t.testimonials.title} />
        <div className="tst-viewport">
          <div className="tst-track" style={{ transform: `translateX(-${idx * (100 / perView)}%)` }}>
            {items.map((it, i) => (
              <div className="tst-slide" key={i}>
                <div className="tst">
                  <div className="stars">{[0, 1, 2, 3, 4].map((s) => <Icon key={s} name="star" size={16} />)}</div>
                  <p className="body">&ldquo;{it.q}&rdquo;</p>
                  <div className="who">
                    <div className="av">{initials(it.n)}</div>
                    <div>
                      <div className="nm">{it.n}</div>
                      <div className="rl">{it.r}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="slider-ctl">
          <button className="arrow" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label="Previous">
            <Icon name="arrow" size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button className="arrow" onClick={() => setIdx((i) => Math.min(maxIdx, i + 1))} disabled={idx >= maxIdx} aria-label="Next">
            <Icon name="arrow" size={18} />
          </button>
          <div className="slider-dots">
            {Array.from({ length: maxIdx + 1 }).map((_, i) => (
              <i key={i} className={i === idx ? "on" : ""} onClick={() => setIdx(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   YOUTUBE / CONTENT HUB
   ========================================================================= */
function YouTube() {
  const { t } = useApp();
  const y = t.youtube;
  return (
    <section className="band band-white" id="resources">
      <div className="wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <SectionHead eyebrow={y.eyebrow} title={y.title} sub={y.sub} icon="youtube" />
          <Reveal><a className="btn btn-outline" href="#">{y.cta}<Icon name="arrow" size={18} /></a></Reveal>
        </div>
        <div className="yt-grid">
          {y.items.map((v, i) => (
            <Reveal as="button" key={i} className={`yt ${v.feat ? "feat-yt" : ""}`} delay={i * 90} style={{ border: 0, padding: 0, font: "inherit", textAlign: "left", cursor: "pointer", display: "block" }}>
              <div className="thumb">
                <ImagePlaceholder label="Video thumbnail - drop image" icon="play" style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
                <div className="play"><Icon name="play" size={22} /></div>
                <span className="dur">{v.dur}</span>
              </div>
              <div className="meta">
                <h3>{v.t}</h3>
                <div className="sub2"><span>{v.tag}</span><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="eye" size={13} />{v.views}</span></div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   SEMINARS & EVENTS
   ========================================================================= */
function Seminars({ onNav }) {
  const { t } = useApp();
  const s = t.seminars;
  return (
    <section className="band band-soft" id="seminars">
      <div className="wrap">
        <SectionHead eyebrow={s.eyebrow} title={s.title} sub={s.sub} icon="calendar" />
        <div className="sem-list">
          {s.items.map((ev, i) => (
            <Reveal key={i} className="sem" delay={i * 80}>
              <div className="date"><div className="d">{ev.d}</div><div className="m">{ev.m}</div></div>
              <div className="info">
                <h3>{ev.t}</h3>
                <div className="row">
                  <span><Icon name={ev.mode === "Online" || ev.mode === "ಆನ್‌ಲೈನ್" ? "monitor" : "pin"} size={15} />{ev.city}</span>
                  <span className="badge badge-green">{ev.mode}</span>
                  <span><Icon name="users" size={15} />{ev.seats} {s.seatsLabel}</span>
                </div>
              </div>
              <div className="act"><button className="btn btn-green btn-sm" onClick={() => onNav("consult")}>{s.cta}</button></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   FREE KNOWLEDGE LIBRARY
   ========================================================================= */
function Library() {
  const { t } = useApp();
  const l = t.library;
  const [overlay, setOverlay] = React.useState(null); // "calc" | {soon:title} | null
  const { CalcOverlay, ComingSoonOverlay } = window;
  const isCalc = (it) => it.tag === "Calculator" || it.tag === "\u0c95\u0ccd\u0caf\u0cbe\u0cb2\u0ccd\u0c95\u0cc1\u0cb2\u0cc7\u0c9f\u0cb0\u0ccd";
  return (
    <section className="band band-white">
      <div className="wrap">
        <SectionHead eyebrow={l.eyebrow} title={l.title} sub={l.sub} icon="book" />
        <div className="lib-grid">
          {l.items.map((it, i) => (
            <Reveal as="button" key={i} className="lib" delay={(i % 4) * 70} style={{ border: 0, font: "inherit", cursor: "pointer", textAlign: "left" }}
              onClick={() => setOverlay(isCalc(it) ? "calc" : { soon: it.t })}>
              <div className="iconwrap"><Icon name={it.ic} size={22} /></div>
              <span className="badge badge-soft" style={{ alignSelf: "flex-start" }}>{it.tag}</span>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
              <span className="dl"><Icon name="arrow" size={16} />{it.tag === "Calculator" || it.tag === "ಕ್ಯಾಲ್ಕುಲೇಟರ್" ? "Open" : "Read"}</span>
            </Reveal>
          ))}
        </div>
      </div>
      {overlay === "calc" && <CalcOverlay onClose={() => setOverlay(null)} />}
      {overlay && overlay.soon && <ComingSoonOverlay title={overlay.soon} onClose={() => setOverlay(null)} />}
    </section>
  );
}

Object.assign(window, { Testimonials, YouTube, Seminars, Library });
