// middleware/upload.js
// -----------------------------------------------------------------------
// Multer configuration for product / avatar / blog image uploads.
// Files are streamed straight to Cloudinary, so nothing touches the local
// disk (Vercel's filesystem is ephemeral). req.file.path / f.path hold the
// permanent https:// Cloudinary URL.
// -----------------------------------------------------------------------
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: 'sisfora/uploads',
    resource_type: 'image',
    public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
});

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const isValidExt = allowed.test(path.extname(file.originalname).toLowerCase());
  const isValidMime = allowed.test(file.mimetype);
  if (isValidExt && isValidMime) return cb(null, true);
  cb(new Error('Only image files (jpg, png, webp, gif, svg) are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
