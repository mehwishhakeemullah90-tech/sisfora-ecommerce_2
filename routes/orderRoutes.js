// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/', protect, placeOrder);
router.get('/my', protect, getMyOrders);
router.get('/', protect, adminOnly, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
