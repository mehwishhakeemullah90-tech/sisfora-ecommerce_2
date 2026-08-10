// public/js/cart-page.js
// -----------------------------------------------------------------------
// Renders and manages the /cart page: line items, quantity changes,
// coupon application, and order summary totals.
// -----------------------------------------------------------------------
const SF_SHIPPING_FLAT = 5.99;
const SF_FREE_SHIPPING_THRESHOLD = 50;

let sfAppliedCoupon = null; // { code, discountAmount }

function sfCartRowHTML(item) {
  return `
  <tr data-id="${item.productId}">
    <td>
      <div class="d-flex align-items-center gap-3">
        <img src="${item.image}" class="thumb-sf" style="width:64px;height:64px;object-fit:cover;border-radius:4px;" alt="${sfEscape(item.name)}" />
        <div>
          <a href="/product/${item.slug}" class="text-dark fw-medium">${sfEscape(item.name)}</a>
          <div class="small text-muted">${sfCurrency(item.price)} each</div>
        </div>
      </div>
    </td>
    <td>
      <div class="input-group input-group-sm" style="width:120px;">
        <button class="btn btn-outline-secondary js-cart-minus" type="button">-</button>
        <input type="number" min="1" value="${item.quantity}" class="form-control text-center js-cart-qty-input" />
        <button class="btn btn-outline-secondary js-cart-plus" type="button">+</button>
      </div>
    </td>
    <td class="fw-semibold">${sfCurrency(item.price * item.quantity)}</td>
    <td><button class="btn btn-sm text-danger js-cart-remove"><i class="bi bi-trash"></i></button></td>
  </tr>`;
}

function sfRenderCartPage() {
  const tbody = document.getElementById('cartTableBody');
  const emptyState = document.getElementById('cartEmptyState');
  const cartContent = document.getElementById('cartContent');
  if (!tbody) return;

  const cart = sfGetCart();
  if (cart.length === 0) {
    emptyState.classList.remove('d-none');
    cartContent.classList.add('d-none');
    return;
  }
  emptyState.classList.add('d-none');
  cartContent.classList.remove('d-none');
  tbody.innerHTML = cart.map(sfCartRowHTML).join('');
  sfRecalculateTotals();
}

function sfRecalculateTotals() {
  const subtotal = sfCartSubtotal();
  const discount = sfAppliedCoupon ? sfAppliedCoupon.discountAmount : 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  // Free shipping only when the order meets the threshold (>= $50).
  // The cart content section is hidden when the cart is empty, so afterDiscount
  // will never be 0 from an empty cart here — only from a full-discount coupon,
  // which should still be charged shipping per the server-side logic.
  const shipping = afterDiscount >= SF_FREE_SHIPPING_THRESHOLD ? 0 : SF_SHIPPING_FLAT;
  const total = afterDiscount + shipping;

  document.getElementById('cartSubtotal').textContent = sfCurrency(subtotal);
  document.getElementById('cartShipping').textContent = shipping === 0 ? 'Free' : sfCurrency(shipping);
  document.getElementById('cartTotal').textContent = sfCurrency(total);

  const discountRow = document.getElementById('cartDiscountRow');
  if (discount > 0) {
    discountRow.classList.remove('d-none');
    document.getElementById('cartDiscount').textContent = `-${sfCurrency(discount)}`;
  } else {
    discountRow.classList.add('d-none');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('cartTableBody')) return;
  sfRenderCartPage();

  document.getElementById('cartTableBody').addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;

    if (e.target.closest('.js-cart-remove')) {
      sfRemoveFromCart(id);
      sfRenderCartPage();
    }
    if (e.target.closest('.js-cart-plus')) {
      const cart = sfGetCart();
      const item = cart.find((i) => i.productId === id);
      sfUpdateCartQuantity(id, item.quantity + 1);
      sfRenderCartPage();
    }
    if (e.target.closest('.js-cart-minus')) {
      const cart = sfGetCart();
      const item = cart.find((i) => i.productId === id);
      if (item.quantity <= 1) { sfRemoveFromCart(id); } else { sfUpdateCartQuantity(id, item.quantity - 1); }
      sfRenderCartPage();
    }
  });

  document.getElementById('cartTableBody').addEventListener('change', (e) => {
    if (!e.target.classList.contains('js-cart-qty-input')) return;
    const row = e.target.closest('tr');
    sfUpdateCartQuantity(row.dataset.id, Number(e.target.value));
    sfRenderCartPage();
  });

  const couponForm = document.getElementById('couponForm');
  if (couponForm) {
    couponForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await sfFetch('/api/coupons/apply', {
          method: 'POST',
          body: { code: couponForm.code.value, subtotal: sfCartSubtotal() },
        });
        sfAppliedCoupon = { code: data.code, discountAmount: data.discountAmount };
        sessionStorage.setItem('sisfora_coupon', JSON.stringify(sfAppliedCoupon));
        sfToast(data.message);
        sfRecalculateTotals();
      } catch (err) {
        if (err.status === 401) {
          window.location.href = `/login?redirect=/cart`;
        } else {
          sfToast(err.message, 'error');
        }
      }
    });
  }

  // Restore coupon from session if present
  const savedCoupon = sessionStorage.getItem('sisfora_coupon');
  if (savedCoupon) {
    sfAppliedCoupon = JSON.parse(savedCoupon);
    sfRecalculateTotals();
  }

  document.getElementById('checkoutBtn')?.addEventListener('click', (e) => {
    if (sfGetCart().length === 0) {
      e.preventDefault();
      sfToast('Your cart is empty', 'error');
    }
  });
});
