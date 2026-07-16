# Wealthoria — React app (Vite)

The Wealthoria web experience packaged as a deployable Vite project. It contains four
React applications plus a PWA layer:

| Page | File | What it is |
|---|---|---|
| Landing site | `Wealthoria.html` | Marketing site (hero, programs, founders, FAQ, EN/Kannada, dark mode). |
| Student portal | `Student Portal.html` | Login + dashboard + collection (simulated auth). |
| Member workspace | `Member Portal.html` | Control-panel dashboard, CMS, uploads, course builder, admin. |
| Student dashboard | `Student Dashboard.html` | Editorial dashboard mockup (overview, courses, detail, purchase). |

The app is installable as a **PWA** (offline support, add-to-home-screen).

---

## How it's built

These pages are **React** apps. They load React 18 + ReactDOM from a pinned CDN and use an
in-browser JSX transform (Babel standalone), so the `.jsx` files run directly in the browser
with **no compile step**. That makes the project trivially deployable as a static site, and is
why Vite is configured to copy the app verbatim from `public/` rather than re-bundle it.

> Want a fully compiled toolchain (JSX precompiled, tree-shaken, no CDN, real routing,
> backend auth/payments)? That's the production rebuild documented in
> `DEVELOPER-REQUIREMENTS.md` — it lists the exact `src/features/...` structure, npm
> dependencies, and backend API endpoints to implement.

---

## Run locally

Requires Node 18+.

```bash
npm install
npm run dev      # http://localhost:5173  (opens the landing page)
```

Service workers need HTTPS or localhost, so the PWA features work on `localhost` in dev.

## Build for production

```bash
npm run build    # outputs static files to dist/
npm run preview  # serve the production build locally to test
```

`dist/` is a plain static folder — deploy it anywhere.

## Deploy

No server code; any static host works. The repo includes configs for the common ones:

- **Netlify:** connect the repo (uses `netlify.toml`) or drag the `dist/` folder into the
  Netlify dashboard.
- **Vercel:** import the repo (uses `vercel.json`). Build command `npm run build`, output `dist`.
- **Cloudflare Pages:** build command `npm run build`, output directory `dist`.
- **GitHub Pages:** run `npm run build`, then publish the `dist/` folder.
- **Any host / Nginx / S3:** upload the contents of `dist/`.

The bare domain (`/`) redirects to `Wealthoria.html`.

---

## Project structure

```
wealthoria-react/
  index.html              root entry → redirects to the landing page
  vite.config.js          copies public/ verbatim into dist/
  package.json
  netlify.toml / vercel.json
  public/
    Wealthoria.html        landing site
    Student Portal.html    student portal
    Member Portal.html     member workspace
    Student Dashboard.html student dashboard mockup
    offline.html           PWA offline fallback
    manifest.webmanifest   PWA manifest
    service-worker.js       offline caching
    pwa-register.js         SW registration + install prompt
    app/                   landing-site React code (jsx) + site.css
    student/               student-portal React code
    member/                member-workspace React code + charts
    student-dashboard/     student-dashboard React code + css
    assets/                brand CSS tokens, logos, images
    icons/                 PWA icons
  DEVELOPER-REQUIREMENTS.md  production rebuild guide (auth/API/payments)
```

## Demo logins
- **Student portal:** `priya@student.in` / `wealth123`
- **Member workspace:** `admin@wealthoria.in` / `admin123` (Admin) · `editor@wealthoria.in` / `editor123` (Editor); optional MFA code `123456`

## Important
Auth, payments, uploads and data are **simulated in the browser** (localStorage + mock data).
The UI is production-grade; wiring real accounts, a database, payments and APIs is a backend
task — see `DEVELOPER-REQUIREMENTS.md`.
