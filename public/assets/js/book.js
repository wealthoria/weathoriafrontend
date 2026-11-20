/* =====================================================================
   THE ART OF PRICE: shared script for the Kannada (kn/) and English (en/) pages.
   Each page sets window.AOP_PAGE = { lang:'kn'|'en', t:{...strings} } before this file.
   SKUs, prices, dates and the checkout mode live in assets/js/config.js.
   ===================================================================== */
var CFG  = window.AOP_CONFIG || {};
var PG   = window.AOP_PAGE || { lang: 'kn', t: {} };
var T    = PG.t || {};
var CK   = CFG.checkout || {};
var PROD = (CFG.products || {})[PG.lang] || {};
document.documentElement.setAttribute('data-sku', PROD.sku || '');

/* ---------- launch window (IST) ---------- */
var LAUNCH = new Date(CFG.launch || '2026-11-23T00:00:00+05:30').getTime();   // pre-booking opens
var CLOSE  = new Date(CFG.close  || '2026-12-12T23:59:59+05:30').getTime();   // pre-booking closes
/* QA override: add ?aop_phase=open (or soon / closed) to the URL to preview a phase.
   This is display-only; the server-side order function still enforces the real window. */
var FORCE_PH = (function(){ try { var v = new URLSearchParams(location.search).get('aop_phase');
  return /^(soon|open|closed)$/.test(v || '') ? v : null; } catch(e){ return null; } })();
function phase(){ if (FORCE_PH) return FORCE_PH; var n=Date.now(); return n<LAUNCH?'soon':(n<=CLOSE?'open':'closed'); }

/* ---------- analytics: every event carries this edition's SKU ---------- */
function track(ev, extra){
  var item = { item_id: PROD.sku, item_name: PROD.name, item_variant: PROD.language, price: PROD.price, quantity: 1 };
  var p = { currency: PROD.currency || 'INR', value: PROD.price, items: [item], sku: PROD.sku, language: PG.lang };
  for (var k in (extra || {})) p[k] = extra[k];
  try { (window.dataLayer = window.dataLayer || []).push({ event: 'aop_' + ev, aop: p }); } catch(e){}
  try { if (typeof window.gtag === 'function') window.gtag('event', ev, p); } catch(e){}
  try { var fb = { view_item: 'ViewContent', begin_checkout: 'InitiateCheckout' }[ev];
    if (fb && typeof window.fbq === 'function') window.fbq('track', fb, { content_ids: [PROD.sku], content_type: 'product',
      content_name: PROD.name, value: PROD.price, currency: PROD.currency || 'INR' }); } catch(e){}
}

