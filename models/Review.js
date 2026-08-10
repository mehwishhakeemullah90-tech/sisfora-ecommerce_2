// models/Review.js
// -----------------------------------------------------------------------
// Product reviews & star ratings, one per user per product. After every
// save/remove we recalculate the parent product's ratingsAverage/Count.
// -----------------------------------------------------------------------
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }, // snapshot of reviewer name
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    comment: { type: String, required: true, trim: true },
    isApproved: { type: Boolean, default: true }, // admin can moderate
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static: recompute the average rating & count on the linked Product.
reviewSchema.statics.recalculateProductRatings = async function recalculateProductRatings(productId) {
  const Product = mongoose.model('Product');
  const stats = await this.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
      ratingsCount: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratingsAverage: 0, ratingsCount: 0 });
  }
};

reviewSchema.post('save', function afterSave() {
  this.constructor.recalculateProductRatings(this.product);
});

reviewSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) doc.constructor.recalculateProductRatings(doc.product);
});

module.exports = mongoose.model('Review', reviewSchema);
