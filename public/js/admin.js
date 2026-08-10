// public/js/admin.js
// -----------------------------------------------------------------------
// Admin dashboard behaviour: login, analytics + charts, and CRUD tables
// for products, categories, orders, customers, reviews, and coupons.
// Each section only runs if its container element exists on the page.
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initAdminLogin();
  initSidebarToggle();
  initDashboard();
  initProducts();
  initCategories();
  initOrders();
  initCustomers();
  initReviews();
  initCoupons();
  initReports();
});

function initSidebarToggle() {
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('adminSidebar')?.classList.toggle('open');
  });
}

// ======================================================================
// Admin Login
// ======================================================================
function initAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await sfFetch('/api/auth/admin-login', { method: 'POST', body: { email: form.email.value, password: form.password.value } });
      window.location.href = '/admin/dashboard';
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });
}

// ======================================================================
// Dashboard
// ======================================================================
async function initDashboard() {
  const el = document.getElementById('dashboardStats');
  if (!el) return;
  try {
    const { stats } = await sfFetch('/api/admin/dashboard');

    document.getElementById('statRevenue').textContent = sfCurrency(stats.totalRevenue);
    document.getElementById('statOrders').textContent = stats.totalOrders;
    document.getElementById('statProducts').textContent = stats.totalProducts;
    document.getElementById('statCustomers').textContent = stats.totalCustomers;

    const recentEl = document.getElementById('recentOrdersTable');
    recentEl.innerHTML = stats.recentOrders
      .map(
        (o) => `
      <tr>
        <td>#${o.orderNumber}</td>
        <td>${o.user ? sfEscape(o.user.name) : 'Guest'}</td>
        <td>${sfCurrency(o.totalPrice)}</td>
        <td><span class="badge-status ${o.status}">${o.status}</span></td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      </tr>`
      )
      .join('') || '<tr><td colspan="5" class="text-center text-muted py-3">No orders yet</td></tr>';

    const lowStockEl = document.getElementById('lowStockList');
    if (lowStockEl) {
      lowStockEl.innerHTML = stats.lowStock.length
        ? stats.lowStock.map((p) => `<li class="d-flex justify-content-between py-1"><span>${sfEscape(p.name)}</span><span class="text-danger fw-semibold">${p.stock} left</span></li>`).join('')
        : '<li class="text-muted">All products well stocked</li>';
    }

    if (window.Chart) {
      const ctx = document.getElementById('orderStatusChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: stats.statusCounts.map((s) => s._id),
            datasets: [{ data: stats.statusCounts.map((s) => s.count), backgroundColor: ['#c9a24b', '#2f5fa3', '#5a3fa8', '#227a45', '#a13a3a'] }],
          },
          options: { plugins: { legend: { position: 'bottom' } } },
        });
      }
    }
  } catch (err) {
    sfToast(err.message, 'error');
  }
}

