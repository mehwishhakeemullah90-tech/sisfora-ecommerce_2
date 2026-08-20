// controllers/productController.js
// -----------------------------------------------------------------------
// Product catalog: listing with search/filter/sort/pagination, single
// product lookup, and full admin CRUD.
// -----------------------------------------------------------------------
const asyncHandler = require('../middleware/asyncHandler');
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    List products with search, filters, sorting & pagination
// @route   GET /api/products
// @access  Public
// Query params: keyword, category, brand, minPrice, maxPrice, sort,
//                page, limit, tag (bestseller|newarrival|offer)
exports.getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, brand, minPrice, maxPrice, sort, tag, page = 1, limit = 12 } = req.query;

  const query = { isActive: true };

  if (keyword) {
    query.$text = { $search: keyword };
  }
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) query.category = cat._id;
  }
  if (brand) {
    query.brand = { $regex: brand, $options: 'i' };
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
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
    Product.distinct('brand'),
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

// @desc    Get single product by slug (with populated reviews)
// @route   GET /api/products/:slug
// @access  Public
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate({ path: 'reviews', match: { isApproved: true }, populate: { path: 'user', select: 'name avatar' } });

  if (!product) {
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
