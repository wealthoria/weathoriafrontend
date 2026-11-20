import { defineConfig } from "vite";
import labBundleHandler from "./api/lab-bundle.js";
import thumbHandler from "./api/thumb.js";
import labPdfMiddleware from "./middleware.js";

function wealthoriaLabServerGatePlugin() {
  return {
    name: "wealthoria-lab-server-gate",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || "/";
        const pathname = rawUrl.split("?")[0];

        if (pathname === "/api/lab-bundle" || pathname === "/api/thumb") {
          const mockRes = {
            setHeader: (k, v) => res.setHeader(k, v),
            status(code) {
              res.statusCode = code;
              return {
                json(payload) {
                  res.setHeader("Content-Type", "application/json; charset=utf-8");
                  res.end(JSON.stringify(payload));
                },
                send(body) {
                  res.end(body);
                },
              };
            },
          };
          if (pathname === "/api/thumb") {
            await thumbHandler(req, mockRes);
          } else {
            await labBundleHandler(req, mockRes);
          }
          return;
        }

        if (pathname.toLowerCase().endsWith(".pdf")) {
          const fullUrl = `http://${req.headers.host || "localhost:5173"}${rawUrl}`;
          const webReq = new Request(fullUrl, {
            method: req.method,
            headers: req.headers,
          });
          const blockedRes = await labPdfMiddleware(webReq);
          if (blockedRes) {
            res.statusCode = blockedRes.status;
            blockedRes.headers.forEach((value, key) => res.setHeader(key, value));
            const buf = Buffer.from(await blockedRes.arrayBuffer());
            res.end(buf);
            return;
          }
        }

        next();
      });
    },
  };
}

// Wealthoria ships as hand-authored pages that load React from a CDN and use an
// in-browser JSX transform. We must NOT run those through Vite's bundler (it would
// try to parse the JSX). So everything real lives in `public/` and is copied to the
// build output verbatim; Vite only processes the tiny root index.html entry.
export default defineConfig({
  base: "/",
  publicDir: "public",
  plugins: [wealthoriaLabServerGatePlugin()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
    open: "/",
  },
  preview: { host: true, port: 4173 },
});
