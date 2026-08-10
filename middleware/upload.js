// middleware/upload.js
// -----------------------------------------------------------------------
// Multer configuration for product / avatar / blog image uploads.
// Files are stored on disk under public/uploads so they can be served
// statically. In production you'd typically swap the storage engine for
// an S3 / Cloudinary adapter — the rest of the app just needs a URL back.
// -----------------------------------------------------------------------
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
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
