/* global React, window */
import React from "react";

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
          <span className="mobile-logo-only"><BrandLockup markHeight={32} onClick={(e) => {e.preventDefault();go("top");}} /></span>
         <nav className="nav-links">
  {t.nav.links.map((l) =>
    <a
      key={l.id}
      onClick={() => {
        if (l.id === "Disclosure") {
          window.location.href = "/wealthoria-disclosure.html";
        } else {
          go(l.id);
        }
      }}
    >
      {l.label}
    </a>
  )}

<div className="products-nav">

  <a
    href="#"
    aria-haspopup="true"
    onClick={(e) => e.preventDefault()}
  >
    Products
  </a>

  <div className="products-dropdown">

    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openBookPrebookPopup?.();
      }}
    >
      📖&nbsp; ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ
    </a>

  </div>

</div>
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
  <span >Member</span>
</a>
 {/*<a
  className="nav-login"
  href="/Student%20Portal.html#/student/register"
  aria-label="Student Register"
>
  <Icon name="user" size={17} />
  <span className="nav-login-txt">Student</span>
</a>*/}
          {/*
          {/*button className="btn btn-green btn-sm nav-cta-desktop" onClick={() => go("consult")}>{t.nav.cta}</button>*/}
            <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu" type="button"><Icon name="menu" size={20} /></button>
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


<div className="products-nav">

  <a
    href="#"
    aria-haspopup="true"
    onClick={(e) => e.preventDefault()}
  >
    Products
  </a>

  <div className="products-dropdown">

    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openBookPrebookPopup?.();
      }}
    >
      📖&nbsp; ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ
    </a>

  </div>

</div>

        <div className="drawer-foot">
          <a className="btn btn-outline btn-block drawer-member-login" href="/members/login"><Icon name="lock" size={16} />Member login</a>
        {/* <button className="btn btn-green btn-block" onClick={() => go("consult")}>{t.nav.cta}</button>*/}
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
          <h1 dangerouslySetInnerHTML={{ __html: `${h.title[0]}<br/>${h.title[1]}` }} style={{ fontSize: "58px" }}></h1>
          <p className="lede">{h.lede}</p>
          <div className="ctas">
            <button className="btn btn-green" onClick={() => {window.open("subscription.html", "_self");
}}>{h.ctaPrimary}<Icon name="arrow" size={18} /></button>

