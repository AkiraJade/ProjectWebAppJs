/**
 * home-search.js
 * Autocomplete search for the homepage (Phase 4 CTA section).
 * Queries GET /api/v1/items/search?q=<query> and renders
 * a live suggestion dropdown. Selecting an item navigates to
 * customer/shop.html?q=<description>. Pressing Enter or clicking
 * "View All" navigates to the shop with the search query.
 */

(function () {
    const API_BASE = 'http://localhost:3000/api/v1';
    const DEBOUNCE_MS = 280;
    const MIN_CHARS = 2;

    const input = document.getElementById('homeSearchInput');
    const dropdown = document.getElementById('homeSearchDropdown');
    const clearBtn = document.getElementById('homeSearchClear');

    if (!input || !dropdown) return; // Guard — only run on pages with the search bar

    let debounceTimer = null;
    let lastQuery = '';

    // ─── Helpers ──────────────────────────────────────────────────────────

    function resolveImage(path) {
        if (!path) return '../assets/toy_placeholder.png';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        const clean = path.startsWith('/') ? path.substring(1) : path;
        if (clean.startsWith('assets/')) return clean;
        return `http://localhost:3000/${clean}`;
    }

    function openDropdown() {
        dropdown.classList.add('open');
    }

    function closeDropdown() {
        dropdown.classList.remove('open');
    }

    function clearSearch() {
        input.value = '';
        lastQuery = '';
        dropdown.innerHTML = '';
        closeDropdown();
        if (clearBtn) clearBtn.style.display = 'none';
        input.focus();
    }

    function navigateToShop(query) {
        const q = encodeURIComponent(query.trim());
        window.location.href = `customer/shop.html${q ? '?q=' + q : ''}`;
    }

    // ─── Render Results ───────────────────────────────────────────────────

    function renderResults(items, query) {
        dropdown.innerHTML = '';

        if (items.length === 0) {
            dropdown.innerHTML = `<div class="home-search-no-results">No results for "<strong>${escapeHtml(query)}</strong>"</div>`;
            openDropdown();
            return;
        }

        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const img = resolveImage(item.img_path || (item.images && item.images[0] && item.images[0].img_path));
            const price = item.sell_price ? '$' + parseFloat(item.sell_price).toFixed(2) : '';

            const a = document.createElement('a');
            a.className = 'home-search-item';
            a.href = `customer/item.html?id=${item.item_id || item.id}`;
            a.setAttribute('role', 'option');
            a.innerHTML = `
                <img class="home-search-item-img" src="${img}" alt="${escapeHtml(item.description || '')}" loading="lazy"
                     onerror="this.src='../assets/toy_placeholder.png'">
                <div class="home-search-item-info">
                    <div class="home-search-item-name">${highlightMatch(item.description || '', query)}</div>
                    ${price ? `<div class="home-search-item-price">${price}</div>` : ''}
                </div>
            `;
            fragment.appendChild(a);
        });

        // "View all results" footer link
        const viewAll = document.createElement('a');
        viewAll.className = 'home-search-view-all';
        viewAll.href = `customer/shop.html?q=${encodeURIComponent(query)}`;
        viewAll.textContent = `View all results for "${query}"`;
        fragment.appendChild(viewAll);

        dropdown.appendChild(fragment);
        openDropdown();
    }

    function renderLoading() {
        dropdown.innerHTML = `<div class="home-search-no-results" style="color:var(--accent-gold);">Searching...</div>`;
        openDropdown();
    }

    // ─── Fetch ────────────────────────────────────────────────────────────

    async function fetchSuggestions(query) {
        try {
            renderLoading();
            const data = await $.ajax({
                url: `${API_BASE}/items/search?q=${encodeURIComponent(query)}`,
                type: 'GET',
                dataType: 'json'
            });
            renderResults(data.items || [], query);
        } catch (err) {
            dropdown.innerHTML = `<div class="home-search-no-results" style="color:#c94a4a;">Could not reach server. Is the backend running?</div>`;
            openDropdown();
        }
    }

    // ─── Input Events ─────────────────────────────────────────────────────

    input.addEventListener('input', function () {
        const query = this.value.trim();

        if (clearBtn) clearBtn.style.display = query.length > 0 ? 'flex' : 'none';

        if (query.length < MIN_CHARS) {
            clearTimeout(debounceTimer);
            dropdown.innerHTML = '';
            closeDropdown();
            lastQuery = '';
            return;
        }

        if (query === lastQuery) return;
        lastQuery = query;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchSuggestions(query), DEBOUNCE_MS);
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.value.trim();
            if (query) navigateToShop(query);
        }
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#homeSearchWrap')) {
            closeDropdown();
        }
    });

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }

    // ─── Utilities ────────────────────────────────────────────────────────

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function highlightMatch(text, query) {
        if (!query) return escapeHtml(text);
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark style="background:rgba(197,168,128,0.3);border-radius:2px;padding:0 1px;">$1</mark>');
    }

})();
