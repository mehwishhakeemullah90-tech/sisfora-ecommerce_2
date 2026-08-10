// controllers/blogController.js
const asyncHandler = require('../middleware/asyncHandler');
const Blog = require('../models/Blog');

// @desc    List published blog posts
// @route   GET /api/blog
// @access  Public
exports.getPosts = asyncHandler(async (req, res) => {
  const posts = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });
  res.json({ success: true, count: posts.length, posts });
});

// @desc    Get single post by slug
// @route   GET /api/blog/:slug
// @access  Public
exports.getPostBySlug = asyncHandler(async (req, res) => {
  const post = await Blog.findOne({ slug: req.params.slug, isPublished: true });
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  const recent = await Blog.find({ isPublished: true, _id: { $ne: post._id } }).sort({ createdAt: -1 }).limit(3);
  res.json({ success: true, post, recent });
});

// ---------------- Admin ----------------
exports.createPost = asyncHandler(async (req, res) => {
  const post = await Blog.create(req.body);
  res.status(201).json({ success: true, post });
});

exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  res.json({ success: true, post });
});

exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Blog.findByIdAndDelete(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  res.json({ success: true, message: 'Post deleted' });
});
