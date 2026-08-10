// routes/reviewRoutes.js
// Standalone review routes (delete/moderate) — creation & listing are
// nested under /api/products/:productId/reviews (see productRoutes.js)
const express = require('express');
const router = express.Router();
const { deleteReview, getAllReviews, toggleApproveReview } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getAllReviews);
router.delete('/:id', protect, deleteReview);
router.put('/:id/approve', protect, adminOnly, toggleApproveReview);

module.exports = router;
