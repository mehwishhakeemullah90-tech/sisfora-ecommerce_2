// controllers/uploadController.js
// -----------------------------------------------------------------------
// Handles image upload responses (multer has already uploaded the file to
// Cloudinary by the time this runs — see middleware/upload.js; `file.path`
// is the Cloudinary URL).
// -----------------------------------------------------------------------

// @desc    Upload a single image, return its public URL
// @route   POST /api/uploads
// @access  Private/Admin
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.status(201).json({ success: true, url: req.file.path });
};

// @desc    Upload multiple images (product gallery), return public URLs
// @route   POST /api/uploads/multiple
// @access  Private/Admin
exports.uploadImages = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  const urls = req.files.map((f) => f.path);
  res.status(201).json({ success: true, urls });
};
