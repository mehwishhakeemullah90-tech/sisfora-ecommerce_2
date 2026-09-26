// seed/useStudioImages.js
// -----------------------------------------------------------------------
// Switches the demo Skincare products to the new, consistent Sisfora
// studio images (public/images/sisfora/products/*.webp) — same backdrop,
// size and lighting on every product, as the brief asked.
//
// Run with:  npm run images:studio
//
// Safe to run on the live database:
//  - It only touches the products listed below, matched by exact name.
//  - It SKIPS any product whose photo was uploaded through the Admin Panel
//    (Cloudinary / https:// images), so real product photos are never replaced.
//  - Nothing is deleted.
// -----------------------------------------------------------------------
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');

const studio = (key) => [`/images/sisfora/products/${key}.webp`, `/images/sisfora/products/${key}-alt.webp`];

const imageMap = {
  'Rose Radiance Serum': studio('serum-radiance'),
  'Pure Hydra Moisturizer': studio('moisturizer-hydra'),
  'Dewy Petal Hydrating Face Mist': studio('mist-dewy'),
  'Rosewater Balancing Toner': studio('toner-rosewater'),
  'Camellia Cream Night Repair': studio('night-camellia'),
  'Sunlit Glow SPF 30 Moisturizer': studio('spf-sunlit'),
  'Petal Soft Cream Cleanser': studio('cleanser-petal'),
};

const isUploadedPhoto = (url) => /^https?:\/\//i.test(String(url || ''));

async function run() {
  await connectDB();
  let updated = 0;
  let skipped = 0;

  for (const [name, images] of Object.entries(imageMap)) {
    const products = await Product.find({ name });
    for (const product of products) {
      if (isUploadedPhoto(product.thumbnail) || (product.images || []).some(isUploadedPhoto)) {
        console.log(`  – kept admin-uploaded photo: ${name}`);
        skipped += 1;
        continue;
      }
      product.thumbnail = images[0];
      product.images = images;
      await product.save();
      console.log(`  ✓ ${name}`);
      updated += 1;
    }
  }

  // Skincare category tile
  const cat = await Category.findOne({ slug: 'skincare' });
  if (cat && !isUploadedPhoto(cat.image)) {
    cat.image = '/images/sisfora/scene/category-skincare.webp';
    await cat.save();
    console.log('  ✓ Skincare category image');
  }

  console.log(`\nDone — ${updated} product(s) updated, ${skipped} kept as they were.`);
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
