// seed/seedData.js
// -----------------------------------------------------------------------
// Populates the database with realistic demo data so the storefront and
// admin dashboard look complete out of the box: an admin account,
// categories, ~18 products spanning best-sellers/new-arrivals/offers,
// a couple of sample orders, blog posts, and a coupon.
//
// Usage:
//   npm run seed            -> import demo data
//   npm run seed:destroy    -> wipe all collections
// -----------------------------------------------------------------------

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Blog = require('../models/Blog');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const Order = require('../models/Order');

const categoriesData = [
  { name: 'Skincare', description: 'Nourishing serums, moisturizers & cleansers for radiant skin.', image: '/images/products/category-skincare.svg', isFeatured: true },
  { name: 'Makeup', description: 'Luxury lips, eyes & complexion essentials.', image: '/images/products/category-makeup.svg', isFeatured: true },
  { name: 'Fragrance', description: 'Signature scents crafted to linger beautifully.', image: '/images/products/category-fragrance.svg', isFeatured: true },
  { name: 'Haircare', description: 'Clean formulas for soft, healthy, luminous hair.', image: '/images/products/category-haircare.svg', isFeatured: true },
  { name: 'Body Care', description: 'Indulgent body rituals for head-to-toe softness.', image: '/images/products/category-body-care.svg', isFeatured: true },
  { name: 'Gift Sets', description: 'Curated Sisfora collections, beautifully boxed.', image: '/images/products/category-gift-sets.svg', isFeatured: true },
];

// [name, categoryIndex, price, discountPrice, stock, flags, imageFile]
// Real product photos are in public/images/products/photo-*.jpg
const productsData = [

  ['Rose Radiance Serum', 0, 42, 34, 40, { isBestSeller: true, isFeatured: true }, 'photo-serum.jpg', '/images/hover-product/images(13).jpg'],

  ['Velvet Matte Lipstick — Blush Nude', 1, 24, 0, 60, { isNewArrival: true }, 'photo-foundation.jpg', '/images/hover-product/images(14).jpg'],

  ['Gold Dew Liquid Highlighter', 1, 29, 22, 35, { isBestSeller: true }, 'photo-fragrance.jpg', '/images/hover-product/images(15).jpg'],

  ['Silk Veil Foundation', 1, 38, 0, 50, { isFeatured: true }, 'photo-foundation.jpg', '/images/hover-product/images(16).jpg'],

  ['Bloom & Glow Cream Blush', 1, 22, 0, 45, { isNewArrival: true }, 'photo-foundation.jpg', '/images/hover-product/images(17).jpg'],

  ['Pure Hydra Moisturizer', 0, 36, 28, 55, { isBestSeller: true, isFeatured: true }, 'photo-moisturizer.jpg', '/images/hover-product/images(18).jpg'],

  ['Midnight Kohl Eyeliner', 1, 18, 0, 70, {}, 'photo-foundation.jpg', '/images/hover-product/images(19).jpg'],

  ['Honey Nectar Lip Oil', 1, 20, 16, 65, { isNewArrival: true }, 'photo-moisturizer.jpg', '/images/hover-product/images(20).jpg'],

  ['Cashmere Cloud Setting Powder', 1, 27, 0, 40, {}, 'photo-foundation.jpg', '/images/hover-product/images(21).jpg'],

  ['Amber Bloom Eau de Parfum', 2, 68, 54, 25, { isBestSeller: true, isFeatured: true }, 'photo-fragrance.jpg', '/images/hover-product/images(22).jpg'],

  ['Silk Lash Volumizing Mascara', 1, 21, 0, 80, { isNewArrival: true }, 'photo-foundation.jpg', '/images/hover-product/images(23).jpg'],

  ['Dewy Petal Hydrating Face Mist', 0, 19, 0, 90, { isBestSeller: true }, 'photo-serum.jpg', '/images/hover-product/images(24).jpg'],

  ['Rosewater Balancing Toner', 0, 23, 18, 60, {}, 'photo-toner.jpg', '/images/hover-product/images(13).jpg'],

  ['Gilded Bronze Bronzer', 1, 26, 0, 38, { isNewArrival: true }, 'photo-fragrance.jpg', '/images/hover-product/images(14).jpg'],

  ['Whisper Nude Lipstick', 1, 24, 0, 55, {}, 'photo-foundation.jpg', '/images/hover-product/images(15).jpg'],

  ['Camellia Cream Night Repair', 0, 45, 36, 30, { isFeatured: true }, 'photo-moisturizer.jpg', '/images/hover-product/images(16).jpg'],

  ['Sunlit Glow SPF 30 Moisturizer', 0, 34, 0, 48, { isBestSeller: true }, 'photo-moisturizer.jpg', '/images/hover-product/images(17).jpg'],

  ['Petal Soft Cream Cleanser', 0, 25, 20, 70, { isNewArrival: true }, 'photo-serum.jpg', '/images/hover-product/images(18).jpg'],

];

