// public/js/product-details.js
// -----------------------------------------------------------------------
// Product Details page: image gallery swapping, quantity stepper,
// review list + review submission form, and wishlist state.
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const page = document.getElementById('productDetailsPage');
  if (!page) return;

  const productId = page.dataset.productId;

  // ---- Gallery ----
  const mainImage = document.getElementById('pdMainImage');
  document.querySelectorAll('.pd-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      mainImage.src = thumb.dataset.full;
      document.querySelectorAll('.pd-thumb').forEach((t) => t.classList.remove('border-dark'));
      thumb.classList.add('border-dark');
    });
  });

  // ---- Quantity stepper ----
  const qtyInput = document.getElementById('pdQty');
  document.getElementById('pdQtyMinus')?.addEventListener('click', () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById('pdQtyPlus')?.addEventListener('click', () => {
    qtyInput.value = Math.min(Number(qtyInput.max || 99), Number(qtyInput.value) + 1);
  });

  // ---- Add to cart with chosen quantity ----
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
        Number(qtyInput.value)
      );
    });
  }

  // ---- Load reviews ----
  const reviewsList = document.getElementById('pdReviewsList');
  async function loadReviews() {
    try {
      const { reviews } = await sfFetch(`/api/products/${productId}/reviews`);
      document.getElementById('pdReviewCount').textContent = reviews.length;
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
      reviewsList.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
  }
  loadReviews();

  // ---- Submit review ----
  const reviewForm = document.getElementById('pdReviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = reviewForm.querySelector('input[name="rating"]:checked')?.value;
      if (!rating) { sfToast('Please select a star rating', 'error'); return; }
      try {
        await sfFetch(`/api/products/${productId}/reviews`, {
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
