$(document).ready(function () {
    const API_URL = 'http://localhost:3000/api/v1';
    let allItems = [];         // Master list from API
    let filteredItems = [];    // After filters applied
    let shopMode = 'infinite'; // 'infinite' or 'paginate'
    
    // Filter states
    let activeCategory = 'all';
    let maxPrice = 1000;
    let availFilter = 'all';
    let sortMode = 'default';

    // Infinite Scroll State
    let infiniteLoaded = 0;
    const infiniteBatchSize = 4;
    let loadingScroll = false;

    // Pagination State
    let currentPage = 1;
    const itemsPerPage = 4;

    // 1. Initial Load
    function loadFigurines() {
        $.ajax({
            url: `${API_URL}/items`,
            type: 'GET',
            success: function (data) {
                allItems = data.rows || [];
                applyFilters();
            },
            error: function (err) {
                console.error("Failed to load catalog figurines:", err);
            }
        });
    }

    // 2. Apply all active filters & sort, then render
    function applyFilters() {
        filteredItems = allItems.slice(); // copy

        // Category filter (client-side — all items are "Hirono Series" in this demo)
        if (activeCategory === 'hirono') {
            filteredItems = filteredItems.filter(i => i.description.toLowerCase().includes('hirono'));
        } else if (activeCategory === 'limited') {
            filteredItems = filteredItems.filter(i => parseFloat(i.sell_price) >= 500);
        } else if (activeCategory === 'new') {
            // Show last 4 items as "new arrivals"
            filteredItems = filteredItems.slice(-4);
        }

        // Price filter
        filteredItems = filteredItems.filter(i => parseFloat(i.sell_price) <= maxPrice);

        // Availability filter
        if (availFilter === 'instock') {
            filteredItems = filteredItems.filter(i => i.quantity > 0);
        } else if (availFilter === 'out') {
            filteredItems = filteredItems.filter(i => i.quantity <= 0);
        }

        // Sorting
        if (sortMode === 'price-low') {
            filteredItems.sort((a, b) => parseFloat(a.sell_price) - parseFloat(b.sell_price));
        } else if (sortMode === 'price-high') {
            filteredItems.sort((a, b) => parseFloat(b.sell_price) - parseFloat(a.sell_price));
        } else if (sortMode === 'name') {
            filteredItems.sort((a, b) => a.description.localeCompare(b.description));
        }

        // Update result count
        $('#resultCount').text(filteredItems.length + ' item' + (filteredItems.length !== 1 ? 's' : ''));

        renderShop();
    }

    // 3. Render Router
    function renderShop() {
        $('#shopGrid').empty();
        $('#shopPagination').hide();
        $('#shopScrollLoader').hide();
        
        if (filteredItems.length === 0) {
            $('#shopGrid').html('<div style="grid-column: 1/-1; padding: 2.5rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">No figurines matching your filters.</div>');
            return;
        }

        if (shopMode === 'infinite') {
            infiniteLoaded = 0;
            loadMoreInfinite();
        } else {
            currentPage = 1;
            renderPaginatedGrid();
            renderPaginationControls();
        }
    }

    // --------------------------------------------------------
    // 4. INFINITE SCROLL MODE
    // --------------------------------------------------------
    function loadMoreInfinite() {
        if (loadingScroll) return;
        loadingScroll = true;

        const start = infiniteLoaded;
        const end = Math.min(start + infiniteBatchSize, filteredItems.length);
        
        if (start >= filteredItems.length) {
            loadingScroll = false;
            return;
        }

        if (start > 0) {
            $('#shopScrollLoader').fadeIn(200);
        }

        setTimeout(() => {
            for (let i = start; i < end; i++) {
                $('#shopGrid').append(createProductCard(filteredItems[i]));
            }
            infiniteLoaded = end;
            $('#shopScrollLoader').fadeOut(200);
            loadingScroll = false;
        }, start > 0 ? 500 : 0);
    }

    $(window).on('scroll', function () {
        if (shopMode !== 'infinite') return;
        
        const shopSection = $('#shop');
        if (shopSection.length === 0) return;

        const scrollPos = $(window).scrollTop() + $(window).height();
        const triggerPos = shopSection.offset().top + shopSection.outerHeight() - 150;

        if (scrollPos >= triggerPos) {
            loadMoreInfinite();
        }
    });

    // --------------------------------------------------------
    // 5. PAGINATION MODE
    // --------------------------------------------------------
    function renderPaginatedGrid() {
        $('#shopGrid').empty();
        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, filteredItems.length);

        for (let i = start; i < end; i++) {
            $('#shopGrid').append(createProductCard(filteredItems[i]));
        }
    }

    function renderPaginationControls() {
        const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
        const container = $('#shopPagination');
        container.empty().css('display', 'flex');

        if (totalPages <= 1) {
            container.hide();
            return;
        }

        const prevDisabled = currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: default;"' : '';
        container.append(`<button class="mode-btn" ${prevDisabled} onclick="changeShopPage(${currentPage - 1})">Prev</button>`);

        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage ? 'active' : '';
            container.append(`<button class="mode-btn ${isActive}" onclick="changeShopPage(${i})">${i}</button>`);
        }

        const nextDisabled = currentPage === totalPages ? 'disabled style="opacity: 0.5; cursor: default;"' : '';
        container.append(`<button class="mode-btn" ${nextDisabled} onclick="changeShopPage(${currentPage + 1})">Next</button>`);
    }

    window.changeShopPage = function (page) {
        const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderPaginatedGrid();
        renderPaginationControls();
        
        $('html, body').animate({
            scrollTop: $('#shop').offset().top - 80
        }, 300);
    };

    // --------------------------------------------------------
    // 6. AUTOCOMPLETE LIVE SEARCH
    // --------------------------------------------------------
    let searchTimeout;
    $('#shopSearchInput').on('input', function () {
        clearTimeout(searchTimeout);
        const query = $(this).val().trim();
        const resultsBox = $('#shopAutocompleteResults');

        if (query.length === 0) {
            resultsBox.hide().empty();
            loadFigurines();
            return;
        }

        searchTimeout = setTimeout(() => {
            $.ajax({
                url: `${API_URL}/search?q=${encodeURIComponent(query)}`,
                type: 'GET',
                success: function (res) {
                    resultsBox.empty().show();
                    const list = res.items || [];
                    if (list.length === 0) {
                        resultsBox.append('<div style="padding: 10px 15px; color:#7a7a7a; font-size:0.85rem;">No results found</div>');
                        return;
                    }
                    list.forEach(item => {
                        const img = item.img_path ? `http://localhost:3000/${item.img_path}` : '../assets/toy_placeholder.png';
                        resultsBox.append(`
                            <div class="autocomplete-item" onclick="selectSearchFigurine(${item.item_id}, '${escapeQuote(item.description)}')" style="padding: 10px 15px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s ease; border-bottom: 1px solid #f4eedc;">
                                <img src="${img}" style="width: 30px; height: 30px; border-radius: 4px; border: 1px solid #c5a880;" alt="thumb">
                                <div>
                                    <div style="font-size: 0.9rem; font-weight:600; color:#1c1c1c;">${item.description}</div>
                                    <div style="font-size: 0.75rem; color: #c5a880; font-weight:500;">$${parseFloat(item.sell_price).toFixed(2)}</div>
                                </div>
                            </div>
                        `);
                    });
                }
            });
        }, 300);
    });

    window.selectSearchFigurine = function (id, name) {
        $('#shopSearchInput').val(name);
        $('#shopAutocompleteResults').hide().empty();
        
        $.ajax({
            url: `${API_URL}/items/${id}`,
            type: 'GET',
            success: function (res) {
                if (res.success && res.result.length > 0) {
                    allItems = res.result;
                    applyFilters();
                }
            }
        });
    };

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#shopSearchInput, #shopAutocompleteResults').length) {
            $('#shopAutocompleteResults').hide();
        }
    });

    // --------------------------------------------------------
    // 7. SIDEBAR FILTER FUNCTIONS (exposed globally)
    // --------------------------------------------------------
    window.filterCategory = function (cat, btn) {
        activeCategory = cat;
        // Update grid header title
        const titles = { all: 'All Figurines', hirono: 'Hirono Series', limited: 'Limited Edition', new: 'New Arrivals' };
        $('.shop-grid-header h2').text(titles[cat] || 'All Figurines');
        // Active state
        $('#categoryFilters .filter-item').removeClass('active');
        $(btn).addClass('active');
        applyFilters();
    };

    window.filterByPrice = function (val) {
        maxPrice = parseInt(val);
        $('#priceDisplay').text(val);
        applyFilters();
    };

    window.filterAvailability = function (mode, btn) {
        availFilter = mode;
        $('.avail-toggle .avail-pill').removeClass('active');
        $(btn).addClass('active');
        applyFilters();
    };

    window.sortShop = function (mode, btn) {
        sortMode = mode;
        // Only update sort section active states
        $(btn).closest('.filter-list').find('.filter-item').removeClass('active');
        $(btn).addClass('active');
        applyFilters();
    };

    // --------------------------------------------------------
    // 8. CARD TEMPLATE
    // --------------------------------------------------------
    function createProductCard(item) {
        const img = item.img_path ? `http://localhost:3000/${item.img_path}` : '../assets/toy_placeholder.png';
        const price = parseFloat(item.sell_price).toFixed(2);
        
        return `
            <div class="toy-catalog-card" onclick="window.location.href='item.html?id=${item.item_id}'" style="background: #ffffff; border: 1px solid rgba(197, 168, 128, 0.15); border-radius: 14px; padding: 1.2rem; display: flex; flex-direction: column; gap: 0.8rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 12px rgba(0,0,0,0.01);">
                <div style="height: 180px; border-radius: 10px; background: rgba(245, 239, 230, 0.35); border: 1px solid rgba(197, 168, 128, 0.1); display: flex; justify-content: center; align-items: center; overflow: hidden;">
                    <img src="${img}" style="max-height: 85%; max-width: 85%; object-fit: contain; transition: transform 0.4s ease;" class="card-img" alt="product">
                </div>
                <div style="text-align: left;">
                    <span style="font-family: var(--font-heading); font-size: 0.72rem; color: var(--accent-gold-dark); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Hirono Series</span>
                    <h4 style="font-family: var(--font-heading); font-size: 1rem; color: var(--text-primary); margin-top: 0.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;">${item.description}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem;">
                        <span style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">$${price}</span>
                        <span style="font-size: 0.72rem; color: ${item.quantity > 0 ? '#2e7d32' : '#c94a4a'}; font-weight: 600;">${item.quantity > 0 ? 'In Stock' : 'Out of Stock'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Mode toggle
    window.setShopMode = function (mode) {
        shopMode = mode;
        if (mode === 'infinite') {
            $('#modeInfiniteBtn').addClass('active');
            $('#modePaginateBtn').removeClass('active');
        } else {
            $('#modePaginateBtn').addClass('active');
            $('#modeInfiniteBtn').removeClass('active');
        }
        renderShop();
    };

    function escapeQuote(str) {
        return str.replace(/'/g, "\\'");
    }

    // Initial load
    loadFigurines();
});
