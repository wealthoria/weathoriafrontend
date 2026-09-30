import React from "react";

/* global React, window, localStorage, document */

const {
  useState,
  useEffect,
  useCallback
} = React;


/* =========================================================
   GLOBAL COMPONENTS
   ========================================================= */

const {
  AppCtx,
  CONTENT,

  NavBar,
  Hero,
  Ticker,
  Narrative,
  Metrics,
  Why,
  Programs,
  Process,
  Founder,
  Testimonials,
  YouTube,
  Seminars,
  Library,
  FAQ,
  Footer,
  SiteAnimations,

  EnquiryForm,

  MembersRouter,
  AdminApp,
  IntroVideo

} = window;


/* =========================================================
   SAFETY CHECK
   ========================================================= */

function checkPublicDependencies() {

  const required = [
    ["AppCtx", AppCtx],
    ["CONTENT", CONTENT],
    ["NavBar", NavBar],
    ["Hero", Hero],
    ["Ticker", Ticker],
    ["Narrative", Narrative],
    ["Metrics", Metrics],
    ["Why", Why],
    ["Programs", Programs],
    ["Process", Process],
    ["Founder", Founder],
    ["Testimonials", Testimonials],
    ["YouTube", YouTube],
    ["Library", Library],
    ["EnquiryForm", EnquiryForm],
    ["FAQ", FAQ],
    ["Footer", Footer],
    ["IntroVideo", IntroVideo],


    ["SiteAnimations", SiteAnimations]
  ];


  const missing =
    required
      .filter(
        ([, value]) =>
          typeof value === "undefined"
      )
      .map(
        ([name]) =>
          name
      );


  if (missing.length > 0) {

    console.error(
      "[Wealthoria] Missing public components:",
      missing
    );

    return false;

  }


  return true;

}


/* =========================================================
   PUBLIC WEBSITE
   ========================================================= */

