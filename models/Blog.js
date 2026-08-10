// models/Blog.js
// -----------------------------------------------------------------------
// Blog posts for beauty tips / brand storytelling (SEO content marketing).
// -----------------------------------------------------------------------
const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    excerpt: { type: String, maxlength: 300 },
    content: { type: String, required: true },
    coverImage: { type: String, default: '/images/products/placeholder.svg' },
    author: { type: String, default: 'Sisfora Team' },
    tags: [{ type: String, trim: true, lowercase: true }],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

blogSchema.pre('save', function generateSlug(next) {
  if (this.isModified('title')) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
