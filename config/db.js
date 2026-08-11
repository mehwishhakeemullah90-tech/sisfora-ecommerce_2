const mongoose = require('mongoose');

// Cache the connection across serverless function invocations so Vercel
// warm instances don't open a new connection on every request.
let cachedConn = null;

const connectDB = async () => {
  // Already connected — reuse.
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // 10 s — fail fast in serverless
    socketTimeoutMS: 45000,
  });

  cachedConn = conn;
  console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

module.exports = connectDB;
