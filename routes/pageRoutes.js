// routes/pageRoutes.js
// -----------------------------------------------------------------------
// Serves HTML pages for the public storefront.
// Dynamic data is loaded client-side by the JS files in /public/js/.
// -----------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const path = require('path');
const { protect } = require('../middleware/auth');

function sendPage(page) {
  return (req, res) => res.sendFile(path.join(__dirname, '..', 'public', page));
}

// Home
router.get('/', sendPage('index.html'));

// About
router.get('/about', sendPage('about.html'));

// Shop
router.get('/shop', sendPage('shop.html'));

// Product Details — product-details.js fetches the product from /api/products/:slug
router.get('/product/:slug', sendPage('product-details.html'));

// Categories
router.get('/categories', sendPage('categories.html'));
router.get('/categories/:slug', sendPage('shop.html')); // shop page reads slug from URL

// Collections
router.get('/best-sellers', sendPage('best-sellers.html'));
router.get('/new-arrivals', sendPage('new-arrivals.html'));
router.get('/offers', sendPage('offers.html'));

// Blog
router.get('/blog', sendPage('blog.html'));
router.get('/blog/:slug', sendPage('blog-details.html')); // blog-details.html fetches post from API

// Info pages
router.get('/contact', sendPage('contact.html'));
router.get('/faq', sendPage('faq.html'));
router.get('/privacy-policy', sendPage('privacy-policy.html'));
router.get('/terms', sendPage('terms.html'));

// Auth — redirect to home if already logged in
router.get('/login', (req, res) => {
  if (req.cookies.token) return res.redirect('/');
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});
router.get('/register', (req, res) => {
  if (req.cookies.token) return res.redirect('/');
  res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});
router.get('/forgot-password', sendPage('forgot-password.html'));
router.get('/reset-password/:token', sendPage('reset-password.html'));

// User account (protected — middleware redirects to /login if not authenticated)
router.get('/profile', protect, sendPage('profile.html'));
router.get('/cart', sendPage('cart.html'));
router.get('/checkout', protect, sendPage('checkout.html'));
router.get('/order-confirmation/:id', protect, sendPage('order-confirmation.html'));

module.exports = router;
