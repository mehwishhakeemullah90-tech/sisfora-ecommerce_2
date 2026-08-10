// models/Category.js
// -----------------------------------------------------------------------
// Product categories (e.g. Skincare, Makeup, Fragrance, Haircare).
// -----------------------------------------------------------------------
const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true },
    image: { type: String, default: '/images/products/placeholder.svg' },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

categorySchema.pre('save', function generateSlug(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
