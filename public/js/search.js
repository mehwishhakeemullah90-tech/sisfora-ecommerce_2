// public/js/search.js
// -----------------------------------------------------------------------
// Search page (/search?q=...): results update while typing (no Enter or
// reload needed), tolerate spelling mistakes (server-side fuzzy search),
// and show popular products when nothing matches.
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchPageInput');
  const form = document.getElementById('searchPageForm');
  const grid = document.getElementById('searchResultsGrid');
  const status = document.getElementById('searchStatus');
  const chips = document.getElementById('searchSuggestions');
  if (!input || !grid) return;

  let requestId = 0;

  function renderChips(data) {
    const words = (data.suggestions || []).map(
      (w) => `<button type="button" class="sf-chip js-search-chip" data-q="${sfEscape(w)}">${sfEscape(w)}</button>`
    );
    const cats = (data.categories || []).map(
      (c) => `<a class="sf-chip" href="/categories/${c.slug}">${sfEscape(c.name)}</a>`
    );
    chips.innerHTML = words.concat(cats).join('');
  }

  async function runSearch(q) {
    const myId = ++requestId;
    sfSkeletonGrid(grid, 4);
    try {
      const data = await sfFetch(`/api/products/search?q=${encodeURIComponent(q)}&limit=24`);
      if (myId !== requestId) return; // a newer search has started

      renderChips(data);

      if (!q.trim()) {
        status.textContent = 'Popular right now';
        sfRenderProductGrid(grid, data.products);
        return;
      }

      if (data.total > 0) {
        status.textContent = `${data.total} result${data.total === 1 ? '' : 's'} for “${q}”`;
        sfRenderProductGrid(grid, data.products);
        return;
      }

      // No matches: friendly message + popular products instead of a blank page
      const popular = await sfFetch('/api/products/search?q=&limit=4');
      if (myId !== requestId) return;
      status.innerHTML = '';
      grid.innerHTML = `
        <div class="col-12 text-center py-4">
          <i class="bi bi-search fs-1 text-muted"></i>
          <h5 class="mt-3 mb-1">No products found for “${sfEscape(q)}”</h5>
          <p class="text-muted mb-0">Check the spelling or try a simpler word — or explore our favourites below.</p>
        </div>`;
      grid.insertAdjacentHTML('beforeend', (popular.products || []).map(sfProductCardHTML).join(''));
      renderChips(popular);
    } catch (err) {
      if (myId !== requestId) return;
      status.textContent = '';
      grid.innerHTML = `<div class="col-12 text-center text-danger py-5">${sfEscape(err.message)}</div>`;
    }
  }

  function updateUrl(q) {
    const url = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
    window.history.replaceState({}, '', url);
  }

  // Search as you type (debounced so we don't call the API on every key)
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      updateUrl(input.value.trim());
      runSearch(input.value.trim());
    }, 250);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(debounce);
    updateUrl(input.value.trim());
    runSearch(input.value.trim());
  });

  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.js-search-chip');
    if (!chip) return;
    input.value = chip.dataset.q;
    updateUrl(input.value);
    runSearch(input.value);
  });

  // Initial search from the URL (?q=...) — also accepts the old ?keyword=
  const params = sfQueryParams();
  input.value = params.q || params.keyword || '';
  runSearch(input.value.trim());
});
