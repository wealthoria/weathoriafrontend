// POST /api/create-order  { sku, lang, source }  ->  { id, amount, currency, key }
// Creates a Razorpay order. The PRICE COMES FROM THIS FILE, never from the browser,
// so nobody can change the amount by editing the page.
// Env vars (Netlify > Site settings > Environment variables):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET   (required)
//   PREBOOK_FORCE_OPEN=1                   (optional, lets you test before 23 Nov; remove after)

const CATALOG = {
  'AOP-KN-PB26': { amount: 99900, lang: 'kn', name: 'The Art of Price (Kannada Edition) - Pre-booking' },
  'AOP-EN-PB26': { amount: 99900, lang: 'en', name: 'The Art of Price (English Edition) - Pre-booking' },
};
const LAUNCH = Date.parse('2026-11-23T00:00:00+05:30');
const CLOSE  = Date.parse('2026-12-12T23:59:59+05:30');

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  let b;
  try { b = await req.json(); } catch { return json(400, { error: 'bad_json' }); }
  const sku = String(b?.sku || '');
  const item = CATALOG[sku];
  if (!item) return json(400, { error: 'unknown_sku' });

  const now = Date.now();
  if (process.env.PREBOOK_FORCE_OPEN !== '1' && (now < LAUNCH || now > CLOSE)) return json(409, { error: 'prebooking_not_open' });

  const keyId = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) return json(500, { error: 'payment_not_configured' });

  const source = String(b?.source || '').replace(/[^\w-]/g, '').slice(0, 30);
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
               Authorization: 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64') },
    body: JSON.stringify({
      amount: item.amount, currency: 'INR',
      receipt: `${sku}-${now}`.slice(0, 40),
      notes: { sku, lang: item.lang, product: item.name, source },
    }),
  });
  const o = await r.json().catch(() => ({}));
  if (!r.ok || !o.id) {
    console.error('razorpay order failed', r.status, o?.error?.description);
    return json(502, { error: 'order_failed' });
  }
  return json(200, { id: o.id, amount: o.amount, currency: o.currency, key: keyId });
};

export const config = { path: '/api/create-order' };
