// public/js/motion.js
// -----------------------------------------------------------------------
// Sisfora motion layer — the 3D / depth effects used across the site.
// Small, dependency-free and switched off for visitors who ask their
// device for reduced motion. Everything here is decoration only: pages
// work exactly the same without it.
//
//   [data-tilt]              card tilts in 3D toward the pointer (+ soft glare)
//   [data-tilt-max="8"]      max tilt in degrees (default 8)
//   [data-depth="0.4"]       layer inside [data-scene] drifts with the pointer
//   [data-parallax="0.15"]   element drifts with page scroll
//   [data-split]             headline words rise in one by one
//   .sf-reveal               fades/slides in when scrolled into view (utils.js)
//   [data-magnetic]          button leans toward the pointer
//   [data-count-to="98"]     number counts up when visible
// -----------------------------------------------------------------------
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---- 3D tilt cards ----------------------------------------------------
  function bindTilt(el) {
    if (el.__sfTilt) return;
    el.__sfTilt = true;
    var max = Number(el.dataset.tiltMax || 8);
    var glare = document.createElement('span');
    glare.className = 'sf-tilt-glare';
    el.appendChild(glare);
    var raf = 0;
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        el.style.setProperty('--rx', ((0.5 - py) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        el.classList.add('is-tilting');
      });
    });
    el.addEventListener('pointerleave', function () {
      cancelAnimationFrame(raf);
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }

  function initTilt(root) {
    if (reduce || !finePointer) return;
    (root || document).querySelectorAll('[data-tilt]').forEach(bindTilt);
  }

  // ---- Pointer-driven depth scenes (hero) --------------------------------
  function initScenes() {
    if (reduce) return;
    document.querySelectorAll('[data-scene]').forEach(function (scene) {
      var layers = scene.querySelectorAll('[data-depth]');
      var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
      function loop() {
        cx += (tx - cx) * 0.07;
        cy += (ty - cy) * 0.07;
        layers.forEach(function (l) {
          var d = Number(l.dataset.depth);
          l.style.setProperty('--mx', (cx * d * 40).toFixed(2) + 'px');
          l.style.setProperty('--my', (cy * d * 40).toFixed(2) + 'px');
        });
        scene.style.setProperty('--scene-rx', (-cy * 6).toFixed(2) + 'deg');
        scene.style.setProperty('--scene-ry', (cx * 8).toFixed(2) + 'deg');
        if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) requestAnimationFrame(loop);
        else running = false;
      }
      function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
      if (finePointer) {
        window.addEventListener('pointermove', function (e) {
          tx = clamp(e.clientX / window.innerWidth - 0.5, -0.5, 0.5);
          ty = clamp(e.clientY / window.innerHeight - 0.5, -0.5, 0.5);
          kick();
        }, { passive: true });
      } else if (window.DeviceOrientationEvent) {
        // Phones: a gentle tilt with the device (only where no permission prompt is needed)
        window.addEventListener('deviceorientation', function (e) {
          if (e.gamma == null) return;
          tx = clamp(e.gamma / 60, -0.5, 0.5);
          ty = clamp((e.beta - 45) / 90, -0.5, 0.5);
          kick();
        }, { passive: true });
      }
    });
  }

  // ---- Scroll parallax ----------------------------------------------------
  function initParallax() {
    if (reduce) return;
    var items = [].slice.call(document.querySelectorAll('[data-parallax]'));
    if (!items.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = Number(el.dataset.parallax);
        var offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.setProperty('--py', (-offset).toFixed(1) + 'px');
        var progress = clamp(1 - (r.top + r.height / 2) / (vh + r.height), 0, 1);
        el.style.setProperty('--progress', progress.toFixed(3));
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ---- Split headline into words that rise in ----------------------------
  function initSplit() {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      if (el.__sfSplit) return;
      el.__sfSplit = true;
      var i = 0;
      (function walk(node) {
        [].slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var outer = document.createElement('span');
              outer.className = 'sf-word';
              var inner = document.createElement('span');
              inner.className = 'sf-word-in';
              inner.style.setProperty('--i', i++);
              inner.textContent = part;
              outer.appendChild(inner);
              frag.appendChild(outer);
            });
            child.parentNode.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') {
            walk(child);
          }
        });
      })(el);
      requestAnimationFrame(function () { el.classList.add('is-split'); });
    });
  }

  // ---- Magnetic buttons ---------------------------------------------------
  function initMagnetic() {
    if (reduce || !finePointer) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * 0.18).toFixed(1) + 'px,' + (y * 0.25).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  // ---- Count-up numbers ---------------------------------------------------
  function initCounters() {
    var els = document.querySelectorAll('[data-count-to]');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target;
        var to = Number(el.dataset.countTo);
        if (reduce) { el.textContent = to.toLocaleString('en-US'); return; }
        var start = performance.now();
        (function step(now) {
          var t = clamp((now - start) / 1400, 0, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(to * eased).toLocaleString('en-US');
          if (t < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---- Horizontal product rails (arrows + drag) ---------------------------
  function initRails() {
    document.querySelectorAll('[data-rail]').forEach(function (wrap) {
      var track = wrap.querySelector('.sf-rail-track');
      if (!track) return;
      wrap.querySelectorAll('[data-rail-dir]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          track.scrollBy({ left: Number(btn.dataset.railDir) * track.clientWidth * 0.8, behavior: 'smooth' });
        });
      });
    });
  }

  // Product grids are filled in after page load — give new cards the tilt too
  function watchGrids() {
    if (reduce || !finePointer || !('MutationObserver' in window)) return;
    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches('[data-tilt]')) bindTilt(n);
          if (n.querySelectorAll) n.querySelectorAll('[data-tilt]').forEach(bindTilt);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  window.sfMotionRefresh = initTilt;

  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add(reduce ? 'sf-reduced-motion' : 'sf-motion');
    initSplit();
    initTilt();
    initScenes();
    initParallax();
    initMagnetic();
    initCounters();
    initRails();
    watchGrids();
  });
})();
