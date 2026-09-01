/* global React, ReactDOM, window */

const { useState, useEffect, useCallback } = React;
const {
  AppCtx, CONTENT,
  NavBar, Hero, Ticker, Narrative, Metrics, Why,
  Programs, Process, Founder,
  Testimonials, YouTube, Seminars, Library,
  FAQ, Footer,
  SiteAnimations,
  AdminApp,
} = window;

function App() {
  const [lang, setLangState] = useState(() => localStorage.getItem("wl-lang") || "en");
  const [theme, setTheme] = useState(() => localStorage.getItem("wl-theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("wl-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("wl-lang", lang);
    document.documentElement.lang = lang === "kn" ? "kn" : "en";
  }, [lang]);

  const setLang = useCallback((l) => setLangState(l), []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  const onNav = useCallback((id) => {
    if (id === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 64;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  const t = CONTENT[lang];
  const ctx = { lang, setLang, theme, toggleTheme, t };

  return (
    <AppCtx.Provider value={ctx}>
      <NavBar onNav={onNav} />
      <main>
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
      {/* <Seminars onNav={onNav} />  */}
        <Library />
<EnquiryForm />
        <FAQ />
      </main>
      <Footer />
      <SiteAnimations />
    </AppCtx.Provider>
  );
}





function RootApp() {
  const path = window.location.pathname;

  console.log("Current path:", path);

 if (path.startsWith("/admin")) {
  console.log("Opening Admin Portal");
  return <AdminApp />;
}

  if (path.startsWith("/members")) {
    console.log("Opening Members Portal");

    return <MembersRouter />;
  }

  console.log("Opening Public Wealthoria");

  return <App />;
}
ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <RootApp />
);