// ======================================================================
// Products
// ======================================================================
async function initProducts() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  let categories = [];
  try {
    const catData = await sfFetch('/api/categories');
    categories = catData.categories;
    const catSelect = document.getElementById('productCategorySelect');
    if (catSelect) catSelect.innerHTML = categories.map((c) => `<option value="${c._id}">${sfEscape(c.name)}</option>`).join('');
  } catch (err) { /* ignore */ }

  async function loadProducts() {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr>';
    try {
      const { products } = await sfFetch('/api/products?limit=100');
      tbody.innerHTML = products
        .map(
          (p) => `
        <tr>
          <td><img src="${p.thumbnail}" class="thumb-sf" /></td>
          <td>${sfEscape(p.name)}</td>
          <td>${p.category ? sfEscape(p.category.name) : '-'}</td>
          <td>${sfCurrency(p.finalPrice)} ${p.discountPrice ? `<span class="text-muted text-decoration-line-through small">${sfCurrency(p.price)}</span>` : ''}</td>
          <td>${p.stock}</td>
          <td>${p.isActive ? '<span class="badge-status delivered">Active</span>' : '<span class="badge-status cancelled">Hidden</span>'}</td>
          <td>
            <button class="btn btn-sm btn-outline-secondary js-edit-product" data-id="${p._id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger js-delete-product" data-id="${p._id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`
        )
        .join('') || '<tr><td colspan="7" class="text-center text-muted py-4">No products yet</td></tr>';
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center py-4">${err.message}</td></tr>`;
    }
  }

  const form = document.getElementById('productForm');
  const modalEl = document.getElementById('productModal');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;

  document.getElementById('addProductBtn')?.addEventListener('click', () => {
    form.reset();
    form.productId.value = '';
    document.getElementById('productModalTitle').textContent = 'Add Product';
    modal.show();
  });

  tbody.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.js-edit-product');
    const delBtn = e.target.closest('.js-delete-product');
    if (editBtn) {
      const { product } = await sfFetch(`/api/products/id/${editBtn.dataset.id}`);
      form.productId.value = product._id;
      form.name.value = product.name;
      form.brand.value = product.brand;
      form.category.value = product.category?._id || product.category;
      form.description.value = product.description;
      form.shortDescription.value = product.shortDescription || '';
      form.price.value = product.price;
      form.discountPrice.value = product.discountPrice || '';
      form.stock.value = product.stock;
      form.thumbnail.value = product.thumbnail;
      form.images.value = (product.images || []).join(', ');
      form.tags.value = (product.tags || []).join(', ');
      form.isNewArrival.checked = product.isNewArrival;
      form.isBestSeller.checked = product.isBestSeller;
      form.isFeatured.checked = product.isFeatured;
      form.isActive.checked = product.isActive;
      document.getElementById('productModalTitle').textContent = 'Edit Product';
      modal.show();
    }
    if (delBtn) {
      if (!confirm('Delete this product? This cannot be undone.')) return;
      try {
        await sfFetch(`/api/products/${delBtn.dataset.id}`, { method: 'DELETE' });
        sfToast('Product deleted');
        loadProducts();
      } catch (err) {
        sfToast(err.message, 'error');
      }
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.value,
      brand: form.brand.value,
      category: form.category.value,
      description: form.description.value,
      shortDescription: form.shortDescription.value,
      price: Number(form.price.value),
      discountPrice: Number(form.discountPrice.value) || 0,
      stock: Number(form.stock.value),
      thumbnail: form.thumbnail.value || '/images/products/placeholder.svg',
      images: form.images.value ? form.images.value.split(',').map((s) => s.trim()) : ['/images/products/placeholder.svg'],
      tags: form.tags.value ? form.tags.value.split(',').map((s) => s.trim()) : [],
      isNewArrival: form.isNewArrival.checked,
      isBestSeller: form.isBestSeller.checked,
      isFeatured: form.isFeatured.checked,
      isActive: form.isActive.checked,
    };
    try {
      if (form.productId.value) {
        await sfFetch(`/api/products/${form.productId.value}`, { method: 'PUT', body: payload });
        sfToast('Product updated');
      } else {
        await sfFetch('/api/products', { method: 'POST', body: payload });
        sfToast('Product created');
      }
      modal.hide();
      loadProducts();
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });

  // Image upload input (optional convenience — uploads then fills thumbnail field)
  document.getElementById('productImageUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      form.thumbnail.value = data.url;
      sfToast('Image uploaded');
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });

  loadProducts();
}

// ======================================================================
// Categories
// ======================================================================
async function initCategories() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  async function loadCategories() {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr>';
    try {
      const { categories } = await sfFetch('/api/categories');
      tbody.innerHTML = categories
        .map(
          (c) => `
        <tr>
          <td><img src="${c.image}" class="thumb-sf" /></td>
          <td>${sfEscape(c.name)}</td>
          <td>${c.productCount}</td>
          <td>
            <button class="btn btn-sm btn-outline-secondary js-edit-category" data-id="${c._id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger js-delete-category" data-id="${c._id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`
        )
        .join('') || '<tr><td colspan="4" class="text-center text-muted py-4">No categories yet</td></tr>';
      window.__sfCategories = categories;
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-danger text-center py-4">${err.message}</td></tr>`;
    }
  }

  const form = document.getElementById('categoryForm');
  const modalEl = document.getElementById('categoryModal');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;

  document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
    form.reset();
    form.categoryId.value = '';
    modal.show();
  });

  tbody.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.js-edit-category');
    const delBtn = e.target.closest('.js-delete-category');
    if (editBtn) {
      const cat = window.__sfCategories.find((c) => c._id === editBtn.dataset.id);
      form.categoryId.value = cat._id;
      form.name.value = cat.name;
      form.description.value = cat.description || '';
      form.image.value = cat.image || '';
      form.isFeatured.checked = cat.isFeatured;
      modal.show();
    }
    if (delBtn) {
      if (!confirm('Delete this category?')) return;
      try {
        await sfFetch(`/api/categories/${delBtn.dataset.id}`, { method: 'DELETE' });
        sfToast('Category deleted');
        loadCategories();
      } catch (err) {
        sfToast(err.message, 'error');
      }
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.value,
      description: form.description.value,
      image: form.image.value || '/images/products/placeholder.svg',
      isFeatured: form.isFeatured.checked,
    };
    try {
      if (form.categoryId.value) {
        await sfFetch(`/api/categories/${form.categoryId.value}`, { method: 'PUT', body: payload });
      } else {
        await sfFetch('/api/categories', { method: 'POST', body: payload });
      }
      sfToast('Category saved');
      modal.hide();
      loadCategories();
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });

  loadCategories();
}

