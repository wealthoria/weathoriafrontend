/* global React, window */
const { useState } = React;
const { useApp, Icon, Reveal, SectionHead, BrandLockup } = window;

/* =========================================================================
   NAV + MOBILE DRAWER
   ========================================================================= */
function NavBar({ onNav }) {
  const { t, lang, setLang, theme, toggleTheme } = useApp();
  const [open, setOpen] = useState(false);
  const go = (id) => {setOpen(false);onNav(id);};

  return (
    <React.Fragment>
      <header className="nav">
        <div className="wrap nav-inner">
          <BrandLockup markHeight={32} onClick={(e) => {e.preventDefault();go("top");}} />
          <nav className="nav-links">
            {t.nav.links.map((l) =>
            <a key={l.id} onClick={() => go(l.id)}>{l.label}</a>
            
            )}
             <a href="live-webinar.html">
    🔴 Live Webinar
  </a>
          </nav>
          <div className="nav-right">
            <div className="lang-toggle" role="group" aria-label="Language">
              <span className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</span>
              <span className={lang === "kn" ? "on" : ""} onClick={() => setLang("kn")}>ಕನ್ನಡ</span>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
            </button>
            <a className="nav-login" href="Student Portal.html" aria-label="Student login">
              <Icon name="user" size={17} /><span className="nav-login-txt">Student login</span>
            </a>
            <button className="btn btn-green btn-sm nav-cta-desktop" onClick={() => go("consult")}>{t.nav.cta}</button>
            <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" size={20} /></button>
          </div>
        </div>
      </header>

      <div className={`drawer-scrim ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <BrandLockup markHeight={30} onClick={(e) => {e.preventDefault();go("top");}} />
          <button className="hamburger" onClick={() => setOpen(false)} aria-label="Close menu"><Icon name="x" size={20} /></button>
        </div>
        {t.nav.links.map((l) => <a key={l.id} onClick={() => go(l.id)}>{l.label}</a>)}
        <div className="drawer-foot">
          <a className="btn btn-outline btn-block" href="Student Portal.html"><Icon name="user" size={17} />Student login</a>
          <a className="btn btn-outline btn-block" href="Member Portal.html"><Icon name="lock" size={16} />Member login</a>
          <button className="btn btn-green btn-block" onClick={() => go("consult")}>{t.nav.cta}</button>
        </div>
      </aside>
    </React.Fragment>);

}

/* =========================================================================
   HERO  (Direction A - calm split)
   ========================================================================= */
function Hero({ onNav }) {
  const { t } = useApp();
  const h = t.hero;

  // pause the ambient video while the hero is offscreen (saves CPU/battery)
  React.useEffect(() => {
    const v = document.querySelector(".hero-video video");
    const hero = document.getElementById("top");
    if (!v || !hero || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {if (e.isIntersecting) {v.play().catch(() => {});} else {v.pause();}});
    }, { threshold: 0.05 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return (
    <section className="hero" id="top">
      <div className="hero-video" aria-hidden="true">
        <video
          autoPlay loop muted playsInline preload="auto"
          poster="assets/hero-bg.png"
          ref={(el) => {if (el && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {el.removeAttribute("autoplay");el.pause();}}}>
          
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260603_132049_036591b8-6e92-4760-b94c-a7ea6eef315c.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="hero-blob" aria-hidden="true"></div>
      <div className="wrap hero-grid">
        <Reveal>
          <span className="eyebrow">{h.eyebrow}</span>
          <h1 dangerouslySetInnerHTML={{ __html: `${h.title[0]}<br/>${h.title[1]}` }} style={{ fontSize: "58px" }}></h1>
          <p className="lede">{h.lede}</p>
          <div className="ctas">
            <button className="btn btn-green" onClick={() => onNav("programs")}>{h.ctaPrimary}<Icon name="arrow" size={18} /></button>
            <button className="btn btn-outline" onClick={() => onNav("consult")}>{h.ctaSecondary}</button>
          </div>
          <div className="trustline">
            <span className="avatars"><i /><i /><i /><i /></span>
            {h.trust}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="pathcard">
            <div className="ph">
              <h4>{h.card.title}</h4>
              <span className="badge badge-green">{h.card.level}</span>
            </div>
            <div className="pbar"><i /></div>
            <div className="pbar-l">{h.card.progress}</div>
            <div style={{ marginTop: 8 }}>
              {h.card.modules.map((m, i) =>
              <div key={i} className={`mod ${m.s === "lock" ? "locked" : ""}`}>
                  <div className={`dot ${m.s}`}>
                    {m.s === "done" ? <Icon name="check" size={14} stroke={3} /> : m.s === "now" ? <Icon name="play" size={11} /> : ""}
                  </div>
                  <div className="t">{m.t}</div>
                </div>
              )}
            </div>
            <button className="btn btn-green btn-block" style={{ marginTop: 18 }} onClick={() => onNav("programs")}>{h.card.cta}</button>
          </div>
        </Reveal>
      </div>
    </section>);

}

/* =========================================================================
   TICKER - scrolling trust strip (sits under the hero)
   ========================================================================= */
function Ticker() {
  const { t } = useApp();
  const items = t.ticker || [];
  if (!items.length) return null;
  const row = items.concat(items);
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {row.map((s, i) => <span className="ti" key={i}>{s}</span>)}
      </div>
    </div>);

}

/* =========================================================================
   NARRATIVE - problem -> solution dark band (before Why)
   ========================================================================= */
function Narrative() {
  const { t } = useApp();
  const n = t.narrative;
  if (!n) return null;
  return (
    <section className="band band-soft" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <Reveal className="narrative">
          <span className="idx n-idx">{n.eyebrow}</span>
          <h2>{n.l1} <em>{n.l2}</em> {n.l3}</h2>
          <div className="resolve"><span className="line"></span><b>{n.resolve}</b></div>
          <p className="sub">{n.sub}</p>
        </Reveal>
      </div>
    </section>);

}

/* =========================================================================
   METRICS - premium stat blocks
   ========================================================================= */
function Metrics() {
  const { t } = useApp();
  return (
    <section className="band band-soft" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="statband">
          {t.metrics.map((m, i) =>
          <Reveal key={i} className="statb" delay={i * 80}>
              <div className="sl"><i></i>{m.l}</div>
              <div className="sn">{m.n}</div>
              {m.c && <div className="sc">{m.c}</div>}
            </Reveal>
          )}
        </div>
      </div>
    </section>);

}

/* =========================================================================
   WHY WEALTHORIA - feature grid with varied surfaces
   ========================================================================= */
const WHY_SURFACES = ["s-white", "s-pale", "s-white", "s-soft", "s-white", "s-ink"];
function Why() {
  const { t } = useApp();
  return (
    <section className="band band-soft" id="why">
      <div className="wrap">
        <SectionHead eyebrow={t.why.eyebrow} title={t.why.title} sub={t.why.sub} />
        <div className="feat-grid">
          {t.why.items.map((it, i) =>
          <Reveal key={i} className={`feat ${WHY_SURFACES[i % WHY_SURFACES.length]}`} delay={i % 3 * 90}>
              <span className="idx">{String(i + 1).padStart(2, "0")}</span>
              <div className="iconwrap"><Icon name={it.ic} size={24} /></div>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
            </Reveal>
          )}
        </div>
      </div>
    </section>);

}

Object.assign(window, { NavBar, Hero, Ticker, Narrative, Metrics, Why });