/* ---------- modal (accessible: Esc closes, focus returns) ---------- */
var modReturn = null;
function openMod(t, p){
  modReturn = document.activeElement;
  document.getElementById('modT').textContent = t;
  document.getElementById('modP').innerHTML = p;
  var m = document.getElementById('mod'); m.classList.add('on');
  var b = m.querySelector('button'); if (b) setTimeout(function(){ b.focus(); }, 30);
}
function closeMod(){
  document.getElementById('mod').classList.remove('on');
  if (modReturn && modReturn.focus) try { modReturn.focus(); } catch(e){}
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape' && document.getElementById('mod').classList.contains('on')) closeMod(); });

/* ---------- pre-book / checkout (Wealthoria Direct Integration) ---------- */
var busy = false;
var aopSource = 'hero';
var aopQty = 1;

function setBusy(on){
  busy = on;
  document.querySelectorAll('.btn-p.ph,[onclick^="startPrebook"]').forEach(function(b){
    b.classList.toggle('busy', on);
  });
}

function thankYou(state, bookingId){
  var isKn = PG.lang === 'kn';
  var sku = (PROD && PROD.sku) || (isKn ? 'THE-ART-OF-PRICE-KN-EDITION' : 'THE-ART-OF-PRICE-EN-EDITION');
  var q = '?lang=' + encodeURIComponent(PG.lang) +
          '&sku=' + encodeURIComponent(sku) +
          '&s=' + encodeURIComponent(state || 'ok') +
          (bookingId ? '&o=' + encodeURIComponent(bookingId) : '');
  if (location.protocol === 'file:') {
    var p = (location.pathname || '').replace(/\\/g, '/');
    var isSubdir = p.indexOf('/kn/') !== -1 || p.indexOf('/en/') !== -1 || p.indexOf('/the-art-of-price/') !== -1;
    return (isSubdir ? '../thank-you.html' : './thank-you.html') + q;
  }
  return '/thank-you.html' + q;
}

function loadRazorpay(){
  return new Promise(function(res, rej){
    if (window.Razorpay) return res();
    var s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

/* Ensure checkout delivery modal exists on the page */
function ensureCheckoutModal(){
  if (document.getElementById('aopCheckoutModal')) return;

  var isKn = PG.lang === 'kn';
  var title = isKn ? 'The Art of Price (ದಿ ಆರ್ಟ್ ಆಫ್ ಪ್ರೈಸ್)' : 'The Art of Price (Technical Analysis)';
  var editionBadge = isKn ? 'ಕನ್ನಡ ಆವೃತ್ತಿ &middot; Kannada Edition' : 'English Edition';
  var priceLabel = isKn ? '₹999 (MRP ₹1,499 &middot; ₹500 ರಿಯಾಯಿತಿ)' : '₹999 (MRP ₹1,499 &middot; Save ₹500)';

  var modalHtml = [
    '<div id="aopCheckoutModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(5,5,5,0.85);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:16px;overflow-y:auto;">',
    '  <div style="background:#141414;border:1px solid rgba(255,255,255,0.14);border-radius:20px;max-width:540px;width:100%;margin:auto;box-shadow:0 30px 80px rgba(0,0,0,0.8);color:#F1ECE2;position:relative;font-family:Outfit,system-ui,sans-serif;overflow:hidden;">',
    '    <div style="padding:20px 24px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.02);">',
    '      <div>',
    '        <div style="display:inline-block;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:750;background:rgba(29,182,106,0.15);color:#1DB66A;letter-spacing:0.5px;margin-bottom:6px;">' + editionBadge + '</div>',
    '        <h3 style="margin:0;font-size:18px;font-weight:750;color:#F1ECE2;">' + (isKn ? 'ಪುಸ್ತಕ Pre-booking ವಿವರಗಳು' : 'Pre-book Your Copy') + '</h3>',
    '      </div>',
    '      <button type="button" onclick="closeCheckoutModal()" style="background:transparent;border:none;color:#888;font-size:26px;cursor:pointer;padding:4px 8px;line-height:1;">&times;</button>',
    '    </div>',
    '    <form id="aopModalForm" onsubmit="handleCheckoutSubmit(event)" style="padding:20px 24px 24px;">',
    '      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 14px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;">',
    '        <div>',
    '          <div style="font-weight:700;font-size:13.5px;color:#F1ECE2;">' + title + '</div>',
    '          <div style="font-size:12px;color:#1DB66A;font-weight:650;margin-top:2px;">' + priceLabel + ' &middot; Free Pan-India Delivery</div>',
    '        </div>',
    '        <div style="text-align:right;">',
    '          <span style="font-size:11px;color:#888;display:block;">Quantity</span>',
    '          <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">',
    '            <button type="button" onclick="changeAopQty(-1)" style="width:26px;height:26px;border-radius:6px;border:1px solid #333;background:#222;color:#fff;cursor:pointer;font-weight:700;">-</button>',
    '            <span id="aopQtyDisplay" style="font-weight:750;font-size:14px;min-width:16px;text-align:center;">1</span>',
    '            <button type="button" onclick="changeAopQty(1)" style="width:26px;height:26px;border-radius:6px;border:1px solid #333;background:#222;color:#fff;cursor:pointer;font-weight:700;">+</button>',
    '          </div>',
    '        </div>',
    '      </div>',
    '      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">',
    '        <div>',
    '          <label style="display:block;font-size:11.5px;font-weight:600;color:#aaa;margin-bottom:5px;">' + (isKn ? 'ನಿಮ್ಮ ಹೆಸರು *' : 'Full Name *') + '</label>',
    '          <input required id="aopName" type="text" placeholder="' + (isKn ? 'ಪೂರ್ಣ ಹೆಸರು' : 'Full Name') + '" style="width:100%;height:38px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#1a1a1a;color:#fff;font-size:13px;box-sizing:border-box;">',
    '        </div>',
    '        <div>',
    '          <label style="display:block;font-size:11.5px;font-weight:600;color:#aaa;margin-bottom:5px;">' + (isKn ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *' : 'Mobile Number *') + '</label>',
    '          <input required id="aopPhone" type="tel" maxlength="10" placeholder="' + (isKn ? '10-ಅಂಕಿಯ ಸಂಖ್ಯೆ' : '10-digit Mobile') + '" style="width:100%;height:38px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#1a1a1a;color:#fff;font-size:13px;box-sizing:border-box;">',
    '        </div>',
    '      </div>',
    '      <div style="margin-bottom:12px;">',
    '        <label style="display:block;font-size:11.5px;font-weight:600;color:#aaa;margin-bottom:5px;">' + (isKn ? 'ಇಮೇಲ್ ವಿಳಾಸ *' : 'Email Address *') + '</label>',
    '        <input required id="aopEmail" type="email" placeholder="' + (isKn ? 'ದೃಢೀಕರಣಕ್ಕಾಗಿ ಇಮೇಲ್' : 'name@example.com for order receipt') + '" style="width:100%;height:38px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#1a1a1a;color:#fff;font-size:13px;box-sizing:border-box;">',
    '      </div>',
    '      <div style="margin-bottom:12px;">',
    '        <label style="display:block;font-size:11.5px;font-weight:600;color:#aaa;margin-bottom:5px;">' + (isKn ? 'ಪುಸ್ತಕ ತಲುಪಿಸಬೇಕಾದ ವಿಳಾಸ *' : 'Delivery Address (Street, House/Flat) *') + '</label>',
    '        <textarea required id="aopAddress" rows="2" placeholder="' + (isKn ? 'ಮನೆ / ಕಟ್ಟಡದ ಸಂಖ್ಯೆ, ರಸ್ತೆ ಹೆಸರು' : 'Flat/House No, Building, Street') + '" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#1a1a1a;color:#fff;font-size:13px;box-sizing:border-box;resize:vertical;"></textarea>',
    '      </div>',
    '      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">',
    '        <div>',
    '          <label style="display:block;font-size:11.5px;font-weight:600;color:#aaa;margin-bottom:5px;">' + (isKn ? 'ಊರು / ನಗರ *' : 'City / Town *') + '</label>',
    '          <input required id="aopCity" type="text" placeholder="' + (isKn ? 'ಬೆಂಗಳೂರು' : 'e.g. Bengaluru') + '" style="width:100%;height:38px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#1a1a1a;color:#fff;font-size:13px;box-sizing:border-box;">',
    '        </div>',
    '        <div>',
    '          <label style="display:block;font-size:11.5px;font-weight:600;color:#aaa;margin-bottom:5px;">' + (isKn ? 'ಪಿನ್‌ಕೋಡ್ *' : 'Pincode *') + '</label>',
    '          <input required id="aopPincode" type="tel" maxlength="6" placeholder="' + (isKn ? '6-ಅಂಕಿಗಳ ಪಿನ್‌ಕೋಡ್' : '6-digit Pincode') + '" style="width:100%;height:38px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#1a1a1a;color:#fff;font-size:13px;box-sizing:border-box;">',
    '        </div>',
    '      </div>',
    '      <div style="margin-bottom:18px;">',
    '        <label style="display:block;font-size:11.5px;font-weight:600;color:#aaa;margin-bottom:5px;">' + (isKn ? 'ರಾಜ್ಯ' : 'State') + '</label>',
    '        <input required id="aopState" type="text" value="Karnataka" style="width:100%;height:38px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#1a1a1a;color:#fff;font-size:13px;box-sizing:border-box;">',
    '      </div>',
    '      <div id="aopErrorMsg" style="display:none;padding:10px 14px;border-radius:8px;background:rgba(200,64,47,0.15);border:1px solid #C8402F;color:#ff8a7a;font-size:12.5px;margin-bottom:14px;font-weight:600;"></div>',
    '      <button id="aopPayBtn" type="submit" style="width:100%;height:46px;border-radius:10px;border:none;background:#1DB66A;color:#06210F;font-weight:750;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 18px rgba(29,182,106,0.35);transition:all 0.2s;">',
    '        <span id="aopPayBtnText">' + (isKn ? 'ಮುಂದುವರಿಯಿರಿ &rarr; ಪಾವತಿ ಮಾಡಿ' : 'Confirm &amp; Proceed to Pay &rarr;') + '</span>',
    '      </button>',
    '      <div style="text-align:center;margin-top:14px;font-size:11.5px;color:#777;">',
    '        ✓ 100% Secure Payment via Razorpay (UPI, Cards, NetBanking)<br>',
    '        <a href="/the-art-of-price-prebook.html?edition=' + (isKn ? 'kannada' : 'english') + '" style="color:#1DB66A;text-decoration:none;display:inline-block;margin-top:6px;">' + (isKn ? 'ಪೂರ್ಣ ಪುಟದ ಫಾರ್ಮ್ ಬಳಸಲು ಇಲ್ಲಿ ಒತ್ತಿ &rarr;' : 'Or open full-page order form &rarr;') + '</a>',
    '      </div>',
    '    </form>',
    '  </div>',
    '</div>'
  ].join('');

  var wrapper = document.createElement('div');
  wrapper.innerHTML = modalHtml;
  document.body.appendChild(wrapper.firstChild);
}

function changeAopQty(delta){
  aopQty = Math.max(1, Math.min(50, aopQty + delta));
  var disp = document.getElementById('aopQtyDisplay');
  if (disp) disp.textContent = aopQty;
}

function openCheckoutModal(source){
  aopSource = source || 'hero';
  ensureCheckoutModal();
  var m = document.getElementById('aopCheckoutModal');
  if (m) {
    m.style.display = 'flex';
    var nameInput = document.getElementById('aopName');
    if (nameInput) setTimeout(function(){ nameInput.focus(); }, 60);
  }
}

function closeCheckoutModal(){
  var m = document.getElementById('aopCheckoutModal');
  if (m) m.style.display = 'none';
}

function startPrebook(source){
  track('begin_checkout', { source: source });
  openCheckoutModal(source);
}

async function handleCheckoutSubmit(e){
  if (e) e.preventDefault();
  var isKn = PG.lang === 'kn';
  var errEl = document.getElementById('aopErrorMsg');
  var payBtn = document.getElementById('aopPayBtn');
  var payText = document.getElementById('aopPayBtnText');

  if (errEl) errEl.style.display = 'none';

  var name = (document.getElementById('aopName').value || '').trim();
  var phone = (document.getElementById('aopPhone').value || '').replace(/\D/g, '').slice(-10);
  var email = (document.getElementById('aopEmail').value || '').trim().toLowerCase();
  var address = (document.getElementById('aopAddress').value || '').trim();
  var city = (document.getElementById('aopCity').value || '').trim();
  var state = (document.getElementById('aopState').value || '').trim() || 'Karnataka';
  var pincode = (document.getElementById('aopPincode').value || '').replace(/\D/g, '').slice(0, 6);

  if (!name || name.length < 2){
    if (errEl){ errEl.textContent = isKn ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.' : 'Please enter your full name.'; errEl.style.display = 'block'; }
    return;
  }
  if (!phone || phone.length !== 10){
    if (errEl){ errEl.textContent = isKn ? 'ದಯವಿಟ್ಟು ಸರಿಯಾದ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.' : 'Please enter a valid 10-digit mobile number.'; errEl.style.display = 'block'; }
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    if (errEl){ errEl.textContent = isKn ? 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.' : 'Please enter a valid email address.'; errEl.style.display = 'block'; }
    return;
  }
  if (!address || address.length < 5){
    if (errEl){ errEl.textContent = isKn ? 'ದಯವಿಟ್ಟು ವಿತರಣಾ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.' : 'Please enter your delivery street address.'; errEl.style.display = 'block'; }
    return;
  }
  if (!city){
    if (errEl){ errEl.textContent = isKn ? 'ದಯವಿಟ್ಟು ನಗರ/ಊರಿನ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.' : 'Please enter your city/town.'; errEl.style.display = 'block'; }
    return;
  }
  if (!pincode || pincode.length !== 6){
    if (errEl){ errEl.textContent = isKn ? 'ದಯವಿಟ್ಟು ಸರಿಯಾದ 6-ಅಂಕಿಯ ಪಿನ್‌ಕೋಡ್ ನಮೂದಿಸಿ.' : 'Please enter a valid 6-digit pincode.'; errEl.style.display = 'block'; }
    return;
  }

  try {
    if (payBtn) payBtn.disabled = true;
    if (payText) payText.textContent = isKn ? 'ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...' : 'Connecting to payment gateway...';

    var apiBase = (window.AOP_CONFIG && window.AOP_CONFIG.apiBase) || 'https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api';

    var chosenSku = isKn ? 'THE-ART-OF-PRICE-KN-EDITION' : 'THE-ART-OF-PRICE-EN-EDITION';
    var chosenTitle = isKn ? 'The Art of Price (ದಿ ಆರ್ಟ್ ಆಫ್ ಪ್ರೈಸ್ - ಕನ್ನಡ)' : 'The Art of Price (English Edition)';

    var payload = {
      name: name,
      email: email,
      phone: phone,
      edition: isKn ? 'kannada' : 'english',
      sku: chosenSku,
      bookTitle: chosenTitle,
      shippingAddress: {
        name: name,
        phone: phone,
        address: address,
        landmark: '',
        city: city,
        state: state,
        pincode: pincode,
        country: 'India'
      },
      billingAddress: { sameAsDelivery: true },
      quantity: aopQty || 1,
      source: 'site_' + PG.lang + '_' + aopSource
    };

    var orderRes = await fetch(apiBase + '/art-of-price/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    var orderData = await orderRes.json().catch(function(){ return {}; });
    if (!orderRes.ok || !orderData.success){
      throw new Error(orderData.message || (isKn ? 'ಪಾವತಿ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ.' : 'Unable to initialize payment gateway.'));
    }

    await loadRazorpay();

    var rzp = new window.Razorpay({
      key: orderData.keyId || 'rzp_live_TgapWXBpVsHDBm',
      amount: orderData.amount,
      currency: 'INR',
      name: 'Wealthoria',
      description: chosenTitle,
      order_id: orderData.orderId,
      prefill: {
        name: name,
        email: email,
        contact: phone
      },
      notes: {
        bookingId: orderData.bookingId,
        edition: isKn ? 'kannada' : 'english',
        sku: chosenSku,
        bookTitle: chosenTitle,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        shippingAddress: address,
        city: city,
        state: state,
        pincode: pincode,
        quantity: String(aopQty || 1)
      },
      theme: { color: '#1DB66A' },
      handler: async function(rzpRes){
        try {
          if (payText) payText.textContent = isKn ? 'ಪಾವತಿ ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ...' : 'Confirming payment...';
          try {
            localStorage.setItem('aop_last_order', JSON.stringify({
              bookingId: orderData.bookingId,
              paymentId: rzpRes.razorpay_payment_id,
              orderId: rzpRes.razorpay_order_id,
              sku: chosenSku,
              edition: isKn ? 'kannada' : 'english',
              name: name,
              phone: phone,
              email: email,
              address: address,
              city: city,
              state: state,
              pincode: pincode,
              quantity: aopQty || 1,
              timestamp: new Date().toISOString()
            }));
          } catch(_lsErr){}

          var verifyRes = await fetch(apiBase + '/art-of-price/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: rzpRes.razorpay_order_id,
              razorpay_payment_id: rzpRes.razorpay_payment_id,
              razorpay_signature: rzpRes.razorpay_signature
            })
          });
          var verifyData = await verifyRes.json().catch(function(){ return {}; });
          if (window.fbq) {
            try {
              fbq('track', 'Purchase', {
                content_name: chosenTitle,
                content_ids: [chosenSku],
                value: (orderData.amount || 99900) / 100,
                currency: 'INR'
              });
            } catch(e){}
          }
          if (window.gtag) {
            try {
              gtag('event', 'purchase', {
                transaction_id: rzpRes.razorpay_payment_id,
                value: (orderData.amount || 99900) / 100,
                currency: 'INR',
                items: [{
                  item_id: chosenSku,
                  item_name: chosenTitle,
                  item_variant: isKn ? 'Kannada' : 'English',
                  quantity: aopQty || 1,
                  price: 999
                }]
              });
            } catch(e){}
          }
          closeCheckoutModal();
          location.href = thankYou('ok', orderData.bookingId);
        } catch(vErr){
          console.warn('Payment verify warning:', vErr);
          closeCheckoutModal();
          location.href = thankYou('ok', orderData.bookingId);
        }
      },
      modal: {
        ondismiss: function(){
          if (payBtn) payBtn.disabled = false;
          if (payText) payText.textContent = isKn ? 'ಮುಂದುವರಿಯಿರಿ &rarr; ಪಾವತಿ ಮಾಡಿ' : 'Confirm & Proceed to Pay &rarr;';
          try {
            fetch(apiBase + '/art-of-price/payment-attempt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderData.orderId,
                bookingId: orderData.bookingId,
                status: 'cancelled',
                reason: 'User dismissed checkout modal',
                customer: { name: name, phone: phone, email: email }
              })
            }).catch(function(){});
          } catch(_attErr){}
        }
      }
    });

    rzp.on('payment.failed', function(resp){
      if (payBtn) payBtn.disabled = false;
      if (payText) payText.textContent = isKn ? 'ಮುಂದುವರಿಯಿರಿ &rarr; ಪಾವತಿ ಮಾಡಿ' : 'Confirm & Proceed to Pay &rarr;';
      try {
        fetch(apiBase + '/art-of-price/payment-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.orderId,
            bookingId: orderData.bookingId,
            status: 'failed',
            error: resp && resp.error,
            customer: { name: name, phone: phone, email: email }
          })
        }).catch(function(){});
      } catch(_attErr){}
      if (errEl){
        errEl.textContent = (resp && resp.error && resp.error.description) || (isKn ? 'ಪಾವತಿ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.' : 'Payment failed. Please try again.');
        errEl.style.display = 'block';
      }
    });

    rzp.open();
  } catch(err){
    console.error('Checkout error:', err);
    if (payBtn) payBtn.disabled = false;
    if (payText) payText.textContent = isKn ? 'ಮುಂದುವರಿಯಿರಿ &rarr; ಪಾವತಿ ಮಾಡಿ' : 'Confirm & Proceed to Pay &rarr;';
    if (errEl){
      errEl.textContent = err.message || (isKn ? 'ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' : 'An error occurred. Please try again.');
      errEl.style.display = 'block';
    }
  }
}
/* Back-button safety: reset the busy state when the page is restored from cache. */
window.addEventListener('pageshow', function(e){ if (e.persisted) setBusy(false); });

