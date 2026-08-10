// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  toggleWishlist,
  getAllUsers,
  toggleUserActive,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.put('/profile', protect, updateProfile);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:productId', protect, toggleWishlist);

// Admin
router.get('/', protect, adminOnly, getAllUsers);
router.put('/:id/toggle-active', protect, adminOnly, toggleUserActive);

module.exports = router;
