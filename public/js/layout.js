// public/js/layout.js
// -----------------------------------------------------------------------
// Shared site chrome for every storefront page: rotating announcement
// bar, vertical side menu, top header with live search, mobile bottom
// bar, newsletter band, footer, promo pop-up, animated cursor and chat.
// Edit it here once and every page updates.
//
// How pages use it:
//   <body>
//     <div id="sfHeader"></div>
//     <script src="/js/site-config.js"></script>
//     <script src="/js/layout.js"></script>   <- renders the header right away
//     ... page content ...
//     <div id="sfFooter"></div>               <- data-newsletter="off" hides the newsletter band
//
// Contact details, social links, live categories, promo text and the
// Tawk.to chat id all come from config/storefront.js (via site-config.js).
// -----------------------------------------------------------------------

var SF_SITE = window.SF_SITE || { email: '', phone: '', social: {}, categories: [] };

// ---- Inline SVG icons (crisp at any size, no extra download) ----------
var SF_ICONS = {
  menu: '<path d="M4 7h16M4 12h11M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.8 4.1-5.6 7.5-5.6s6.3 1.8 7.5 5.6"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  bag: '<path d="M5.5 8.5h13l-1 11.5h-11z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
  home: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 10v10h12V10"/>',
  grid: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.2"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.2"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.2"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.2"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  phone: '<path d="M7 4h3l1.5 4-2 1.3a10 10 0 0 0 5.2 5.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 5 6.2 2 2 0 0 1 7 4z"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  truck: '<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6" fill="currentColor"/>',
  facebook: '<path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V9a.5.5 0 0 1 .5-.5z"/>',
  tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.5 2.6 2.3 4.2 5 4.4"/>',
  pinterest: '<circle cx="12" cy="12" r="8.5"/><path d="M10.5 20l1.8-7.5M11 13.5c.5 1.2 1.6 1.8 2.8 1.6 2-.3 3.2-2.4 3-4.7-.3-2.6-2.8-4.2-5.5-3.8-2.8.4-4.6 2.8-4.1 5.3"/>',
};

function sfIcon(name, size) {
  var s = size || 20;
  return '<svg class="sf-ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (SF_ICONS[name] || '') + '</svg>';
}

/** Categories customers can currently see (others are hidden until launch). */
function sfLiveCategories() {
  return (SF_SITE.categories || []).filter(function (c) { return c.live; });
}

/** Free-shipping amount in Rupees, e.g. "Rs. 14,000" (formatted by the server). */
function sfFreeShippingText() {
  return (SF_SITE.formatted && SF_SITE.formatted.freeShippingThreshold) || '';
}

function sfTel() {
  return String(SF_SITE.phone || '').replace(/\s+/g, '');
}

function sfLogoHTML(extraClass) {
  return (
    '<a class="sf-logo ' + (extraClass || '') + '" href="/" aria-label="Sisfora — back to home">' +
      '<span class="sf-logo-mark"><img src="/images/brand/sisfora-mark-gold.webp" alt="" width="200" height="240"></span>' +
      '<span class="sf-logo-word">Sisfora</span>' +
    '</a>'
  );
}

/** Messages that rotate in the announcement bar at the very top. */
function sfAnnouncements() {
  return [
    sfIcon('truck', 15) + '<span>Free delivery over ' + sfFreeShippingText() + ' across Pakistan</span>',
    sfIcon('spark', 15) + '<span>Reveal Your Natural Beauty — <a href="/offers">Shop the offers</a></span>',
    sfIcon('phone', 15) + '<span>Need help? Call <a href="tel:' + sfTel() + '">' + SF_SITE.phone + '</a></span>',
  ];
}

function sfTopbarHTML() {
  var slides = sfAnnouncements().map(function (msg, i) {
    return '<p class="sf-announce-slide' + (i === 0 ? ' active' : '') + '">' + msg + '</p>';
  }).join('');
  return (
    '<div class="sf-topbar sf-announce" role="region" aria-label="Announcements">' +
      '<button type="button" class="sf-announce-arrow" data-dir="-1" aria-label="Previous announcement">' + sfIcon('left', 14) + '</button>' +
      '<div class="sf-announce-track" aria-live="polite">' + slides + '</div>' +
      '<button type="button" class="sf-announce-arrow" data-dir="1" aria-label="Next announcement">' + sfIcon('right', 14) + '</button>' +
    '</div>'
  );
}

