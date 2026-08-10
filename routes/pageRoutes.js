// routes/pageRoutes.js
// -----------------------------------------------------------------------
// Server-rendered (EJS) page routes for the public storefront. These
// handle SEO-friendly page loads; the pages themselves then use the
// JSON API (public/js/*.js) for interactive bits like add-to-cart,
// wishlist toggling, filtering, etc.
// -----------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Blog = require('../models/Blog');
const { protect } = require('../middleware/auth');

const STORE = process.env.STORE_NAME || 'Sisfora';

// Home
router.get('/', asyncHandler(async (req, res) => {
  const [featured, bestSellers, newArrivals, offers, categories] = await Promise.all([
    Product.find({ isFeatured: true, isActive: true }).limit(8),
    Product.find({ isBestSeller: true, isActive: true }).limit(8),
    Product.find({ isNewArrival: true, isActive: true }).sort({ createdAt: -1 }).limit(8),
    Product.find({ discountPrice: { $gt: 0 }, isActive: true }).limit(4),
    Category.find().limit(6),
  ]);
  res.render('home', {
    title: `${STORE} | Reveal Your Natural Beauty`,
    metaDescription: 'Discover Sisfora — luxury cosmetics crafted to reveal your natural beauty. Shop skincare, makeup, fragrance & more.',
    featured, bestSellers, newArrivals, offers, categories,
  });
}));

// About Us
router.get('/about', (req, res) => {
  res.render('about', { title: `About Us | ${STORE}`, metaDescription: 'Learn the Sisfora story — our mission, values, and commitment to clean, luxury beauty.' });
});

// Shop (with filters via query params, read client-side too)
router.get('/shop', asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  const brands = await Product.distinct('brand');
  res.render('shop', { title: `Shop All | ${STORE}`, metaDescription: 'Shop the full Sisfora collection of luxury cosmetics.', categories, brands });
}));

// Product Details
router.get('/product/:slug', asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug');
  if (!product) return res.status(404).render('404', { title: 'Product Not Found' });
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  }).limit(4);
  res.render('product-details', {
    title: `${product.name} | ${STORE}`,
    metaDescription: product.shortDescription || product.description.slice(0, 150),
    product,
    related,
  });
}));

// Categories overview
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.render('categories', { title: `Categories | ${STORE}`, metaDescription: 'Browse Sisfora products by category.', categories });
}));

// Single category (reuses shop layout, pre-filtered)
router.get('/categories/:slug', asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) return res.status(404).render('404', { title: 'Category Not Found' });
  const categories = await Category.find().sort({ name: 1 });
  const brands = await Product.distinct('brand');
  res.render('shop', {
    title: `${category.name} | ${STORE}`,
    metaDescription: category.description || `Shop ${category.name} at Sisfora.`,
    categories, brands, presetCategory: category.slug, categoryName: category.name,
  });
}));

// Best Sellers
router.get('/best-sellers', (req, res) => {
  res.render('best-sellers', { title: `Best Sellers | ${STORE}`, metaDescription: 'Shop Sisfora’s most-loved, best-selling beauty products.' });
});

// New Arrivals
router.get('/new-arrivals', (req, res) => {
  res.render('new-arrivals', { title: `New Arrivals | ${STORE}`, metaDescription: 'Discover the newest additions to the Sisfora collection.' });
});

// Offers & Discounts
router.get('/offers', (req, res) => {
  res.render('offers', { title: `Offers & Discounts | ${STORE}`, metaDescription: 'Save on your favorite Sisfora products with our latest offers.' });
});

// Blog
router.get('/blog', asyncHandler(async (req, res) => {
  const posts = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });
  res.render('blog', { title: `Beauty Journal | ${STORE}`, metaDescription: 'Beauty tips, tutorials, and stories from the Sisfora team.', posts });
}));

router.get('/blog/:slug', asyncHandler(async (req, res) => {
  const post = await Blog.findOne({ slug: req.params.slug, isPublished: true });
  if (!post) return res.status(404).render('404', { title: 'Post Not Found' });
  const recent = await Blog.find({ isPublished: true, _id: { $ne: post._id } }).sort({ createdAt: -1 }).limit(3);
  res.render('blog-details', { title: `${post.title} | ${STORE}`, metaDescription: post.excerpt, post, recent });
}));

// Contact
router.get('/contact', (req, res) => {
  res.render('contact', { title: `Contact Us | ${STORE}`, metaDescription: 'Get in touch with the Sisfora team.' });
});

// FAQ
router.get('/faq', (req, res) => {
  res.render('faq', { title: `FAQ | ${STORE}`, metaDescription: 'Answers to frequently asked questions about Sisfora orders, shipping, and returns.' });
});

// Privacy Policy
router.get('/privacy-policy', (req, res) => {
  res.render('privacy-policy', { title: `Privacy Policy | ${STORE}`, metaDescription: 'Sisfora’s privacy policy.' });
});

// Terms & Conditions
router.get('/terms', (req, res) => {
  res.render('terms', { title: `Terms & Conditions | ${STORE}`, metaDescription: 'Sisfora’s terms and conditions.' });
});

// Auth pages
router.get('/login', (req, res) => {
  if (req.cookies.token) return res.redirect('/');
  res.render('auth/login', { title: `Login | ${STORE}`, metaDescription: 'Log in to your Sisfora account.', redirect: req.query.redirect || '/' });
});
router.get('/register', (req, res) => {
  if (req.cookies.token) return res.redirect('/');
  res.render('auth/register', { title: `Create Account | ${STORE}`, metaDescription: 'Create your Sisfora account.' });
});
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { title: `Forgot Password | ${STORE}`, metaDescription: 'Reset your Sisfora account password.' });
});
router.get('/reset-password/:token', (req, res) => {
  res.render('auth/reset-password', { title: `Reset Password | ${STORE}`, metaDescription: 'Choose a new password.', token: req.params.token });
});

// User account (protected)
router.get('/profile', protect, (req, res) => {
  res.render('profile', { title: `My Account | ${STORE}`, metaDescription: 'Manage your Sisfora account.', activeTab: req.query.tab || 'overview' });
});

// Cart & Checkout
router.get('/cart', (req, res) => {
  res.render('cart', { title: `Shopping Cart | ${STORE}`, metaDescription: 'Review items in your Sisfora shopping cart.' });
});
router.get('/checkout', protect, (req, res) => {
  res.render('checkout', {
    title: `Checkout | ${STORE}`,
    metaDescription: 'Complete your Sisfora order securely.',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  });
});
router.get('/order-confirmation/:id', protect, (req, res) => {
  res.render('order-confirmation', { title: `Order Confirmed | ${STORE}`, metaDescription: 'Your Sisfora order confirmation.', orderId: req.params.id });
});

module.exports = router;
