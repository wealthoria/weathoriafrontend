/* =====================================================================
   THE ART OF PRICE: Central configuration for both editions.
   ===================================================================== */
window.AOP_CONFIG = {
  launch: '2026-11-23T00:00:00+05:30',
  close:  '2026-12-12T23:59:59+05:30',
  apiBase: 'https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api',

  checkout: {
    mode: 'wealthoria',
    keyId: 'rzp_live_TgapWXBpVsHDBm',
    brandName: 'Wealthoria',
    themeColor: '#1DB66A'
  },

  products: {
    kn: {
      sku: 'THE-ART-OF-PRICE-KN-EDITION',
      name: 'The Art of Price (ದಿ ಆರ್ಟ್ ಆಫ್ ಪ್ರೈಸ್ - ಕನ್ನಡ)',
      titleKn: 'ದಿ ಆರ್ಟ್ ಆಫ್ ಪ್ರೈಸ್ (ಕನ್ನಡ ಆವೃತ್ತಿ)',
      language: 'Kannada',
      edition: 'kannada',
      price: 999, // Normal price ₹999
      displayPrice: 999,
      mrp: 1499,
      currency: 'INR',
      path: 'kn/'
    },
    en: {
      sku: 'THE-ART-OF-PRICE-EN-EDITION',
      name: 'The Art of Price (English Edition)',
      titleEn: 'The Art of Price (English Edition)',
      language: 'English',
      edition: 'english',
      price: 999, // Normal price ₹999
      displayPrice: 999,
      mrp: 1499,
      currency: 'INR',
      path: 'en/'
    }
  }
};
