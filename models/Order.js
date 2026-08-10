// models/Order.js
// -----------------------------------------------------------------------
// A placed order: snapshot of cart items + shipping + payment info.
// Supports both Cash on Delivery and Card (Stripe) payment methods.
// -----------------------------------------------------------------------
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot at time of order
    image: { type: String },
    price: { type: Number, required: true }, // unit price actually paid
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: String,
    postalCode: String,
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ['COD', 'CARD'], required: true },
    paymentResult: {
      id: String, // Stripe payment intent id
      status: String,
      updateTime: String,
      email: String,
    },
    coupon: {
      code: String,
      discountAmount: { type: Number, default: 0 },
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveredAt: Date,
  },
  { timestamps: true }
);

// Auto-generate a human-friendly order number, e.g. SIS-240804-XXXXX
orderSchema.pre('validate', function generateOrderNumber(next) {
  if (!this.orderNumber) {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randPart = Math.random().toString(36).slice(2, 7).toUpperCase();
    this.orderNumber = `SIS-${datePart}-${randPart}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
