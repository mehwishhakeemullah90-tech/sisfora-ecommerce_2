// scripts/createAdmin.js
// -----------------------------------------------------------------------
// Upserts the admin account ONLY — leaves products, orders, and every
// other collection untouched.
//
// Usage:
//   npm run create-admin
//
// Reads credentials from .env:
//   ADMIN_EMAIL    (default: admin@gmail.com)
//   ADMIN_PASSWORD (default: admin000)
//   ADMIN_NAME     (default: Sisfora Admin)
// -----------------------------------------------------------------------

// MongoDB Atlas uses SRV DNS records; some environments fail to resolve them
// with the system resolver. Force Google/Cloudflare DNS to fix that.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

async function main() {
  await connectDB();

  const email    = (process.env.ADMIN_EMAIL    || 'admin@gmail.com').toLowerCase().trim();
  const password =  process.env.ADMIN_PASSWORD || 'admin000';
  const name     =  process.env.ADMIN_NAME     || 'Sisfora Admin';

  console.log('\n🔐 Admin upsert started...');
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);

  // Hash the password the same way the User pre-save hook does.
  const salt         = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Look for an existing admin (by email first, then by role as fallback).
  let admin = await User.findOne({ email }).select('+password');

  if (!admin) {
    // No user with that email — check if ANY admin already exists.
    admin = await User.findOne({ role: 'admin' }).select('+password');
  }

  if (admin) {
    // Update the existing admin in-place using updateOne so we can set the
    // pre-hashed password directly (bypassing the pre-save hook safely).
    await User.updateOne(
      { _id: admin._id },
      {
        $set: {
          name,
          email,
          password: hashedPassword, // already hashed — stored as-is
          role: 'admin',
          isActive: true,
        },
      }
    );
    console.log(`\n✅ Existing admin updated.`);
    console.log(`   Old email: ${admin.email}  →  New email: ${email}`);
    console.log(`   Password reset to: ${password}`);
  } else {
    // No admin at all — create one from scratch.
    // We insert directly with the pre-hashed password so it isn't double-hashed.
    await User.create({
      name,
      email,
      // Temporarily bypass the pre-save hook by inserting the hash directly.
      // We do this by setting the field after construction (see note below).
      password: 'placeholder', // will be overwritten immediately
      role: 'admin',
      isActive: true,
    });

    // Overwrite with the real hash via updateOne (avoids double-hashing).
    await User.updateOne({ email }, { $set: { password: hashedPassword } });
    console.log(`\n✅ New admin created.`);
  }

  // Quick sanity-check: re-fetch the admin and verify the password matches.
  const saved = await User.findOne({ email, role: 'admin' }).select('+password');
  if (!saved) {
    console.error('❌ Admin not found after upsert — something went wrong!');
    process.exit(1);
  }

  const ok = await bcrypt.compare(password, saved.password);
  if (ok) {
    console.log('\n✅ Password verification passed — login is ready!');
    console.log('─────────────────────────────────────────');
    console.log(`   Login URL : http://localhost:${process.env.PORT || 5000}/admin/login`);
    console.log(`   Email     : ${email}`);
    console.log(`   Password  : ${password}`);
    console.log('─────────────────────────────────────────\n');
  } else {
    console.error('❌ Password verification FAILED — please check your .env values.');
    process.exit(1);
  }

  mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