const blogData = [
  {
    title: '5 Skincare Rituals for Radiant, Healthy Skin',
    excerpt: 'Small daily rituals that make a lasting difference in your skin\'s natural glow.',
    content:
      'Great skin starts with consistency, not complexity. Begin every morning with a gentle cleanse to remove overnight buildup, followed by a hydrating toner to rebalance your skin\'s pH. Layer a lightweight serum packed with active ingredients like vitamin C or hyaluronic acid, then lock it all in with a nourishing moisturizer. Never skip SPF — it is the single most effective anti-aging step you can take.\n\nAt night, double cleanse to fully remove makeup and sunscreen, then treat your skin with a richer night cream or repair serum while you sleep. Consistency, not perfection, is what reveals your natural beauty over time.',
    coverImage: '/images/products/blog-1.svg',
    tags: ['skincare', 'routine', 'tips'],
  },
  {
    title: 'The Art of Layering Fragrance',
    excerpt: 'Make your signature scent last all day with these simple layering techniques.',
    content:
      'Fragrance layering starts with a scented body wash or lotion in the same family as your perfume — this creates a subtle base note that makes your scent last longer. Apply your eau de parfum to pulse points: wrists, neck, and behind the ears, where body heat helps diffuse the fragrance throughout the day.\n\nAvoid rubbing your wrists together after spraying, as this breaks down the fragrance molecules. Instead, let it dry naturally. For an evening refresh, a travel-size mist in your bag means your signature Sisfora scent stays with you from morning meetings to dinner.',
    coverImage: '/images/products/blog-2.svg',
    tags: ['fragrance', 'tips'],
  },
  {
    title: 'Clean Beauty 101: What "Clean" Really Means',
    excerpt: 'Cutting through the marketing noise to understand what clean beauty actually is.',
    content:
      '"Clean beauty" is often used loosely, but at Sisfora it means formulas free from parabens, sulfates, phthalates, and unnecessary synthetic fragrance — without compromising on performance. Clean does not mean "natural only"; it means every ingredient is chosen deliberately, is safe for long-term use, and is backed by science.\n\nWhen shopping for clean beauty, look for transparency: brands that list full ingredients, explain their sourcing, and avoid greenwashing buzzwords. That is the standard we hold every Sisfora formula to.',
    coverImage: '/images/products/blog-3.svg',
    tags: ['clean beauty', 'ingredients'],
  },
  {
    title: 'Glow From Within: Beauty Habits Beyond the Bottle',
    excerpt: 'Because radiant skin is built from the inside out, too.',
    content:
      'While great skincare matters, true radiance is also shaped by sleep, hydration, and stress management. Aim for seven to eight hours of sleep, where your skin does most of its repair work. Drink water consistently throughout the day rather than all at once, and incorporate antioxidant-rich foods like berries and leafy greens into your diet.\n\nStress shows up on skin as dullness and breakouts, so building in moments of calm — even five quiet minutes with your favorite Sisfora ritual — supports both your wellbeing and your glow.',
    coverImage: '/images/products/blog-4.svg',
    tags: ['wellness', 'lifestyle'],
  },
];

