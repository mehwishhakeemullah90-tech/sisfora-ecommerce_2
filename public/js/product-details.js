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

  // Gallery: thumbnails + left/right arrows on the main image (+ swipe on phones)
  let currentImage = 0;
  function showImage(index) {
    if (!images.length || !mainImage) return;
    currentImage = (index + images.length) % images.length;
    mainImage.src = images[currentImage];
    document.querySelectorAll('.pd-thumb-v').forEach((t, i) => t.classList.toggle('active', i === currentImage));
    const counter = document.querySelector('.pd-gallery-count b');
    if (counter) counter.textContent = currentImage + 1;
    mainImage.animate && mainImage.animate([{ opacity: 0.3, transform: 'scale(1.03)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' });
  }

  if (thumbsContainer && images.length) {
    thumbsContainer.innerHTML = images
      .map((img, i) =>
        `<img src="${img}" data-index="${i}" class="pd-thumb-v ${i === 0 ? 'active' : ''}" alt="${sfEscape(product.name)} photo ${i + 1}" loading="lazy" />`
      )
      .join('');
    document.querySelectorAll('.pd-thumb-v').forEach((thumb) => {
      thumb.addEventListener('click', () => showImage(Number(thumb.dataset.index)));
    });
  }

  const mediaBox = mainImage && mainImage.closest('.product-media');
  if (mediaBox && images.length > 1) {
    mediaBox.insertAdjacentHTML('beforeend', `
      <button type="button" class="pd-gallery-arrow pd-gallery-prev" aria-label="Previous photo">${sfIcon('left', 20)}</button>
      <button type="button" class="pd-gallery-arrow pd-gallery-next" aria-label="Next photo">${sfIcon('right', 20)}</button>
      <span class="pd-gallery-count" aria-hidden="true"><b>1</b> / ${images.length}</span>`);
    mediaBox.querySelector('.pd-gallery-prev').addEventListener('click', () => showImage(currentImage - 1));
    mediaBox.querySelector('.pd-gallery-next').addEventListener('click', () => showImage(currentImage + 1));

    let touchStartX = null;
    mediaBox.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    mediaBox.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) showImage(currentImage + (dx < 0 ? 1 : -1));
      touchStartX = null;
    });
  }

  // Product info panel
  const infoEl = document.getElementById('pdInfo');
  if (infoEl) {
    const catName = product.category && product.category.name ? sfEscape(product.category.name) : '';
    const shortText = product.shortDescription || String(product.description || '').split(/(?<=\.)\s/)[0] || '';
    infoEl.innerHTML = `
      ${catName ? `<p class="eyebrow mb-2">${catName}</p>` : ''}
      <h1 class="pd-title mb-3">${sfEscape(product.name)}</h1>
      <button type="button" class="pd-rating-link mb-3" id="pdRatingLink" aria-label="Read the reviews">
        <span class="product-rating">${sfStars(product.ratingsAverage)}</span>
        <span class="pd-review-count"><span id="pdReviewCount">${product.ratingsCount || 0}</span> reviews · Write a review</span>
      </button>
      <div class="d-flex align-items-baseline gap-3 mb-3">
        <span class="pd-price">${sfCurrency(finalPrice)}</span>
        ${hasDiscount ? `<span class="pd-price-old">${sfCurrency(product.price)}</span><span class="sf-badge sf-badge-sale">Save ${discountPercent}%</span>` : ''}
      </div>
      ${shortText ? `<p class="pd-short">${sfEscape(shortText)}</p>` : ''}
      <div class="d-flex gap-4 mb-4">
        <button type="button" class="pd-action-link" id="pdAskBtn"><i class="bi bi-question-circle me-1"></i>Ask a question</button>
        <button type="button" class="pd-action-link" id="pdShareBtn"><i class="bi bi-share me-1"></i>Share</button>
      </div>
      ${product.stock > 0
        ? `<p class="pd-stock ${product.stock <= 5 ? 'is-low' : ''}"><span></span>${product.stock <= 5 ? `Only ${product.stock} left in stock` : 'In stock — ready to ship'}</p>`
        : '<p class="pd-stock is-out"><span></span>Out of stock</p>'}
      <div class="pd-buy-row mb-3">
        <div class="pd-qty-group">
          <button class="pd-qty-btn" type="button" id="pdQtyMinus" aria-label="Decrease quantity">−</button>
          <input type="number" id="pdQty" class="pd-qty-input" value="1" min="1" max="${product.stock}" aria-label="Quantity">
          <button class="pd-qty-btn" type="button" id="pdQtyPlus" aria-label="Increase quantity">+</button>
        </div>
        <button id="pdAddToCartBtn" class="btn-pd-cart flex-grow-1" ${product.stock === 0 ? 'disabled' : ''}
          data-id="${product._id}" data-name="${sfEscape(product.name)}" data-slug="${product.slug}"
          data-image="${images[0] || ''}" data-price="${finalPrice}" data-stock="${product.stock}">
          ${sfIcon('bag', 18)} Add to Cart
        </button>
        <button class="btn-pd-icon js-toggle-wishlist" data-id="${product._id}" aria-label="Add to wishlist" aria-pressed="false" type="button">
          ${sfIcon('heart', 20)}
        </button>
      </div>
      <button class="btn-pd-buynow w-100 mb-4" ${product.stock === 0 ? 'disabled' : ''} id="pdBuyNowBtn" type="button">
        Buy Now
      </button>
      <ul class="pd-assure">
        <li>${sfIcon('truck', 20)}<div><strong>Free delivery</strong><span>On orders over ${sfCurrency((window.SF_SITE && SF_SITE.freeShippingThreshold) || 50)} · <a href="/shipping">Details</a></span></div></li>
        <li><i class="bi bi-cash-coin"></i><div><strong>Cash on Delivery</strong><span>Pay when it arrives, nationwide</span></div></li>
        <li><i class="bi bi-arrow-repeat"></i><div><strong>Easy returns</strong><span>30 days · <a href="/faq#returns">How it works</a></span></div></li>
      </ul>
    `;
    // Star summary opens the Reviews tab (where the review form is)
    document.getElementById('pdRatingLink')?.addEventListener('click', () => {
      const tabBtn = document.querySelector('[data-bs-target="#pdReviewsTab"]');
      if (tabBtn && window.bootstrap) bootstrap.Tab.getOrCreateInstance(tabBtn).show();
      document.getElementById('pdTabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (typeof sfRefreshWishlistHearts === 'function') sfRefreshWishlistHearts();

  // Share: the phone's share sheet where available, otherwise copy the link
  document.getElementById('pdShareBtn')?.addEventListener('click', async () => {
    const shareData = { title: `${product.name} | Sisfora`, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { /* user closed the share sheet */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      sfToast('Link copied — paste it anywhere to share');
    } catch (e) {
      window.prompt('Copy this link to share:', window.location.href);
    }
  });

  // Ask a question: small form that goes to the admin's Contact Messages
  const askModalEl = document.getElementById('pdAskModal');
  document.getElementById('pdAskBtn')?.addEventListener('click', () => {
    if (!askModalEl || !window.bootstrap) { window.location.href = '/contact'; return; }
    document.getElementById('pdAskProduct').textContent = product.name;
    bootstrap.Modal.getOrCreateInstance(askModalEl).show();
  });
  const askForm = document.getElementById('pdAskForm');
  askForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = askForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const data = await sfFetch('/api/contact', {
        method: 'POST',
        body: {
          fullName: askForm.fullName.value,
          email: askForm.email.value,
          subject: `Question about ${product.name}`,
          message: `${askForm.message.value}\n\nProduct: ${window.location.href}`,
        },
      });
      bootstrap.Modal.getOrCreateInstance(askModalEl).hide();
      askForm.reset();
      sfToast(data.message || 'Thanks! We will reply by email soon.');
    } catch (err) {
      sfToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

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

  // Buy Now — add to cart and go straight to checkout (fewest taps)
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
        Number(qtyInput?.value || 1),
        { silent: true }
      );
      window.location.href = '/checkout';
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
      const countLabel = countEl && countEl.parentElement;
      if (countLabel) countLabel.lastChild.textContent = reviews.length === 1 ? ' review · Write a review' : ' reviews · Write a review';
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
