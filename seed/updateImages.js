// seed/updateImages.js
// Updates product image fields in MongoDB to use real photos.
// Run with:  npm run update:images
//
// This does NOT delete or recreate any products — it only patches
// the thumbnail + images fields on existing records by name.

require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');

const imageMap = {
  'Rose Radiance Serum':                '/images/products/photo-serum.jpg',
  'Velvet Matte Lipstick — Blush Nude': '/images/products/photo-foundation.jpg',
  'Gold Dew Liquid Highlighter':        '/images/products/photo-fragrance.jpg',
  'Silk Veil Foundation':               '/images/products/photo-foundation.jpg',
  'Bloom & Glow Cream Blush':           '/images/products/photo-foundation.jpg',
  'Pure Hydra Moisturizer':             '/images/products/photo-moisturizer.jpg',
  'Midnight Kohl Eyeliner':             '/images/products/photo-foundation.jpg',
  'Honey Nectar Lip Oil':               '/images/products/photo-moisturizer.jpg',
  'Cashmere Cloud Setting Powder':      '/images/products/photo-foundation.jpg',
  'Amber Bloom Eau de Parfum':          '/images/products/photo-fragrance.jpg',
  'Silk Lash Volumizing Mascara':       '/images/products/photo-foundation.jpg',
  'Dewy Petal Hydrating Face Mist':     '/images/products/photo-serum.jpg',
  'Rosewater Balancing Toner':          '/images/products/photo-toner.jpg',
  'Gilded Bronze Bronzer':              '/images/products/photo-fragrance.jpg',
  'Whisper Nude Lipstick':              '/images/products/photo-foundation.jpg',
  'Camellia Cream Night Repair':        '/images/products/photo-moisturizer.jpg',
  'Sunlit Glow SPF 30 Moisturizer':     '/images/products/photo-moisturizer.jpg',
  'Petal Soft Cream Cleanser':          '/images/products/photo-serum.jpg',
};

async function run() {
  await connectDB();
  let updated = 0;
  for (const [name, img] of Object.entries(imageMap)) {
    const result = await Product.updateMany(
      { name },
      { $set: { thumbnail: img, images: [img, img] } }
    );
    if (result.matchedCount > 0) {
      console.log(`✅ ${name} → ${img}`);
      updated += result.modifiedCount;
    } else {
      console.log(`⚠️  Not found: ${name}`);
    }
  }
  console.log(`\n🌸 Done — ${updated} product(s) updated.`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