async function importData() {
  await connectDB();
  console.log('🌱 Seeding Sisfora database...');

  // --- Admin user ---
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin000';
  const adminName = process.env.ADMIN_NAME || 'Sisfora Admin';

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  } else {
    admin.name = adminName;
    admin.email = adminEmail;
    admin.password = adminPassword;
    await admin.save();
    console.log(`✅ Admin updated: ${adminEmail}`);
  }

  // --- Demo customer ---
  let customer = await User.findOne({ email: 'customer@sisfora.com' });
  if (!customer) {
    customer = await User.create({
      name: 'Amara Khan',
      email: 'customer@sisfora.com',
      password: 'Customer@123',
      phone: '+92 300 1234567',
      addresses: [
        {
          label: 'Home',
          fullName: 'Amara Khan',
          phone: '+92 300 1234567',
          addressLine1: '45 Garden Town',
          city: 'Lahore',
          country: 'Pakistan',
          isDefault: true,
        },
      ],
    });
    console.log('✅ Demo customer created: customer@sisfora.com / Customer@123');
  }

  // --- Categories ---
  await Category.deleteMany({});
  // Use create() (not insertMany) so the pre-save slug hook fires for each document.
  const categories = [];
  for (const cat of categoriesData) {
    categories.push(await Category.create(cat));
  }
  console.log(`✅ ${categories.length} categories created`);

  // --- Products ---
  await Product.deleteMany({});
  const products = [];
for (const [
  name,
  catIdx,
  price,
  discountPrice,
  stock,
  flags,
  imgFile,
  hoverImgFile
] of productsData) {
    const image = `/images/products/${imgFile}`;
   const hoverImage = hoverImgFile || `/images/products/${imgFile}`;
    const product = await Product.create({
      name,
      brand: 'Sisfora',
      category: categories[catIdx]._id,
      description: `${name} by Sisfora — thoughtfully formulated with clean, effective ingredients to help reveal your natural beauty. Cruelty-free and designed for everyday luxury.`,
      shortDescription: `A Sisfora signature essential for your daily ritual.`,
      price,
      discountPrice,
      stock,

      images: [image, hoverImage].filter(Boolean),

      thumbnail: image,
      
      tags: ['sisfora', categories[catIdx].name.toLowerCase()],
      isActive: true,
      soldCount: Math.floor(Math.random() * 120),
      ...flags,
    });
    products.push(product);
  }
  console.log(`✅ ${products.length} products created`);

  // --- Sample reviews ---
  await Review.deleteMany({});
  const sampleComments = [
    { rating: 5, title: 'Absolutely love it!', comment: 'This has become a staple in my routine. The texture and scent are luxurious.' },
    { rating: 4, title: 'Great quality', comment: 'Really impressed with the formula, though the packaging could be a touch sturdier.' },
    { rating: 5, title: 'Worth every penny', comment: 'You can tell this is a premium product from the first use. Highly recommend!' },
  ];
  for (const product of products.slice(0, 10)) {
    const pick = sampleComments[Math.floor(Math.random() * sampleComments.length)];
    await Review.create({
      product: product._id,
      user: customer._id,
      name: customer.name,
      ...pick,
    });
  }
  console.log('✅ Sample reviews created');

  // --- Blog posts ---
  await Blog.deleteMany({});
  for (const post of blogData) {
    await Blog.create(post);
  }
  console.log(`✅ ${blogData.length} blog posts created`);

  // --- Coupons ---
  await Coupon.deleteMany({});
  await Coupon.insertMany([
    {
      code: 'WELCOME10',
      description: '10% off your first order',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      usageLimit: 1000,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'SISFORA20',
      description: '$20 off orders over $100',
      discountType: 'fixed',
      discountValue: 20,
      minOrderAmount: 100,
      usageLimit: 200,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log('✅ Coupons created: WELCOME10, SISFORA20');

  console.log('\n🌸 Sisfora seed complete!');
  console.log(`   Admin login:    ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'admin000'}`);
  console.log('   Customer login: customer@sisfora.com / Customer@123\n');
  process.exit(0);
}

async function destroyData() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Blog.deleteMany({}),
    Coupon.deleteMany({}),
    Review.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log('🗑️  All collections cleared');
  process.exit(0);
}

if (process.argv.includes('-d')) {
  destroyData();
} else {
  importData();
}
