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

  // Back-to-top button: appears after scrolling down a screen
  const backToTop = document.getElementById('sfBackToTop');
  if (backToTop) {
    const toggleBackToTop = () => backToTop.classList.toggle('show', window.scrollY > window.innerHeight * 0.8);
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Newsletter: saved to Admin -> Contact Messages so no sign-up is lost
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"]').value.trim();
      const btn = newsletterForm.querySelector('button');
      btn.disabled = true;
      try {
        await sfFetch('/api/contact', {
          method: 'POST',
          body: { fullName: 'Newsletter subscriber', email, subject: 'Newsletter sign-up', message: `Please add ${email} to the Sisfora Circle newsletter.` },
        });
        sfToast('Welcome to the Sisfora Circle!');
        newsletterForm.reset();
      } catch (err) {
        sfToast(err.message || 'Could not subscribe, please try again', 'error');
      } finally {
        btn.disabled = false;
      }
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
  sfInitLiveSearch();
});

/**
 * Header search box: shows popular products as soon as it's clicked and
 * matching products (with photos) while typing — no Enter needed.
 * Enter (or "View all results") opens the full /search page.
 */
function sfInitLiveSearch() {
  const form = document.getElementById('sfSearchPill');
  if (!form) return;
  const input = form.querySelector('input[name="q"]');

  const panel = document.createElement('div');
  panel.className = 'sf-live-search';
  panel.id = 'sfLiveSearch';
  panel.hidden = true;
  form.appendChild(panel);
  input.setAttribute('aria-controls', 'sfLiveSearch');

  let debounce;
  let requestId = 0;

  function productRow(p) {
    const price = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price;
    const img = p.thumbnail || (p.images && p.images[0]) || '/images/products/placeholder.svg';
    return `<a class="sf-live-item" href="/product/${p.slug}">
        <img src="${img}" alt="" loading="lazy" />
        <span class="sf-live-name">${sfEscape(p.name)}</span>
        <span class="sf-live-price">${sfCurrency(price)}</span>
      </a>`;
  }

  async function update() {
    const q = input.value.trim();
    const myId = ++requestId;
    try {
      const data = await sfFetch(`/api/products/search?q=${encodeURIComponent(q)}&limit=6`);
      if (myId !== requestId) return;
      let html = '';
      if (!q) {
        html += '<p class="sf-live-heading">Popular right now</p>';
        html += (data.products || []).map(productRow).join('');
        if (data.categories && data.categories.length) {
          html += '<p class="sf-live-heading">Categories</p><div class="sf-search-chips px-3 pb-3">' +
            data.categories.map((c) => `<a class="sf-chip" href="/categories/${c.slug}">${sfEscape(c.name)}</a>`).join('') + '</div>';
        }
      } else if (data.total === 0) {
        html += `<p class="sf-live-empty">No products found for “${sfEscape(q)}”. Try another word.</p>`;
      } else {
        if (data.suggestions && data.suggestions.length) {
          html += '<p class="sf-live-heading">Suggestions</p><div class="sf-search-chips px-3 pb-2">' +
            data.suggestions.map((w) => `<a class="sf-chip" href="/search?q=${encodeURIComponent(w)}">${sfEscape(w)}</a>`).join('') + '</div>';
        }
        html += '<p class="sf-live-heading">Products</p>' + data.products.map(productRow).join('');
        html += `<a class="sf-live-all" href="/search?q=${encodeURIComponent(q)}">View all ${data.total} result${data.total === 1 ? '' : 's'} <i class="bi bi-arrow-right"></i></a>`;
      }
      panel.innerHTML = html;
      panel.hidden = false;
    } catch (err) {
      panel.hidden = true;
    }
  }

  input.addEventListener('focus', update);
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(update, 200);
  });
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) panel.hidden = true;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { panel.hidden = true; input.blur(); }
  });
}

/** Refresh the cart + wishlist counters shown in the navbar */
async function updateNavBadges() {
  // Cart count comes from localStorage (client-side cart)
  const cart = sfGetCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('[data-count="cart"]').forEach((el) => {
    if (el.textContent !== String(count)) {
      el.textContent = count; // always shown, even when 0
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    }
  });

  // Wishlist count: account if signed in, otherwise this browser (wishlist.js)
  if (typeof sfLoadWishlistIds === 'function') {
    const n = await sfLoadWishlistIds();
    document.querySelectorAll('[data-count="wishlist"]').forEach((el) => { el.textContent = n; });
  }
}
