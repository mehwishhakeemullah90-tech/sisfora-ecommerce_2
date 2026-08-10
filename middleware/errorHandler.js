// middleware/errorHandler.js
// -----------------------------------------------------------------------
// Central error handler. Returns JSON for API routes and renders a nice
// error page for regular page requests.
// -----------------------------------------------------------------------
function notFound(req, res, next) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `API route not found: ${req.originalUrl}` });
  }
  res.status(404).render('404', { title: 'Page Not Found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  console.error(`❌ ${err.stack || err}`);

  if (req.originalUrl.startsWith('/api')) {
    return res.status(statusCode).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  }

  res.status(statusCode).render('error', { title: 'Something Went Wrong', message, statusCode });
}

module.exports = { notFound, errorHandler };