/** Vertical side menu: fixed on large screens, a slide-in drawer on phones/tablets. */
function sfSideMenuHTML() {
  var n = 0;
  function link(href, label) {
    n += 1;
    return '<li><a class="sf-side-link" href="' + href + '"><span class="sf-side-num">' + (n < 10 ? '0' + n : n) + '</span><span class="sf-side-text">' + label + '</span></a></li>';
  }
  var categoryLinks = sfLiveCategories().map(function (c) {
    return '<li><a class="sf-side-link sf-side-sublink" href="/categories/' + c.slug + '"><span class="sf-side-dot"></span><span class="sf-side-text">' + c.name + '</span><span class="sf-side-tag">Shop</span></a></li>';
  }).join('');

  return (
    '<aside class="sf-sidebar" id="sfSidebar" aria-label="Main menu">' +
      '<div class="sf-sidebar-glow" aria-hidden="true"></div>' +
      '<div class="sf-sidebar-head">' +
        sfLogoHTML('sf-logo--side') +
        '<button type="button" class="sf-sidebar-close" id="sfSidebarClose" aria-label="Close menu">' + sfIcon('close', 22) + '</button>' +
      '</div>' +
      '<nav class="sf-side-nav" aria-label="Site">' +
        '<ul class="list-unstyled mb-0">' +
          link('/', 'Home') +
          link('/shop', 'Shop All') +
          '<li class="sf-side-label">Shop by Category</li>' +
          categoryLinks +
          '<li class="sf-side-divider" aria-hidden="true"></li>' +
          link('/new-arrivals', 'New Arrivals') +
          link('/best-sellers', 'Best Sellers') +
          link('/offers', 'Offers') +
          link('/#ritual', 'The Ritual') +
          '<li class="sf-side-divider" aria-hidden="true"></li>' +
          '<li class="sf-side-minor"><a href="/about">About</a><a href="/blog">Journal</a><a href="/contact">Contact</a><a href="/shipping">Delivery</a><a href="/faq">FAQ</a></li>' +
        '</ul>' +
      '</nav>' +
      '<div class="sf-sidebar-foot">' +
        '<a href="tel:' + sfTel() + '">' + sfIcon('phone', 16) + '<span>' + SF_SITE.phone + '</span></a>' +
        '<a href="mailto:' + SF_SITE.email + '">' + sfIcon('mail', 16) + '<span>' + SF_SITE.email + '</span></a>' +
        sfSocialIconsHTML('sf-side-social') +
      '</div>' +
    '</aside>' +
    '<div class="sf-sidebar-overlay" id="sfSidebarOverlay"></div>'
  );
}

