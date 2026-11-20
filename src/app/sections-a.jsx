/* global React, window */
import React, { useState, useEffect } from "react";
import { InstallIcon, isStandalone } from "./InstallPopup.jsx";
import { useLaunchCountdown } from "./ArtOfPriceSpotlight.jsx";

const { useApp, Icon, Reveal, SectionHead, BrandLockup } = window;

/* =========================================================================
   NAV + MOBILE DRAWER
   ========================================================================= */
function NavBar({ onNav }) {
  const { t, lang, setLang, theme, toggleTheme } = useApp();
  const [open, setOpen] = useState(false);
  const [standaloneApp, setStandaloneApp] = useState(() => isStandalone());
  useEffect(() => {
    const update = () => setStandaloneApp(isStandalone());
    let mql = null;
    try {
      mql = window.matchMedia("(display-mode: standalone)");
      if (mql.addEventListener) mql.addEventListener("change", update);
      else if (mql.addListener) mql.addListener(update);
    } catch (e) { }
    window.addEventListener("appinstalled", update);
    window.addEventListener("wl-install-change", update);
    return () => {
      if (mql) {
        if (mql.removeEventListener) mql.removeEventListener("change", update);
        else if (mql.removeListener) mql.removeListener(update);
      }
      window.removeEventListener("appinstalled", update);
      window.removeEventListener("wl-install-change", update);
    };
  }, []);
  const currentPath = window.location.pathname.toLowerCase();

  const currentPage = new URLSearchParams(
    window.location.search
  ).get("page");


  const isLegalPage =
    [
      "/privacy-policy.html",
      "/terms.html",
      "/refund-policy.html",
      "/contact.html",
      "/contactus.html"
    ].includes(currentPath) ||
    [
      "privacy-policy",
      "terms",
      "contactus",
      "refund-policy"
    ].includes(currentPage);
  const go = (id) => { setOpen(false); onNav(id); };
  const productsLabel = t.nav?.products || (lang === "kn" ? "ಉತ್ಪನ್ನಗಳು" : "Products");
  const productLinks = [
    { href: "/Book.html", ic: "book", label: lang === "kn" ? "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ" : "Book · ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ" },
    { href: "/artofbookhomepage.html", ic: "book", label: lang === "kn" ? "ದಿ ಆರ್ಟ್ ಆಫ್ ಪ್ರೈಸ್" : "Book · The Art of Price", isNew: true },
  ];
  const renderProductsNav = (closeDrawer = false) => (
    <div className="products-nav">
      <a
        href="/Book.html"
        aria-haspopup="true"
        onClick={closeDrawer ? () => setOpen(false) : undefined}
      >
        {productsLabel}
      </a>
      <div className="products-dropdown">
        {productLinks.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={closeDrawer ? () => setOpen(false) : undefined}
          >
            <Icon name={item.ic} size={16} stroke={2} />
            <span>{item.label}</span>
            {item.isNew && <span className="aop-nav-new">NEW</span>}
          </a>
        ))}
      </div>
    </div>
  );
  const handleGetApp = () => {
    if (typeof window.triggerPwaInstall === "function") {
      window.triggerPwaInstall();
    } else {
      window.dispatchEvent(new Event("wl-install-steps"));
    }
  };

  return (
    <React.Fragment>
      <header className="nav">
        <div className="wrap nav-inner">
          <span className="mobile-logo-only">
            <BrandLockup
              markHeight={32}
              href="/"
              onClick={(e) => {
                if (!isLegalPage) {
                  e.preventDefault();
                  go("top");
                }
              }}
            />
          </span>         <nav className="nav-links">

            {isLegalPage && (
              <a href="/">{t.nav?.home || "Home"}</a>
            )}
            {t.nav.links.map((l) =>
              <a
                key={l.id}
                href={
                  l.id === "Disclosure"
                    ? "/wealthoria-disclosure.html"
                    : isLegalPage
                      ? `/#${l.id}`
                      : `#${l.id}`
                }
                onClick={(e) => {
                  if (l.id === "Disclosure" || isLegalPage) {
                    return;
                  }

                  e.preventDefault();
                  go(l.id);
                }}
              >
                {l.label}
              </a>
            )}
            {renderProductsNav(false)}
          </nav>
          <div className="nav-right">
            <div className="lang-toggle" role="group" aria-label="Language">
              <span className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</span>
              <span className={lang === "kn" ? "on" : ""} onClick={() => setLang("kn")}>ಕನ್ನಡ</span>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
            </button>

            <a
              className="btn btn-green member-login-button"
              href="/members/login"
              aria-label="Member Login"
            >
              <Icon name="user" size={17} />
              <span>{t.nav?.memberLogin || "Member"}</span>
            </a>

            {!standaloneApp && (
              <button
                type="button"
                className="btn-get-app"
                onClick={handleGetApp}
                aria-label="Get App"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v13" />
                  <path d="m7 11 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                <span>{lang === "kn" ? "ಆ್ಯಪ್ ಪಡೆಯಿರಿ" : "Get App"}</span>
              </button>
            )}

            <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu" type="button"><Icon name="menu" size={20} /></button>
          </div>
        </div>
      </header>

      <div className={`drawer-scrim ${open ? "open" : ""}`} onClick={() => setOpen(false)} />

      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <BrandLockup
            markHeight={30}
            href="/"
            onClick={(e) => {
              if (!isLegalPage) {
                e.preventDefault();
                go("top");
              }
            }}
          />
          <button className="hamburger" onClick={() => setOpen(false)} aria-label="Close menu"><Icon name="x" size={20} /></button>
        </div>
        {isLegalPage && (
          <a href="/" onClick={() => setOpen(false)}>{t.nav?.home || "Home"}</a>
        )}
        {t.nav.links.map((l) =>
          <a
            key={l.id}
            href={
              l.id === "Disclosure"
                ? "/wealthoria-disclosure.html"
                : isLegalPage
                  ? `/#${l.id}`
                  : `#${l.id}`
            }
            onClick={(e) => {
              if (l.id === "Disclosure" || isLegalPage) {
                setOpen(false);
                return;
              }

              e.preventDefault();
              go(l.id);
            }}
          >
            {l.label}
          </a>
        )}

        {renderProductsNav(true)}

        <div className="drawer-foot">
          {!standaloneApp && (
            <button
              type="button"
              className="btn btn-outline btn-block"
              style={{ marginBottom: "10px" }}
              onClick={() => {
                setOpen(false);
                handleGetApp();
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ marginRight: 6 }}
              >
                <path d="M12 3v13" />
                <path d="m7 11 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              {lang === "kn" ? "ಆ್ಯಪ್ ಪಡೆಯಿರಿ" : "Get App"}
            </button>
          )}
          <a className="btn btn-green btn-block drawer-member-login" href="/members/login"><Icon name="lock" size={16} />{t.nav?.memberLoginFull || "Member login"}</a>
        </div>
      </aside>
    </React.Fragment>);

}

