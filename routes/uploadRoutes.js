// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { uploadImage, uploadImages } = require('../controllers/uploadController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, adminOnly, upload.single('image'), uploadImage);
router.post('/multiple', protect, adminOnly, upload.array('images', 6), uploadImages);

module.exports = router;
