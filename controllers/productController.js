// controllers/productController.js
// -----------------------------------------------------------------------
// Product catalog: listing with search/filter/sort/pagination, single
// product lookup, and full admin CRUD.
// -----------------------------------------------------------------------
const asyncHandler = require('../middleware/asyncHandler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const storefront = require('../config/storefront');
const { getLiveCategoryIds, isAdminRequest } = require('../utils/liveCategories');

// @desc    List products with search, filters, sorting & pagination
// @route   GET /api/products
// @access  Public
// Query params: keyword, category, brand, minPrice, maxPrice, sort,
//                page, limit, tag (bestseller|newarrival|offer)
exports.getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, brand, minPrice, maxPrice, sort, tag, page = 1, limit = 12 } = req.query;

  const query = { isActive: true };

  if (keyword) {
    // Same typo-tolerant matching as the search box (see fuzzySearch below)
    const { results } = fuzzySearch(await getSearchIndex(), normalizeWords(String(keyword).slice(0, 100)));
    query._id = { $in: results.map((r) => r.product._id) };
  }
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) query.category = cat._id;
  }
  // Customers only see products from live categories (config/storefront.js)
  let liveIds = null;
  if (!isAdminRequest(req)) {
    liveIds = await getLiveCategoryIds();
    const inLiveCategory = query.category && liveIds.some((id) => id.equals(query.category));
    query.category = inLiveCategory ? query.category : { $in: query.category ? [] : liveIds };
  }
  if (brand) {
    // Several brands can be ticked at once: "Sisfora,Other" -> either brand
    const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const brands = String(brand).split(',').map((b) => b.trim()).filter(Boolean);
    query.brand = { $in: brands.map((b) => new RegExp(`^${escapeRegex(b)}$`, 'i')) };
  }
  if (minPrice || maxPrice) {
    // Filter on the price the customer actually pays (sale price if any)
    const payPrice = { $cond: [{ $gt: ['$discountPrice', 0] }, '$discountPrice', '$price'] };
    const conditions = [];
    if (minPrice) conditions.push({ $gte: [payPrice, Number(minPrice)] });
    if (maxPrice) conditions.push({ $lte: [payPrice, Number(maxPrice)] });
    query.$expr = { $and: conditions };
  }
  if (tag === 'bestseller') query.isBestSeller = true;
  if (tag === 'newarrival') query.isNewArrival = true;
  if (tag === 'offer') query.discountPrice = { $gt: 0 };
  if (tag === 'featured') query.isFeatured = true;

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  if (sort === 'price_desc') sortOption = { price: -1 };
  if (sort === 'rating') sortOption = { ratingsAverage: -1 };
  if (sort === 'bestselling') sortOption = { soldCount: -1 };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [products, total, brands] = await Promise.all([
    Product.find(query).populate('category', 'name slug').sort(sortOption).skip(skip).limit(limitNum),
    Product.countDocuments(query),
    Product.distinct('brand', liveIds ? { isActive: true, category: { $in: liveIds } } : {}),
  ]);

  res.json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    brands,
    products,
  });
});

// ---------------------------------------------------------------------
// Fuzzy search
// A small in-memory search index (product name, category, brand, tags)
// rebuilt at most once a minute. Matches whole words, word beginnings
// (for search-as-you-type) and small spelling mistakes ("moisturiser",
// "moistrizer" → "Moisturizer").
// ---------------------------------------------------------------------
const SEARCH_INDEX_TTL_MS = 60 * 1000;
let searchIndex = null; // { builtAt, entries: [{ product, terms: [{ word, weight }] }] }

function normalizeWords(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Number of single-letter edits needed to turn a into b (Levenshtein).
function editDistance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = temp;
    }
  }
  return prev[b.length];
}

// How well one typed word matches one indexed word (0 = no match, 1 = exact).
function wordScore(typed, word) {
  if (typed === word) return 1;
  if (typed.length >= 2 && word.startsWith(typed)) return 0.9;
  if (typed.length >= 3 && word.includes(typed)) return 0.7;
  if (typed.length < 4) return 0;
  const allowed = typed.length >= 7 ? 2 : 1;
  // Compare with the whole word, and with its beginning (user still typing)
  const distance = Math.min(editDistance(typed, word), editDistance(typed, word.slice(0, typed.length)));
  return distance <= allowed ? 0.6 : 0;
}

