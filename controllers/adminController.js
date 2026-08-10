// controllers/adminController.js
// -----------------------------------------------------------------------
// Dashboard analytics + sales reports for the admin panel.
// -----------------------------------------------------------------------
const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');

// @desc    Dashboard summary stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [totalOrders, totalProducts, totalCustomers, totalReviews, revenueAgg, recentOrders, lowStock, statusCounts] =
    await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Review.countDocuments(),
      Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
      Product.find({ stock: { $lte: 5 }, isActive: true }).select('name stock thumbnail').limit(5),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

  const totalRevenue = revenueAgg[0]?.total || 0;

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalProducts,
      totalCustomers,
      totalReviews,
      totalRevenue,
      recentOrders,
      lowStock,
      statusCounts,
    },
  });
});

// @desc    Sales report grouped by day for the last N days
// @route   GET /api/admin/reports/sales?days=30
// @access  Private/Admin
exports.getSalesReport = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const dailySales = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalPrice' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
  ]);

  res.json({ success: true, dailySales, topProducts });
});
