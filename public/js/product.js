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

  const bagIcon = typeof sfIcon === 'function' ? sfIcon('bag', 17) : '';
  const heartIcon = typeof sfIcon === 'function' ? sfIcon('heart', 18) : '<i class="bi bi-heart"></i>';
  const lowStock = p.stock > 0 && p.stock <= 5;

  return `
  <div class="col-6 col-md-4 col-lg-3">
    <article class="product-card" data-tilt data-tilt-max="6">
      <div class="product-media">
        <a href="/product/${p.slug}" class="product-image-link" data-cursor="View" aria-label="${sfEscape(p.name)}">
          <div class="product-image-wrapper${hoverImg ? ' has-hover' : ''}">
            <img class="product-main-image" src="${mainImg}" alt="${sfEscape(p.name)}" loading="lazy" decoding="async" width="500" height="625" />
            ${hoverImg ? `<img class="product-hover-image" src="${hoverImg}" alt="" loading="lazy" decoding="async" width="500" height="625" onerror="this.closest('.product-image-wrapper').classList.remove('has-hover')" />` : ''}
          </div>
        </a>
        <div class="product-badges">
          ${p.isNewArrival ? '<span class="sf-badge sf-badge-new">New</span>' : ''}
          ${hasDiscount ? `<span class="sf-badge sf-badge-sale">-${discountPercent}%</span>` : ''}
          ${p.isBestSeller ? '<span class="sf-badge sf-badge-bestseller">Bestseller</span>' : ''}
        </div>
        <div class="product-quick-actions">
          <button type="button" class="btn-sm-icon js-toggle-wishlist" data-id="${p._id}" aria-label="Add ${sfEscape(p.name)} to wishlist" aria-pressed="false">${heartIcon}</button>
        </div>
        ${p.stock > 0 ? `<button type="button" class="add-to-cart-btn js-add-to-cart"
          data-id="${p._id}" data-name="${sfEscape(p.name)}" data-slug="${p.slug}"
          data-image="${mainImg}" data-price="${finalPrice}" data-stock="${p.stock}">
          ${bagIcon}<span>Add to Cart</span>
        </button>` : '<span class="add-to-cart-btn is-disabled">Sold out</span>'}
      </div>
      <div class="product-info">
        <p class="product-category-label">${p.category && p.category.name ? sfEscape(p.category.name) : sfEscape(p.brand || '')}${lowStock ? ' · <span class="product-low">Only ' + p.stock + ' left</span>' : ''}</p>
        <h3 class="product-name"><a href="/product/${p.slug}">${sfEscape(p.name)}</a></h3>
        <div class="product-meta">
          <div class="product-price">
            <span class="price-current">${sfCurrency(finalPrice)}</span>
            ${hasDiscount ? `<span class="price-old">${sfCurrency(p.price)}</span>` : ''}
          </div>
          ${p.ratingsCount ? `<div class="product-rating" aria-label="Rated ${Number(p.ratingsAverage || 0).toFixed(1)} out of 5">${sfStars(p.ratingsAverage)}<span>(${p.ratingsCount})</span></div>` : ''}
        </div>
      </div>
    </article>
  </div>`;
}

function sfRenderProductGrid(containerEl, products) {
  if (!products || products.length === 0) {
    containerEl.innerHTML = `<div class="col-12"><div class="sf-empty">
      <span class="sf-empty-orb" aria-hidden="true"></span>
      <h3>Nothing here just yet</h3>
      <p>No products match right now. Try clearing a filter or searching another word.</p>
      <a href="/shop" class="btn btn-sisfora-outline">Browse all products</a>
    </div></div>`;
    return;
  }
  containerEl.innerHTML = products.map(sfProductCardHTML).join('');
  if (typeof sfRefreshWishlistHearts === 'function') sfRefreshWishlistHearts();
}

function sfSkeletonGrid(containerEl, count = 8) {
  containerEl.innerHTML = Array.from({ length: count })
    .map(() => `<div class="col-6 col-md-4 col-lg-3"><div class="sf-skeleton sf-skeleton-card"></div></div>`)
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
  // Give up after 10 seconds instead of showing a grey placeholder forever
  const withTimeout = (promise) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
  ]);
  const categoriesEl = document.getElementById('shopCategoryFilters');
  const brandsEl = document.getElementById('shopBrandFilters');

  // Categories and brands load at the same time
  const [catResult, brandResult] = await Promise.allSettled([
    withTimeout(sfFetch('/api/categories')),
    withTimeout(sfFetch('/api/products/brands')),
  ]);

  if (categoriesEl) {
    if (catResult.status === 'fulfilled') {
      const categories = catResult.value.categories || [];
      categoriesEl.innerHTML =
        '<div class="form-check mb-2"><input class="form-check-input" type="radio" name="category" value="" id="cat-all" checked>' +
        '<label class="form-check-label" for="cat-all">All Categories</label></div>' +
        categories
          .map(
            (cat) =>
              `<div class="form-check mb-2"><input class="form-check-input" type="radio" name="category" value="${cat.slug}" id="cat-${cat.slug}">` +
              `<label class="form-check-label" for="cat-${cat.slug}">${sfEscape(cat.name)}</label></div>`
          )
          .join('');
    } else {
      categoriesEl.innerHTML = '<p class="small text-muted">Could not load categories. Please refresh the page.</p>';
    }
  }

  if (brandsEl) {
    const brands = brandResult.status === 'fulfilled' ? brandResult.value.brands || [] : [];
    brandsEl.innerHTML = brands.length
      ? brands
          .map((brand) => {
            const id = `brand-${brand.replace(/[^a-z0-9]+/gi, '-')}`;
            return `<div class="form-check mb-2"><input class="form-check-input" type="checkbox" name="brand" value="${sfEscape(brand)}" id="${id}">` +
              `<label class="form-check-label" for="${id}">${sfEscape(brand)}</label></div>`;
          })
          .join('')
      : `<p class="small text-muted mb-0">${brandResult.status === 'fulfilled' ? 'No brands yet.' : 'Could not load brands.'}</p>`;
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

    // Customers type prices in Rupees; the database stores USD, so convert
    const minPrice = form.minPrice.value;
    const maxPrice = form.maxPrice.value;
    if (minPrice) params.set('minPrice', sfFromRupees(minPrice)); else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', sfFromRupees(maxPrice)); else params.delete('maxPrice');

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

  // Category / brand ticks update results immediately; prices apply with the button (or Enter)
  form.addEventListener('change', (e) => {
    if (e.target.name === 'minPrice' || e.target.name === 'maxPrice') return;
    currentPage = 1;
    loadProducts();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 1;
    loadProducts();
  });
  form.addEventListener('reset', () => {
    // Wait for the browser to clear the fields, then drop filters from the URL too
    setTimeout(() => {
      window.history.replaceState({}, '', window.location.pathname);
      currentPage = 1;
      loadProducts();
    });
  });
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
      if (input) {
        input.checked = true;
      } else {
        // Category not launched yet (hidden in config/storefront.js)
        grid.innerHTML = `<div class="col-12 text-center py-5">
          <i class="bi bi-stars fs-1 text-gold"></i>
          <h4 class="mt-3 mb-2">Coming soon</h4>
          <p class="text-muted mb-4">This collection isn't available yet — explore our Skincare range in the meantime.</p>
          <a href="/categories/skincare" class="btn btn-sisfora">Shop Skincare</a>
        </div>`;
        if (resultsCount) resultsCount.textContent = '';
        const heading = document.getElementById('shopHeading');
        if (heading) heading.textContent = 'Coming Soon';
        return;
      }
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
