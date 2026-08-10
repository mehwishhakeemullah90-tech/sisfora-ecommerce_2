// routes/adminPageRoutes.js
// -----------------------------------------------------------------------
// Server-rendered admin dashboard pages. All data-loading for tables is
// done client-side against /api/admin/* and /api/* endpoints (see
// public/js/admin.js) to keep this layer thin; these routes just gate
// access and render the shell for each screen.
// -----------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

const STORE = process.env.STORE_NAME || 'Sisfora';

// Use the admin-specific layout for all admin pages.
// express-ejs-layouts reads res.locals.layout; individual render() calls
// that pass { layout: false } (like the login page) still override this.
router.use((req, res, next) => {
  res.locals.layout = 'partials/admin-layout';
  next();
});

router.get('/login', (req, res) => {
  res.render('admin/login', { title: `Admin Login | ${STORE}`, layout: false });
});

router.get('/', protect, adminOnly, (req, res) => res.redirect('/admin/dashboard'));

router.get('/dashboard', protect, adminOnly, (req, res) => {
  res.render('admin/dashboard', { title: `Dashboard | ${STORE} Admin`, page: 'dashboard' });
});

router.get('/products', protect, adminOnly, (req, res) => {
  res.render('admin/products', { title: `Manage Products | ${STORE} Admin`, page: 'products' });
});

router.get('/categories', protect, adminOnly, (req, res) => {
  res.render('admin/categories', { title: `Manage Categories | ${STORE} Admin`, page: 'categories' });
});

router.get('/orders', protect, adminOnly, (req, res) => {
  res.render('admin/orders', { title: `Manage Orders | ${STORE} Admin`, page: 'orders' });
});

router.get('/customers', protect, adminOnly, (req, res) => {
  res.render('admin/customers', { title: `Manage Customers | ${STORE} Admin`, page: 'customers' });
});

router.get('/reviews', protect, adminOnly, (req, res) => {
  res.render('admin/reviews', { title: `Manage Reviews | ${STORE} Admin`, page: 'reviews' });
});

router.get('/coupons', protect, adminOnly, (req, res) => {
  res.render('admin/coupons', { title: `Manage Coupons | ${STORE} Admin`, page: 'coupons' });
});

router.get('/reports', protect, adminOnly, (req, res) => {
  res.render('admin/reports', { title: `Sales Reports | ${STORE} Admin`, page: 'reports' });
});

module.exports = router;