/** Slim top header: menu (small screens), logo (small screens), search, account/wishlist/cart. */
function sfNavbarHTML() {
  return (
    '<header class="sf-header" id="sfNavbar">' +
      '<div class="sf-header-inner">' +
        '<button type="button" class="sf-icon-btn sf-menu-btn" id="sfMenuBtn" aria-label="Open menu" aria-controls="sfSidebar" aria-expanded="false">' + sfIcon('menu', 24) + '</button>' +
        sfLogoHTML('sf-logo--header') +
        '<form action="/search" method="GET" class="sf-search-pill" id="sfSearchPill" role="search">' +
          sfIcon('search', 18) +
          '<input type="search" name="q" placeholder="Search serums, cleansers, moisturisers…" autocomplete="off" aria-label="Search products" />' +
          '<kbd class="sf-search-kbd" aria-hidden="true">/</kbd>' +
        '</form>' +
        '<div class="sf-header-icons">' +
          '<button type="button" class="sf-icon-btn sf-search-toggle" id="sfSearchToggle" aria-label="Search" aria-controls="sfSearchPill" aria-expanded="false">' + sfIcon('search', 22) + '</button>' +
          '<div class="dropdown d-inline-flex">' +
            '<a href="/profile" class="sf-icon-btn" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account">' + sfIcon('user', 22) + '</a>' +
            '<ul class="dropdown-menu dropdown-menu-end sf-dropdown">' +
              '<li><a class="dropdown-item" href="/profile">My Account</a></li>' +
              '<li><a class="dropdown-item" href="/profile?tab=orders">Order History</a></li>' +
              '<li><a class="dropdown-item" href="/wishlist">Wishlist</a></li>' +
              '<li><hr class="dropdown-divider"></li>' +
              '<li><a class="dropdown-item" href="/login">Sign in / Register</a></li>' +
              '<li><a class="dropdown-item" href="#" id="logoutBtn">Sign out</a></li>' +
            '</ul>' +
          '</div>' +
          '<a href="/wishlist" class="sf-icon-btn sf-hide-xs" aria-label="Wishlist">' + sfIcon('heart', 22) +
            '<span class="badge-count" id="wishlistCount" data-count="wishlist">0</span></a>' +
          '<a href="/cart" class="sf-icon-btn js-open-cart" aria-label="Cart">' + sfIcon('bag', 22) +
            '<span class="badge-count" id="cartCount" data-count="cart">0</span></a>' +
        '</div>' +
      '</div>' +
    '</header>'
  );
}

/** Phone-only bottom bar: the five things shoppers reach for most, one tap away. */
function sfBottomBarHTML() {
  return (
    '<nav class="sf-bottom-bar" aria-label="Quick links">' +
      '<a href="/" data-path="/">' + sfIcon('home', 22) + '<span>Home</span></a>' +
      '<a href="/shop" data-path="/shop">' + sfIcon('grid', 22) + '<span>Shop</span></a>' +
      '<a href="/search" data-path="/search" class="js-bottom-search">' + sfIcon('search', 22) + '<span>Search</span></a>' +
      '<a href="/wishlist" data-path="/wishlist">' + sfIcon('heart', 22) + '<span>Wishlist</span><em class="badge-count" data-count="wishlist">0</em></a>' +
      '<a href="/cart" data-path="/cart" class="js-open-cart">' + sfIcon('bag', 22) + '<span>Cart</span><em class="badge-count" data-count="cart">0</em></a>' +
    '</nav>'
  );
}

function sfNewsletterHTML() {
  return (
    '<section class="sf-newsletter" aria-labelledby="sfNewsletterTitle">' +
      '<div class="container">' +
        '<div class="sf-newsletter-card" data-tilt data-tilt-max="4">' +
          '<div class="sf-newsletter-orbit" aria-hidden="true"><span></span><span></span></div>' +
          '<div class="row align-items-center g-4 position-relative">' +
            '<div class="col-lg-6">' +
              '<p class="eyebrow eyebrow--light">The Sisfora Circle</p>' +
              '<h2 class="sf-newsletter-title" id="sfNewsletterTitle">Glow notes, <em>straight to your inbox.</em></h2>' +
              '<p class="sf-newsletter-sub">' + (SF_SITE.newsletterIncentive || 'Be the first to know about new arrivals and exclusive offers.') + '</p>' +
            '</div>' +
            '<div class="col-lg-6">' +
              '<form class="sf-newsletter-form" id="newsletterForm">' +
                '<label class="visually-hidden" for="sfNewsletterEmail">Email address</label>' +
                '<input type="email" id="sfNewsletterEmail" required placeholder="Your email address" autocomplete="email" />' +
                '<button type="submit" class="btn btn-gold">Subscribe ' + sfIcon('arrow', 18) + '</button>' +
              '</form>' +
              '<p class="sf-newsletter-note">By subscribing you agree to our <a href="/privacy-policy">privacy policy</a>. Unsubscribe any time.</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>'
  );
}

