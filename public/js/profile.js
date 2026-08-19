// public/js/profile.js
// -----------------------------------------------------------------------
// My Account page: profile details, order history, wishlist, saved
// shipping addresses, and change password — all tab panels loaded on
// demand from the JSON API.
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const page = document.getElementById('profilePage');
  if (!page) return;

  loadProfileData();
  loadOrders();
  loadWishlist();
  loadAddresses();

  // ---- Load profile data into form fields ----
  async function loadProfileData() {
    try {
      const { user } = await sfFetch('/api/auth/me');
      if (!user) return;
      const profileForm = document.getElementById('profileForm');
      if (profileForm) {
        const nameInput = profileForm.querySelector('[name="name"]');
        const emailInput = profileForm.querySelector('[type="email"]');
        const phoneInput = profileForm.querySelector('[name="phone"]');
        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
      }
      const welcomeEl = document.getElementById('profileWelcome');
      if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.name}`;
    } catch (err) { /* protect middleware handles auth redirect */ }
  }

  // ---- Update profile form ----
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await sfFetch('/api/users/profile', {
          method: 'PUT',
          body: { name: profileForm.name.value, phone: profileForm.phone.value },
        });
        sfToast('Profile updated successfully');
      } catch (err) {
        sfToast(err.message, 'error');
      }
    });
  }

  // ---- Orders ----
  async function loadOrders() {
    const el = document.getElementById('ordersListContainer');
    if (!el) return;
    try {
      const { orders } = await sfFetch('/api/orders/my');
      if (!orders.length) {
        el.innerHTML = '<p class="text-muted">You haven\'t placed any orders yet. <a href="/shop">Start shopping</a></p>';
        return;
      }
      el.innerHTML = orders
        .map(
          (o) => `
        <div class="admin-card mb-3">
          <div class="card-header-sf">
            <div>
              <strong>#${o.orderNumber}</strong>
              <div class="small text-muted">${new Date(o.createdAt).toLocaleDateString()} &middot; ${o.items.length} item(s)</div>
            </div>
            <span class="badge-status ${o.status}">${o.status}</span>
          </div>
          <div class="p-3">
            <div class="d-flex justify-content-between">
              <span class="text-muted small">Payment: ${o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'} ${o.isPaid ? '(Paid)' : ''}</span>
              <span class="fw-semibold">${sfCurrency(o.totalPrice)}</span>
            </div>
          </div>
        </div>`
        )
        .join('');
    } catch (err) {
      el.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
  }

  // ---- Wishlist ----
  async function loadWishlist() {
    const el = document.getElementById('wishlistGridContainer');
    if (!el) return;
    try {
      const { wishlist } = await sfFetch('/api/users/wishlist');
      if (!wishlist.length) {
        el.innerHTML = '<div class="col-12"><p class="text-muted">Your wishlist is empty. <a href="/shop">Discover products</a></p></div>';
        return;
      }
      el.innerHTML = wishlist.map((p) => sfProductCardHTML(p)).join('');
    } catch (err) {
      el.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
  }

  // ---- Addresses ----
  async function loadAddresses() {
    const el = document.getElementById('addressListContainer');
    if (!el) return;
    try {
      const { user } = await sfFetch('/api/auth/me');
      renderAddresses(user.addresses || []);
    } catch (err) {
      el.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
  }

  function renderAddresses(addresses) {
    const el = document.getElementById('addressListContainer');
    if (!addresses.length) {
      el.innerHTML = '<p class="text-muted">No saved addresses yet.</p>';
      return;
    }
    el.innerHTML = addresses
      .map(
        (a) => `
      <div class="border-sf rounded-sf p-3 mb-2 d-flex justify-content-between align-items-start">
        <div>
          <strong>${sfEscape(a.label || 'Address')}</strong> ${a.isDefault ? '<span class="badge bg-dark">Default</span>' : ''}
          <div class="small text-muted">${sfEscape(a.fullName)} &middot; ${sfEscape(a.phone)}</div>
          <div class="small text-muted">${sfEscape(a.addressLine1)}, ${sfEscape(a.city)}, ${sfEscape(a.country)}</div>
        </div>
        <button class="btn btn-sm text-danger js-delete-address" data-id="${a._id}"><i class="bi bi-trash"></i></button>
      </div>`
      )
      .join('');
  }

  document.getElementById('addressListContainer')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.js-delete-address');
    if (!btn) return;
    try {
      const data = await sfFetch(`/api/users/addresses/${btn.dataset.id}`, { method: 'DELETE' });
      renderAddresses(data.addresses);
      sfToast('Address removed');
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });

  const addAddressForm = document.getElementById('addAddressForm');
  if (addAddressForm) {
    addAddressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await sfFetch('/api/users/addresses', {
          method: 'POST',
          body: {
            label: addAddressForm.label.value || 'Home',
            fullName: addAddressForm.fullName.value,
            phone: addAddressForm.phone.value,
            addressLine1: addAddressForm.addressLine1.value,
            addressLine2: addAddressForm.addressLine2.value,
            city: addAddressForm.city.value,
            state: addAddressForm.state.value,
            postalCode: addAddressForm.postalCode.value,
            country: addAddressForm.country.value,
            isDefault: addAddressForm.isDefault.checked,
          },
        });
        renderAddresses(data.addresses);
        addAddressForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('addAddressModal'))?.hide();
        sfToast('Address added');
      } catch (err) {
        sfToast(err.message, 'error');
      }
    });
  }
});
