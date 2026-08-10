// controllers/authController.js
// -----------------------------------------------------------------------
// Register, Login, Logout, Forgot/Reset Password, Change Password.
// Works for both the JSON API (fetch calls from the frontend JS) and can
// be reused by server-rendered form posts.
// -----------------------------------------------------------------------
const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  const user = await User.create({ name, email, password, phone });
  generateToken(res, user._id);

  res.status(201).json({
    success: true,
    message: `Welcome to Sisfora, ${user.name}!`,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'This account has been deactivated' });
  }

  generateToken(res, user._id);
  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Admin login (same as login but requires role === admin)
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate that both fields were provided before calling .toLowerCase()
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  generateToken(res, user._id);
  res.json({ success: true, message: 'Welcome back, Admin', user: { id: user._id, name: user.name, role: user.role } });
});

// @desc    Logout (clear cookie)
// @route   POST /api/auth/logout
// @access  Public
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get currently logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @desc    Forgot password - generates reset token & "sends" email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });

  // Always respond success (don't leak which emails are registered)
  const genericMessage = 'If an account with that email exists, a reset link has been sent.';
  if (!user) return res.json({ success: true, message: genericMessage });

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;
  const html = `
    <h2>Sisfora Password Reset</h2>
    <p>Hi ${user.name}, click the link below to reset your password. This link expires in 30 minutes.</p>
    <a href="${resetUrl}">${resetUrl}</a>
  `;

  try {
    await sendEmail({ to: user.email, subject: 'Sisfora - Password Reset Request', html });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, message: 'Email could not be sent' });
  }

  res.json({ success: true, message: genericMessage });
});

// @desc    Reset password using token from email
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }
  if (!req.body.password || req.body.password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  generateToken(res, user._id);
  res.json({ success: true, message: 'Password reset successful. You are now logged in.' });
});

// @desc    Change password (while logged in)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});
