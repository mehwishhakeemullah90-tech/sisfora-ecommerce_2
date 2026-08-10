// controllers/couponController.js
const asyncHandler = require('../middleware/asyncHandler');
const Coupon = require('../models/Coupon');

// @desc    Validate & apply a coupon code against a subtotal
// @route   POST /api/coupons/apply
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code: (code || '').toUpperCase().trim() });

  if (!coupon || !coupon.isValid()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
  }
  if (subtotal < coupon.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `This coupon requires a minimum order of $${coupon.minOrderAmount.toFixed(2)}`,
    });
  }

  let discountAmount =
    coupon.discountType === 'percentage' ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;

  if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  discountAmount = Math.min(discountAmount, subtotal); // never exceed order total

  res.json({
    success: true,
    code: coupon.code,
    discountAmount: Math.round(discountAmount * 100) / 100,
    message: `Coupon "${coupon.code}" applied!`,
  });
});

// ---------------- Admin CRUD ----------------

// @desc    List all coupons
// @route   GET /api/coupons
// @access  Private/Admin
exports.getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.json({ success: true, coupon });
});

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.json({ success: true, message: 'Coupon deleted' });
});
