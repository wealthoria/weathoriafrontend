# Wealthoria security fixes (applied to your zip)

Unzip over your project root, then DELETE `src/admin/data.jsx` and rebuild (`npm run build`).
`dist/` in your zip is a stale build that still contains the old code: always rebuild before deploying.

## Done in code
| # | Issue | What changed |
|---|-------|--------------|
| 3 | Mock admin/editor passwords in bundle | `src/admin/data.jsx` deleted, import removed from `main.jsx` (nothing read `window.MEMBER_DATA`) |
| 2 | `window.db / auth / storage` globals | 20 files now `import { db, auth, ... } from "../firebase.js"`. `window.firebase` is kept ON PURPOSE: `public/firebase/notifications.js` is a separately loaded script that needs `firebase.messaging()` |
| 4 | Storage readable by any signed-in user | `storage.rules`: reads need the `admin` custom claim (members don't use Firebase Auth, see notes) |
| 5 | No login throttling | `members/login.jsx`: 3 free failures, then 30s lock, doubling up to 5 min |
| 9 | No client-side token expiry | `tokenExpiry` saved from the JWT `exp` claim; expired saved sessions are dropped on restore |
| 10 | `window.__wealthoriaSessionRestoreStarted` | now a module-scoped variable |
| 8 | Security headers only on one page | `vercel.json` + `firebase.json`: X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS (global) |
| 7 | CORS localhost only | `cors.json` adds www.wealthoria.in, wealthoria.in, and the web.app / firebaseapp.com hosts |

## You must do these (cannot be done in code)
1. **API key (#1):** Google Cloud Console > APIs & Services > Credentials > the browser key > Application restrictions = HTTP referrers: `https://www.wealthoria.in/*`, `https://wealthoria.in/*`, `https://wealthoria-6fc11.firebaseapp.com/*`, `https://wealthoria-6fc11.web.app/*`, and `http://localhost:5173/*` for dev. Under API restrictions, allow only the Firebase APIs you use. Then enable **App Check** (reCAPTCHA v3) and enforce it for Firestore.
2. **Rotate the demo passwords** `admin123` / `editor123` if those accounts ever existed anywhere real.
3. **Deploy rules:** `firebase deploy --only storage` and `gsutil cors set cors.json gs://wealthoria-6fc11.firebasestorage.app`
4. **Login throttling is only a deterrent.** Enforce rate limiting in the `/api/members/login` Cloud Function too.

## Deliberately not changed
- **#11 admin logout to /members/login:** this is the single shared login page. `admin/app.jsx` has no `/admin/login` route, so changing it would land on a dead route.
- **#6 admin routes client-side only:** inherent to SPAs; your Firestore rules (admin claim) are the real protection and already look right.
- **CSP is `Content-Security-Policy-Report-Only`:** I could not run the app here, and an enforcing CSP could silently break Razorpay, GA, fonts or inline scripts. Deploy, open the site/admin/member pages with DevTools console open, fix any reported violations, then rename the header to `Content-Security-Policy`. HSTS omits `includeSubDomains` so other subdomains cannot be locked out by accident; add it if all subdomains are HTTPS.
- **Firebase config values stay in source:** web API keys are public by design; moving them to env vars would not hide them. Referrer restriction + App Check is the real fix.
- Legacy files in `public/` (e.g. `public/firebase/firebase.js`, old HTML pages) still use `window.db`; they run as standalone pages, not in the Vite bundle. `prebookOrders copy.jsx` and `dashboardcopy.jsx` are unused (not imported) and still contain old patterns: safe to delete.
- `public/firebase-messaging-sw.js` is an empty file in your zip, so background push notifications will not work until it has content.
