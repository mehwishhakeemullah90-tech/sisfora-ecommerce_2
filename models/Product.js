// models/Product.js
// -----------------------------------------------------------------------
// Core product catalog item. Supports gallery images, discount pricing,
// brand/category filtering, stock tracking, ratings (denormalised for
// fast reads) and flags used across Best Sellers / New Arrivals / Offers.
// -----------------------------------------------------------------------
const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, unique: true, lowercase: true },
    brand: { type: String, required: true, trim: true, default: 'Sisfora' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200 },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: 0 }, // 0 = no discount
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    images: {
      type: [String],
      default: ['/images/products/placeholder.svg'],
    },
    thumbnail: { type: String, default: '/images/products/placeholder.svg' },
    tags: [{ type: String, trim: true, lowercase: true }],
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 }, // used to auto-rank best sellers
  },
  { timestamps: true }
);

// Virtual: discount percentage (computed, not stored)
productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Virtual: the price the customer actually pays
productSchema.virtual('finalPrice').get(function finalPrice() {
  return this.discountPrice && this.discountPrice > 0 ? this.discountPrice : this.price;
});

// Virtual: linked reviews (not embedded, kept in their own collection)
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.pre('save', function generateSlug(next) {
  if (this.isModified('name')) {
    this.slug = `${slugify(this.name, { lower: true, strict: true })}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
  }
  next();
});

// Text index for search-by-keyword
productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
