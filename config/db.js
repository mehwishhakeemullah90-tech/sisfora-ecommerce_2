const dns = require('dns');
const mongoose = require('mongoose');

// Atlas SRV records need a resolver that supports SRV lookups. Some local
// environments expose an unavailable loopback resolver to Node, so allow a
// comma-separated override and use reliable public resolvers by default.
const dnsServers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);
if (dnsServers.length) dns.setServers(dnsServers);

// Cache the connection across serverless function invocations so Vercel
// warm instances don't open a new connection on every request.
let cachedConn = null;
let connectionPromise = null;

const connectDB = async () => {
  // Already connected — reuse.
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Share one in-flight connection attempt across concurrent requests.
  // This prevents each homepage section from opening its own connection
  // while the first Atlas connection is still being established.
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((conn) => {
        cachedConn = conn;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .finally(() => {
        connectionPromise = null;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
