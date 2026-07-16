import { defineConfig } from "vite";

// Wealthoria ships as hand-authored pages that load React from a CDN and use an
// in-browser JSX transform. We must NOT run those through Vite's bundler (it would
// try to parse the JSX). So everything real lives in `public/` and is copied to the
// build output verbatim; Vite only processes the tiny root index.html entry.
export default defineConfig({
  base: "./",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: { host: true, port: 5173, open: "/Wealthoria.html" },
  preview: { host: true, port: 4173 },
});
