// controllers/orderController.js
// -----------------------------------------------------------------------
// Order placement (COD + Stripe card), order history, order details,
// admin order management (status updates), and Stripe payment intent
// creation for the checkout page.
// -----------------------------------------------------------------------
const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const stripe = require('../config/stripe');

const SHIPPING_FLAT_RATE = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;
const TAX_RATE = 0.0; // adjust per your jurisdiction

// Helper: recompute authoritative pricing server-side from cart items,
// never trust prices sent from the client.
async function priceCart(items) {
  const detailedItems = [];
  let itemsPrice = 0;

  for (const cartItem of items) {
    const product = await Product.findById(cartItem.productId);
    if (!product || !product.isActive) {
      throw new Error(`Product ${cartItem.productId} is no longer available`);
    }
    if (product.stock < cartItem.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    const unitPrice = product.finalPrice;
    itemsPrice += unitPrice * cartItem.quantity;
    detailedItems.push({
      product: product._id,
      name: product.name,
      image: product.thumbnail,
      price: unitPrice,
      quantity: cartItem.quantity,
    });
  }

  return { detailedItems, itemsPrice };
}

// @desc    Create a Stripe PaymentIntent for the current cart total
// @route   POST /api/orders/create-payment-intent
// @access  Private
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { items, couponCode } = req.body;
  const { itemsPrice } = await priceCart(items);

  let discountAmount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon && coupon.isValid() && itemsPrice >= coupon.minOrderAmount) {
      discountAmount =
        coupon.discountType === 'percentage' ? (itemsPrice * coupon.discountValue) / 100 : coupon.discountValue;
      if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  }

  const shippingPrice = itemsPrice - discountAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const totalPrice = Math.max(0, itemsPrice - discountAmount) + shippingPrice + itemsPrice * TAX_RATE;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalPrice * 100), // Stripe expects cents
    currency: (process.env.CURRENCY || 'usd').toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: { userId: req.user._id.toString() },
  });

  res.json({ success: true, clientSecret: paymentIntent.client_secret, totalPrice });
});

// @desc    Place an order (COD or after successful Stripe payment)
// @route   POST /api/orders
// @access  Private
exports.placeOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode, paymentIntentId } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty' });
  }
  if (!['COD', 'CARD'].includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }

  const { detailedItems, itemsPrice } = await priceCart(items);

  let discountAmount = 0;
  let appliedCouponCode;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon && coupon.isValid() && itemsPrice >= coupon.minOrderAmount) {
      discountAmount =
        coupon.discountType === 'percentage' ? (itemsPrice * coupon.discountValue) / 100 : coupon.discountValue;
      if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      coupon.usedCount += 1;
      await coupon.save();
      appliedCouponCode = coupon.code;
    }
  }

  const shippingPrice = itemsPrice - discountAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const taxPrice = Math.round(itemsPrice * TAX_RATE * 100) / 100;
  const totalPrice = Math.max(0, itemsPrice - discountAmount) + shippingPrice + taxPrice;

  let isPaid = false;
  let paidAt;
  let paymentResult;

  if (paymentMethod === 'CARD') {
    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'Missing payment confirmation' });
    }
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment was not completed successfully' });
    }
    isPaid = true;
    paidAt = new Date();
    paymentResult = { id: intent.id, status: intent.status, updateTime: new Date().toISOString(), email: req.user.email };
  }

  const order = await Order.create({
    user: req.user._id,
    items: detailedItems,
    shippingAddress,
    paymentMethod,
    paymentResult,
    coupon: appliedCouponCode ? { code: appliedCouponCode, discountAmount } : undefined,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    isPaid,
    paidAt,
  });

  // Decrement stock & bump soldCount for best-seller ranking
  await Promise.all(
    detailedItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      })
    )
  );

  res.status(201).json({ success: true, order });
});

// @desc    Get logged-in user's order history
// @route   GET /api/orders/my
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: orders.length, orders });
});

// @desc    Get single order (owner or admin)
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
  }
  res.json({ success: true, order });
});

// ---------------- Admin ----------------

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, count: orders.length, orders });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.status = req.body.status;
  if (req.body.status === 'delivered') order.deliveredAt = new Date();
  await order.save();

  res.json({ success: true, order });
});
