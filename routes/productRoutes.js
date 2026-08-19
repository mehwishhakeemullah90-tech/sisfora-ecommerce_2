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
} = require('../controllers/productController');
const { addReview, getProductReviews } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');
const Product = require('../models/Product');

router.get('/', getProducts);
router.get('/id/:id', protect, adminOnly, getProductById);

// Returns the list of distinct brand names — used by the shop filter sidebar
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand');
    res.json({ success: true, brands });
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
