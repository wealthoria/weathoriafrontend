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


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <AppCtx.Provider value={ctx}>

      <NavBar
        onNav={onNav}
      />


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


        {/*
          Seminars are currently disabled.
          Keep this commented until the seminar
          section is intentionally enabled again.
        */}

        {/*
          <Seminars onNav={onNav} />
        */}


        <Library />


        <EnquiryForm />


        <FAQ />

      </main>


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


  console.log(
    "[Wealthoria] Current path:",
    path
  );


  /* =======================================================
     ADMIN PORTAL
     ======================================================= */

  if (
    path === "/admin" ||
    path.startsWith("/admin/")
  ) {

    console.log(
      "[Wealthoria] Opening Admin Portal"
    );


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

    console.log(
      "[Wealthoria] Opening Members Portal"
    );


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

  console.log(
    "[Wealthoria] Opening Public Wealthoria"
  );


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

console.log(
  "[Wealthoria] app.jsx loaded successfully"
);