async function getSearchIndex() {
  if (searchIndex && Date.now() - searchIndex.builtAt < SEARCH_INDEX_TTL_MS) return searchIndex;

  const liveCategoryIds = await getLiveCategoryIds();
  const products = await Product.find({ isActive: true, category: { $in: liveCategoryIds } })
    .select('name slug brand price discountPrice thumbnail images stock soldCount ratingsAverage ratingsCount isNewArrival isBestSeller tags category')
    .populate('category', 'name slug')
    .lean({ virtuals: false });

  const entries = products.map((product) => {
    const terms = [];
    const add = (text, weight) => normalizeWords(text).forEach((word) => terms.push({ word, weight }));
    add(product.name, 3);
    add(product.category && product.category.name, 2);
    (product.tags || []).forEach((tag) => add(tag, 2));
    add(product.brand, 1);
    return { product, terms };
  });

  searchIndex = { builtAt: Date.now(), entries };
  return searchIndex;
}

// @desc    Fuzzy product search (search-as-you-type + search page)
// @route   GET /api/products/search?q=serum&limit=8
// @access  Public
// With an empty q it returns popular products and live categories, used
// as suggestions as soon as the search box is focused.
exports.searchProducts = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').slice(0, 100);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 8));
  const index = await getSearchIndex();
  const categories = storefront.categories.filter((c) => c.live).map(({ name, slug }) => ({ name, slug }));

  const typedWords = normalizeWords(q);
  if (!typedWords.length) {
    const popular = index.entries
      .map((e) => e.product)
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, limit);
    return res.json({ success: true, query: q, total: popular.length, products: popular, suggestions: [], categories, popular: true });
  }

  const { results, suggestions } = fuzzySearch(index, typedWords);

  res.json({
    success: true,
    query: q,
    total: results.length,
    products: results.slice(0, limit).map((r) => r.product),
    suggestions,
    categories: categories.filter((c) => typedWords.some((w) => normalizeWords(c.name).some((cw) => wordScore(w, cw) > 0))),
  });
});

// Scores every indexed product against the typed words. A product must
// match every word (exactly, by its beginning, or with a small typo).
function fuzzySearch(index, typedWords) {
  const results = [];
  const matchedWords = new Map(); // indexed word -> best score (for "did you mean" suggestions)

  index.entries.forEach(({ product, terms }) => {
    let total = 0;
    const everyWordMatched = typedWords.every((typed) => {
      let best = 0;
      terms.forEach(({ word, weight }) => {
        const score = wordScore(typed, word);
        if (score > 0) {
          best = Math.max(best, score * weight);
          if (word.length > 2) matchedWords.set(word, Math.max(matchedWords.get(word) || 0, score));
        }
      });
      total += best;
      return best > 0;
    });
    if (everyWordMatched) results.push({ product, score: total });
  });

  results.sort((a, b) => b.score - a.score || (b.product.soldCount || 0) - (a.product.soldCount || 0));

  const suggestions = [...matchedWords.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return { results, suggestions };
}

// @desc    Get single product by slug (with populated reviews)
// @route   GET /api/products/:slug
// @access  Public
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate({ path: 'reviews', match: { isApproved: true }, populate: { path: 'user', select: 'name avatar' } });

  // Products in not-yet-launched categories are hidden from customers
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  const liveIds = isAdminRequest(req) ? null : await getLiveCategoryIds();
  const hidden = liveIds && !(product.category && liveIds.some((id) => id.equals(product.category._id)));
  if (hidden) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  }).limit(4);

  res.json({ success: true, product, related });
});

// @desc    Create product (admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// @desc    Update product (admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// @desc    Delete product (admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deleted' });
});

// @desc    Get single product by id (admin edit form)
// @route   GET /api/products/id/:id
// @access  Private/Admin
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});
