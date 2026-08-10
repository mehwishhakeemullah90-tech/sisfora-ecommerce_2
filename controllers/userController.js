// controllers/userController.js
// -----------------------------------------------------------------------
// Customer profile management: view/update profile, manage saved
// shipping addresses, and wishlist. Also admin customer management.
// -----------------------------------------------------------------------
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Update own profile (name, phone, avatar)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (avatar) user.avatar = avatar;
  await user.save();
  res.json({ success: true, user });
});

// @desc    Add a shipping address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});

// @desc    Update a shipping address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

  if (req.body.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  Object.assign(address, req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// @desc    Delete a shipping address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.pull({ _id: req.params.addressId });
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// @desc    Get wishlist (populated)
// @route   GET /api/users/wishlist
// @access  Private
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json({ success: true, wishlist: user.wishlist });
});

// @desc    Toggle a product in the wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const user = await User.findById(req.user._id);
  const index = user.wishlist.findIndex((id) => id.toString() === req.params.productId);
  let added;
  if (index > -1) {
    user.wishlist.splice(index, 1);
    added = false;
  } else {
    user.wishlist.push(req.params.productId);
    added = true;
  }
  await user.save();
  res.json({ success: true, added, wishlistCount: user.wishlist.length });
});

// ---------------- Admin ----------------

// @desc    List all customers
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

// @desc    Toggle a customer's active status (ban/unban)
// @route   PUT /api/users/:id/toggle-active
// @access  Private/Admin
exports.toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user });
});
