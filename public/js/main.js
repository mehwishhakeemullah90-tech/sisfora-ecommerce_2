// public/js/main.js
// -----------------------------------------------------------------------
// Global site chrome behaviour: sticky navbar shadow, mobile search
// toggle, newsletter form, and updating the cart/wishlist badge counts
// on every page load.
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Navbar shadow on scroll
  const navbar = document.getElementById('sfNavbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 12);
    });
  }

  // Desktop search toggle
  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('sfSearchBar');
  if (searchToggle && searchBar && window.bootstrap) {
    const collapse = new bootstrap.Collapse(searchBar, { toggle: false });
    searchToggle.addEventListener('click', (e) => {
      e.preventDefault();
      collapse.toggle();
    });
  }
  const mobileSearchToggle = document.getElementById('mobileSearchToggle');
  if (mobileSearchToggle) {
    mobileSearchToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const kw = prompt('Search Sisfora for...');
      if (kw) window.location.href = `/shop?keyword=${encodeURIComponent(kw)}`;
    });
  }

  // Newsletter (demo — no real backend endpoint required by spec)
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sfToast('Thank you for subscribing to the Sisfora Circle!');
      newsletterForm.reset();
    });
  }

  // Logout
  document.querySelectorAll('#logoutBtn, #adminLogoutBtn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await sfFetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        /* ignore */
      }
      window.location.href = btn.id === 'adminLogoutBtn' ? '/admin/login' : '/';
    });
  });

  updateNavBadges();
});

/** Refresh the cart + wishlist counters shown in the navbar */
async function updateNavBadges() {
  // Cart count comes from localStorage (client-side cart)
  const cart = sfGetCart();
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = count;
    cartCountEl.classList.toggle('d-none', count === 0);
  }

  // Wishlist count requires a logged-in user
  const wishlistCountEl = document.getElementById('wishlistCount');
  if (wishlistCountEl) {
    try {
      const { wishlist } = await sfFetch('/api/users/wishlist');
      wishlistCountEl.textContent = wishlist.length;
      wishlistCountEl.classList.toggle('d-none', wishlist.length === 0);
    } catch (err) {
      wishlistCountEl.classList.add('d-none');
    }
  }
}
