/* global React, ReactDOM, window, localStorage, document */

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
  IntroVideo,

  EnquiryForm,

  MembersRouter,
  AdminApp

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
    ["IntroVideo", IntroVideo],
   
    ["Library", Library],
    ["EnquiryForm", EnquiryForm],
    ["FAQ", FAQ],
    ["Footer", Footer],
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

const isPrivacyPolicy =
  window.location.pathname === "/privacy-policy.html" ||
  currentPage === "privacy-policy";

const isTermsPage =
  window.location.pathname === "/terms.html" ||
  currentPage === "terms";

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

          <section
            id="privacy-policy"
            style={{
              maxWidth: "1000px",
              margin: "0 auto",
              padding: "120px 24px 80px",
              minHeight: "60vh",
              lineHeight: 1.8
            }}
          >
            <h1>Privacy Policy</h1>

            <p>
              Last updated: September 30, 2026
            </p>

            <p>
              Welcome to Wealthoria. We respect your privacy
              and are committed to protecting your personal
              information.
            </p>

            <h2>Information We Collect</h2>

            <p>
              We may collect information you provide when
              registering, contacting us, making payments,
              or using our services.
            </p>

            <h2>How We Use Your Information</h2>

            <p>
              We use collected information to provide and
              maintain our services, process registrations
              and payments, communicate with you, and
              improve our website.
            </p>

            <h2>Payments</h2>

            <p>
              Payments may be processed by third-party
              payment providers. Payment information is
              handled according to the applicable provider's
              policies and procedures.
            </p>

            <h2>Data Security</h2>

            <p>
              We take reasonable measures to protect
              personal information. However, no method
              of electronic storage or transmission is
              completely secure.
            </p>

            <h2>Third-Party Services</h2>

            <p>
              Our website may use third-party services
              to support payments, communications, and
              other website features. Their own privacy
              policies may also apply.
            </p>

            <h2>Your Privacy</h2>

            <p>
              For questions about your personal information
              or this Privacy Policy, please contact
              Wealthoria through the contact details
              provided on our website.
            </p>

            <h2>Changes to This Policy</h2>

            <p>
              We may update this Privacy Policy from time
              to time. Updates will be published on this
              page.
            </p>
          </section>

       ) : isTermsPage ? (
  <main className="privacy-page">
    <article className="privacy-card">
      <span className="privacy-eyebrow">
        WEALTHORIA
      </span>

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
) : (
 

          <>
            <Hero onNav={onNav} />

            <Ticker />

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
          </>

        )}


      <main>

        <Hero
          onNav={onNav}
        />

        <Ticker />

        <Metrics />

        <Narrative />

        <Why />

        <Programs
          onNav={onNav}
        />

        <Process />

        <Founder />

        <Testimonials />

        <YouTube />




        <Library />


        <EnquiryForm />


        <FAQ />

      </main>


      <Footer />
 <IntroVideo />

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
   REACT ROOT
   ========================================================= */

const rootElement =
  document.getElementById(
    "root"
  );


if (!rootElement) {

  console.error(
    "[Wealthoria] #root element was not found."
  );

}
else {

  const root =
    ReactDOM.createRoot(
      rootElement
    );


  root.render(
    <RootApp />
  );

}


/* =========================================================
   DEBUG
   ========================================================= */

