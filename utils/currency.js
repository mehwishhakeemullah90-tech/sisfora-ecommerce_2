// utils/currency.js
// -----------------------------------------------------------------------
// Server-side price formatting. Prices are STORED in US Dollars and SHOWN
// in Pakistani Rupees using the single rate in config/storefront.js.
// (The browser does the same with sfCurrency() in public/js/utils.js,
// reading the same rate via /js/site-config.js.)
// -----------------------------------------------------------------------
const { currency } = require('../config/storefront');

/** Converts a stored USD amount to Rupees, e.g. 20 -> 5600 */
function usdToPkr(amountUsd) {
  return Number(amountUsd || 0) * currency.usdToPkr;
}

/** Formats a stored USD amount for customers, e.g. 20 -> "Rs. 5,600" */
function formatPrice(amountUsd) {
  const rupees = Math.round(usdToPkr(amountUsd)); // Rupees are shown without paisa
  return `${currency.symbol} ${rupees.toLocaleString('en-US')}`;
}

module.exports = { usdToPkr, formatPrice };
