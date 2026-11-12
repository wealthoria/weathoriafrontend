(function () {
  "use strict";

  var COPY = {
    en: {
      sub: "FINANCIAL EDUCATION",
      home: "Home",
      why: "Why us",
      process: "How it works",
      about: "About",
      disclosure: "Disclosure",
      products: "Products",
      bookLabel: "Book · ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ",
      member: "Member",
      memberFull: "Member login",
      blurb:
        "Wealthoria is a financial education company on a mission to build a financially aware India, learning before investing, investing before trading.",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      refund: "Refund Policy",
      contact: "Contact Us",
      disclaimer:
        "Wealthoria provides financial education only and does not offer investment advice, stock tips, or guaranteed returns. Investments in securities markets are subject to market risks.",
      rights: "Wealthoria Education Pvt. Ltd. All rights reserved.",
      tagline: "Learning is the first investment.",
      menuOpen: "Open menu",
      menuClose: "Close menu"
    },
    kn: {
      sub: "ಹಣಕಾಸು ಶಿಕ್ಷಣ",
      home: "ಮುಖಪುಟ",
      why: "ಏಕೆ ನಾವು?",
      process: "ಹೇಗೆ ಕೆಲಸ?",
      about: "ನಮ್ಮ ಬಗ್ಗೆ",
      disclosure: "ಬಹಿರಂಗೀಕರಣ",
      products: "ಉತ್ಪನ್ನಗಳು",
      bookLabel: "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ",
      member: "ಸದಸ್ಯ",
      memberFull: "ಸದಸ್ಯರ ಲಾಗಿನ್",
      blurb:
        "Wealthoria ಒಂದು ಹಣಕಾಸು ಶಿಕ್ಷಣ ಸಂಸ್ಥೆ, ಹಣಕಾಸು ಅರಿವಿನ ಭಾರತವನ್ನು ಕಟ್ಟುವ ಗುರಿ. ಹೂಡಿಕೆಗೆ ಮೊದಲು ಕಲಿಕೆ, ವ್ಯಾಪಾರಕ್ಕಿಂತ ಮೊದಲು ಹೂಡಿಕೆ.",
      privacy: "ಗೌಪ್ಯತಾ ನೀತಿ",
      terms: "ಬಳಕೆಯ ನಿಯಮಗಳು",
      refund: "ಮರುಪಾವತಿ ನೀತಿ",
      contact: "ಸಂಪರ್ಕಿಸಿ",
      disclaimer:
        "Wealthoria ಕೇವಲ ಹಣಕಾಸು ಶಿಕ್ಷಣವನ್ನು ಒದಗಿಸುತ್ತದೆ ಮತ್ತು ಹೂಡಿಕೆ ಸಲಹೆ ಅಥವಾ ಖಾತರಿ ಲಾಭವನ್ನು ನೀಡುವುದಿಲ್ಲ. ಹೂಡಿಕೆಗಳು ಮಾರುಕಟ್ಟೆ ಅಪಾಯಗಳಿಗೆ ಒಳಪಟ್ಟಿವೆ.",
      rights: "Wealthoria Education Pvt. Ltd. ಎಲ್ಲಾ ಹಕ್ಕುಗಳು ಕಾಯ್ದಿರಿಸಲ್ಪಟ್ಟಿವೆ.",
      tagline: "ಹೂಡಿಕೆಗೂ ಮುನ್ನ ಕಲಿಕೆ.",
      menuOpen: "ಮೆನು ತೆರೆಯಿರಿ",
      menuClose: "ಮೆನು ಮುಚ್ಚಿ"
    }
  };

  function getSavedLang() {
    var attr = document.documentElement.getAttribute("data-lang");
    if (attr === "kn" || attr === "en") return attr;
    try {
      var saved = localStorage.getItem("wl-lang");
      if (saved === "kn" || saved === "en") return saved;
    } catch (e) {}
    return document.documentElement.lang === "kn" ? "kn" : "en";
  }

  function applyLang(lang) {
    var normalized = lang === "kn" ? "kn" : "en";
    try {
      localStorage.setItem("wl-lang", normalized);
    } catch (e) {}
    document.documentElement.setAttribute("data-lang", normalized);
    if (document.body.getAttribute("data-wl-bilingual") === "true") {
      document.documentElement.lang = normalized;
    }
    return normalized;
  }

  function buildHeaderHtml(lang) {
    var c = COPY[lang] || COPY.en;
    var homeHref = lang === "kn" ? "/kn/" : "/";
    return (
      '<header class="wl-site-header">' +
      '  <div class="wl-nav-inner">' +
      '    <a class="wl-brand" href="' + homeHref + '">' +
      '      <img class="wl-brand-mark" src="/assets/logo-mark.png" alt="Wealthoria" />' +
      '      <span class="wl-brand-text">' +
      '        <span class="wl-brand-word">WEALTHORIA</span>' +
      '        <span class="wl-brand-sub">' + c.sub + "</span>" +
      "      </span>" +
      "    </a>" +
      '    <nav class="wl-nav-links" aria-label="Main navigation">' +
      '      <a href="' + homeHref + '">' + c.home + "</a>" +
      '      <a href="/#why">' + c.why + "</a>" +
      '      <a href="/#process">' + c.process + "</a>" +
      '      <a href="/#about">' + c.about + "</a>" +
      '      <a href="/wealthoria-disclosure.html">' + c.disclosure + "</a>" +
      '      <div class="wl-products-nav">' +
      '        <a class="wl-products-trigger" href="/Book.html" aria-haspopup="true">' + c.products + "</a>" +
      '        <div class="wl-products-dropdown">' +
      '          <a href="/Book.html">' +
      '            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' +
      "            <span>" + c.bookLabel + "</span>" +
      "          </a>" +
      "        </div>" +
      "      </div>" +
      "    </nav>" +
      '    <div class="wl-nav-right">' +
      '      <div class="wl-lang-toggle" role="group" aria-label="Language">' +
      '        <button type="button" data-wl-lang="en" class="' + (lang === "en" ? "on" : "") + '">EN</button>' +
      '        <button type="button" data-wl-lang="kn" class="' + (lang === "kn" ? "on" : "") + '">ಕನ್ನಡ</button>' +
      "      </div>" +
      '      <a class="wl-member-btn" href="/members/login" aria-label="Member Login">' +
      '        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
      "        <span>" + c.member + "</span>" +
      "      </a>" +
      '      <button type="button" class="wl-hamburger" data-wl-drawer-open="true" aria-label="' + c.menuOpen + '">' +
      '        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
      "      </button>" +
      "    </div>" +
      "  </div>" +
      "</header>" +
      '<div class="wl-drawer-scrim" id="wl-drawer-scrim"></div>' +
      '<aside class="wl-site-drawer" id="wl-site-drawer" aria-hidden="true">' +
      '  <div class="wl-drawer-head">' +
      '    <a class="wl-brand" href="' + homeHref + '">' +
      '      <img class="wl-brand-mark" src="/assets/logo-mark.png" alt="Wealthoria" />' +
      '      <span class="wl-brand-text"><span class="wl-brand-word">WEALTHORIA</span></span>' +
      "    </a>" +
      '    <button type="button" class="wl-hamburger" data-wl-drawer-close="true" aria-label="' + c.menuClose + '">' +
      '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      "    </button>" +
      "  </div>" +
      '  <a href="' + homeHref + '">' + c.home + "</a>" +
      '  <a href="/#why">' + c.why + "</a>" +
      '  <a href="/#process">' + c.process + "</a>" +
      '  <a href="/#about">' + c.about + "</a>" +
      '  <a href="/wealthoria-disclosure.html">' + c.disclosure + "</a>" +
      '  <a href="/Book.html">' + c.bookLabel + "</a>" +
      '  <div class="wl-drawer-foot">' +
      '    <a class="wl-drawer-login" href="/members/login">' + c.memberFull + "</a>" +
      "  </div>" +
      "</aside>"
    );
  }

  function buildFooterHtml(lang) {
    var c = COPY[lang] || COPY.en;
    var homeHref = lang === "kn" ? "/kn/" : "/";
    var year = new Date().getFullYear();
    return (
      '<footer class="wl-site-footer">' +
      '  <div class="wl-footer-wrap">' +
      '    <div class="wl-footer-top">' +
      "      <div>" +
      '        <a class="wl-footer-brand" href="' + homeHref + '">' +
      '          <img class="wl-brand-mark" src="/assets/logo-mark.png" alt="Wealthoria" />' +
      '          <span class="wl-brand-text">' +
      '            <span class="wl-brand-word">WEALTHORIA</span>' +
      '            <span class="wl-brand-sub">' + c.sub + "</span>" +
      "          </span>" +
      "        </a>" +
      '        <p class="wl-footer-blurb">' + c.blurb + "</p>" +
      "      </div>" +
      '      <div class="wl-footer-right">' +
      '        <div class="wl-footer-links">' +
      '          <a href="' + homeHref + '">' + c.home + "</a>" +
      '          <a href="/privacy-policy.html">' + c.privacy + "</a>" +
      '          <a href="/terms.html">' + c.terms + "</a>" +
      '          <a href="/refund-policy.html">' + c.refund + "</a>" +
      '          <a href="/contact.html">' + c.contact + "</a>" +
      "        </div>" +
      '        <div class="wl-footer-social">' +
      '          <a href="https://www.youtube.com/@Wealthoria_edu/featured" target="_blank" rel="noopener noreferrer" aria-label="YouTube">' +
      '            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>' +
      "          </a>" +
      '          <a href="https://www.instagram.com/wealthoria_edu" target="_blank" rel="noopener noreferrer" aria-label="Instagram">' +
      '            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>' +
      "          </a>" +
      '          <a href="https://wa.me/919019759001" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">' +
      '            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
      "          </a>" +
      '          <a href="https://www.linkedin.com/in/wealthoria-education-988411413/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">' +
      '            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>' +
      "          </a>" +
      "        </div>" +
      "      </div>" +
      "    </div>" +
      '    <p class="wl-footer-disclaimer">' + c.disclaimer + "</p>" +
      '    <div class="wl-footer-bar">' +
      "      <span>&copy; " + year + " " + c.rights + "</span>" +
      "      <span>" + c.tagline + "</span>" +
      "    </div>" +
      "  </div>" +
      "</footer>"
    );
  }

  function toggleDrawer(open) {
    var scrim = document.getElementById("wl-drawer-scrim");
    var drawer = document.getElementById("wl-site-drawer");
    if (!scrim || !drawer) return;
    scrim.classList.toggle("open", open);
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function render(lang) {
    var headerMount = document.getElementById("wl-header");
    var footerMount = document.getElementById("wl-footer");
    if (headerMount) headerMount.innerHTML = buildHeaderHtml(lang);
    if (footerMount) footerMount.innerHTML = buildFooterHtml(lang);
  }

  function init() {
    var lang = applyLang(getSavedLang());
    render(lang);

    document.addEventListener("click", function (e) {
      var target = e.target;
      if (!target || !target.closest) return;

      var langBtn = target.closest("[data-wl-lang]");
      if (langBtn) {
        var nextLang = applyLang(langBtn.getAttribute("data-wl-lang"));
        render(nextLang);
        window.dispatchEvent(new CustomEvent("wl-lang-change", { detail: { lang: nextLang } }));
        return;
      }

      if (target.closest("[data-wl-drawer-open]")) {
        toggleDrawer(true);
        return;
      }

      if (target.closest("[data-wl-drawer-close]") || target.id === "wl-drawer-scrim") {
        toggleDrawer(false);
        return;
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") toggleDrawer(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

