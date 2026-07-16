# Wealthoria — Technical Requirements: what's done, and the production plan

This note answers the technical-requirements brief (folder structure, error handling,
security, loading states, accessibility, deliverables). It is split into two parts:

1. **Implemented now** — things that are real in this prototype today.
2. **Production architecture** — the structure, dependencies, and API endpoints a
   developer (or Claude Code) must build, because they need a framework + backend
   that a single-file in-browser prototype cannot provide.

---

## IMPORTANT context: this is a prototype, not a production codebase

The brief assumes a built app (React Router / Next.js, Tailwind or CSS Modules, Axios,
an existing auth util, an API base URL). **None of those exist here.** This project is a
self-contained, dependency-free prototype: React + ReactDOM + Babel loaded from CDN, plain
CSS with design tokens, a hand-rolled hash router, and **simulated** auth + **mock data**
in `localStorage`. There is no bundler, no `npm`, no `src/` tree, and no server.

So requirements like "match the existing Tailwind/CSS-Modules setup", "use an Axios
interceptor", "add a CSRF header", or "don't use localStorage under SSR" are **not
applicable to the prototype** — they are instructions for the production rebuild, captured
in Part 2.

---

## PART 1 — Implemented in the prototype now

### Accessibility (real, verified)
- **`app/a11y.jsx`** (new) — shared helpers loaded by both portals:
  - `useModalA11y(isOpen, onClose, ref)` — **Escape-to-close**, **focus trap** (Tab/Shift-Tab
    cycle inside the dialog), and **focus restore** to the trigger on close.
  - `useFocusOnMount(ref)` — moves focus to an element on mount.
  - `Skeleton` / `SkeletonText` / `SkeletonCard` — pulsing gray placeholders.
- **Focus management after login:** focus moves to the dashboard heading
  (member "Control panel" h1; student "Welcome back" h1). Verified.
- **Modals** now use `role="dialog"` / `role="alertdialog"` with `aria-modal`,
  `aria-labelledby`/`aria-label`, focus trap, and Escape — wired into the member confirm
  dialog and the student purchase modal.
