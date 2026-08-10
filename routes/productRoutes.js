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

router.get('/', getProducts);
router.get('/id/:id', protect, adminOnly, getProductById);
router.get('/:slug', getProductBySlug);

router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Nested review routes
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', protect, addReview);

module.exports = router;
