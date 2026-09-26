// config/storefront.js
// -----------------------------------------------------------------------
// Site-wide storefront settings — the ONE place to edit contact details,
// social links and which product categories are live.
//
// Used by the server (search, product listings, emails) and sent to the
// browser as /js/site-config.js (read by public/js/layout.js).
// -----------------------------------------------------------------------
module.exports = {
  // TODO: replace with the real Sisfora email address once shared
  email: 'hello@sisfora.com',
  phone: '+92 300 1234567',

  // Social links — leave a link empty ('') to hide that icon in the footer.
  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
    pinterest: '',
  },

  // Product categories. Set live: true when a category launches.
  // Hidden categories disappear from menus, search and listings, but
  // their pages and products are kept (nothing is deleted).
  categories: [
    { name: 'Skincare', slug: 'skincare', live: true },
    { name: 'Makeup', slug: 'makeup', live: false },
    { name: 'Fragrance', slug: 'fragrance', live: false },
    { name: 'Body Care', slug: 'body-care', live: false },
    { name: 'Hair Care', slug: 'haircare', live: false },
    { name: 'Gift Sets', slug: 'gift-sets', live: false },
  ],

  // Currency. Product prices, coupons and shipping charges are STORED in
  // US Dollars (the database is unchanged) and SHOWN to customers in
  // Pakistani Rupees using this ONE exchange rate — the only place it is set.
  //   Shown price = stored USD price × usdToPkr
  //   e.g. $20.00 × 280 = Rs. 5,600
  // Change usdToPkr here and every price on the site updates.
  currency: {
    code: 'PKR',        // also the currency Stripe charges in
    symbol: 'Rs.',
    usdToPkr: 280,      // 1 US Dollar = 280 Pakistani Rupees
  },

  // Small promo pop-up in the corner of every page. Set text to '' to turn it off.
  // {freeShipping} is replaced with the free-shipping amount in Rupees.
  promo: {
    text: 'Free delivery on orders over {freeShipping} across Pakistan',
    linkText: 'Shop now',
    link: '/categories/skincare',
  },

  // Newsletter sign-up message in the footer. If you run a sign-up offer
  // (e.g. 10% off), create the coupon in Admin → Coupons and mention it here.
  newsletterIncentive: 'Sign up for early access to new launches and members-only offers.',

  // Tawk.to live chat (https://www.tawk.to). From the Tawk.to dashboard:
  // Administration → Chat Widget → the link looks like
  // https://embed.tawk.to/<propertyId>/<widgetId>. Leave propertyId '' to turn chat off.
  tawk: {
    propertyId: '',
    widgetId: 'default',
  },

  // Shipping charges in USD (shown in Rs. using currency.usdToPkr above).
  // Used by checkout, the cart page and the Shipping page.
  freeShippingThreshold: 50,
  shippingFlatRate: 5.99,
};
