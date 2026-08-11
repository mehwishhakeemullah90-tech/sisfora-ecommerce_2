const dns = require('dns');

// Fix MongoDB Atlas SRV DNS resolution
dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);

require('dotenv').config();

const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const methodOverride = require('method-override');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { attachUser } = require('./middleware/auth');

// ---------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------
connectDB();

const app = express();

// ---------------------------------------------------------------------
// Security & performance middleware
// ---------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // relaxed for CDN'd Bootstrap/fonts in this starter; tighten for production
  })
);
app.use(compression());
app.use(mongoSanitize());

// Basic rate limiting on the API to deter brute-force / scraping abuse.
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', apiLimiter);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ---------------------------------------------------------------------
// Body parsing & cookies
// ---------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// ---------------------------------------------------------------------
// View engine (EJS + layouts) for server-rendered, SEO-friendly pages
// ---------------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Make current user + store constants available to every EJS template.
app.use(attachUser);
app.use((req, res, next) => {
  res.locals.storeName = process.env.STORE_NAME || 'Sisfora';
  res.locals.currentPath = req.path;
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// ---------------------------------------------------------------------
// Static assets
// ---------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------
// API routes (JSON, consumed by frontend JS)
// ---------------------------------------------------------------------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/blog', require('./routes/blogRoutes'));
app.use('/api/admin', require('./routes/adminApiRoutes'));

// ---------------------------------------------------------------------
// Server-rendered pages
// ---------------------------------------------------------------------
app.use('/admin', require('./routes/adminPageRoutes'));
app.use('/', require('./routes/pageRoutes'));

// ---------------------------------------------------------------------
// Error handling (must be last)
// ---------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`\n🌸 Sisfora server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`   Storefront:  http://localhost:${PORT}`);
  console.log(`   Admin panel: http://localhost:${PORT}/admin/login\n`);
});

module.exports = app;
