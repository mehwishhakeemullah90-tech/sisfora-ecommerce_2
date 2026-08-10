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

function sfAddToCart(product, quantity = 1) {
  const cart = sfGetCart();
  const existing = cart.find((i) => i.productId === product.productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, product.stock || 99);
  } else {
    cart.push({ ...product, quantity });
  }
  sfSaveCart(cart);
  sfToast(`${product.name} added to your bag`);
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
