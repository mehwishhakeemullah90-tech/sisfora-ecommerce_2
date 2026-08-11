// config/db.js
// -----------------------------------------------------------------------
// Establishes the MongoDB connection using Mongoose.
// -----------------------------------------------------------------------

const mongoose = require('mongoose');

const connectDB = async () => {
  // Guard: fail fast with a clear message if the env var is missing
  if (!process.env.MONGODB_URI) {
    console.error(
      '❌ MONGODB_URI is not set in your .env file.\n' +
      '   Add a line like:  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sisfora?retryWrites=true&w=majority\n' +
      '   Then restart the server.'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
