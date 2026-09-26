// public/js/wishlist.js
// -----------------------------------------------------------------------
// Wishlist that works WITHOUT signing in:
//  - Signed in  -> saved to the customer's account (server).
//  - Signed out -> saved in this browser (localStorage), one click, no
//                  sign-in needed. It is moved into the account
//                  automatically the next time the customer signs in.
// Delegated click handler, so it works for buttons rendered later
// (e.g. product grids loaded by product.js).
// -----------------------------------------------------------------------
const SF_GUEST_WISHLIST_KEY = 'sisfora_wishlist';

// Product ids currently in the wishlist (guest or account) — used to
// show filled hearts. Filled in by sfLoadWishlistIds().
let sfWishlistIds = new Set(sfGetGuestWishlist());

function sfGetGuestWishlist() {
  try {
    return JSON.parse(localStorage.getItem(SF_GUEST_WISHLIST_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function sfSaveGuestWishlist(ids) {
  try {
    localStorage.setItem(SF_GUEST_WISHLIST_KEY, JSON.stringify(ids));
  } catch (e) { /* storage unavailable — ignore */ }
}

/** Fill every heart button on the page that is in the wishlist. */
function sfRefreshWishlistHearts() {
  document.querySelectorAll('.js-toggle-wishlist').forEach((btn) => {
    const inList = sfWishlistIds.has(btn.dataset.id);
    btn.classList.toggle('active', inList);
    btn.setAttribute('aria-pressed', inList ? 'true' : 'false');
    const icon = btn.querySelector('i');
    if (icon) icon.className = inList ? 'bi bi-heart-fill' : 'bi bi-heart';
  });
}

/**
 * Loads the wishlist ids (account if signed in, otherwise this browser),
 * moves any guest items into the account after sign-in, and returns the count.
 */
async function sfLoadWishlistIds() {
  try {
    let { wishlist } = await sfFetch('/api/users/wishlist');
    const guestIds = sfGetGuestWishlist();
    if (guestIds.length) {
      await sfFetch('/api/users/wishlist/merge', { method: 'POST', body: { productIds: guestIds } });
      sfSaveGuestWishlist([]);
      ({ wishlist } = await sfFetch('/api/users/wishlist'));
    }
    sfWishlistIds = new Set(wishlist.map((p) => String(p._id || p)));
  } catch (err) {
    sfWishlistIds = new Set(sfGetGuestWishlist()); // signed out
  }
  sfRefreshWishlistHearts();
  return sfWishlistIds.size;
}

function sfSetWishlistBadge() {
  document.querySelectorAll('[data-count="wishlist"]').forEach((el) => {
    el.textContent = sfWishlistIds.size;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  });
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.js-toggle-wishlist');
  if (!btn) return;
  e.preventDefault();

  const productId = btn.dataset.id;
  let added;
  try {
    const data = await sfFetch(`/api/users/wishlist/${productId}`, { method: 'POST' });
    added = data.added;
  } catch (err) {
    if (err.status !== 401) {
      sfToast(err.message, 'error');
      return;
    }
    // Signed out: save in this browser instead
    const ids = sfGetGuestWishlist();
    added = !ids.includes(productId);
    sfSaveGuestWishlist(added ? ids.concat(productId) : ids.filter((id) => id !== productId));
  }

  if (added) sfWishlistIds.add(productId);
  else sfWishlistIds.delete(productId);
  sfRefreshWishlistHearts();
  sfSetWishlistBadge();
  sfToast(added ? 'Added to your wishlist' : 'Removed from your wishlist');

  // On the wishlist page, drop the card straight away when un-hearted
  if (!added && document.getElementById('wishlistPageGrid')) {
    const card = btn.closest('.col-6, .col-md-4, .col-lg-3');
    if (card) card.remove();
    if (!sfWishlistIds.size && typeof sfRenderWishlistPage === 'function') sfRenderWishlistPage();
  }
});
