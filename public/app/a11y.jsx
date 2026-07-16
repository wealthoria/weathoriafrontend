/* global React, window */
/* =========================================================================
   Shared accessibility + loading helpers (used by both portals).
   Loaded as a plain babel script before the portal apps. Exposes:
     useModalA11y(isOpen, onClose, ref)  - Escape to close, focus trap, restore
     useFocusOnMount(ref)                - move focus to an element on mount
     Skeleton / SkeletonText / SkeletonCard - pulsing gray placeholders
   ========================================================================= */
const { useEffect, useRef } = React;

/* Trap focus inside a modal, close on Escape, restore focus on unmount. */
function useModalA11y(isOpen, onClose, containerRef) {
  const prevFocus = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    prevFocus.current = document.activeElement;
    const node = containerRef.current;
    const SEL = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

    // focus the first sensible target inside the modal
    const focusables = () => Array.from(node ? node.querySelectorAll(SEL) : []).filter((el) => el.offsetParent !== null);
    const first = focusables()[0];
    if (first) first.focus(); else if (node) node.focus();

    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose && onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      // restore focus to whatever opened the modal
      if (prevFocus.current && prevFocus.current.focus) {
        try { prevFocus.current.focus(); } catch (e) { /* node gone */ }
      }
    };
  }, [isOpen, onClose, containerRef]);
}

/* Move focus to a heading/element on mount (e.g. dashboard h1 after login). */
function useFocusOnMount(ref, deps) {
  useEffect(() => {
    if (ref.current) {
      // make non-interactive headings programmatically focusable
      if (!ref.current.hasAttribute("tabindex")) ref.current.setAttribute("tabindex", "-1");
      ref.current.focus({ preventScroll: true });
    }
    // eslint-disable-next-line
  }, deps || []);
}

/* ---- skeleton loaders ---------------------------------------------------- */
function Skeleton({ w = "100%", h = 14, r = 8, style }) {
  return <span className="sk" style={{ width: w, height: h, borderRadius: r, display: "block", ...style }} aria-hidden="true" />;
}
function SkeletonText({ lines = 3, lastW = "60%" }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 9 }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <span key={i} className="sk" style={{ height: 12, borderRadius: 6, width: i === lines - 1 ? lastW : "100%", display: "block" }} />
      ))}
    </span>
  );
}
function SkeletonCard({ height = 120 }) {
  return <div className="sk" style={{ height, borderRadius: 16 }} aria-hidden="true" />;
}

Object.assign(window, { useModalA11y, useFocusOnMount, Skeleton, SkeletonText, SkeletonCard });
