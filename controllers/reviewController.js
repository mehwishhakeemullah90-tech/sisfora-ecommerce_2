// controllers/reviewController.js
const asyncHandler = require('../middleware/asyncHandler');
const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Add a review to a product
// @route   POST /api/products/:productId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const alreadyReviewed = await Review.findOne({ product: product._id, user: req.user._id });
  if (alreadyReviewed) {
    return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
  }

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    name: req.user.name,
    rating,
    title,
    comment,
  });

  res.status(201).json({ success: true, review });
});

// @desc    Get all reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

// @desc    Delete a review (owner or admin)
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  const isOwner = review.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
  }

  await Review.findOneAndDelete({ _id: review._id });
  res.json({ success: true, message: 'Review deleted' });
});

// @desc    List all reviews (admin moderation)
// @route   GET /api/reviews
// @access  Private/Admin
exports.getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('user', 'name email')
    .populate('product', 'name slug thumbnail')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

// @desc    Toggle approval on a review (admin)
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
exports.toggleApproveReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  review.isApproved = !review.isApproved;
  await review.save();
  res.json({ success: true, review });
});
