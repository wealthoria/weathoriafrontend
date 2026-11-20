/* =====================================================================
   THE ART OF PRICE: one config for both editions.
   Edit ONLY this file to change SKUs, prices, dates or checkout mode.
   (Prices shown in the page text must match `price` / `mrp` below;
   the page warns in the browser console if they don't.)
   ===================================================================== */
window.AOP_CONFIG = {

  /* Pre-booking window (IST). Same for both editions. */
  launch: '2026-11-23T00:00:00+05:30',
  close:  '2026-12-12T23:59:59+05:30',

  /* Checkout mode:
       'stub'     : no payment yet, shows a "checkout not connected" popup (testing only)
       'link'     : sends the buyer to the edition's Razorpay Payment Page / Payment Link
                    (simplest: create ONE payment page per SKU in Razorpay, paste URLs below)
       'razorpay' : Razorpay Checkout popup using the included Netlify functions
                    (/api/create-order + /api/verify-payment). Needs env vars, see README. */
  checkout: {
    mode: 'stub',
    razorpayKeyId: '',                      // rzp_live_xxx (public key id only, never the secret)
    orderEndpoint: '/api/create-order',
    verifyEndpoint: '/api/verify-payment',
    brandName: 'Wealthoria',
    themeColor: '#1DB66A'
  },

  /* One product per edition. Each has its own SKU so sales are tracked separately
     in Razorpay (notes.sku), Google Analytics (item_id) and Meta Pixel (content_ids). */
  products: {
    kn: {
      sku: 'AOP-KN-PB26',
      name: 'The Art of Price (Kannada Edition) - Pre-booking',
      language: 'Kannada',
      price: 999,
      mrp: 1499,
      currency: 'INR',
      paymentLink: '',                      // e.g. https://rzp.io/rzp/xxxxKN  (mode 'link')
      path: 'kn/'
    },
    en: {
      sku: 'AOP-EN-PB26',
      name: 'The Art of Price (English Edition) - Pre-booking',
      language: 'English',
      price: 999,
      mrp: 1499,
      currency: 'INR',
      paymentLink: '',                      // e.g. https://rzp.io/rzp/xxxxEN  (mode 'link')
      path: 'en/'
    }
  }
};