/* ---------- language links: remember choice, keep UTM params, work from file:// ---------- */
try { localStorage.setItem('aop_lang', PG.lang); } catch(e){}
(function(){
  var qs = location.search.replace(/([?&])aop_phase=[^&]*&?/, '$1').replace(/[?&]$/, '');
  document.querySelectorAll('a[href^="../"]').forEach(function(a){
    var href = a.getAttribute('href');
    if (location.protocol === 'file:' && /\/$/.test(href)) href += 'index.html';
    if (a.hasAttribute('data-lang') && qs) href += qs;
    a.setAttribute('href', href);
    if (a.hasAttribute('data-lang')) a.addEventListener('click', function(){
      try { localStorage.setItem('aop_lang', a.getAttribute('data-lang')); } catch(e){} });
  });
})();

/* ---------- self-check: page prices must match config ---------- */
(function(){
  var pn = document.querySelector('.p-now'); if (!pn || !PROD.price) return;
  var shown = pn.textContent.replace(/[^\d]/g, '');
  if (shown !== String(PROD.price)) console.error('[AOP] Price on page (' + shown + ') does not match config.js (' + PROD.price + ') for ' + PROD.sku);
  if (!PROD.sku) console.error('[AOP] No product configured for lang "' + PG.lang + '"');
})();
track('view_item');

