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

const app = express();

// ---------------------------------------------------------------------
// Security & performance middleware
// ---------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(mongoSanitize());

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
// View engine (EJS + layouts)
// ---------------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ---------------------------------------------------------------------
// Static assets — served BEFORE the DB middleware so CSS/JS/images
// are delivered without opening a MongoDB connection on each request.
// ---------------------------------------------------------------------
if (process.env.VERCEL === '1') {
  const fs = require('fs');
  const tmpUploads = '/tmp/uploads';
  if (!fs.existsSync(tmpUploads)) fs.mkdirSync(tmpUploads, { recursive: true });
  app.use('/uploads', express.static(tmpUploads));
}
app.use(express.static(path.join(__dirname, 'public')));

// Health-check endpoint — always reachable, reports exact DB error so
// you can diagnose connection failures without digging into logs.
app.get('/health', async (req, res) => {
  try {
    await connectDB();
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'failed', error: err.message, ts: new Date().toISOString() });
  }
});

// ---------------------------------------------------------------------
// Lazy DB connection middleware
// On Vercel, connecting at module load time is unreliable because env
// vars may not be fully propagated and process.exit() crashes the fn.
// This middleware ensures a connection exists before each request and
// surfaces DB errors gracefully instead of crashing the process.
// ---------------------------------------------------------------------
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    if (req.originalUrl.startsWith('/api')) {
      return res.status(503).json({ success: false, message: 'Database unavailable. Check MONGODB_URI in Vercel environment variables.' });
    }
    return res.status(503).send('<h1>503 – Service Unavailable</h1><p>Database connection failed. Please try again shortly.</p>');
  }
});

// Make current user + store constants available to every EJS template.
app.use(attachUser);
app.use((req, res, next) => {
  res.locals.storeName = process.env.STORE_NAME || 'Sisfora';
  res.locals.currentPath = req.path;
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// ---------------------------------------------------------------------
// Public config endpoint — returns non-sensitive frontend configuration
// ---------------------------------------------------------------------
app.get('/api/config', (req, res) => {
  res.json({ stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// ---------------------------------------------------------------------
// API routes (JSON)
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
app.use('/api/contact', require('./routes/contactRoutes'));
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

// ---------------------------------------------------------------------
// Ensure a default admin user exists so the panel is always accessible.
// Runs once at startup; does nothing if an admin already exists.
// ---------------------------------------------------------------------
async function bootstrapAdmin() {
  try {
    await connectDB();
    const User = require('./models/User');
    const exists = await User.findOne({ role: 'admin' });
    if (!exists) {
      const name     = process.env.ADMIN_NAME     || 'Sisfora Admin';
      const email    = process.env.ADMIN_EMAIL    || 'admin@sisfora.com';
      const password = process.env.ADMIN_PASSWORD || 'admin000';
      await User.create({ name, email, password, role: 'admin' });
      console.log(`   ✅ Admin account created  — login: admin / ${password}`);
    } else {
      console.log(`   ✅ Admin account ready    — login at /admin/login`);
    }
  } catch (err) {
    console.error('   ⚠️  Admin bootstrap failed:', err.message);
  }
}

// On Vercel the platform handles HTTP — do not call app.listen().
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 7001;
  app.listen(PORT, async () => {
    console.log(`\n🌸 Sisfora server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`   Storefront:  http://localhost:${PORT}`);
    console.log(`   Admin panel: http://localhost:${PORT}/admin/login`);
    await bootstrapAdmin();
    console.log();
  });
}

module.exports = app;
