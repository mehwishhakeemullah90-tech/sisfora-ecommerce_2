// utils/liveCategories.js
// -----------------------------------------------------------------------
// Helpers for hiding not-yet-launched categories from customers.
// Which categories are live is set in config/storefront.js.
// Admins (signed in) still see everything, so the Admin Panel keeps
// working and products can be prepared before launch.
// -----------------------------------------------------------------------
const Category = require('../models/Category');
const storefront = require('../config/storefront');

function liveCategorySlugs() {
  return storefront.categories.filter((c) => c.live).map((c) => c.slug);
}

function isLiveCategorySlug(slug) {
  return liveCategorySlugs().includes(slug);
}

async function getLiveCategoryIds() {
  const cats = await Category.find({ slug: { $in: liveCategorySlugs() } }).select('_id');
  return cats.map((c) => c._id);
}

function isAdminRequest(req) {
  return Boolean(req.user && req.user.role === 'admin');
}

module.exports = { liveCategorySlugs, isLiveCategorySlug, getLiveCategoryIds, isAdminRequest };
