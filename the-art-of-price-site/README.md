# The Art of Price: pre-booking site (Kannada + English)

```
public/                     <- this folder is the website (upload / deploy this)
  index.html                language picker landing page (animated)  ->  /
  kn/index.html             Kannada edition page   (SKU AOP-KN-PB26)  ->  /kn/
  en/index.html             English edition page   (SKU AOP-EN-PB26)  ->  /en/
  thank-you/index.html      after-payment page, both languages
  404.html, robots.txt, sitemap.xml
  assets/js/config.js       <- THE ONLY FILE YOU EDIT for SKUs, prices, dates, checkout
  assets/js/book.js         shared logic for both edition pages
  assets/css/book.css       shared styles
  assets/img/               covers, chapter-4 figures, texture
netlify/functions/          optional Razorpay order + verify functions
netlify.toml                Netlify settings (publish folder, short links, headers)
```

## How the two SKUs are kept apart

| Edition | URL | SKU | Where the SKU shows up |
|---|---|---|---|
| Kannada | `/kn/` (also `/kannada`) | `AOP-KN-PB26` | Razorpay `notes.sku`, GA4 `item_id`, Meta Pixel `content_ids`, `<meta name="product-sku">`, schema.org Offer |
| English | `/en/` (also `/english`) | `AOP-EN-PB26` | same |

Analytics events sent (all carry `sku` + `language`): `select_edition` (landing), `view_item`, `begin_checkout` (with `source`: hero / quiz / gate / box / close / mobile), `purchase` (thank-you page, once per order). They go to `gtag()`, `fbq()` and `dataLayer` (as `aop_*` events for GTM), whichever is installed.

## Before launch: checklist

1. **Domain.** Replace `https://book.wealthoria.in` with the real address in all files (`index.html`, `kn/`, `en/`, `robots.txt`, `sitemap.xml`). In VS Code: Find in Files, Replace All.
2. **Analytics.** Paste your GA4 / Meta Pixel snippet where each page says `<!-- Analytics: ... -->` (4 pages: landing, kn, en, thank-you).
3. **Checkout.** In `public/assets/js/config.js` set `checkout.mode`:
   - `'link'` (easiest, works on any host): in Razorpay create **two Payment Pages**, one per edition, ₹999 each. Paste their URLs into `products.kn.paymentLink` and `products.en.paymentLink`. In each Payment Page set the success redirect to
     `https://YOUR-DOMAIN/thank-you/?lang=kn&sku=AOP-KN-PB26&s=ok` (and `lang=en&sku=AOP-EN-PB26` for English).
   - `'razorpay'` (popup checkout, needs Netlify deployed from Git or the Netlify CLI so the functions deploy): set `checkout.razorpayKeyId`, then in Netlify add env vars `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Prices for this mode live in `netlify/functions/create-order.mjs` (server side, can't be tampered with).
   - `'stub'` (current): shows "Checkout opens shortly". Fine for previews, **not for launch**.
4. **English sample chapter.** In `public/en/index.html`, search for `ENGLISH SAMPLE CHAPTER GOES HERE` and follow the comment. Put English chart images in `assets/img/` as `en-fig-*.jpg`.
5. **English cover.** `assets/img/cover-en.jpg` is a placeholder made from the Kannada cover (Kannada lines replaced with English). Replace it with the final English cover, same 640 × 972 size.
6. **Legal links.** The pre-book box links to `/terms`, `/refund`, `/shipping`, `/privacy`. Create those pages or change the links (Razorpay requires them).
7. **If price or dates change:** edit `config.js` *and* the visible text on the pages (and `create-order.mjs` if using `'razorpay'`). The pages log a console error if the shown price doesn't match `config.js`.

## Deploy

- **Netlify (recommended):** connect the folder as a Git repo, or run `netlify deploy --prod` from this folder. `netlify.toml` already points to `public/`. (Drag-and-drop of `public/` also works for `'link'` mode, but doesn't deploy the functions.)
- **Any other static host** (cPanel, Hostinger, GitHub Pages, S3, Vercel static): upload the *contents* of `public/` to the web root. Use `'link'` mode.

## Testing before 23 November

- Add `?aop_phase=open` to any edition URL to see the "open" state and try the checkout button (display only; the server still enforces the real window).
- For `'razorpay'` mode before launch, set env var `PREBOOK_FORCE_OPEN=1` with Razorpay **test** keys; remove it after.
- Preview locally: `python -m http.server 8000 --directory public`, then open http://localhost:8000. (Links also adjust themselves when a page is opened by double-click, but the local server is the reliable way to preview.)

## Built-in safety

- Language links are plain links: they work even if JavaScript fails. The landing animation only animates content that is already visible, and finishes instantly on any tap/key, or after 3.6 s if the device throttles animation.
- Back button after choosing an edition restores a clean landing page. Ctrl/Cmd-click opens an edition in a new tab normally.
- UTM / ad parameters on the landing URL are carried to the edition page and between KN ⇄ EN.
- The landing page remembers the last edition viewed ("Last viewed" badge). Keyboard: press **K** or **E** on the landing page.
- Checkout buttons lock while a payment is starting (no double orders), and unlock if the buyer comes back.
- Respects "reduce motion" settings. Product pages skip their own intro when the visitor already saw the landing animation.