// ======================================================================
// Orders
// ======================================================================
async function initOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  async function loadOrders() {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr>';
    try {
      const { orders } = await sfFetch('/api/orders');
      tbody.innerHTML = orders
        .map(
          (o) => `
        <tr>
          <td>#${o.orderNumber}</td>
          <td>${o.user ? sfEscape(o.user.name) : 'Guest'}</td>
          <td>${sfCurrency(o.totalPrice)}</td>
          <td>${o.paymentMethod}</td>
          <td>
            <select class="form-select form-select-sm js-order-status" data-id="${o._id}" style="width:130px;">
              ${['pending', 'processing', 'shipped', 'delivered', 'cancelled']
                .map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`)
                .join('')}
            </select>
          </td>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
        </tr>`
        )
        .join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No orders yet</td></tr>';
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center py-4">${err.message}</td></tr>`;
    }
  }

  tbody.addEventListener('change', async (e) => {
    if (!e.target.classList.contains('js-order-status')) return;
    try {
      await sfFetch(`/api/orders/${e.target.dataset.id}/status`, { method: 'PUT', body: { status: e.target.value } });
      sfToast('Order status updated');
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });

  loadOrders();
}

// ======================================================================
// Customers
// ======================================================================
async function initCustomers() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  async function loadCustomers() {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr>';
    try {
      const { users } = await sfFetch('/api/users');
      tbody.innerHTML = users
        .map(
          (u) => `
        <tr>
          <td>${sfEscape(u.name)}</td>
          <td>${sfEscape(u.email)}</td>
          <td>${u.phone ? sfEscape(u.phone) : '-'}</td>
          <td>${u.isActive ? '<span class="badge-status delivered">Active</span>' : '<span class="badge-status cancelled">Banned</span>'}</td>
          <td><button class="btn btn-sm btn-outline-secondary js-toggle-user" data-id="${u._id}">${u.isActive ? 'Ban' : 'Unban'}</button></td>
        </tr>`
        )
        .join('') || '<tr><td colspan="5" class="text-center text-muted py-4">No customers yet</td></tr>';
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-4">${err.message}</td></tr>`;
    }
  }

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('.js-toggle-user');
    if (!btn) return;
    try {
      await sfFetch(`/api/users/${btn.dataset.id}/toggle-active`, { method: 'PUT' });
      loadCustomers();
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });

  loadCustomers();
}