/* ---------- phase texts + countdowns ---------- */
var lastPh=null;
function applyPhase(ph){
  if (ph===lastPh) return; lastPh=ph;
  document.querySelectorAll('.ph').forEach(function(el){
    var v=el.getAttribute('data-'+ph); if (v!==null) el.innerHTML=v; });
  document.querySelectorAll('.btn-p.ph').forEach(function(el){ el.setAttribute('aria-disabled', ph==='open'?'false':'true'); });
  if (ph==='closed') document.body.classList.add('no-cd');
}
function tick(){
  var ph=phase(); applyPhase(ph);
  if (ph==='closed') return;
  var left = (ph==='soon'?LAUNCH:CLOSE) - Date.now(); if (left<0) left=0;
  var s=Math.floor(left/1000), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), q=s%60;
  var pad=function(n){return String(n).padStart(2,'0');}, v=[d,h,m,q];
  ['cdBig','cdHero'].forEach(function(id){ var el=document.getElementById(id); if(!el) return;
    var b=el.querySelectorAll('b'); for (var i=0;i<b.length;i++) b[i].textContent=pad(v[i]); });
}
tick(); setInterval(tick,1000);

/* ---------- motion (GSAP + ScrollTrigger, inlined above) ---------- */
var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var G = window.gsap, ST = window.ScrollTrigger;
if (G && ST) G.registerPlugin(ST);
var NS='http://www.w3.org/2000/svg';
function rng(seed){ return function(){ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; }; }
function el(tag,attrs,parent){ var e=document.createElementNS(NS,tag); for (var k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }
function candle(parent,x,w,o,h,l,c,up,cls){
  var g=el('g',{'class':cls||''},parent), col=up?'#1DB66A':'#C8402F';
  el('line',{x1:x+w/2,x2:x+w/2,y1:h,y2:l,stroke:col,'stroke-width':Math.max(1,w*.28)},g);
  el('rect',{x:x,y:Math.min(o,c),width:w,height:Math.max(1.5,Math.abs(c-o)),fill:col},g);
  return g;
}

/* ---- hero background: two candle layers for parallax ---- */
function heroLayer(id,seed,N,breakAt){
  var svg=document.getElementById(id); if(!svg) return; var r=rng(seed), W=1000/N, p=190;
  if (breakAt) el('rect',{x:0,y:150,width:W*breakAt,height:34,fill:'#1DB66A',opacity:.16},svg);
  for (var i=0;i<N;i++){
    var drift = breakAt ? (i<breakAt ? (p>178?-4:(p<150?4:0)) : -6.5) : (r()-.5)*10;
    var o=p, c=o+drift+(r()-.5)*(breakAt&&i<breakAt?22:16);
    if (breakAt && i<breakAt) c=Math.max(146,Math.min(186,c));
    c=Math.max(30,Math.min(280,c));
    var hi=Math.min(o,c)-3-r()*9, lo=Math.max(o,c)+3+r()*9;
    candle(svg,i*W+W*.2,W*.6,o,hi,lo,c,c<o,'hb-c'); p=c;
  }
}
heroLayer('heroCandles',7,56,36); heroLayer('heroCandles2',11,90,0);

/* ---- word split helper (keeps <em>, <b>) ---- */
function splitWords(node){
  [].slice.call(node.childNodes).forEach(function(n){
    if (n.nodeType===3){
      var parts=n.textContent.split(/(\s+)/), frag=document.createDocumentFragment();
      parts.forEach(function(p){ if(!p) return; if(/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
        else { var sp=document.createElement('span'); sp.className='w'; sp.textContent=p; frag.appendChild(sp); } });
      n.parentNode.replaceChild(frag,n);
    } else if (n.nodeType===1 && n.tagName!=='BR') splitWords(n);
  });
  node.classList.add('w-split');
}

/* ---- intro chart ---- */
(function(){
  var svg=document.getElementById('introChart'); if(!svg) return; var r=rng(3);
  el('rect',{'class':'izone',x:215,y:262,width:372,height:34,fill:'#E8735A',opacity:.18},svg);
  var t=el('text',{'class':'izone',x:219,y:254,fill:'#E8735A','font-family':'Outfit,sans-serif','font-size':13,'font-weight':600,'letter-spacing':'2'},svg); t.textContent='RESISTANCE';
  var N=31, x0=228, W=11.4, p=380, pts=[];
  for (var i=0;i<N;i++){
    var tgt = (i%9<4) ? 280 : 420;                 // swing up to the zone, then back down
    var o=p, c=o+(tgt-o)*.38+(r()-.5)*24; c=Math.max(272,Math.min(450,c));
    var hi=Math.min(o,c)-4-r()*10, lo=Math.max(o,c)+4+r()*10; if (hi<264) hi=264+r()*6;
    candle(svg,x0+i*W,W*.62,o,hi,lo,c,c<o,'ic'); pts.push((x0+i*W+W*.31)+','+c); p=c;
  }
  pts.push('600,300');
  el('polyline',{'class':'pl',points:pts.join(' '),fill:'none',stroke:'#F1ECE2','stroke-width':1.4,opacity:.55},svg);
})();

/* ---- scroll story chart (real Reliance candles, from the book's chart 4.3) ---- */
var REL=[[1339.3,1340.6,1286.8,1303.1],[1294.3,1310.0,1288.1,1306.8],[1311.2,1328.7,1301.8,1326.8],[1325.6,1325.6,1304.3,1306.8],[1299.3,1302.5,1276.8,1284.9],[1280.6,1286.8,1268.7,1273.7],[1277.4,1289.9,1269.3,1275.6],[1271.8,1276.2,1251.2,1253.1],[1254.9,1273.1,1253.1,1269.3],[1269.3,1273.7,1245.5,1261.8],[1262.4,1281.8,1236.8,1243.0],[1243.7,1244.3,1219.3,1224.3],[1230.5,1269.3,1224.3,1267.4],[1291.8,1305.0,1284.3,1288.1],[1296.2,1298.1,1286.2,1297.5],[1295.6,1304.3,1288.1,1294.3],[1291.8,1296.8,1270.6,1271.8],[1281.2,1300.0,1276.8,1293.7],[1289.3,1311.8,1278.7,1311.2],[1318.1,1327.5,1308.7,1325.0],[1328.1,1328.7,1305.6,1310.0],[1315.6,1326.2,1308.1,1323.7],[1325.6,1325.6,1311.8,1313.1],[1305.0,1315.6,1294.9,1296.2],[1291.2,1295.6,1281.8,1286.2],[1286.8,1290.6,1278.1,1279.3],[1271.8,1278.7,1262.4,1264.3],[1261.2,1275.6,1241.2,1274.3],[1276.8,1281.8,1268.1,1269.3],[1263.1,1264.3,1244.3,1246.2],[1241.8,1260.6,1241.8,1254.9],[1240.5,1245.5,1230.5,1231.8],[1225.5,1239.9,1203.0,1206.1],[1216.2,1227.4,1214.9,1224.3],[1222.4,1234.3,1222.4,1234.3],[1226.2,1228.0,1216.2,1217.4],[1219.3,1228.7,1218.7,1223.0],[1218.0,1223.7,1209.9,1211.8],[1209.3,1219.3,1208.0,1217.4],[1216.2,1226.8,1213.0,1223.0],[1222.4,1244.9,1221.8,1243.7],[1244.9,1262.4,1237.4,1253.1],[1255.6,1262.4,1216.8,1219.3],[1223.0,1244.9,1223.0,1242.4],[1249.9,1271.8,1246.8,1267.4],[1268.7,1270.6,1249.9,1256.2],[1255.6,1257.4,1237.4,1243.0],[1231.2,1245.5,1228.0,1241.8],[1245.5,1253.7,1229.3,1239.9],[1246.2,1257.4,1243.7,1253.7],[1259.9,1275.6,1253.1,1268.1],[1322.5,1323.1,1286.8,1303.7],[1318.1,1318.1,1301.8,1306.8],[1312.5,1313.7,1271.8,1274.9],[1279.9,1283.7,1270.6,1278.1],[1271.8,1278.1,1263.1,1264.9],[1268.1,1273.7,1244.9,1247.4],[1240.5,1241.2,1221.8,1230.5],[1239.9,1245.5,1219.9,1235.5],[1243.0,1243.0,1229.9,1229.9],[1236.8,1257.4,1234.3,1254.9],[1256.8,1267.4,1250.5,1266.8],[1266.8,1271.2,1242.4,1265.6],[1252.4,1256.2,1239.3,1246.8],[1249.3,1289.3,1248.0,1286.8],[1284.3,1291.2,1278.7,1279.3],[1274.9,1288.7,1271.8,1283.1],[1278.1,1284.3,1263.7,1268.1],[1266.2,1266.8,1247.4,1254.9],[1266.2,1266.2,1231.8,1236.2],[1221.2,1227.4,1194.9,1217.4],[1218.7,1228.7,1213.7,1217.4],[1220.5,1224.3,1206.8,1218.7],[1212.4,1228.0,1206.1,1226.8],[1226.2,1230.5,1218.0,1227.4],[1220.5,1233.0,1219.3,1229.3],[1224.9,1239.9,1223.7,1234.9],[1230.5,1240.5,1223.7,1229.3],[1218.0,1223.7,1212.4,1215.5],[1212.4,1221.2,1203.0,1204.9],[1214.3,1215.5,1202.4,1208.0],[1203.6,1218.0,1194.9,1201.1],[1205.5,1206.8,1157.4,1172.4],[1163.6,1174.3,1161.1,1163.0],[1161.7,1183.6,1158.6,1177.4],[1198.0,1214.3,1186.8,1211.2],[1216.8,1255.6,1213.7,1251.8],[1246.8,1258.7,1237.4,1239.3],[1241.2,1249.9,1231.8,1249.3],[1259.9,1263.7,1245.5,1258.1],[1261.8,1264.9,1245.5,1249.3],[1243.7,1258.1,1234.9,1239.9],[1242.4,1253.7,1240.5,1248.7],[1253.1,1273.7,1251.8,1271.2],[1276.2,1281.8,1271.8,1278.1],[1292.4,1306.8,1286.2,1303.7],[1303.7,1304.3,1284.3,1286.8],[1293.1,1294.3,1270.6,1274.3],[1279.3,1285.6,1273.1,1279.9],[1281.8,1296.2,1270.6,1276.2],[1266.2,1278.7,1251.2,1253.7],[1248.7,1256.2,1245.5,1253.1],[1234.3,1252.4,1234.3,1250.5],[1243.0,1246.2,1194.9,1205.5],[1133.0,1171.8,1116.1,1167.4],[1173.0,1196.8,1164.9,1183.6],[1170.5,1190.5,1169.9,1186.8],[1196.1,1223.0,1196.1,1220.5],[1252.4,1252.4,1238.7,1241.2],[1234.9,1241.2,1230.5,1241.2],[1241.2,1280.6,1229.3,1276.2],[1271.2,1301.2,1268.7,1297.5],[1301.8,1304.3,1288.1,1292.4],[1298.1,1306.8,1287.4,1301.8],[1293.7,1305.0,1291.8,1303.1],[1305.6,1325.6,1289.9,1301.8],[1341.2,1375.0,1321.8,1370.6],[1372.5,1411.3,1371.9,1401.9],[1403.1,1413.1,1370.6,1406.9],[1415.0,1427.5,1411.3,1421.9],[1428.8,1440.0,1428.8,1440.0],[1433.2,1433.2,1412.5,1421.9],[1422.5,1425.0,1404.4,1407.5],[1405.6,1421.3,1400.0,1408.8],[1387.5,1395.6,1376.2,1378.7],[1401.3,1439.4,1401.3,1438.2],[1435.7,1448.2,1414.4,1416.9],[1421.3,1430.7,1417.5,1426.3],[1426.3,1461.9,1414.4,1456.3],[1454.4,1461.9,1449.4,1458.2],[1453.8,1455.0,1440.0,1441.9],[1440.0,1445.7,1423.8,1425.6],[1425.0,1436.9,1420.0,1431.3],[1423.1,1424.4,1398.8,1410.6],[1408.1,1434.4,1408.1,1428.8],[1433.2,1441.9,1426.9,1436.9],[1428.1,1437.5,1415.6,1423.1],[1421.9,1423.1,1412.5,1414.4],[1413.1,1420.6,1410.6,1420.0],[1419.4,1431.3,1411.9,1422.5],[1413.1,1418.1,1397.5,1415.6],[1424.4,1426.9,1405.0,1406.9],[1416.3,1426.3,1408.1,1425.6],[1429.4,1455.7,1425.6,1444.4],[1442.5,1451.9,1438.8,1445.7],[1458.8,1458.8,1447.5,1450.0],[1451.9,1454.4,1438.2,1440.0],[1446.9,1469.4,1445.0,1450.7],[1455.7,1457.5,1436.3,1443.2],[1425.0,1436.3,1416.3,1430.0],[1428.1,1443.2,1426.3,1440.0],[1450.0,1450.0,1427.5,1432.5],[1427.5,1443.8,1427.5,1443.8],[1431.3,1440.7,1427.5,1435.0],[1432.5,1471.9,1430.0,1468.2],[1454.4,1464.4,1443.8,1458.8],[1466.9,1475.7,1445.0,1451.9],[1465.0,1473.2,1462.5,1469.4],[1470.7,1499.4,1466.9,1497.6],[1500.7,1522.6,1498.8,1517.6],[1515.7,1525.7,1498.2,1501.9],[1501.9,1532.0,1501.9,1530.7],[1530.7,1530.7,1510.7,1520.1],[1522.6,1532.6,1515.1,1519.5],[1525.7,1530.7,1519.5,1529.5],[1528.2,1545.7,1527.0,1543.8],[1537.6,1545.7,1532.0,1539.5],[1538.8,1552.0,1511.9,1520.7],[1522.0,1525.7,1509.4,1518.8],[1513.8,1515.7,1492.6,1496.3],[1494.4,1500.7,1481.3,1485.1],[1488.2,1496.9,1484.4,1486.9],[1474.4,1491.9,1473.2,1487.6],[1489.4,1490.1,1475.7,1477.6],[1486.9,1486.9,1471.3,1477.6],[1466.9,1476.9,1425.0,1430.0],[1429.4,1432.5,1412.5,1414.4],[1428.1,1428.1,1416.3,1425.6],[1421.3,1423.8,1398.1,1404.4],[1400.6,1401.9,1386.3,1393.1],[1394.4,1408.8,1386.9,1388.8],[1384.4,1420.6,1384.4,1418.8],[1420.0,1423.8,1403.1,1411.3],[1389.4,1403.1,1384.4,1391.9],[1388.1,1406.3,1386.3,1395.6],[1396.3,1416.9,1393.8,1413.1],[1413.1,1413.1,1390.0,1393.1],[1393.1,1396.3,1385.0,1394.4],[1388.8,1394.4,1368.1,1391.3],[1386.9,1398.1,1366.9,1368.7],[1371.2,1388.8,1363.1,1388.1],[1383.7,1402.5,1376.9,1381.9],[1390.0,1392.5,1379.4,1383.7],[1379.4,1381.2,1371.9,1375.0],[1391.9,1395.6,1378.7,1383.1],[1391.3,1421.9,1391.3,1421.9],[1414.4,1425.6,1411.9,1415.0],[1426.9,1432.5,1422.5,1426.3],[1421.9,1423.8,1410.0,1410.6],[1416.9,1420.0,1407.5,1413.8],[1410.0,1410.6,1383.7,1386.3],[1391.9,1393.1,1368.1,1386.9],[1383.1,1404.4,1351.9,1358.1],[1358.1,1363.7,1346.9,1355.0],[1356.2,1385.0,1356.2,1368.1],[1371.2,1376.9,1362.5,1374.4],[1373.7,1374.4,1358.7,1360.6],[1364.4,1381.9,1361.2,1376.9],[1381.9,1386.9,1374.4,1380.0],[1378.7,1381.9,1370.6,1377.5],[1385.6,1389.4,1376.2,1378.1],[1377.5,1386.3,1376.9,1385.0],[1384.4,1396.9,1382.5,1396.9],[1394.4,1401.3,1390.6,1401.3],[1406.3,1408.8,1400.0,1406.9],[1408.1,1416.9,1408.1,1415.6],[1422.5,1422.5,1412.5,1416.3],[1416.9,1417.5,1405.6,1408.8],[1405.6,1411.3,1390.0,1391.9],[1393.1,1395.6,1378.7,1391.3],[1386.9,1396.9,1382.5,1384.4],[1383.1,1385.0,1370.6,1373.7],[1373.1,1383.1,1368.1,1379.4],[1383.7,1389.4,1370.0,1373.7],[1378.7,1378.7,1364.4,1365.0],[1368.1,1379.4,1364.4,1370.6],[1364.4,1372.5,1363.1,1365.0],[1362.5,1378.1,1360.6,1376.9],[1377.5,1396.3,1377.5,1386.9],[1386.9,1389.4,1366.2,1368.7],[1375.0,1380.6,1371.2,1379.4],[1378.7,1388.8,1376.9,1383.7],[1378.7,1378.7,1369.4,1376.2],[1381.9,1388.8,1371.9,1376.9],[1385.0,1385.0,1374.4,1375.6],[1376.2,1401.3,1376.2,1400.0],[1402.5,1423.8,1401.3,1418.8],[1441.3,1474.4,1435.0,1468.8],[1470.0,1474.4,1461.9,1466.3],[1476.9,1483.8,1446.3,1449.4],[1451.3,1460.7,1443.2,1453.8],[1464.4,1486.3,1460.0,1486.3],[1485.7,1492.6,1479.4,1488.8],[1491.3,1508.8,1490.1,1506.3],[1501.9,1503.8,1485.7,1490.1],[1492.6,1498.2,1484.4,1487.6],[1488.2,1495.7,1481.3,1486.3],[1485.7,1493.8,1471.9,1474.4]];
(function(){
  var svg=document.getElementById('stChart'); if(!svg) return;
  var P0=1090,P1=1580, X=function(i){return 14+i*3.92;}, Y=function(p){return 16+(P1-p)/(P1-P0)*390;};
  [1100,1200,1300,1400,1500].forEach(function(v){
    el('line',{x1:0,x2:985,y1:Y(v),y2:Y(v),stroke:'rgba(255,255,255,.06)'},svg);
    var t=el('text',{'class':'ax',x:990,y:Y(v)+4},svg); t.textContent='₹'+v.toLocaleString('en-IN'); });
  el('rect',{id:'stZone',x:0,y:Y(1357),width:985,height:Y(1308)-Y(1357),fill:'#E8735A',opacity:0},svg);
  var g=el('g',{},svg);
  REL.forEach(function(d,i){ candle(g,X(i)-1.3,2.6,Y(d[0]),Y(d[1]),Y(d[2]),Y(d[3]),d[3]>=d[0],'sc'); });
  function mark(id,i,price,txt,col,above){
    var gg=el('g',{id:id,opacity:0},svg), x=X(i), y=Y(price);
    el('circle',{cx:x,cy:y,r:5,fill:col},gg);
    var t=el('text',{'class':'lbl',x:x,y:above?y-12:y+22,fill:col,'text-anchor':'middle'},gg); t.textContent=txt; return gg; }
  mark('mR1',20,1328.7,'₹1,330','#E8735A',true); mark('mR2',51,1323.1,'₹1,326','#E8735A',true); mark('mR3',95,1306.8,'₹1,308','#E8735A',true);
  mark('mBO',116,1375,'Breakout ₹1,368.8','#1DB66A',true); (function(){var t=document.querySelector('#mBO text'); t.setAttribute('text-anchor','end'); t.setAttribute('x',X(116)-10); t.setAttribute('y',Y(1375)-4);})();
  mark('mS1',203,1346.9,'Retest','#1DB66A',false); mark('mS2',227,1360.6,'Retest','#1DB66A',false);
})();

/* ---- hero entrance ---- */
function heroIn(){
  if (!G || RM) return;
  var items=['.eyebrow','.ht-k','.ht-a','.ht-b','.ht-sub','.ht-kn','.hook','.hsub','.pricerow','.p-note','.hcd','.btns','.hmeta'];
  G.from(items.map(function(s){return '.hero '+s;}).join(','),{y:34,opacity:0,duration:.85,stagger:.065,ease:'power3.out',clearProps:'transform,opacity'});
  G.from('.ht-b .candle',{scaleY:0,transformOrigin:'50% 100%',duration:.9,delay:.35,ease:'power3.out'});
  G.from('#bk3',{rotationY:95,rotationX:12,y:90,opacity:0,duration:1.6,ease:'power3.out',delay:.15});
  G.from('.bk3-glow',{opacity:0,scale:.6,duration:1.4,delay:.6});
  G.from('#heroCandles .hb-c',{scaleY:0,opacity:0,transformOrigin:'50% 100%',duration:.5,stagger:.03,delay:.3,ease:'power2.out'});
  G.from('#heroCandles2 .hb-c',{opacity:0,duration:.6,stagger:.012,delay:.5});
  var hk=document.querySelector('.hero .hook'); if (hk){ splitWords(hk);
    G.from(hk.querySelectorAll('.w'),{opacity:0,y:12,filter:'blur(8px)',duration:.7,stagger:.09,delay:.9,ease:'power2.out'}); }
  var sub=document.getElementById('htSub'); if (sub){ var t=sub.textContent; sub.setAttribute('aria-label',t); sub.textContent='';
    for (var i=0;i<t.length;i++){ var sp=document.createElement('span'); sp.className='lt2'; sp.setAttribute('aria-hidden','true'); sp.style.display='inline-block';
      sp.textContent=t[i]===' '?' ':t[i]; sub.appendChild(sp); }
    G.from(sub.querySelectorAll('.lt2'),{opacity:0,y:8,filter:'blur(4px)',duration:.4,stagger:.03,delay:.8}); }
}

/* ---- intro sequence ---- */
(function(){
  var intro=document.getElementById('intro'), seen=false;
  try { seen = sessionStorage.getItem('aop_intro')==='1'; } catch(e){}
  var hasHash = Boolean(location.hash && location.hash.length > 1);
  if (!intro || !G || RM || seen || hasHash){
    document.documentElement.classList.add('no-intro');
    if (intro) intro.style.display = 'none';
    heroIn();
    if (hasHash){
      setTimeout(function(){
        try {
          var target = document.querySelector(location.hash);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch(e){}
      }, 300);
    }
    return;
  }
  try { sessionStorage.setItem('aop_intro','1'); } catch(e){}
  document.documentElement.classList.add('intro-on');
  var pl=intro.querySelector('.pl'), len=pl? pl.getTotalLength():1000;
  if (pl){ pl.style.strokeDasharray=len; pl.style.strokeDashoffset=len; }
  G.set('.in-lock > *, .in-pr, .in-ce',{opacity:0});
  G.set('.in-lock',{opacity:1});
  G.set('.in-b',{opacity:1});
  G.set('.in-c',{scaleY:0,transformOrigin:'50% 100%'});
  G.set('.in-c i',{scaleY:0,transformOrigin:'50% 100%'});
  var tl=G.timeline({onComplete:finish});
  tl.from('.izone',{opacity:0,duration:.5})
    .from('#introChart .ic',{scaleY:0,opacity:0,transformOrigin:'50% 100%',stagger:.045,duration:.3,ease:'power2.out'},'<.1')
    .to(pl,{strokeDashoffset:0,duration:1.5,ease:'none'},'<')
    .from('.in-words span',{opacity:0,y:40,stagger:.18,duration:.7,ease:'power2.out'},'<.2')
    .to('.in-c',{scaleY:1,duration:.55,ease:'power4.out'},'-=.2')
    .to('.in-c i',{scaleY:1,duration:.45,ease:'power3.out'},'-=.15')
    .to('#introChart',{opacity:.14,duration:.5},'<')
    .fromTo('.in-pr',{x:-140,opacity:0},{x:0,opacity:1,duration:.65,ease:'power3.out'},'-=.15')
    .fromTo('.in-ce',{x:140,opacity:0},{x:0,opacity:1,duration:.65,ease:'power3.out'},'<')
    .fromTo('.in-a',{y:-30,opacity:0},{y:0,opacity:1,duration:.5,ease:'power2.out'},'<.2')
    .fromTo('.in-k',{y:16,opacity:0},{y:0,opacity:1,duration:.5},'<.2')
    .to('#intro',{clipPath:'inset(0 0 100% 0)',duration:1,ease:'power4.inOut'},'+=.7')
    .add(function(){ document.documentElement.classList.remove('intro-on'); heroIn(); },'-=.55');
  function finish(){ intro.style.display='none'; document.documentElement.classList.remove('intro-on'); }
  function skip(){ if (tl.progress()<.86) tl.timeScale(4.5); }
  document.getElementById('introSkip').addEventListener('click',function(e){ e.stopPropagation(); tl.progress(.84).timeScale(2); });
  intro.addEventListener('click',skip);
  window.addEventListener('wheel',skip,{passive:true,once:true});
  window.addEventListener('touchstart',skip,{passive:true,once:true});
  window.addEventListener('keydown',skip,{once:true});
})();

/* ---- hero: mouse parallax + book tilt + idle float ---- */
(function(){
  if (!G || RM) return;
  var bk=document.getElementById('bk3'); if(!bk) return;
  G.set(bk,{rotationY:24,rotationX:4,transformPerspective:0});
  var float=G.to('#bkStage',{y:-12,duration:3.2,ease:'sine.inOut',yoyo:true,repeat:-1});
  var ry=G.quickTo(bk,'rotationY',{duration:.9,ease:'power3'}), rx=G.quickTo(bk,'rotationX',{duration:.9,ease:'power3'});
  var l1x=G.quickTo('#heroCandles','x',{duration:1.2,ease:'power3'}), l2x=G.quickTo('#heroCandles2','x',{duration:1.2,ease:'power3'});
  var hero=document.getElementById('hero');
  hero.addEventListener('pointermove',function(e){
    var r=hero.getBoundingClientRect(), dx=(e.clientX-r.left)/r.width-.5, dy=(e.clientY-r.top)/r.height-.5;
    ry(24+dx*22); rx(4-dy*14); l1x(-dx*30); l2x(-dx*70); });
  hero.addEventListener('pointerleave',function(){ ry(24); rx(4); l1x(0); l2x(0); });
})();

/* ---- scroll story: pinned, scrubbed ---- */
(function(){
  var sec=document.getElementById('story'); if(!sec) return;
  var cs=[].slice.call(sec.querySelectorAll('.sc')), caps=[].slice.call(sec.querySelectorAll('.st-cap'));
  if (!G || !ST || RM){ cs.forEach(function(c){c.style.opacity=1;}); caps.forEach(function(c){c.style.position='static';c.style.opacity=1;});
    ['mR1','mR2','mR3','mBO','mS1','mS2'].forEach(function(id){var m=document.getElementById(id); if(m) m.setAttribute('opacity',1);});
    var z=document.getElementById('stZone'); if(z) z.setAttribute('opacity',.18); return; }
  var tl=G.timeline({scrollTrigger:{trigger:sec,start:'top top',end:'+=3200',pin:true,scrub:.6,anticipatePin:1}});
  var q=function(a,b){return cs.slice(a,b);};
  tl.to('.st-prog i',{scaleX:1,ease:'none',duration:9},0);
  tl.to(q(0,101),{opacity:1,stagger:.02,duration:.05},0)
    .to('#stZone',{attr:{opacity:.2},duration:.4},.3)
    .to('#mR1',{attr:{opacity:1},duration:.15},.4).to('#mR2',{attr:{opacity:1},duration:.15},1.0).to('#mR3',{attr:{opacity:1},duration:.15},1.9)
    .to(q(101,118),{opacity:1,stagger:.03,duration:.05},2.05)
    .to('#mBO',{attr:{opacity:1},duration:.2},2.55)
    .to(q(118,180),{opacity:1,stagger:.028,duration:.05},2.75)
    .to(q(180,248),{opacity:1,stagger:.03,duration:.05},4.5)
    .to('#stZone',{attr:{fill:'#1DB66A',opacity:.26},duration:.5},5.4)
    .to('#mS1',{attr:{opacity:1},duration:.2},5.6).to('#mS2',{attr:{opacity:1},duration:.2},6.25);
  var at=[[.15,2.4],[2.5,3.6],[3.7,5.1],[5.2,7.1],[7.2,9]];
  caps.forEach(function(c,i){ G.set(c,{autoAlpha:0,y:16});
    tl.to(c,{autoAlpha:1,y:0,duration:.3},at[i][0]); if(i<caps.length-1) tl.to(c,{autoAlpha:0,y:-12,duration:.25},at[i][1]); });
})();

/* ---- section reveals, counters, h2 word reveals, chart zone sweeps ---- */
(function(){
  var sel='.wy,.md,.mc,.qz,.who,.ed,.pb,.ix-m,.faq details';
  var els=[].slice.call(document.querySelectorAll(sel));
  var counters=[].slice.call(document.querySelectorAll('[data-count]'));
  function count(el){ var to=+el.getAttribute('data-count'), em=el.querySelector('em'), o={v:0};
    if (!G){ return; } G.to(o,{v:to,duration:1.6,ease:'power3.out',onUpdate:function(){ var v=Math.round(o.v); if(em) em.textContent=v; else el.textContent=v; }}); }
  var marks=[].slice.call(document.querySelectorAll('.bk-fig,h2 .sweep'));
  if (!G || !ST || RM){ els.concat(marks).forEach(function(e){e.classList.add('in');}); return; }
  G.set(els,{opacity:0,y:40});
  ST.batch(els,{start:'top 90%',once:true,onEnter:function(b){
    b.forEach(function(e){ e.classList.add('in'); });
    G.fromTo(b,{opacity:0,y:40,rotationX:-10,transformPerspective:900,transformOrigin:'50% 0%'},
      {opacity:1,y:0,rotationX:0,duration:.8,stagger:.09,ease:'power3.out',clearProps:'transform'}); }});
  marks.forEach(function(m){ ST.create({trigger:m,start:'top 82%',once:true,onEnter:function(){ m.classList.add('in'); }}); });
  counters.forEach(function(c){ ST.create({trigger:c,start:'top 92%',once:true,onEnter:function(){ count(c); }}); });
  [].slice.call(document.querySelectorAll('section h2')).forEach(function(h){
    if (h.closest('#story') || h.querySelector('.sweep') || h.classList.contains('ph') || h.classList.contains('bk-title')) return;
    splitWords(h);
    G.from(h.querySelectorAll('.w'),{opacity:0,y:18,filter:'blur(6px)',duration:.6,stagger:.06,ease:'power2.out',
      scrollTrigger:{trigger:h,start:'top 88%',once:true}}); });
  /* ticker speeds up a little with scroll velocity */
  var tk=document.querySelector('.tk-track');
  if (tk){ tk.style.animation='none'; var tw=G.to(tk,{xPercent:-50,ease:'none',duration:48,repeat:-1});
    ST.create({onUpdate:function(self){ var v=Math.min(4,1+Math.abs(self.getVelocity())/600); G.to(tw,{timeScale:v,duration:.3,overwrite:true}); G.to(tw,{timeScale:1,duration:1.2,delay:.3}); }}); }
  window.addEventListener('load',function(){ ST.refresh(); });
})();

(function(){
  var qs=[].slice.call(document.querySelectorAll('.qz')), done=0, good=0;
  qs.forEach(function(q){
    q.querySelectorAll('.qz-o button').forEach(function(btn){
      btn.addEventListener('click',function(){
        if (q.classList.contains('done')) return;
        var ans=q.getAttribute('data-ans'), ok=btn.getAttribute('data-v')===ans;
        q.querySelectorAll('.qz-o button').forEach(function(b){ b.disabled=true;
          if (b.getAttribute('data-v')===ans) b.classList.add('right'); });
        btn.classList.add('pick'); if(!ok) btn.classList.add('wrong');
        q.classList.add('done', ok?'good':'bad'); done++; if(ok) good++;
        if (done===qs.length){ var end=document.getElementById('qzEnd'); end.hidden=false;
          document.getElementById('qzScore').textContent=(T.quizScore||'{g} / 3').replace('{g}',good); }
      });
    });
  });
})();
