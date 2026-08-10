// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const { getPosts, getPostBySlug, createPost, updatePost, deletePost } = require('../controllers/blogController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getPosts);
router.get('/:slug', getPostBySlug);
router.post('/', protect, adminOnly, createPost);
router.put('/:id', protect, adminOnly, updatePost);
router.delete('/:id', protect, adminOnly, deletePost);

module.exports = router;