- **Charts** carry descriptive `aria-label`s (e.g. "Revenue over time, gross versus net,
  last 30 days…", "Traffic sources: Organic 36 percent, Direct…"). Verified on all five.
- **Forms** already use `<label>` + associated inputs with inline validation
  (required, email format, min 6-char password) in both login flows.
- Added `.sr-only` utility and a visible `:focus-visible` outline in `app/site.css`.

### Error handling (real)
- **Inline form validation** on both logins (email format + password length), with the
  field-level error text shown under each input.
- **Toasts** for actions (member: `useMToast`; student: `useToast`) — e.g. "Published…",
  "Deleted…", "Exported student CSV".
- **403 handling:** the member area shows an **Access denied** page when an Editor opens an
  Admin-only route (`/member/users`). Verified.
- **"401-style" redirect:** unauthenticated access to any `/member/*` or `/student/*` route
  redirects to the matching login (the `MemberGuard` / `PrivateRoute`). Verified.

### Loading states (real)
- Auth restore shows a spinner splash; skeleton components are available via `app/a11y.jsx`
  for any data area. (In the prototype data is synchronous/mocked, so skeletons are wired as
  the pattern to use once real async fetches exist — see Part 2.)

---

## PART 2 — Production architecture (for the backend / app rebuild)

When this moves to a real React app (Vite + React Router v6, **or** Next.js), use this
structure. It mirrors the brief.

### Folder structure
```
src/
  features/
    studentAuth/     AuthContext, useAuth, login/register pages, PrivateRoute usage
    memberAuth/      MemberAuthContext, useMemberAuth, useRole, MFA step, guard
    dashboard/       Control-panel page + chart components (Recharts)
    cms/             content table, upload manager, course builder
  components/ui/     PrivateRoute, LoadingSpinner, Skeleton, Modal, Table, Toast, Pagination
  lib/
    apiClient.ts     fetch/Axios wrapper: base URL, auth header, 401/403 handling, CSRF
    queryClient.ts   React Query setup (caching, refetch)
  styles/            token CSS (port colors_and_type.css) or Tailwind config from tokens
```
The prototype already maps cleanly onto this: `student/*` → `features/studentAuth` +
shared dashboard; `member/*` → `features/memberAuth` + `features/dashboard` + `features/cms`;
`member/ui.jsx` + `app/a11y.jsx` → `components/ui`.

### Dependencies to add (npm) and why
| Package | Why |
|---|---|
| `react-router-dom` (v6) | Real client routing + nested `PrivateRoute`/loaders (replaces the hash router). Omit if Next.js (use the App Router). |
| `@tanstack/react-query` | Data fetching, caching, loading/error states (drives the skeletons). |
| `axios` | HTTP client; attach an **interceptor** for auth header, **CSRF** token, and **401 → silent refresh / logout**, **403 → access-denied**. (Native `fetch` wrapper is fine too.) |
| `recharts` | Production charts (the brief's default). The prototype's SVG charts can be swapped 1:1 — same data shapes. |
| `react-hot-toast` | Toast notifications (or keep the existing in-app toast). |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Accessible drag-and-drop for the course-builder curriculum (replaces the native DnD). |
| `react-dropzone` | The upload manager's drag-and-drop + file validation. |
| `zod` (+ `react-hook-form`) | Schema validation for forms (formalizes the inline rules). |
| `otplib` / `speakeasy` (server) + `qrcode` (client) | Real TOTP MFA for the member login. |

### Security (production)
- **Tokens:** store the access token in memory; keep the **refresh token in an httpOnly,
  Secure, SameSite cookie** (never localStorage under SSR). Silent refresh via the Axios
  interceptor on 401, then retry the request once; on refresh failure, log out.
- **CSRF:** if the backend uses cookie auth, send the CSRF token header on all mutations
  (POST/PUT/PATCH/DELETE) from the interceptor.
- **Input sanitization:** escape/strip user input on render; validate on the server too.
- **Role in JWT:** keep `role` in the token payload (the prototype already encodes it) and
  re-check on the server for every protected endpoint — never trust the client gate alone.

### Backend API endpoints to implement
Auth (student + member share shapes; separate token audiences):
- `POST /api/auth/student/login`  · `POST /api/auth/student/register`
- `POST /api/auth/member/login`   · `POST /api/auth/member/mfa/verify`
- `POST /api/auth/refresh`         · `POST /api/auth/logout`  · `GET /api/auth/me`
- `POST /api/auth/oauth/google` (student Google sign-in)

Student:
- `GET /api/courses` · `GET /api/courses/:id`
- `GET /api/me/courses` (enrollments + progress)
- `POST /api/me/courses/:id/enroll` (purchase) · `PATCH /api/me/courses/:id/progress`
- `POST /api/payments/checkout` + webhook (Razorpay/Stripe) for real purchases

Member CMS:
- `GET/POST /api/content` · `PATCH /api/content/:id` · `DELETE /api/content/:id`
- `POST /api/content/bulk` (bulk publish/delete)
- `POST /api/uploads` (multipart; returns asset) · `GET /api/uploads` · `DELETE /api/uploads/:id`
- `GET/POST /api/courses` · `PATCH /api/courses/:id` · `DELETE /api/courses/:id`

Admin:
- `GET /api/students` · `PATCH /api/students/:id` (suspend/reactivate) · `DELETE /api/students/:id`

Analytics (control panel; all accept `?range=7d|30d|90d|custom&from=&to=`):
- `GET /api/analytics/summary` (headline metrics + deltas)
- `GET /api/analytics/revenue` (gross/net series, `grain=daily|weekly|monthly`)
- `GET /api/analytics/enrollments` · `GET /api/analytics/funnel`
- `GET /api/analytics/traffic` · `GET /api/analytics/signups`
- `GET /api/analytics/activity?cursor=` (paginated feed)
- `GET /api/students/export.csv` (CSV export)

---

## New files created this pass
| File | Purpose |
|---|---|
| `app/a11y.jsx` | Shared accessibility hooks (modal focus-trap + Escape + restore, focus-on-mount) and skeleton-loader components. Loaded by both portals. |
| `DEVELOPER-REQUIREMENTS.md` | This document. |

## Files changed this pass
- `app/site.css` — added `.sk` skeleton shimmer, `.sr-only`, `:focus-visible` outline.
- `member/ui.jsx` — confirm dialog: `role="alertdialog"`, labelled, focus-trap + Escape.
- `member/charts.jsx` — every chart accepts and renders an `aria-label`.
- `member/dashboard.jsx` — chart aria descriptions; focus moves to the heading after mount.
- `student/collection.jsx` — purchase modal: focus-trap + Escape + label.
- `student/dashboard.jsx` — focus moves to the heading after mount.
- `Member Portal.html`, `Student Portal.html` — load `app/a11y.jsx`.
