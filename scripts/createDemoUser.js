// scripts/createDemoUser.js
// -----------------------------------------------------------------------
// Creates (or resets) a demo CUSTOMER account so the store owner can try
// checkout, wishlist, order history and account details before launch.
// Leaves every other account and collection untouched.
//
// Usage:
//   npm run create-demo
//
// Optional .env overrides:
//   DEMO_EMAIL    (default: demo@sisfora.com)
//   DEMO_PASSWORD (default: SisforaDemo2026)
//
// Delete the account from Admin → Customers (or deactivate it) at launch.
// -----------------------------------------------------------------------

// MongoDB Atlas uses SRV DNS records; some environments fail to resolve them
// with the system resolver. Force Google/Cloudflare DNS to fix that.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function main() {
  await connectDB();

  const email = (process.env.DEMO_EMAIL || 'demo@sisfora.com').toLowerCase().trim();
  const password = process.env.DEMO_PASSWORD || 'SisforaDemo2026';

  let user = await User.findOne({ email }).select('+password');
  if (user && user.role === 'admin') {
    console.error(`❌ ${email} is an admin account — choose a different DEMO_EMAIL.`);
    process.exit(1);
  }

  if (!user) user = new User({ name: 'Demo Customer', email });
  user.password = password; // hashed by the User model's pre-save hook
  user.isActive = true;
  await user.save();

  console.log('\n✅ Demo customer account ready');
  console.log(`   Sign in at /login with:`);
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Could not create demo account:', err.message);
  process.exit(1);
});
