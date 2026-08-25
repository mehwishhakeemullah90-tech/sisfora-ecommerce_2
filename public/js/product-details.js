// public/js/product-details.js
// -----------------------------------------------------------------------
// Product Details page: fetches product from /api/products/:slug,
// renders gallery + info, handles qty stepper, add-to-cart, reviews.
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  const page = document.getElementById('productDetailsPage');
  if (!page) return;

  // Read slug from URL: /product/rose-serum  →  "rose-serum"
  const slug = window.location.pathname.split('/product/')[1];
  if (!slug) return;

  // Fetch product from API
  let product;
  try {
    const data = await sfFetch(`/api/products/${slug}`);
    product = data.product;
    if (!product) throw new Error('Product not found');
  } catch (err) {
    const infoEl = document.getElementById('pdInfo');
    if (infoEl) infoEl.innerHTML = `<p class="text-danger">Product not found. <a href="/shop">Browse the shop</a></p>`;
    return;
  }

  const finalPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  // Update page title
  document.title = `${product.name} | Sisfora`;

  // Breadcrumb
  const breadcrumb = document.getElementById('pdBreadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML =
      `<a href="/">Home</a> / <a href="/shop">Shop</a> / ` +
      `<a href="/categories/${product.category?.slug || ''}">${sfEscape(product.category?.name || '')}</a> / ` +
      `<span class="text-dark">${sfEscape(product.name)}</span>`;
  }

  // Gallery
  const mainImage = document.getElementById('pdMainImage');
  const thumbsContainer = document.getElementById('pdThumbs');
  const images = product.images || [];
  if (mainImage && images.length) {
    mainImage.src = images[0];
    mainImage.alt = product.name;
  }
  // Show discount badge on image
  const discountBadgeEl = document.getElementById('pdDiscountBadge');
  if (discountBadgeEl && hasDiscount) {
    discountBadgeEl.textContent = `-${discountPercent}%`;
    discountBadgeEl.classList.remove('d-none');
  }

  if (thumbsContainer && images.length) {
    thumbsContainer.innerHTML = images
      .map((img, i) =>
        `<img src="${img}" data-full="${img}" class="pd-thumb-v ${i === 0 ? 'active' : ''}" alt="Product thumbnail" />`
      )
      .join('');
    document.querySelectorAll('.pd-thumb-v').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (mainImage) mainImage.src = thumb.dataset.full;
        document.querySelectorAll('.pd-thumb-v').forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  }

  // Product info panel
  const infoEl = document.getElementById('pdInfo');
  if (infoEl) {
    infoEl.innerHTML = `
      <h1 class="pd-title mb-2">${sfEscape(product.name)}</h1>
      <div class="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <div class="product-rating">${sfStars(product.ratingsAverage)}</div>
        <span class="pd-review-count"><span id="pdReviewCount">0</span> reviews</span>
        <span class="pd-sold-badge"><i class="bi bi-fire me-1"></i>15 sold in last 24 hours</span>
      </div>
      <div class="d-flex align-items-baseline gap-3 mb-3">
        <span class="pd-price">${sfCurrency(finalPrice)}</span>
        ${hasDiscount ? `<span class="pd-price-old">${sfCurrency(product.price)}</span>` : ''}
      </div>
      <div class="pd-viewing-pill mb-3">
        <i class="bi bi-eye me-2"></i>30 people are viewing this right now
      </div>
      <div class="d-flex gap-4 mb-3">
        <a href="/contact" class="pd-action-link"><i class="bi bi-question-circle me-1"></i>Ask a question</a>
        <a href="#" class="pd-action-link" onclick="return false;"><i class="bi bi-share me-1"></i>Share</a>
      </div>
      <hr class="my-3">
      ${product.stock > 0
        ? `<p class="text-success small mb-3"><i class="bi bi-check-circle me-1"></i>In Stock (${product.stock} available)</p>`
        : `<p class="text-danger small mb-3"><i class="bi bi-x-circle me-1"></i>Out of Stock</p>`}
      <div class="d-flex align-items-center gap-2 mb-3">
        <div class="pd-qty-group">
          <button class="pd-qty-btn" type="button" id="pdQtyMinus">-</button>
          <input type="number" id="pdQty" class="pd-qty-input" value="1" min="1" max="${product.stock}" aria-label="Quantity">
          <button class="pd-qty-btn" type="button" id="pdQtyPlus">+</button>
        </div>
        <button id="pdAddToCartBtn" class="btn-pd-cart flex-grow-1" ${product.stock === 0 ? 'disabled' : ''}
          data-id="${product._id}" data-name="${sfEscape(product.name)}" data-slug="${product.slug}"
          data-image="${images[0] || ''}" data-price="${finalPrice}" data-stock="${product.stock}">
          Add to Cart
        </button>
        <button class="btn-pd-icon js-toggle-wishlist" data-id="${product._id}" title="Add to wishlist" type="button">
          <i class="bi bi-heart"></i>
        </button>
        <button class="btn-pd-icon" title="Compare" type="button">
          <i class="bi bi-layers"></i>
        </button>
      </div>
      <button class="btn-pd-buynow w-100 mb-4" ${product.stock === 0 ? 'disabled' : ''} id="pdBuyNowBtn" type="button">
        <i class="bi bi-cart me-2"></i>Buy Now
      </button>
      <div class="d-flex gap-4 small text-muted">
        <span><i class="bi bi-truck me-1"></i>Free shipping on orders over $50</span>
        <span><i class="bi bi-arrow-repeat me-1"></i>Easy 30-day returns</span>
      </div>
    `;
  }

  // Description + tags
  const descEl = document.getElementById('pdDescription');
  if (descEl) descEl.textContent = product.description || '';
  const tagsEl = document.getElementById('pdTags');
  if (tagsEl && product.tags && product.tags.length) {
    tagsEl.innerHTML = product.tags
      .map((tag) => `<span class="badge bg-light text-dark border me-1">${sfEscape(tag)}</span>`)
      .join('');
  }

  // Quantity stepper
  const qtyInput = document.getElementById('pdQty');
  document.getElementById('pdQtyMinus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById('pdQtyPlus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.min(Number(qtyInput.max || 99), Number(qtyInput.value) + 1);
  });

  // Add to cart
  const addToCartBtn = document.getElementById('pdAddToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      sfAddToCart(
        {
          productId: addToCartBtn.dataset.id,
          name: addToCartBtn.dataset.name,
          slug: addToCartBtn.dataset.slug,
          image: addToCartBtn.dataset.image,
          price: Number(addToCartBtn.dataset.price),
          stock: Number(addToCartBtn.dataset.stock || 99),
        },
        Number(qtyInput?.value || 1)
      );
    });
  }

  // Buy Now — add to cart then go to cart
  const buyNowBtn = document.getElementById('pdBuyNowBtn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      sfAddToCart(
        {
          productId: product._id,
          name: product.name,
          slug: product.slug,
          image: images[0] || '',
          price: finalPrice,
          stock: product.stock,
        },
        Number(qtyInput?.value || 1)
      );
      window.location.href = '/cart';
    });
  }

  // Related products
  const relatedGrid = document.getElementById('relatedProductsGrid');
  if (relatedGrid && product.category?.slug) {
    try {
      const relData = await sfFetch(`/api/products?category=${product.category.slug}&limit=5`);
      const related = (relData.products || []).filter((p) => p._id !== product._id).slice(0, 4);
      sfRenderProductGrid(relatedGrid, related);
    } catch (e) {
      relatedGrid.innerHTML = '';
    }
  }

  // Reviews
  const reviewsList = document.getElementById('pdReviewsList');
  async function loadReviews() {
    try {
      const { reviews } = await sfFetch(`/api/products/${product._id}/reviews`);
      const countEl = document.getElementById('pdReviewCount');
      if (countEl) countEl.textContent = reviews.length;
      if (!reviews.length) {
        reviewsList.innerHTML = '<p class="text-muted">No reviews yet. Be the first to share your experience!</p>';
        return;
      }
      reviewsList.innerHTML = reviews
        .map(
          (r) => `
          <div class="border-bottom pb-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong>${sfEscape(r.name)}</strong>
              <span class="small text-muted">${new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="product-rating mb-1">${sfStars(r.rating)}</div>
            ${r.title ? `<p class="mb-1 fw-semibold">${sfEscape(r.title)}</p>` : ''}
            <p class="mb-0 text-muted">${sfEscape(r.comment)}</p>
          </div>`
        )
        .join('');
    } catch (err) {
      if (reviewsList) reviewsList.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
  }
  loadReviews();

  // Submit review
  const reviewForm = document.getElementById('pdReviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = reviewForm.querySelector('input[name="rating"]:checked')?.value;
      if (!rating) { sfToast('Please select a star rating', 'error'); return; }
      try {
        await sfFetch(`/api/products/${product._id}/reviews`, {
          method: 'POST',
          body: { rating: Number(rating), title: reviewForm.title.value, comment: reviewForm.comment.value },
        });
        sfToast('Thank you for your review!');
        reviewForm.reset();
        loadReviews();
      } catch (err) {
        if (err.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        } else {
          sfToast(err.message, 'error');
        }
      }
    });
  }
});
