// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  searchProducts,
} = require('../controllers/productController');
const { addReview, getProductReviews } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');
const Product = require('../models/Product');
const { getLiveCategoryIds, isAdminRequest } = require('../utils/liveCategories');

router.get('/', getProducts);
router.get('/search', searchProducts); // must stay above '/:slug'
router.get('/id/:id', protect, adminOnly, getProductById);

// Returns the list of distinct brand names — used by the shop filter sidebar
router.get('/brands', async (req, res) => {
  try {
    // Customers only see brands from live categories (config/storefront.js)
    const filter = isAdminRequest(req) ? {} : { isActive: true, category: { $in: await getLiveCategoryIds() } };
    const brands = await Product.distinct('brand', filter);
    res.json({ success: true, brands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Product details for a list of ids — used by the guest wishlist page
router.get('/by-ids', async (req, res) => {
  try {
    const ids = String(req.query.ids || '').split(',').filter((id) => /^[a-f0-9]{24}$/i.test(id)).slice(0, 100);
    const filter = { _id: { $in: ids }, isActive: true };
    if (!isAdminRequest(req)) filter.category = { $in: await getLiveCategoryIds() };
    const products = await Product.find(filter).populate('category', 'name slug');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:slug', getProductBySlug);

router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Nested review routes
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', protect, addReview);

module.exports = router;
