// models/Coupon.js
// -----------------------------------------------------------------------
// Discount coupon codes applied at checkout. Supports fixed or percentage
// discounts, usage limits, per-user tracking and expiry dates.
// -----------------------------------------------------------------------
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number }, // caps percentage discounts
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Instance helper: is this coupon currently redeemable?
couponSchema.methods.isValid = function isValid() {
  return this.isActive && this.usedCount < this.usageLimit && this.expiresAt > new Date();
};

module.exports = mongoose.model('Coupon', couponSchema);