function sfSocialIconsHTML(extraClass) {
  var icons = [
    { key: 'instagram', label: 'Instagram' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'pinterest', label: 'Pinterest' },
  ];
  var social = SF_SITE.social || {};
  // Icons only appear once a real link is set in config/storefront.js
  var html = icons
    .filter(function (i) { return social[i.key]; })
    .map(function (i) {
      return '<a href="' + social[i.key] + '" class="social-icon" target="_blank" rel="noopener" aria-label="Sisfora on ' + i.label + '">' + sfIcon(i.key, 18) + '</a>';
    })
    .join('');
  return html ? '<div class="sf-social ' + (extraClass || '') + '">' + html + '</div>' : '';
}

function sfFooterHTML() {
  var cats = sfLiveCategories().map(function (c) {
    return '<li><a href="/categories/' + c.slug + '">' + c.name + '</a></li>';
  }).join('');
  return (
    '<footer class="sf-footer">' +
      '<div class="container">' +
        '<div class="sf-footer-top">' +
          '<div class="sf-footer-brand">' +
            sfLogoHTML('sf-logo--footer') +
            '<p>Reveal your natural beauty. Clean, luxurious skincare crafted to celebrate every skin story.</p>' +
            sfSocialIconsHTML() +
          '</div>' +
          '<div class="sf-footer-contact">' +
            '<h6>Contact Us</h6>' +
            '<a href="tel:' + sfTel() + '">' + sfIcon('phone', 16) + '<span>' + SF_SITE.phone + '</span></a>' +
            '<a href="mailto:' + SF_SITE.email + '">' + sfIcon('mail', 16) + '<span>' + SF_SITE.email + '</span></a>' +
          '</div>' +
        '</div>' +
        '<div class="sf-footer-cols">' +
          '<div><h6>Shop</h6><ul>' +
            '<li><a href="/shop">All Products</a></li>' + cats +
            '<li><a href="/new-arrivals">New Arrivals</a></li>' +
            '<li><a href="/best-sellers">Best Sellers</a></li>' +
            '<li><a href="/offers">Offers</a></li>' +
          '</ul></div>' +
          '<div><h6>Company</h6><ul>' +
            '<li><a href="/about">About Sisfora</a></li>' +
            '<li><a href="/blog">Journal</a></li>' +
            '<li><a href="/contact">Contact</a></li>' +
          '</ul></div>' +
          '<div><h6>Policies</h6><ul>' +
            '<li><a href="/faq">FAQs</a></li>' +
            '<li><a href="/shipping">Shipping &amp; Delivery</a></li>' +
            '<li><a href="/faq#returns">Returns &amp; Refunds</a></li>' +
            '<li><a href="/privacy-policy">Privacy Policy</a></li>' +
            '<li><a href="/terms">Terms &amp; Conditions</a></li>' +
          '</ul></div>' +
          '<div><h6>Account</h6><ul>' +
            '<li><a href="/profile">My Account</a></li>' +
            '<li><a href="/profile?tab=orders">Order History</a></li>' +
            '<li><a href="/wishlist">Wishlist</a></li>' +
            '<li><a href="/cart">Cart</a></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="sf-footer-bottom">' +
          '<span>&copy; ' + new Date().getFullYear() + ' Sisfora. All rights reserved.</span>' +
          '<span class="sf-footer-pay">Cash on Delivery · Card payments</span>' +
        '</div>' +
      '</div>' +
      '<div class="sf-footer-word" aria-hidden="true">SISFORA</div>' +
    '</footer>' +
    '<div id="sfToast" class="toast-sf" role="status" aria-live="polite"></div>' +
    '<button type="button" class="sf-back-to-top" id="sfBackToTop" aria-label="Back to top">' + sfIcon('up', 20) + '</button>'
  );
}

