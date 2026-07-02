// Visual error logger for debugging in UI
(function() {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.background = 'rgba(255, 0, 0, 0.9)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.zIndex = '99999';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.display = 'none';
    errorDiv.id = 'visual-debug-console';
    
    function logErrorToScreen(msg) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML += '<div>' + msg + '</div>';
    }
    
    window.addEventListener('error', function(e) {
        logErrorToScreen('Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno);
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        logErrorToScreen('Promise Rejection: ' + e.reason);
    });
    
    // Also patch console.error
    const origConsoleError = console.error;
    console.error = function() {
        origConsoleError.apply(console, arguments);
        const args = Array.prototype.slice.call(arguments);
        logErrorToScreen('Console Error: ' + args.join(' '));
    };
    
    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(errorDiv);
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    // Compute basePath: pages in subfolders (admin/, customer/) need "../" prefix
    function getBasePath() {
        const path = window.location.pathname;
        // Check if current page is inside a subfolder like /admin/ or /customer/
        if (path.match(/\/(admin|customer)\//i)) {
            return '../';
        }
        return '';
    }

    const basePath = getBasePath();

    // Redirect logged-in admin directly to the admin panel if they attempt to load customer/public pages
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
        try {
            const user = JSON.parse(userJson);
            if (user && user.role && user.role.trim().toLowerCase() === 'admin') {
                const path = window.location.pathname;
                const page = path.split("/").pop() || "index.html";
                const pageName = page.toLowerCase();
                const adminForbiddenPages = ['index.html', '', 'shop.html', 'dashboard.html', 'cart.html', 'item.html', 'profile.html', 'deactivate.html'];
                if (adminForbiddenPages.includes(pageName)) {
                    window.location.href = basePath + 'admin/admin.html';
                    return;
                }
            }
        } catch (e) {}
    }

    async function loadHeader() {
        const placeholder = document.getElementById('header-placeholder');
        if (!placeholder) return;
        
        try {
            let html = await $.ajax({
                url: basePath + 'header.html?v=' + Date.now(),
                type: 'GET',
                dataType: 'html',
                cache: false
            });

            // Rewrite header links to use correct base path
            html = html.replace(/href="([^"#][^"]*)"/g, (match, href) => {
                // Skip absolute URLs and anchors
                if (href.startsWith('http') || href.startsWith('#') || href.startsWith('//')) return match;
                // Already has basePath prefix? skip
                if (href.startsWith('../')) return match;
                return `href="${basePath}${href}"`;
            });

            placeholder.innerHTML = html;
            
            // Set active class on navbar links depending on current page URL
            highlightActiveLink();
            
            // Initialize navbar user state
            updateNavbarState();
        } catch (err) {
            console.error("Failed to load header:", err);
        }
    }

    function highlightActiveLink() {
        const path = window.location.pathname;
        const page = path.split("/").pop() || "index.html";
        // Also consider subfolder context
        const pathLower = path.toLowerCase();
        
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            // Match by filename regardless of folder prefix
            const linkPage = href.split("/").pop();
            if (linkPage === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function updateNavbarState() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');

        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                
                // Show Admin link for administrators
                if (user.role && user.role.trim().toLowerCase() === 'admin') {
                    const navLinks = document.querySelector('.nav-links');
                    if (navLinks && !document.querySelector('.nav-link-admin')) {
                        const adminLink = document.createElement('a');
                        adminLink.href = basePath + 'admin/admin.html';
                        adminLink.className = 'nav-link nav-link-admin';
                        adminLink.innerText = 'Admin';
                        navLinks.appendChild(adminLink);
                        highlightActiveLink(); // refresh highlights
                    }
                }

                headerActions.innerHTML = `
                    <div class="user-profile-menu" id="userProfileMenu" style="display: flex; align-items: center; gap: 1.2rem;">
                        <a href="${basePath}customer/cart.html" class="icon-nav-link" title="View Cart" style="color: var(--text-primary); display: inline-flex; align-items: center; transition: color 0.3s ease, transform 0.3s ease;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                        </a>
                        <a href="${basePath}customer/profile.html" class="icon-nav-link" title="View Profile" style="color: var(--text-primary); display: inline-flex; align-items: center; transition: color 0.3s ease, transform 0.3s ease;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </a>
                        <span class="user-welcome" style="font-size: 0.9rem;">Welcome, <strong id="navUserName">${escapeHTML(user.name)}</strong></span>
                        <button class="btn-logout" id="logoutBtn">Sign Out</button>
                    </div>
                `;

                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = basePath + 'index.html';
                    });
                }
            } catch (err) {
                console.error("Error parsing user session:", err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        
        // Guard check for protected pages
        const protectedPages = ['dashboard.html', 'profile.html', 'deactivate.html', 'admin.html', 'cart.html', 'item.html'];
        const path = window.location.pathname;
        const page = path.split("/").pop();
        if (protectedPages.includes(page)) {
            if (!token || !userJson) {
                alert("Unauthorized. Please sign in first.");
                window.location.href = basePath + 'login.html';
                return;
            }
            try {
                const user = JSON.parse(userJson);
                if (page === 'admin.html' && (!user.role || user.role.trim().toLowerCase() !== 'admin')) {
                    alert("Forbidden. Administrators only.");
                    window.location.href = basePath + 'index.html';
                }
            } catch (err) {
                window.location.href = basePath + 'login.html';
            }
        }
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Call loadHeader after all functions and variables are defined
    loadHeader();
});
