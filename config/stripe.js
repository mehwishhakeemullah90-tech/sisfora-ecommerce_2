// config/stripe.js
// -----------------------------------------------------------------------
// Centralised Stripe client (test mode by default via STRIPE_SECRET_KEY).
// -----------------------------------------------------------------------
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

module.exports = stripe;