/** Highlight the menu link for the current page. */
function sfMarkActiveNav() {
  var path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('#sfSidebar .sf-side-link').forEach(function (link) {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
  document.querySelectorAll('.sf-bottom-bar a').forEach(function (a) {
    var p = a.dataset.path;
    if (p === path || (p !== '/' && path.indexOf(p) === 0) || (p === '/shop' && path.indexOf('/categories') === 0)) a.classList.add('active');
  });
}

/** Open / close the side menu drawer (phones and tablets). */
function sfInitSideMenu() {
  var sidebar = document.getElementById('sfSidebar');
  var overlay = document.getElementById('sfSidebarOverlay');
  var menuBtn = document.getElementById('sfMenuBtn');
  if (!sidebar || !menuBtn) return;

  function setOpen(open) {
    sidebar.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    document.body.classList.toggle('sf-no-scroll', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) document.getElementById('sfSidebarClose').focus();
  }

  menuBtn.addEventListener('click', function () { setOpen(true); });
  overlay.addEventListener('click', function () { setOpen(false); });
  document.getElementById('sfSidebarClose').addEventListener('click', function () { setOpen(false); });
  sidebar.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) setOpen(false);
  });
}

/** Phones: the search icon drops the search box down under the header. */
function sfInitSearchToggle() {
  var header = document.getElementById('sfNavbar');
  var toggle = document.getElementById('sfSearchToggle');
  var input = header && header.querySelector('#sfSearchPill input');
  if (!toggle || !input) return;
  function open() {
    header.classList.add('search-open');
    toggle.setAttribute('aria-expanded', 'true');
    setTimeout(function () { input.focus(); }, 60);
  }
  toggle.addEventListener('click', function () {
    if (header.classList.contains('search-open')) {
      header.classList.remove('search-open');
      toggle.setAttribute('aria-expanded', 'false');
    } else open();
  });
  document.querySelectorAll('.js-bottom-search').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (window.location.pathname === '/search') return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      open();
    });
  });
  // Desktop shortcut: press "/" to jump to search
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      input.focus();
    }
  });
}

/** Rotate the announcement bar every few seconds (pauses on hover). */
function sfInitAnnouncements() {
  var bar = document.querySelector('.sf-announce');
  if (!bar) return;
  var slides = bar.querySelectorAll('.sf-announce-slide');
  var current = 0;
  var timer;

  function show(index) {
    slides[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
  }
  function start() {
    clearInterval(timer);
    timer = setInterval(function () { show(current + 1); }, 4500);
  }

  bar.querySelectorAll('.sf-announce-arrow').forEach(function (btn) {
    btn.addEventListener('click', function () {
      show(current + Number(btn.dataset.dir));
      start();
    });
  });
  bar.addEventListener('mouseenter', function () { clearInterval(timer); });
  bar.addEventListener('mouseleave', start);
  start();
}

// Header: rendered immediately (this script sits right after #sfHeader),
// so there is no flash of a page without a menu.
(function renderHeader() {
  var header = document.getElementById('sfHeader');
  if (!header) return;
  header.outerHTML = sfSideMenuHTML() + '<div class="sf-chrome-top">' + sfTopbarHTML() + sfNavbarHTML() + '</div>' + sfBottomBarHTML();
  document.body.classList.add('sf-has-sidebar');
  sfMarkActiveNav();
  sfInitSideMenu();
  sfInitSearchToggle();
  sfInitAnnouncements();
})();

/** Small promo pop-up in the bottom-left corner (text set in config/storefront.js). */
function sfInitPromo() {
  var promo = SF_SITE.promo;
  if (!promo || !promo.text || /^\/(checkout|order-confirmation|cart)/.test(window.location.pathname)) return;
  try {
    if (localStorage.getItem('sisfora_promo_closed') === promo.text) return; // already closed
  } catch (e) { /* storage unavailable — show it */ }

  setTimeout(function () {
    var box = document.createElement('div');
    box.className = 'sf-promo';
    box.setAttribute('role', 'status');
    box.innerHTML =
      '<span class="sf-promo-icon">' + sfIcon('truck', 18) + '</span>' +
      '<span class="sf-promo-text">' + promo.text + (promo.link ? ' <a href="' + promo.link + '">' + (promo.linkText || 'Shop now') + '</a>' : '') + '</span>' +
      '<button type="button" aria-label="Close offer">' + sfIcon('close', 16) + '</button>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('show'); });
    box.querySelector('button').addEventListener('click', function () {
      box.classList.remove('show');
      try { localStorage.setItem('sisfora_promo_closed', promo.text); } catch (e) { /* ignore */ }
      setTimeout(function () { box.remove(); }, 400);
    });
  }, 3500);
}

/**
 * Animated cursor: a gold dot with a trailing ring that grows over links
 * and buttons and shows a label over product images. Only for mouse users
 * (not phones/tablets) and turned off for visitors who prefer reduced motion.
 */
function sfInitCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.className = 'sf-cursor-dot';
  ring.className = 'sf-cursor-ring';
  ring.innerHTML = '<span class="sf-cursor-label"></span>';
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.body.classList.add('sf-cursor-on');
  var label = ring.firstChild;

  var mouseX = -100, mouseY = -100, ringX = -100, ringY = -100;
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
    var view = e.target.closest('[data-cursor]');
    var interactive = e.target.closest('a, button, [role="button"], label, select, input, textarea, .product-card');
    ring.classList.toggle('view', Boolean(view));
    ring.classList.toggle('grow', Boolean(interactive) && !view);
    label.textContent = view ? view.dataset.cursor : '';
  }, { passive: true });
  document.addEventListener('mousedown', function () { ring.classList.add('press'); });
  document.addEventListener('mouseup', function () { ring.classList.remove('press'); });
  document.addEventListener('mouseleave', function () { dot.style.opacity = ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', function () { dot.style.opacity = ring.style.opacity = ''; });

  (function follow() {
    ringX += (mouseX - ringX) * 0.16; // ring glides after the dot
    ringY += (mouseY - ringY) * 0.16;
    ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px)';
    requestAnimationFrame(follow);
  })();
}

