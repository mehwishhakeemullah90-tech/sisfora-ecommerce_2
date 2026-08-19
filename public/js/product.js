// public/js/product.js
// -----------------------------------------------------------------------
// Reusable product-grid rendering + the Shop page's search/filter/sort/
// pagination logic. Also powers Best Sellers / New Arrivals / Offers
// pages via a `tag` query param against the same /api/products endpoint.
// -----------------------------------------------------------------------

/** Renders a single product card's HTML (used by every listing page). */
function sfProductCardHTML(p) {
  const finalPrice = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price;
  const hasDiscount = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;
  const discountPercent = hasDiscount ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;

  const mainImg = p.thumbnail || (p.images && p.images[0]) || '/images/products/placeholder.svg';
  const hoverImg = p.images && p.images[1] ? p.images[1] : null;

  return `
  <div class="col-6 col-md-4 col-lg-3">
    <div class="product-card sf-reveal sf-visible">
      <div class="product-media">
        <a href="/product/${p.slug}">
          <div class="product-image-wrapper${hoverImg ? ' has-hover' : ''}">
            <img class="product-main-image" src="${mainImg}" alt="${sfEscape(p.name)}" loading="lazy" />
            ${hoverImg ? `<img class="product-hover-image" src="${hoverImg}" alt="${sfEscape(p.name)}" loading="lazy" onerror="this.closest('.product-image-wrapper').classList.remove('has-hover')" />` : ''}
          </div>
        </a>
        <div class="product-badges">
          ${p.isNewArrival ? '<span class="sf-badge sf-badge-new">New</span>' : ''}
          ${hasDiscount ? `<span class="sf-badge sf-badge-sale">-${discountPercent}%</span>` : ''}
          ${p.isBestSeller ? '<span class="sf-badge sf-badge-bestseller">Bestseller</span>' : ''}
        </div>
        <div class="product-quick-actions">
          <button class="btn-sm-icon js-toggle-wishlist" data-id="${p._id}" title="Add to wishlist"><i class="bi bi-heart"></i></button>
          <a class="btn-sm-icon" href="/product/${p.slug}" title="Quick view"><i class="bi bi-eye"></i></a>
        </div>
        <button class="btn btn-sisfora btn-sm w-auto add-to-cart-btn js-add-to-cart"
          data-id="${p._id}" data-name="${sfEscape(p.name)}" data-slug="${p.slug}"
          data-image="${p.thumbnail || (p.images && p.images[0]) || ''}" data-price="${finalPrice}" data-stock="${p.stock}">
          <i class="bi bi-bag-plus me-1"></i> Add to Bag
        </button>
      </div>
      <div class="product-info">
        <p class="product-category-label">${p.category && p.category.name ? p.category.name : p.brand}</p>
        <h6 class="product-name"><a href="/product/${p.slug}" class="text-dark">${sfEscape(p.name)}</a></h6>
        <div class="product-rating mb-1">${sfStars(p.ratingsAverage)} <span class="text-muted small">(${p.ratingsCount || 0})</span></div>
        <div class="product-price">
          <span class="price-current">${sfCurrency(finalPrice)}</span>
          ${hasDiscount ? `<span class="price-old">${sfCurrency(p.price)}</span>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

function sfRenderProductGrid(containerEl, products) {
  if (!products || products.length === 0) {
    containerEl.innerHTML = `<div class="col-12 text-center py-5">
      <i class="bi bi-emoji-frown fs-1 text-muted"></i>
      <p class="mt-3 text-muted">No products found. Try adjusting your filters.</p>
    </div>`;
    return;
  }
  containerEl.innerHTML = products.map(sfProductCardHTML).join('');
}

function sfSkeletonGrid(containerEl, count = 8) {
  containerEl.innerHTML = Array.from({ length: count })
    .map(() => `<div class="col-6 col-md-4 col-lg-3"><div class="sf-skeleton" style="aspect-ratio:1/1.4;"></div></div>`)
    .join('');
}

// ---------------------------------------------------------------------
// Generic "product tag" page loader — used by Best Sellers, New
// Arrivals, and Offers pages which just fetch a filtered/sorted set.
// ---------------------------------------------------------------------
async function sfLoadTaggedProducts(containerEl, tag, extraParams = {}) {
  sfSkeletonGrid(containerEl);
  try {
    const params = new URLSearchParams({ tag, limit: 24, ...extraParams });
    const data = await sfFetch(`/api/products?${params.toString()}`);
    sfRenderProductGrid(containerEl, data.products);
  } catch (err) {
    containerEl.innerHTML = `<div class="col-12 text-center text-danger py-5">${err.message}</div>`;
  }
}

// ---------------------------------------------------------------------
// Shop filter sidebar — loads categories and brands from the API
// ---------------------------------------------------------------------
async function sfInitShopFilters() {
  // Load categories
  const categoriesEl = document.getElementById('shopCategoryFilters');
  if (categoriesEl) {
    try {
      const { categories } = await sfFetch('/api/categories');
      categoriesEl.innerHTML =
        '<div class="form-check mb-2"><input class="form-check-input" type="radio" name="category" value="" id="cat-all" checked>' +
        '<label class="form-check-label" for="cat-all">All Categories</label></div>' +
        (categories || [])
          .map(
            (cat) =>
              `<div class="form-check mb-2"><input class="form-check-input" type="radio" name="category" value="${cat.slug}" id="cat-${cat.slug}">` +
              `<label class="form-check-label" for="cat-${cat.slug}">${sfEscape(cat.name)}</label></div>`
          )
          .join('');
    } catch (e) {
      categoriesEl.innerHTML = '<p class="small text-muted">Could not load categories.</p>';
    }
  }

  // Load brands
  const brandsEl = document.getElementById('shopBrandFilters');
  if (brandsEl) {
    try {
      const { brands } = await sfFetch('/api/products/brands');
      if (brands && brands.length) {
        brandsEl.innerHTML = brands
          .map(
            (brand) =>
              `<div class="form-check mb-2"><input class="form-check-input" type="checkbox" name="brand" value="${sfEscape(brand)}" id="brand-${brand.replace(/\s+/g, '-')}">` +
              `<label class="form-check-label" for="brand-${brand.replace(/\s+/g, '-')}">${sfEscape(brand)}</label></div>`
          )
          .join('');
      } else {
        brandsEl.innerHTML = '';
      }
    } catch (e) {
      brandsEl.innerHTML = '';
    }
  }
}

// ---------------------------------------------------------------------
// Shop page: full search/filter/sort/pagination
// ---------------------------------------------------------------------
function sfInitShopPage() {
  const grid = document.getElementById('shopProductGrid');
  if (!grid) return;

  const form = document.getElementById('shopFilterForm');
  const sortSelect = document.getElementById('shopSort');
  const resultsCount = document.getElementById('shopResultsCount');
  const pagination = document.getElementById('shopPagination');
  const searchInput = document.getElementById('shopSearchInput');

  let currentPage = 1;

  function buildParams() {
    const params = new URLSearchParams(sfQueryParams());
    const formData = new FormData(form);

    const category = formData.getAll('category');
    const brand = formData.getAll('brand');
    if (category.length && category[0]) params.set('category', category[0]);
    else params.delete('category');
    if (brand.length) params.set('brand', brand.join(','));
    else params.delete('brand');

    const minPrice = form.minPrice.value;
    const maxPrice = form.maxPrice.value;
    if (minPrice) params.set('minPrice', minPrice); else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice); else params.delete('maxPrice');

    if (sortSelect.value) params.set('sort', sortSelect.value); else params.delete('sort');
    params.set('page', currentPage);
    params.set('limit', 12);
    return params;
  }

  async function loadProducts() {
    sfSkeletonGrid(grid);
    try {
      const params = buildParams();
      const data = await sfFetch(`/api/products?${params.toString()}`);
      sfRenderProductGrid(grid, data.products);
      if (resultsCount) resultsCount.textContent = `${data.total} product${data.total === 1 ? '' : 's'} found`;
      renderPagination(data.page, data.pages);
    } catch (err) {
      grid.innerHTML = `<div class="col-12 text-center text-danger py-5">${err.message}</div>`;
    }
  }

  function renderPagination(page, pages) {
    if (!pagination) return;
    if (pages <= 1) { pagination.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= pages; i += 1) {
      html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    pagination.innerHTML = html;
  }

  pagination?.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    currentPage = Number(link.dataset.page);
    loadProducts();
    grid.scrollIntoView({ behavior: 'smooth' });
  });

  form.addEventListener('change', () => { currentPage = 1; loadProducts(); });
  sortSelect.addEventListener('change', () => { currentPage = 1; loadProducts(); });

  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        if (searchInput.value) params.set('keyword', searchInput.value);
        else params.delete('keyword');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        currentPage = 1;
        loadProducts();
      }, 400);
    });
  }

  // Init: load filters first, then load products
  async function init() {
    await sfInitShopFilters();

    // Apply preset category — from data-attribute or from URL (/categories/:slug)
    const presetCategory =
      grid.dataset.presetCategory ||
      (window.location.pathname.startsWith('/categories/') ? window.location.pathname.split('/categories/')[1] : '');
    if (presetCategory) {
      const input = form.querySelector(`input[name="category"][value="${presetCategory}"]`);
      if (input) input.checked = true;
    }

    // Prefill from URL query params
    const initialParams = sfQueryParams();
    if (initialParams.keyword && searchInput) searchInput.value = initialParams.keyword;
    if (initialParams.minPrice) form.minPrice.value = initialParams.minPrice;
    if (initialParams.maxPrice) form.maxPrice.value = initialParams.maxPrice;
    if (initialParams.sort) sortSelect.value = initialParams.sort;

    loadProducts();
  }

  init();
}

document.addEventListener('DOMContentLoaded', () => {
  sfInitShopPage();

  const bestSellersGrid = document.getElementById('bestSellersGrid');
  if (bestSellersGrid) sfLoadTaggedProducts(bestSellersGrid, 'bestseller', { sort: 'bestselling' });

  const newArrivalsGrid = document.getElementById('newArrivalsGrid');
  if (newArrivalsGrid) sfLoadTaggedProducts(newArrivalsGrid, 'newarrival');

  const offersGrid = document.getElementById('offersGrid');
  if (offersGrid) sfLoadTaggedProducts(offersGrid, 'offer');
});
