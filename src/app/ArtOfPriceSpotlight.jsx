import React, { useState, useEffect } from "react";
import "./art-of-price-spotlight.css";

const BOOK_HREF = "/the-art-of-price-prebook.html";
const SAMPLE_HREF = "/the-art-of-price-prebooking.html#sample";
const RIBBON_DISMISS_KEY = "wl-aop-ribbon-dismissed";
const TEASER_DISMISS_KEY = "wl-aop-teaser-dismissed";

const LAUNCH_TS = new Date("2026-11-23T00:00:00+05:30").getTime();
const CLOSE_TS = new Date("2026-12-12T23:59:59+05:30").getTime();

function computeCountdown() {
  const now = Date.now();
  const phase = now < LAUNCH_TS ? "soon" : now <= CLOSE_TS ? "open" : "closed";
  const target = phase === "soon" ? LAUNCH_TS : CLOSE_TS;
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  const pad = (n) => String(n).padStart(2, "0");
  return {
    phase,
    d: pad(days),
    h: pad(hours),
    m: pad(mins),
    s: pad(secs),
  };
}

export function useLaunchCountdown() {
  const [cd, setCd] = useState(computeCountdown);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCd(computeCountdown());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return cd;
}

export function ArtOfPriceLaunchBar({ lang = "en" }) {
  const cd = useLaunchCountdown();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.sessionStorage.getItem(RIBBON_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const isKn = lang === "kn";

  const handleClose = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(RIBBON_DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className="aop-ribbon" role="region" aria-label="The Art of Price new book launch">
      <div className="aop-ribbon-inner">
        <a className="aop-ribbon-link" href={BOOK_HREF}>
          <span className="aop-ribbon-pill">
            <span className="aop-live-dot" aria-hidden="true" />
            {isKn ? "ಹೊಸ ಪುಸ್ತಕ" : "NEW LAUNCH"}
          </span>

          <span className="aop-ribbon-text">
            {isKn ? (
              <>
                <strong>ದಿ ಆರ್ಟ್ ಆಫ್ ಪ್ರೈಸ್</strong> · 500+ ಪುಟ · NSE Technical Analysis —{" "}
                <span className="aop-ribbon-price">₹999</span>
                <span className="aop-ribbon-mrp">₹1,499</span>
              </>
            ) : (
              <>
                <strong>The Art of Price</strong> · 500+ pages, 29 chapters — Launch Offer{" "}
                <span className="aop-ribbon-price">₹999</span>
                <span className="aop-ribbon-mrp">₹1,499</span>
              </>
            )}
          </span>

          {cd.phase !== "closed" && (
            <span className="aop-ribbon-timer" aria-label="Countdown">
              ⏱ {cd.d}d : {cd.h}h : {cd.m}m : {cd.s}s
            </span>
          )}

          <span className="aop-ribbon-cta">
            {isKn ? "₹999 ಆಫರ್ ಪಡೆಯಿರಿ →" : "Claim ₹999 Offer →"}
          </span>
        </a>

        <button
          type="button"
          className="aop-ribbon-close"
          onClick={handleClose}
          aria-label="Dismiss announcement"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function ArtOfPriceSpotlight({ lang = "en" }) {
  const cd = useLaunchCountdown();
  const isKn = lang === "kn";

  const cdHeading =
    cd.phase === "soon"
      ? isKn
        ? "Pre-booking ತೆರೆಯಲು ಬಾಕಿ"
        : "Pre-Booking Opens In"
      : isKn
        ? "Pre-booking ಆಫರ್ ಮುಕ್ತಾಯಕ್ಕೆ ಬಾಕಿ"
        : "Pre-Booking Offer Ends In";

  return (
    <section className="aop-section" id="book-art-of-price" aria-labelledby="aop-spotlight-heading">
      <div className="wrap">
        <div className="aop-card">
          {/* Candlestick chart silhouette watermark */}
          <svg
            className="aop-bg-chart"
            viewBox="0 0 1000 420"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g stroke="#f4823c" strokeWidth="2.2" fill="#f4823c" opacity="0.35">
              <line x1="70" y1="275" x2="70" y2="360" />
              <rect x="62" y="295" width="16" height="40" rx="2" />
              <line x1="145" y1="230" x2="145" y2="325" />
              <rect x="137" y="250" width="16" height="48" rx="2" />
              <line x1="220" y1="255" x2="220" y2="335" stroke="#e8473f" />
              <rect x="212" y="270" width="16" height="36" rx="2" fill="#e8473f" stroke="#e8473f" />
              <line x1="295" y1="195" x2="295" y2="295" />
              <rect x="287" y="214" width="16" height="54" rx="2" />
              <line x1="370" y1="160" x2="370" y2="255" />
              <rect x="362" y="178" width="16" height="46" rx="2" />
              <line x1="445" y1="185" x2="445" y2="265" stroke="#e8473f" />
              <rect x="437" y="198" width="16" height="38" rx="2" fill="#e8473f" stroke="#e8473f" />
              <line x1="520" y1="125" x2="520" y2="225" />
              <rect x="512" y="144" width="16" height="56" rx="2" />
              <line x1="595" y1="100" x2="595" y2="195" />
              <rect x="587" y="118" width="16" height="48" rx="2" />
              <line x1="670" y1="120" x2="670" y2="205" stroke="#e8473f" />
              <rect x="662" y="136" width="16" height="36" rx="2" fill="#e8473f" stroke="#e8473f" />
              <line x1="745" y1="75" x2="745" y2="165" />
              <rect x="737" y="92" width="16" height="52" rx="2" />
              <line x1="820" y1="50" x2="820" y2="140" />
              <rect x="812" y="66" width="16" height="48" rx="2" />
              <line x1="895" y1="30" x2="895" y2="115" />
              <rect x="887" y="44" width="16" height="44" rx="2" />
              <line x1="955" y1="18" x2="955" y2="95" />
              <rect x="947" y="30" width="16" height="40" rx="2" />
            </g>
          </svg>

          <div className="aop-grid">
            {/* Left Copy & Conversion Panel */}
            <div>
              <div className="aop-top-badges">
                <span className="aop-eyebrow">
                  <span className="aop-live-dot-green" aria-hidden="true" />
                  {isKn
                    ? "ಹೊಸ ಪುಸ್ತಕ · PRE-BOOKING 23 NOV – 12 DEC"
                    : "NEW LAUNCH · PRE-BOOKING 23 NOV – 12 DEC"}
                </span>
                <span className="aop-scarcity-tag">
                  {isKn ? "20 ದಿನ ಮಾತ್ರ · ಮತ್ತೆ ₹999 ಬರಲ್ಲ" : "20 Days Only · Never ₹999 Again"}
                </span>
              </div>

              <h2 id="aop-spotlight-heading" className="aop-title">
                <span className="aop-title-sub">
                  {isKn ? "ವೆಲ್ತೋರಿಯಾ ಪ್ರಸ್ತುತಿ · TECHNICAL ANALYSIS" : "Wealthoria Presents · TECHNICAL ANALYSIS"}
                </span>
                The Art of Price
              </h2>

              <p className="aop-hook">
                {isKn ? (
                  <>
                    ಬೆಲೆ ಪಿಸುಗುಟ್ಟುತ್ತದೆ. <em>ಕೇಳಿಸಿಕೊಳ್ಳುವವರು ಕೆಲವರು ಮಾತ್ರ.</em>
                  </>
                ) : (
                  <>
                    Price whispers. <em>Only a few learn to listen.</em>
                  </>
                )}
              </p>

              <p className="aop-desc">
                {isKn
                  ? "Whispers Beyond Candlesticks — Reliance, Titan ನಂತಹ NSE ಯ ನಿಜವಾದ ಚಾರ್ಟ್‌ಗಳ ಮೇಲೆ ಪರೀಕ್ಷಿಸಿದ Technical Analysis ನಿಯಮಗಳನ್ನು ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಕಲಿಸುವ ಸಮಗ್ರ ಪುಸ್ತಕ."
                  : "Whispers Beyond Candlesticks — Karnataka's most complete technical analysis book in Kannada, built and verified on real NSE charts like Reliance & Titan."}
              </p>

              {/* 3 Bold Stat Cards */}
              <div className="aop-stats">
                <div className="aop-stat-box">
                  <strong>29</strong>
                  <span>{isKn ? "ಸಂಪೂರ್ಣ ಅಧ್ಯಾಯ" : "Deep Chapters"}</span>
                </div>
                <div className="aop-stat-box">
                  <strong>500+</strong>
                  <span>{isKn ? "ಪುಟಗಳು (ಕನ್ನಡ)" : "Pages in Kannada"}</span>
                </div>
                <div className="aop-stat-box">
                  <strong>NSE</strong>
                  <span>{isKn ? "ನಿಜವಾದ ಚಾರ್ಟ್‌ಗಳು" : "Real Chart Proof"}</span>
                </div>
              </div>

              {/* Price + Live Ticking Countdown Box */}
              <div className="aop-offer-panel">
                <div className="aop-price-block">
                  <div className="aop-price-row">
                    <span className="aop-price-now">₹999</span>
                    <span className="aop-price-was">₹1,499</span>
                    <span className="aop-price-off">
                      {isKn ? "33% OFF" : "33% OFF"}
                    </span>
                  </div>
                  <span className="aop-price-warn">
                    {isKn
                      ? "ಡಿಸೆಂಬರ್ 13 ರಿಂದ MRP ₹1,499 — ಈಗ ₹500 ಉಳಿಸಿ"
                      : "Jumps to ₹1,499 on Dec 13 — Save ₹500 today"}
                  </span>
                </div>

                {cd.phase !== "closed" && (
                  <div className="aop-cd-wrap">
                    <span className="aop-cd-label">{cdHeading}</span>
                    <div className="aop-cd-grid" aria-label="Launch countdown timer">
                      <div className="aop-cd-cell">
                        <b>{cd.d}</b>
                        <span>{isKn ? "ದಿನ" : "Days"}</span>
                      </div>
                      <div className="aop-cd-cell">
                        <b>{cd.h}</b>
                        <span>{isKn ? "ಗಂಟೆ" : "Hrs"}</span>
                      </div>
                      <div className="aop-cd-cell">
                        <b>{cd.m}</b>
                        <span>{isKn ? "ನಿಮಿಷ" : "Min"}</span>
                      </div>
                      <div className="aop-cd-cell">
                        <b>{cd.s}</b>
                        <span>{isKn ? "ಸೆಕೆಂಡ್" : "Sec"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* High-Contrast Shimmer CTA Buttons */}
              <div className="aop-actions">
                <a className="aop-btn-primary" href={BOOK_HREF}>
                  {isKn ? "₹999 ಕ್ಕೆ ಈಗಲೇ Pre-Book ಮಾಡಿ →" : "Reserve Your Copy at ₹999 →"}
                </a>
                <a className="aop-btn-ghost" href={SAMPLE_HREF}>
                  {isKn ? "ಮಾದರಿ ಅಧ್ಯಾಯ ಓದಿ" : "Preview Sample Chapter"}
                </a>
              </div>

              <div className="aop-trust">
                <span><b>✓</b> {isKn ? "ಭಾರತದಾದ್ಯಂತ ಉಚಿತ Delivery" : "Free Pan-India Delivery"}</span>
                <span><b>✓</b> {isKn ? "Dispatch ಗಿಂತ ಮೊದಲು 100% Refund" : "100% Refund Before Dispatch"}</span>
                <span><b>✓</b> {isKn ? "ಮೊದಲು Book ಮಾಡಿದವರಿಗೆ ಮೊದಲು ರವಾನೆ" : "Dispatches Dec 13 (First-Come)"}</span>
              </div>
            </div>

            {/* Right Levitating 3D Book Stage */}
            <div className="aop-stage">
              <div className="aop-halo" aria-hidden="true" />
              <a
                className="aop-book-link"
                href={BOOK_HREF}
                aria-label="Pre-book The Art of Price for ₹999"
              >
                <span className="aop-float-badge">
                  <b>₹500 OFF</b>
                  {isKn ? "Launch ದರ" : "Launch Offer"}
                </span>
                <div className="bk3-stage aop-bk3-large">
                  <div className="bk3">
                    <img
                      className="bk3-f"
                      src="/assets/art-of-price-cover.webp"
                      alt="The Art of Price — Technical Analysis Book in Kannada by Wealthoria"
                      width="230"
                      height="350"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="bk3-b" aria-hidden="true" />
                    <div className="bk3-s" aria-hidden="true">
                      <span>THE ART OF <i></i> PRICE</span>
                      <b>WEALTHORIA</b>
                    </div>
                    <div className="bk3-p" aria-hidden="true" />
                    <div className="bk3-t" aria-hidden="true" />
                  </div>
                  <div className="bk3-glow" aria-hidden="true" />
                </div>
              </a>
              <div className="aop-book-floor" aria-hidden="true" />
              <p className="aop-book-caption">
                {isKn
                  ? "👆 ಪುಸ್ತಕದ ಮಾದರಿ ಪುಟಗಳನ್ನು ನೋಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ"
                  : "Click book to preview sample chapters inside →"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ArtOfPriceFloatTeaser({ lang = "en" }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.sessionStorage.getItem(TEASER_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      // Show subtle corner teaser after user scrolls past the spotlight section
      setVisible(window.scrollY > 1150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  if (dismissed || !visible) return null;

  const isKn = lang === "kn";

  const handleClose = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(TEASER_DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <aside className="aop-float-teaser" aria-label="The Art of Price book offer">
      <a className="aop-float-teaser-link" href={BOOK_HREF}>
        <img
          className="aop-float-thumb"
          src="/assets/art-of-price-cover.webp"
          alt="The Art of Price book cover"
          width="40"
          height="60"
          loading="lazy"
          decoding="async"
        />
        <div className="aop-float-copy">
          <span className="aop-float-kicker">
            <span className="aop-live-dot-green" aria-hidden="true" />
            {isKn ? "ಹೊಸ ಪುಸ್ತಕ · 33% OFF" : "New Book · 33% OFF"}
          </span>
          <span className="aop-float-title">
            {isKn ? "ದಿ ಆರ್ಟ್ ಆಫ್ ಪ್ರೈಸ್" : "The Art of Price"}
          </span>
          <span className="aop-float-cta">
            {isKn ? "₹999 ಕ್ಕೆ Pre-book →" : "Pre-book ₹999 (MRP ₹1,499) →"}
          </span>
        </div>
      </a>
      <button
        type="button"
        className="aop-float-close"
        onClick={handleClose}
        aria-label="Close offer card"
      >
        ×
      </button>
    </aside>
  );
}
