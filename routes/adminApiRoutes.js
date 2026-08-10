// routes/adminApiRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats, getSalesReport } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/reports/sales', protect, adminOnly, getSalesReport);

module.exports = router;