/** Tawk.to live chat — loads only when a property id is set in config/storefront.js. */
function sfInitChat() {
  var tawk = SF_SITE.tawk;
  if (!tawk || !tawk.propertyId) return;
  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://embed.tawk.to/' + tawk.propertyId + '/' + (tawk.widgetId || 'default');
  s.charset = 'UTF-8';
  s.setAttribute('crossorigin', '*');
  document.body.appendChild(s);
  document.body.classList.add('sf-has-chat'); // moves the back-to-top button above the chat bubble
}

/** Contact details written in page content (Contact, Privacy, Terms) come from config too. */
function sfFillContactDetails() {
  document.querySelectorAll('.js-site-email').forEach(function (el) {
    el.textContent = SF_SITE.email;
    if (el.tagName === 'A') el.href = 'mailto:' + SF_SITE.email;
  });
  document.querySelectorAll('.js-site-phone').forEach(function (el) {
    el.textContent = SF_SITE.phone;
    if (el.tagName === 'A') el.href = 'tel:' + sfTel();
  });
  if (SF_SITE.formatted) {
    document.querySelectorAll('.js-free-threshold').forEach(function (el) { el.textContent = SF_SITE.formatted.freeShippingThreshold; });
    document.querySelectorAll('.js-flat-rate').forEach(function (el) { el.textContent = SF_SITE.formatted.shippingFlatRate; });
  }
}

/** Cart icons open the slide-out cart instead of leaving the page. */
function sfInitCartIcons() {
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.js-open-cart');
    if (!link || typeof sfOpenCartDrawer !== 'function') return;
    if (window.location.pathname === '/cart' || window.location.pathname === '/checkout') return;
    e.preventDefault();
    sfOpenCartDrawer();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  sfFillContactDetails();
  sfInitPromo();
  sfInitCursor();
  sfInitChat();
  sfInitCartIcons();
});

// Footer: rendered once the page has been parsed. Registered before the
// other scripts' DOMContentLoaded handlers, so #newsletterForm / #sfToast
// exist by the time main.js wires them up.
document.addEventListener('DOMContentLoaded', function renderFooter() {
  var footer = document.getElementById('sfFooter');
  if (!footer) return;
  var withNewsletter = footer.dataset.newsletter !== 'off';
  footer.outerHTML = (withNewsletter ? sfNewsletterHTML() : '') + sfFooterHTML();
});