/* =========================================================================
   HERO  (Direction A - calm split)
   ========================================================================= */
function Hero({ onNav }) {
  const { t, lang } = useApp();
  const h = t.hero;
  const cd = useLaunchCountdown();

  // pause the ambient video while the hero is offscreen (saves CPU/battery)
  React.useEffect(() => {
    const v = document.querySelector(".hero-video video");
    const hero = document.getElementById("top");
    if (!v || !hero || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { v.play().catch(() => { }); } else { v.pause(); } });
    }, { threshold: 0.05 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return (
    <section className="hero" id="top">
      <div className="hero-video" aria-hidden="true">

        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/assets/hero-bg.png"
          ref={(el) => {
            if (
              el &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ) {
              el.removeAttribute("autoplay");
              el.pause();
            }
          }}
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260603_132049_036591b8-6e92-4760-b94c-a7ea6eef315c.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      <div className="hero-blob" aria-hidden="true"></div>
      <div className="wrap hero-grid">
        <Reveal>
          <span className="eyebrow">{h.eyebrow}</span>
          <h1 dangerouslySetInnerHTML={{ __html: `${h.title[0]}<br/>${h.title[1]}` }} className="titlehead"></h1>
          <p className="lede">{h.lede}</p>
          <div className="ctas">
            <a href="/membership.html" className="btn btn-green">{h.ctaPrimary}<Icon name="arrow" size={18} /></a>

            {h.ctaSecondary && (
              <a href="/courses-coming-soon.html" className="btn btn-outline">
                {h.ctaSecondary}
              </a>
            )}
          </div>
          <div className="trustline">
            <span className="avatars"><i /><i /><i /><i /></span>
            {h.trust}
          </div>

          {/* Book Launch Animated Ad Card (Sleek horizontal compact layout) */}
          <div className="hero-book-ad-card">
            {/* Ambient Candlestick Motion Watermark (Creative financial background art) */}
            <div className="hba-candlestick-bg" aria-hidden="true">
              <svg viewBox="0 0 120 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="16" y1="12" x2="16" y2="44" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <rect x="13" y="18" width="6" height="18" rx="1" fill="currentColor" opacity="0.35" />

                <line x1="38" y1="10" x2="38" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <rect x="35" y="16" width="6" height="22" rx="1" fill="currentColor" opacity="0.45" />

                <line x1="60" y1="8" x2="60" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <rect x="57" y="14" width="6" height="18" rx="1" fill="currentColor" opacity="0.45" />

                {/* Glowing Bullish Breakout Candle */}
                <line x1="82" y1="2" x2="82" y2="50" stroke="#ea580c" strokeWidth="1.2" className="hba-breakout-line" />
                <rect x="79" y="8" width="6" height="32" rx="1" fill="#ea580c" className="hba-breakout-body" />

                <line x1="104" y1="2" x2="104" y2="36" stroke="#f4823c" strokeWidth="1" opacity="0.6" />
                <rect x="101" y="6" width="6" height="20" rx="1" fill="#f4823c" opacity="0.65" />
              </svg>
            </div>

            {/* Main Showcase: Left Book Cover Stage + Right Content Column */}
            <div className="hba-showcase">
              <div className="hba-cover-col">
                <a
                  href="/artofbookhomepage.html"
                  className="hba-cover-stage"
                  style={{ display: "block", textDecoration: "none" }}
                  title={lang === "kn" ? "ದಿ ಆರ್ಟ್ ಆಫ್ ಪ್ರೈಸ್ - ಆವೃತ್ತಿಯನ್ನು ಆರಿಸಿ" : "The Art of Price - Choose Edition"}
                >
                  <img
                    src="/assets/art-of-price-cover.webp"
                    alt="The Art of Price"
                    className="hba-cover-img"
                    width="78"
                    height="114"
                    loading="eager"
                    decoding="async"
                  />
                  <span className="hba-cover-glow" aria-hidden="true" />
                  <span className="hba-cover-sheen" aria-hidden="true" />
                </a>
                <a
                  href="/artofbookhomepage.html"
                  className="hba-preview-link"
                >
                  {lang === "kn" ? "ಆವೃತ್ತಿ ಆರಿಸಿ / ಮಾದರಿ →" : "Choose Edition / Sample →"}
                </a>
              </div>

              <div className="hba-info">
                {/* Badges Row */}
                <div className="hba-badge-row">
                  <span className="hba-tag">
                    <span className="hba-pulse-dot" aria-hidden="true" />
                    {lang === "kn" ? "PRE-BOOKING ವಿಶೇಷ ಆಫರ್" : "PRE-BOOKING SPECIAL"}
                  </span>
                  <span className="hba-discount">
                    {lang === "kn" ? "SAVE ₹500 · 33% OFF" : "SAVE ₹500 · 33% OFF"}
                  </span>
                </div>

                <div className="hba-title-row">
                  <h4 className="hba-title">
                    {lang === "kn" ? "The Art of Price" : "The Art of Price"}
                  </h4>
                  <span className="hba-subtitle">
                    {lang === "kn"
                      ? "Whispers Beyond Candlesticks · 500+ Pages, 29 Chapters"
                      : "Whispers Beyond Candlesticks · 500+ Pages, 29 Chapters"}
                  </span>
                </div>

                <div className="hba-features-list">
                  <div className="hba-feat-item">
                    <span className="hba-feat-check">✓</span>
                    <span>{lang === "kn" ? "Kannada & English Editions" : "Kannada & English Editions"}</span>
                  </div>
                  <div className="hba-feat-item">
                    <span className="hba-feat-check">✓</span>
                    <span>{lang === "kn" ? "Real NSE Chart Proofs" : "Real NSE Chart Proofs"}</span>
                  </div>
                  <div className="hba-feat-item">
                    <span className="hba-feat-check">✓</span>
                    <span>{lang === "kn" ? "Free Pan-India Delivery" : "Free Pan-India Delivery"}</span>
                  </div>
                </div>

                {/* Horizontal Action Row: Price + Timer + Button */}
                <div className="hba-action-row">
                  <div className="hba-price-group">
                    <span className="hba-price-curr">₹999</span>
                    <span className="hba-price-mrp">₹1,499</span>
                    <span className="hba-discount-pill">33% OFF</span>
                  </div>

                  {cd.phase !== "closed" && (
                    <div className="hba-timer" title={lang === "kn" ? "ಪ್ರಿ-ಬುಕಿಂಗ್ ಮುಕ್ತಾಯದ ಕೌಂಟ್‌ಡೌನ್" : "Pre-booking countdown"}>
                      <span className="hba-timer-label">
                        {lang === "kn" ? "ಮುಕ್ತಾಯ:" : "CLOSES IN:"}
                      </span>
                      <span className="hba-timer-txt">
                        {cd.d}d : {cd.h}h : {cd.m}m : {cd.s}s
                      </span>
                    </div>
                  )}

                  <a
                    href="/artofbookhomepage.html"
                    className="hba-btn-cta"
                  >
                    <span>{lang === "kn" ? "Pre-book at ₹999 →" : "Pre-book at ₹999 →"}</span>
                  </a>
                </div>
              </div>
            </div>
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
              {(h.card.modules || []).map((m, i) =>
                <div key={i} className={`mod ${m.s === "lock" ? "locked" : ""}`}>
                  <div className={`dot ${m.s}`}>
                    {m.s === "done" ? <Icon name="check" size={14} stroke={3} /> : m.s === "now" ? <Icon name="play" size={11} /> : ""}
                  </div>
                  <div className="t">{m.t}</div>
                </div>
              )}
            </div>
            <a
              href="/courses-coming-soon.html"
              className="btn btn-green btn-block"
              style={{ marginTop: 18, textDecoration: "none" }}
            >
              <span>{h.card.cta}</span>
              <Icon name="arrow" size={17} stroke={2.2} />
            </a>
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



Object.assign(window, {
  NavBar,
  Hero,
  Ticker,
  Narrative,
  Metrics,
  Why
});