function App() {

  const [
    lang,
    setLangState
  ] = useState(
    () =>
      localStorage.getItem(
        "wl-lang"
      ) || "en"
  );


  const [
    theme,
    setTheme
  ] = useState(
    () =>
      localStorage.getItem(
        "wl-theme"
      ) || "light"
  );


  /* =======================================================
     THEME
     ======================================================= */

  useEffect(
    () => {

      document.documentElement.setAttribute(
        "data-theme",
        theme
      );


      localStorage.setItem(
        "wl-theme",
        theme
      );

    },
    [theme]
  );


  /* =======================================================
     LANGUAGE
     ======================================================= */

  useEffect(
    () => {

      localStorage.setItem(
        "wl-lang",
        lang
      );


      document.documentElement.lang =
        lang === "kn"
          ? "kn"
          : "en";

    },
    [lang]
  );


  /* =======================================================
     LANGUAGE HANDLER
     ======================================================= */

  const setLang =
    useCallback(
      (language) => {

        setLangState(
          language
        );

      },
      []
    );


  /* =======================================================
     THEME HANDLER
     ======================================================= */

  const toggleTheme =
    useCallback(
      () => {

        setTheme(
          current =>
            current === "dark"
              ? "light"
              : "dark"
        );

      },
      []
    );


  /* =======================================================
     NAVIGATION
     ======================================================= */

  const onNav =
    useCallback(
      (id) => {

        if (id === "top") {

          window.scrollTo(
            {
              top: 0,
              behavior: "smooth"
            }
          );

          return;

        }


        const element =
          document.getElementById(
            id
          );


        if (!element) {

          return;

        }


        const y =
          element.getBoundingClientRect().top +
          window.pageYOffset -
          64;


        window.scrollTo(
          {
            top: y,
            behavior: "smooth"
          }
        );

      },
      []
    );


  /* =======================================================
     CONTENT
     ======================================================= */

  const safeContent =
    CONTENT || {};


  const t =
    safeContent[lang] ||
    safeContent.en ||
    {};


  const ctx = {

    lang,

    setLang,

    theme,

    toggleTheme,

    t

  };


const currentPage = new URLSearchParams(
  window.location.search
).get("page");

const currentPath = window.location.pathname.toLowerCase();

const isPrivacyPolicy =
  currentPath === "/privacy-policy.html" ||
  currentPage === "privacy-policy";

const isTermsPage =
  currentPath === "/terms.html" ||
  currentPage === "terms";

  const isRefundPolicy =
  currentPath === "/refund-policy.html" ||
  currentPage === "refund-policy";


  const isContactUs =
  currentPath === "/contactus.html" ||
  currentPage === "contactus";

const PrivacyPolicy = window.PrivacyPolicy;
  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <AppCtx.Provider value={ctx}>

      <NavBar
        onNav={onNav}
      />

      {isPrivacyPolicy ? (
        typeof PrivacyPolicy === "function" ? (
          <PrivacyPolicy />
        ) : (
          <main className="privacy-page">
            <p>Privacy Policy is loading...</p>
          </main>
        )
      ) : isTermsPage ? (
        <main className="privacy-page">
          <article className="privacy-card">
            <span className="privacy-eyebrow">WEALTHORIA</span>
            <h1>Terms &amp; Conditions</h1>
            <div className="privacy-divider" />
            <p>
              By registering for Wealthoria webinars you agree
              to these terms.
            </p>
            <ul>
              <li>Registration is subject to payment confirmation.</li>
              <li>Webinar timings may change with prior notice.</li>
              <li>Content is for educational purposes only.</li>
              <li>
                Recording or redistribution without permission
                is prohibited.
              </li>
            </ul>
          </article>
        </main>
      ) : isRefundPolicy ? (
        <main className="privacy-page">
        
<article className="privacy-card">

  <h1>Cancellation &amp; Refund Policy</h1>

  <div className="privacy-divider" />

  <h2>1. Membership Subscription</h2>
  <p>
    Wealthoria offers a membership subscription at ₹99 per month.
    Active subscribers receive access to a dedicated member portal
    and dashboard, where they can watch videos, access weekly
    round-ups, and view the latest updates and available membership
    content.
  </p>

  <h2>2. Subscription Renewal and Auto-Debit</h2>
  <p>
    Your subscription may renew automatically each month according
    to your selected payment method and auto-debit authorization.
    If you cancel your auto-debit authorization, future automatic
    subscription payments will stop. You can continue accessing the
    member portal until the end of the subscription period you have
    already paid for.
  </p>

  <h2>3. Access After Subscription Expiry</h2>
  <p>
    Once your paid subscription period ends, access to the member
    portal and subscription content will be suspended if your
    subscription has not been renewed.
  </p>

  <h2>4. Reactivating Your Membership</h2>
  <p>
    You can subscribe again using the same email address associated
    with your existing account. Once your new subscription is
    successfully activated, your membership access will be restored.
  </p>

  <h2>5. Cancellation and Refunds</h2>
  <p>
    Subscription payments are generally non-refundable once a
    subscription period has started, except where a refund is
    required by applicable law or approved by Wealthoria.
  </p>
  <p>
    If Wealthoria cancels a paid service and you are eligible for
    a refund, the refund will be processed as applicable.
  </p>

  <h2>6. Contact Us</h2>
  <p>
    For assistance with subscriptions, auto-debit cancellation,
    membership access, or refunds, contact{" "}
    <a href="mailto:support@wealthoria.in">
      support@wealthoria.in
    </a>.
  </p>
</article>
        </main>
      ) 
      : isContactUs ? (
        <main className="privacy-page">
          <article className="privacy-card">

            <h1>Contact Us</h1>
            <div className="privacy-divider" />

            <p>
              We're here to help you with your Wealthoria membership,
              subscriptions, webinars, and learning experience.
            </p>

            <h2>How Can We Help You?</h2>
            <ul>
              <li>Membership subscriptions, renewals, and auto-debit cancellation.</li>
              <li>Member portal login, dashboard access, and subscription activation.</li>
              <li>Webinar registration, payments, and joining links.</li>
              <li>Educational videos, weekly round-ups, and membership updates.</li>
              <li>Payment confirmation and eligible refund queries.</li>
            </ul>

            <h2>Contact Information</h2>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:support@wealthoria.in">
                support@wealthoria.in
              </a>
            </p>

            <p>
              <strong>Website:</strong>{" "}
              <a href="https://www.wealthoria.in/">
                www.wealthoria.in
              </a>
            </p>
             <p>
              <strong>Location:</strong>{" "}
              Wealthoria Education Private Limited No.2687/1, D-1, 2nd Floor 
5th Cross, Kalidasa Road 
V V Mohalla, Mysore - 570002
            </p>

            <h2>Need Assistance?</h2>
            <p>
              Email us with a brief description of your issue. For
              account-related queries, include your registered email
              address. Please do not send passwords, OTPs, or card details.
            </p>
          </article>
        </main>):(
        <main>
          <Hero onNav={onNav} />
          <Ticker />
          <IntroVideo />
          <Metrics />
          <Narrative />
          <Why />
          <Programs onNav={onNav} />
          <Process />
          <Founder />
          <Testimonials />
          <YouTube />
          <Library />
          <EnquiryForm />
          <FAQ />
        </main>
      )}

      <Footer />
      <SiteAnimations />

    </AppCtx.Provider>

  );

}


