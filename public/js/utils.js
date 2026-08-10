// public/js/utils.js
// -----------------------------------------------------------------------
// Shared helpers used across the storefront: fetch wrapper, toast
// notifications, currency formatting, and scroll-reveal animations.
// -----------------------------------------------------------------------

/** Wraps fetch() with JSON handling + credentials so the JWT cookie is sent. */
async function sfFetch(url, options = {}) {
  const opts = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  };
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);

  const res = await fetch(url, opts);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { success: false, message: 'Unexpected server response' };
  }
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Shows a small slide-in toast notification (success or error). */
function sfToast(message, type = 'success') {
  const el = document.getElementById('sfToast');
  if (!el) return;
  el.textContent = message;
  el.className = `toast-sf show ${type === 'error' ? 'error' : ''}`;
  clearTimeout(window.__sfToastTimer);
  window.__sfToastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/** Formats a number as currency, e.g. 24.5 -> "$24.50" */
function sfCurrency(amount) {
  const currency = (window.SF_CURRENCY || 'USD').toUpperCase();
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${Number(amount || 0).toFixed(2)}`;
}

/** Simple query-string parser */
function sfQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

/** Escape HTML to prevent XSS when injecting user-controlled text */
function sfEscape(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/** Renders a row of star icons for a given rating (0-5, supports halves) */
function sfStars(rating) {
  const r = Math.round((rating || 0) * 2) / 2;
  let html = '';
  for (let i = 1; i <= 5; i += 1) {
    if (r >= i) html += '<i class="bi bi-star-fill"></i>';
    else if (r >= i - 0.5) html += '<i class="bi bi-star-half"></i>';
    else html += '<i class="bi bi-star"></i>';
  }
  return html;
}

/** IntersectionObserver-based scroll-reveal for elements with .sf-reveal */
function sfInitScrollReveal() {
  const items = document.querySelectorAll('.sf-reveal');
  if (!items.length || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('sf-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sf-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', sfInitScrollReveal);
