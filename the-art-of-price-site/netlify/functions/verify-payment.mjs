// POST /api/verify-payment { razorpay_order_id, razorpay_payment_id, razorpay_signature, sku }
//   -> { ok: true, sku }   when Razorpay's signature is valid
// Used only to decide which thank-you message to show. Your source of truth for orders
// is the Razorpay dashboard (filter by notes.sku) or a payment.captured webhook.
import crypto from 'node:crypto';

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false });
  let b;
  try { b = await req.json(); } catch { return json(400, { ok: false }); }
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return json(500, { ok: false });

  const orderId = String(b?.razorpay_order_id || ''), paymentId = String(b?.razorpay_payment_id || '');
  const sig = String(b?.razorpay_signature || '');
  if (!orderId || !paymentId || !/^[a-f0-9]{64}$/i.test(sig)) return json(400, { ok: false });

  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const ok = crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
  return json(ok ? 200 : 400, { ok, sku: ok ? String(b?.sku || '') : undefined });
};

export const config = { path: '/api/verify-payment' };