// ======================================================================
// Reviews
// ======================================================================
async function initReviews() {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  async function loadReviews() {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr>';
    try {
      const { reviews } = await sfFetch('/api/reviews');
      tbody.innerHTML = reviews
        .map(
          (r) => `
        <tr>
          <td>${sfEscape(r.product?.name || 'N/A')}</td>
          <td>${sfEscape(r.user?.name || 'N/A')}</td>
          <td>${sfStars(r.rating)}</td>
          <td>${sfEscape(r.comment).slice(0, 60)}${r.comment.length > 60 ? '…' : ''}</td>
          <td>${r.isApproved ? '<span class="badge-status delivered">Approved</span>' : '<span class="badge-status pending">Hidden</span>'}</td>
          <td>
            <button class="btn btn-sm btn-outline-secondary js-toggle-review" data-id="${r._id}">${r.isApproved ? 'Hide' : 'Approve'}</button>
            <button class="btn btn-sm btn-outline-danger js-delete-review" data-id="${r._id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`
        )
        .join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No reviews yet</td></tr>';
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center py-4">${err.message}</td></tr>`;
    }
  }

  tbody.addEventListener('click', async (e) => {
    const toggleBtn = e.target.closest('.js-toggle-review');
    const delBtn = e.target.closest('.js-delete-review');
    try {
      if (toggleBtn) {
        await sfFetch(`/api/reviews/${toggleBtn.dataset.id}/approve`, { method: 'PUT' });
        loadReviews();
      }
      if (delBtn) {
        if (!confirm('Delete this review?')) return;
        await sfFetch(`/api/reviews/${delBtn.dataset.id}`, { method: 'DELETE' });
        loadReviews();
      }
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });

  loadReviews();
}

// ======================================================================
// Coupons
// ======================================================================
async function initCoupons() {
  const tbody = document.getElementById('couponsTableBody');
  if (!tbody) return;

  async function loadCoupons() {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr>';
    try {
      const { coupons } = await sfFetch('/api/coupons');
      tbody.innerHTML = coupons
        .map(
          (c) => `
        <tr>
          <td class="fw-semibold">${sfEscape(c.code)}</td>
          <td>${c.discountType === 'percentage' ? `${c.discountValue}%` : sfCurrency(c.discountValue)}</td>
          <td>${c.usedCount} / ${c.usageLimit}</td>
          <td>${new Date(c.expiresAt).toLocaleDateString()}</td>
          <td>${c.isActive ? '<span class="badge-status delivered">Active</span>' : '<span class="badge-status cancelled">Disabled</span>'}</td>
          <td><button class="btn btn-sm btn-outline-danger js-delete-coupon" data-id="${c._id}"><i class="bi bi-trash"></i></button></td>
        </tr>`
        )
        .join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No coupons yet</td></tr>';
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center py-4">${err.message}</td></tr>`;
    }
  }

  const form = document.getElementById('couponForm');
  const modalEl = document.getElementById('couponModal');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;

  document.getElementById('addCouponBtn')?.addEventListener('click', () => {
    form.reset();
    modal.show();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await sfFetch('/api/coupons', {
        method: 'POST',
        body: {
          code: form.code.value,
          description: form.description.value,
          discountType: form.discountType.value,
          discountValue: Number(form.discountValue.value),
          minOrderAmount: Number(form.minOrderAmount.value) || 0,
          maxDiscountAmount: form.maxDiscountAmount.value ? Number(form.maxDiscountAmount.value) : undefined,
          usageLimit: Number(form.usageLimit.value) || 100,
          expiresAt: form.expiresAt.value,
        },
      });
      sfToast('Coupon created');
      modal.hide();
      loadCoupons();
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });

  tbody.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.js-delete-coupon');
    if (!delBtn) return;
    if (!confirm('Delete this coupon?')) return;
    try {
      await sfFetch(`/api/coupons/${delBtn.dataset.id}`, { method: 'DELETE' });
      loadCoupons();
    } catch (err) {
      sfToast(err.message, 'error');
    }
  });

  loadCoupons();
}

// ======================================================================
// Sales Reports
// ======================================================================
async function initReports() {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  try {
    const { dailySales, topProducts } = await sfFetch('/api/admin/reports/sales?days=30');

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: dailySales.map((d) => d._id),
        datasets: [
          { label: 'Revenue', data: dailySales.map((d) => d.revenue), borderColor: '#c9a24b', backgroundColor: 'rgba(201,162,75,0.15)', fill: true, tension: 0.35 },
        ],
      },
      options: { responsive: true },
    });

    const topEl = document.getElementById('topProductsList');
    if (topEl) {
      topEl.innerHTML = topProducts
        .map((p) => `<li class="d-flex justify-content-between py-2 border-bottom"><span>${sfEscape(p.name)}</span><span class="fw-semibold">${p.unitsSold} sold &middot; ${sfCurrency(p.revenue)}</span></li>`)
        .join('') || '<li class="text-muted">No sales yet</li>';
    }
  } catch (err) {
    sfToast(err.message, 'error');
  }
}
