// public/js/wishlist.js
// -----------------------------------------------------------------------
// Server-backed wishlist (requires login). Delegated click handler so it
// works for buttons rendered dynamically (e.g. in shop.js grids).
// -----------------------------------------------------------------------
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.js-toggle-wishlist');
  if (!btn) return;
  e.preventDefault();

  const productId = btn.dataset.id;
  try {
    const data = await sfFetch(`/api/users/wishlist/${productId}`, { method: 'POST' });
    btn.classList.toggle('active', data.added);
    const icon = btn.querySelector('i');
    if (icon) icon.className = data.added ? 'bi bi-heart-fill' : 'bi bi-heart';
    sfToast(data.added ? 'Added to wishlist' : 'Removed from wishlist');
    if (typeof updateNavBadges === 'function') updateNavBadges();
  } catch (err) {
    if (err.status === 401) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    } else {
      sfToast(err.message, 'error');
    }
  }
});