{h.ctaSecondary && (
  <button className="btn btn-outline" onClick={() => window.open("courses-coming-soon.html", "_self")}>
    {h.ctaSecondary}
  </button>
)}
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
            <button className="btn btn-green btn-block" style={{ marginTop: 18 }} onClick={() => window.open("courses-coming-soon.html", "_self")}>
              {h.card.cta}
            </button>
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
function BookPrebookPopup() {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    window.openBookPrebookPopup = () => {
      setOpen(true);
      setError("");
    };

    window.closeBookPrebookPopup = () => setOpen(false);

    return () => {
      delete window.openBookPrebookPopup;
      delete window.closeBookPrebookPopup;
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const checkbox = document.getElementById("billingSameAsDelivery");
    const billingSection = document.getElementById("billingAddressSection");

    if (!checkbox || !billingSection) return;

    const updateBillingVisibility = () => {
      billingSection.style.display = checkbox.checked ? "none" : "block";
    };

    checkbox.addEventListener("change", updateBillingVisibility);
    updateBillingVisibility();

    return () => {
      checkbox.removeEventListener("change", updateBillingVisibility);
    };
  }, [open]);

  const loadRazorpay = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () =>
        reject(new Error("Unable to load Razorpay checkout."));
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    setError("");

    const name =
      document.getElementById("bookName")?.value.trim();

    const email =
      document.getElementById("bookEmail")?.value.trim();

    const phone =
      document.getElementById("bookPhone")?.value.trim();

    const deliveryName =
      document.getElementById("bookDeliveryName")?.value.trim();

    const deliveryPhone =
      document.getElementById("bookDeliveryPhone")?.value.trim();

    const address =
      document.getElementById("bookAddress")?.value.trim();

    const landmark =
      document.getElementById("bookLandmark")?.value.trim();

    const city =
      document.getElementById("bookCity")?.value.trim();

    const state =
      document.getElementById("bookState")?.value.trim();

    const pincode =
      document.getElementById("bookPincode")?.value.trim();

    if (!name) {
      setError("Please enter your name.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!deliveryName) {
      setError("Please enter the delivery name.");
      return;
    }

    if (!deliveryPhone || !/^\d{10}$/.test(deliveryPhone)) {
      setError("Please enter a valid delivery phone number.");
      return;
    }

    if (!address) {
      setError("Please enter the delivery address.");
      return;
    }

    if (!city) {
      setError("Please enter the delivery city.");
      return;
    }

    if (!state) {
      setError("Please enter the delivery state.");
      return;
    }

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    const sameBilling =
      document.getElementById("billingSameAsDelivery")?.checked;

    let billingAddress;

    if (sameBilling) {
      billingAddress = {
        sameAsDelivery: true,
        name: deliveryName,
        phone: deliveryPhone,
        address,
        landmark,
        city,
        state,
        pincode,
        country: "India",
      };
    } else {
      const billingName =
        document.getElementById("bookBillingName")?.value.trim();

      const billingPhone =
        document.getElementById("bookBillingPhone")?.value.trim();

      const billingAddressText =
        document.getElementById("bookBillingAddress")?.value.trim();

      const billingLandmark =
        document.getElementById("bookBillingLandmark")?.value.trim();

      const billingCity =
        document.getElementById("bookBillingCity")?.value.trim();

      const billingState =
        document.getElementById("bookBillingState")?.value.trim();

      const billingPincode =
        document.getElementById("bookBillingPincode")?.value.trim();

      if (!billingName) {
        setError("Please enter the billing name.");
        return;
      }

      if (!billingPhone || !/^\d{10}$/.test(billingPhone)) {
        setError("Please enter a valid billing phone number.");
        return;
      }

      if (!billingAddressText) {
        setError("Please enter the billing address.");
        return;
      }

      if (!billingCity) {
        setError("Please enter the billing city.");
        return;
      }

      if (!billingState) {
        setError("Please enter the billing state.");
        return;
      }

      if (
        !billingPincode ||
        !/^\d{6}$/.test(billingPincode)
      ) {
        setError("Please enter a valid billing pincode.");
        return;
      }

      billingAddress = {
        sameAsDelivery: false,
        name: billingName,
        phone: billingPhone,
        address: billingAddressText,
        landmark: billingLandmark,
        city: billingCity,
        state: billingState,
        pincode: billingPincode,
        country: "India",
      };
    }

    setLoading(true);

    try {
      // -------------------------------------------------------
      // Load Razorpay
      // -------------------------------------------------------

      await loadRazorpay();

      // -------------------------------------------------------
      // Create order on backend
      // -------------------------------------------------------
const API_BASE =
  "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api";

const createResponse = await fetch(
  `${API_BASE}/prebook/create-order`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "website",
    }),
  }
);
      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.success) {
        throw new Error(
          createData.message ||
          "Unable to create payment order."
        );
      }

      // -------------------------------------------------------
      // Open Razorpay
      // -------------------------------------------------------

      const options = {
        key: createData.keyId,

        amount: createData.amount,

        currency: createData.currency || "INR",

        order_id: createData.orderId,

        name: "Wealthoria",

        description:
          "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ — Pre-booking",

        prefill: {
          name,
          email,
          contact: phone,
        },

        notes: {
          product: "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ",
        },

        theme: {
          color: "#E1622B",
        },

        handler: async function (response) {
          try {
            setError("");

            // -------------------------------------------------
            // Verify payment + save order + send email
            // -------------------------------------------------

           const verifyResponse = await fetch(
  `${API_BASE}/prebook/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,

                  customer: {
                    name,
                    email,
                    phone,
                  },

                  shippingAddress: {
                    name: deliveryName,
                    phone: deliveryPhone,
                    address,
                    landmark,
                    city,
                    state,
                    pincode,
                    country: "India",
                  },

                  billingAddress,

                  source: "website",
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              throw new Error(
                verifyData.message ||
                "Payment verification failed."
              );
            }

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            setLoading(false);

            window.location.href =
              "/thank-you?o=" +
              encodeURIComponent(
                response.razorpay_order_id
              );
          } catch (verifyError) {
            console.error(
              "Payment verification error:",
              verifyError
            );

            setLoading(false);

            setError(
              verifyError.message ||
              "Payment was successful, but verification failed. Please contact support."
            );
          }
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
            setError(
              "Payment window was closed. No payment was completed."
            );
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setLoading(false);

          setError(
            response?.error?.description ||
            "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();

    } catch (paymentError) {
      console.error(
        "Pre-book payment error:",
        paymentError
      );

      setLoading(false);

      setError(
        paymentError.message ||
        "Unable to start payment. Please try again."
      );
    }
  };

  if (!open) return null;

  return (
    <div
      className="book-popup-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <div className="book-popup">

        <button
          type="button"
          className="book-popup-close"
          onClick={() => setOpen(false)}
        >
          ×
        </button>

        <div className="book-popup-left">
          <iframe
            src="/hoodikeya-vijnana.html?embedded=1"
            title="ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ"
          />
        </div>

        <div className="book-popup-right">

          <h2>Pre-book ಮಾಡಿ</h2>

          <p>
            ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಮತ್ತು delivery address ಅನ್ನು ನಮೂದಿಸಿ.
          </p>

          <h3>Customer Details</h3>

          <label>Name *</label>
          <input
            type="text"
            id="bookName"
          />

          <label>Email *</label>
          <input
            type="email"
            id="bookEmail"
          />

          <label>Phone *</label>
          <input
            type="tel"
            id="bookPhone"
            maxLength="10"
            inputMode="numeric"
          />

          <h3>Delivery Address</h3>

          <label>Full Name *</label>
          <input
            type="text"
            id="bookDeliveryName"
          />

          <label>Phone *</label>
          <input
            type="tel"
            id="bookDeliveryPhone"
            maxLength="10"
            inputMode="numeric"
          />

          <label>Address *</label>
          <textarea id="bookAddress" />

          <label>Landmark</label>
          <input
            type="text"
            id="bookLandmark"
          />

          <label>City *</label>
          <input
            type="text"
            id="bookCity"
          />

          <label>State *</label>
          <input
            type="text"
            id="bookState"
          />

          <label>Pincode *</label>
          <input
            type="text"
            id="bookPincode"
            maxLength="6"
            inputMode="numeric"
          />

          <label>Country</label>
          <input
            type="text"
            value="India"
            readOnly
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              marginTop: "18px",
              width: "100%",
            }}
          >
            <input
              type="checkbox"
              id="billingSameAsDelivery"
              defaultChecked
              style={{
                width: "18px",
                height: "18px",
                margin: 0,
                flex: "0 0 auto",
              }}
            />

            <span style={{ margin: 0 }}>
              Billing address is same as delivery address
            </span>
          </label>

          <div
            id="billingAddressSection"
            style={{ display: "none" }}
          >
            <h3>Billing Address</h3>

            <label>Full Name *</label>
            <input
              type="text"
              id="bookBillingName"
            />

            <label>Phone *</label>
            <input
              type="tel"
              id="bookBillingPhone"
              maxLength="10"
              inputMode="numeric"
            />

            <label>Address *</label>
            <textarea
              id="bookBillingAddress"
            />

            <label>Landmark</label>
            <input
              type="text"
              id="bookBillingLandmark"
            />

            <label>City *</label>
            <input
              type="text"
              id="bookBillingCity"
            />

            <label>State *</label>
            <input
              type="text"
              id="bookBillingState"
            />

            <label>Pincode *</label>
            <input
              type="text"
              id="bookBillingPincode"
              maxLength="6"
              inputMode="numeric"
            />

            <label>Country</label>
            <input
              type="text"
              value="India"
              readOnly
            />
          </div>

          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "7px",
                background: "#fff1ed",
                color: "#c24f1e",
                border: "1px solid #f2c2b0",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            className="book-popup-pay"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay ₹1"}
          </button>

        </div>
      </div>
    </div>
  );
}
Object.assign(window, {
  NavBar,
  Hero,
  Ticker,
  Narrative,
  Metrics,
  Why,
  BookPrebookPopup
});
