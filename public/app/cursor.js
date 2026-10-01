/* =========================================================================
   Wealthoria — brand cursor
   Coral arrow with a white outline; coral hand over clickable things.
   Pure CSS cursors (no lag, no overlays). Desktop mouse only.
   ========================================================================= */
(function () {
  if (typeof window === "undefined" || !window.matchMedia) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  var CORAL = "#e8473f";

  var arrow =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<path d="M4 2.5v17l4.6-4.2 3.1 6.7 2.8-1.3-3.1-6.6h6.4z" fill="' + CORAL + '" ' +
    'stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';

  var hand =
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" ' +
    'fill="#fff" stroke="' + CORAL + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>' +
    '<path d="M10 9.5V4a2 2 0 0 0-4 0v10"/>' +
    '<path d="M14 10V9a2 2 0 0 0-4 0v1"/>' +
    '<path d="M18 11v-1a2 2 0 0 0-4 0"/></svg>';

  function uri(svg) {
    return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
  }

  var css =
    "html, body { cursor: " + uri(arrow) + " 4 3, auto; }" +
    "a, button, select, label, summary, [role=button], [role=tab], .btn," +
    ".nav-login, .footer-login, [onclick], [style*=\"cursor: pointer\"], [style*=\"cursor:pointer\"]" +
    " { cursor: " + uri(hand) + " 9 2, pointer !important; }" +
    "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea" +
    " { cursor: text; }";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();