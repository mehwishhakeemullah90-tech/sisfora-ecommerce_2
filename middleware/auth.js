// middleware/auth.js
// -----------------------------------------------------------------------
// Route-protection middleware.
//   protect      -> must be logged in (valid JWT, from cookie OR Bearer header)
//   adminOnly    -> must be logged in AND role === 'admin'
//   attachUser   -> attaches req.user / res.locals.user if a valid token
//                   exists, but does NOT block the request (used on public
//                   pages that render differently for logged-in users)
// -----------------------------------------------------------------------
const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User');

function getTokenFromRequest(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

const attachUser = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) {
      req.user = null;
    }
  }
  res.locals.user = req.user || null;
  next();
});

const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).json({ success: false, message: 'Not authorized, please log in' });
    }
    if (req.originalUrl.startsWith('/admin')) {
      return res.redirect('/admin/login');
    }
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user || !req.user.isActive) throw new Error('User not found or inactive');
    res.locals.user = req.user;
    next();
  } catch (err) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
    }
    if (req.originalUrl.startsWith('/admin')) {
      return res.redirect('/admin/login');
    }
    return res.redirect('/login');
  }
});

const adminOnly = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }
    return res.redirect('/admin/login');
  }
  next();
});

module.exports = { protect, adminOnly, attachUser };
