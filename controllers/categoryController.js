// controllers/categoryController.js
const asyncHandler = require('../middleware/asyncHandler');
const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    List all categories (with product counts)
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  const withCounts = await Promise.all(
    categories.map(async (cat) => {
      const count = await Product.countDocuments({ category: cat._id, isActive: true });
      return { ...cat.toObject(), productCount: count };
    })
  );
  res.json({ success: true, categories: withCounts });
});

// @desc    Get single category by slug + its products
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  const products = await Product.find({ category: category._id, isActive: true });
  res.json({ success: true, category, products });
});

// @desc    Create category (admin)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
});

// @desc    Update category (admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, category });
});

// @desc    Delete category (admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    return res.status(400).json({ success: false, message: `Cannot delete: ${inUse} product(s) use this category` });
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, message: 'Category deleted' });
});
