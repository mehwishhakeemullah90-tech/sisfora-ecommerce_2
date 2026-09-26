// public/js/cart.js
// -----------------------------------------------------------------------
// Client-side shopping cart persisted in localStorage. Kept client-side
// (rather than a server model) so guests can shop freely; it's synced to
// the server only at checkout time, where prices are re-validated.
// Cart shape: [{ productId, name, slug, image, price, quantity, stock }]
// -----------------------------------------------------------------------
const SF_CART_KEY = 'sisfora_cart';

function sfGetCart() {
  try {
    return JSON.parse(localStorage.getItem(SF_CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function sfSaveCart(cart) {
  localStorage.setItem(SF_CART_KEY, JSON.stringify(cart));
  if (typeof updateNavBadges === 'function') updateNavBadges();
}

// options.silent = true skips the slide-out cart panel (used by Buy Now)
function sfAddToCart(product, quantity = 1, options = {}) {
  const cart = sfGetCart();
  const existing = cart.find((i) => i.productId === product.productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, product.stock || 99);
  } else {
    cart.push({ ...product, quantity });
  }
  sfSaveCart(cart);
  if (!options.silent) sfOpenCartDrawer(`${product.name} added to your cart`);
}

function sfUpdateCartQuantity(productId, quantity) {
  const cart = sfGetCart();
  const item = cart.find((i) => i.productId === productId);
  if (!item) return;
  item.quantity = Math.max(1, Math.min(quantity, item.stock || 99));
  sfSaveCart(cart);
}

function sfRemoveFromCart(productId) {
  const cart = sfGetCart().filter((i) => i.productId !== productId);
  sfSaveCart(cart);
}

function sfClearCart() {
  localStorage.removeItem(SF_CART_KEY);
  if (typeof updateNavBadges === 'function') updateNavBadges();
}

function sfCartSubtotal() {
  return sfGetCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

// ---- Wire up "Add to Cart" buttons that carry data-* attributes ----
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.js-add-to-cart');
  if (!btn) return;
  e.preventDefault();
  sfAddToCart(
    {
      productId: btn.dataset.id,
      name: btn.dataset.name,
      slug: btn.dataset.slug,
      image: btn.dataset.image,
      price: Number(btn.dataset.price),
      stock: Number(btn.dataset.stock || 99),
    },
    Number(btn.dataset.qty || 1)
  );
});

// ---------------------------------------------------------------------
// Slide-out cart panel — opens after "Add to Cart" so the customer can
// adjust quantity or go straight to checkout without hunting for the
// cart icon. Created the first time it is needed.
// ---------------------------------------------------------------------
function sfCartDrawerEl() {
  let drawer = document.getElementById('sfCartDrawer');
  if (drawer) return drawer;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="sf-drawer-overlay" id="sfCartOverlay"></div>
    <aside class="sf-cart-drawer" id="sfCartDrawer" role="dialog" aria-modal="true" aria-labelledby="sfCartDrawerTitle" aria-hidden="true">
      <div class="sf-cart-drawer-head">
        <h5 class="mb-0" id="sfCartDrawerTitle">Your Cart</h5>
        <button type="button" class="sf-drawer-close js-close-cart-drawer" aria-label="Close cart">${typeof sfIcon === 'function' ? sfIcon('close', 20) : '&times;'}</button>
      </div>
      <p class="sf-cart-drawer-msg" id="sfCartDrawerMsg"></p>
      <div class="sf-cart-drawer-items" id="sfCartDrawerItems"></div>
      <div class="sf-cart-drawer-foot">
        <p class="small mb-0" id="sfCartDrawerShipping"></p>
        <div class="sf-ship-meter" aria-hidden="true"><span id="sfCartDrawerMeter" style="width:0"></span></div>
        <div class="d-flex justify-content-between fw-semibold mb-3">
          <span>Subtotal</span><span id="sfCartDrawerSubtotal"></span>
        </div>
        <a href="/cart" class="btn btn-sisfora-outline w-100 mb-2">View Cart</a>
        <a href="/checkout" class="btn btn-sisfora w-100">Checkout</a>
      </div>
    </aside>`);

  drawer = document.getElementById('sfCartDrawer');
  document.getElementById('sfCartOverlay').addEventListener('click', sfCloseCartDrawer);
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('.js-close-cart-drawer')) return sfCloseCartDrawer();
    const row = e.target.closest('[data-id]');
    if (!row) return;
    const item = sfGetCart().find((i) => i.productId === row.dataset.id);
    if (!item) return;
    if (e.target.closest('.js-drawer-plus')) sfUpdateCartQuantity(item.productId, item.quantity + 1);
    if (e.target.closest('.js-drawer-minus')) {
      if (item.quantity <= 1) sfRemoveFromCart(item.productId);
      else sfUpdateCartQuantity(item.productId, item.quantity - 1);
    }
    if (e.target.closest('.js-drawer-remove')) sfRemoveFromCart(item.productId);
    sfRenderCartDrawer();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') sfCloseCartDrawer(); });
  return drawer;
}

function sfRenderCartDrawer() {
  const cart = sfGetCart();
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = sfCartSubtotal();
  const threshold = (window.SF_SITE && SF_SITE.freeShippingThreshold) || 50;

  document.getElementById('sfCartDrawerTitle').textContent = `Your Cart (${count})`;
  document.getElementById('sfCartDrawerSubtotal').textContent = sfCurrency(subtotal);
  document.getElementById('sfCartDrawerShipping').innerHTML = subtotal >= threshold
    ? '<i class="bi bi-truck me-1"></i>You qualify for <strong>free shipping</strong>'
    : `<i class="bi bi-truck me-1"></i>Add <strong>${sfCurrency(threshold - subtotal)}</strong> more for free shipping`;
  const meter = document.getElementById('sfCartDrawerMeter');
  if (meter) requestAnimationFrame(() => { meter.style.width = `${Math.min(100, (subtotal / threshold) * 100)}%`; });

  document.getElementById('sfCartDrawerItems').innerHTML = cart.length
    ? cart.map((item) => `
      <div class="sf-drawer-item" data-id="${item.productId}">
        <a href="/product/${item.slug}"><img src="${item.image || '/images/products/placeholder.svg'}" alt="${sfEscape(item.name)}" /></a>
        <div class="flex-grow-1">
          <a href="/product/${item.slug}" class="sf-drawer-item-name">${sfEscape(item.name)}</a>
          <div class="small text-muted mb-2">${sfCurrency(item.price)}</div>
          <div class="d-flex align-items-center justify-content-between">
            <div class="sf-drawer-qty">
              <button type="button" class="js-drawer-minus" aria-label="Decrease quantity">−</button>
              <span>${item.quantity}</span>
              <button type="button" class="js-drawer-plus" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="sf-drawer-remove js-drawer-remove" aria-label="Remove ${sfEscape(item.name)}">Remove</button>
          </div>
        </div>
      </div>`).join('')
    : `<div class="text-center py-5"><span class="sf-empty-orb" aria-hidden="true"></span><p class="text-muted mt-3 mb-3">Your cart is empty.</p><a href="/shop" class="btn btn-sisfora-outline btn-sm">Start shopping</a></div>`;
}

function sfOpenCartDrawer(message) {
  const drawer = sfCartDrawerEl();
  document.getElementById('sfCartDrawerMsg').innerHTML = message
    ? `<i class="bi bi-check-circle-fill me-1"></i>${sfEscape(message)}`
    : '';
  sfRenderCartDrawer();
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  document.getElementById('sfCartOverlay').classList.add('open');
  document.body.classList.add('sf-no-scroll');
  drawer.querySelector('.js-close-cart-drawer').focus();
}

function sfCloseCartDrawer() {
  const drawer = document.getElementById('sfCartDrawer');
  if (!drawer || !drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  document.getElementById('sfCartOverlay').classList.remove('open');
  document.body.classList.remove('sf-no-scroll');
}