/* =========================================================
   ROOT APPLICATION
   ========================================================= */

function RootApp() {

  const path =
    window.location.pathname ||
    "/";




  /* =======================================================
     ADMIN PORTAL
     ======================================================= */

  if (
    path === "/admin" ||
    path.startsWith("/admin/")
  ) {


    if (
      typeof AdminApp === "function"
    ) {

      return (
        <AdminApp />
      );

    }


    console.error(
      "[Wealthoria] AdminApp is not loaded."
    );


    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 30,
          textAlign: "center",
          fontFamily: "Arial, sans-serif"
        }}
      >

        <div>

          <h2>
            Admin Portal is loading...
          </h2>

          <p>
            Please refresh the page.
          </p>

        </div>

      </div>

    );

  }


  /* =======================================================
     MEMBERS PORTAL
     ======================================================= */

  if (
    path === "/members" ||
    path.startsWith("/members/")
  ) {

   

    if (
      typeof MembersRouter === "function"
    ) {

      return (
        <MembersRouter />
      );

    }


    console.error(
      "[Wealthoria] MembersRouter is not loaded."
    );



    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 30,
          textAlign: "center",
          fontFamily: "Arial, sans-serif"
        }}
      >

        <div>

          <h2>
            Members Portal is loading...
          </h2>

          <p>
            Please refresh the page.
          </p>

        </div>

      </div>

    );

  }


  /* =======================================================
     PUBLIC WEBSITE
     ======================================================= */


  if (
    !checkPublicDependencies()
  ) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 30,
          textAlign: "center",
          fontFamily: "Arial, sans-serif"
        }}
      >

        <div>

          <h2>
            Wealthoria is loading...
          </h2>

          <p
            style={{
              color: "#666",
              lineHeight: 1.6
            }}
          >
            Some website components are still
            loading. Please refresh the page.
          </p>


          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            style={{
              marginTop: 10,
              border: "none",
              borderRadius: 8,
              padding: "12px 20px",
              background: "#e8473f",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Refresh
          </button>

        </div>

      </div>

    );

  }


  return (
    <App />
  );

}


/* =========================================================
   VITE GLOBAL EXPORTS
   ========================================================= */

window.WealthoriaApp = App;

window.WealthoriaRootApp = RootApp;


/* =========================================================
   DEBUG
   ========================================================= */

