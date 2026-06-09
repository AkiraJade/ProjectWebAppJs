document.addEventListener('DOMContentLoaded', () => {
    loadHeader();

    async function loadHeader() {
        const placeholder = document.getElementById('header-placeholder');
        if (!placeholder) return;
        
        try {
            const response = await fetch('header.html?v=' + Date.now(), { cache: 'no-cache' });
            if (!response.ok) throw new Error("Header fetch failed");
            const html = await response.text();
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
        
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === page) {
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
                if (user.role === 'admin') {
                    const navLinks = document.querySelector('.nav-links');
                    if (navLinks && !document.querySelector('a[href="admin.html"]')) {
                        const adminLink = document.createElement('a');
                        adminLink.href = 'admin.html';
                        adminLink.className = 'nav-link';
                        adminLink.innerText = 'Admin';
                        navLinks.appendChild(adminLink);
                        highlightActiveLink(); // refresh highlights
                    }
                }

                headerActions.innerHTML = `
                    <div class="user-profile-menu" id="userProfileMenu" style="display: flex; align-items: center; gap: 1.2rem;">
                        <a href="cart.html" class="icon-nav-link" title="View Cart" style="color: var(--text-primary); display: inline-flex; align-items: center; transition: color 0.3s ease, transform 0.3s ease;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                        </a>
                        <a href="profile.html" class="icon-nav-link" title="View Profile" style="color: var(--text-primary); display: inline-flex; align-items: center; transition: color 0.3s ease, transform 0.3s ease;">
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
                        window.location.href = 'index.html';
                    });
                }
            } catch (err) {
                console.error("Error parsing user session:", err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        
        // Guard check for protected pages
        const protectedPages = ['dashboard.html', 'profile.html', 'deactivate.html', 'admin.html'];
        const path = window.location.pathname;
        const page = path.split("/").pop();
        if (protectedPages.includes(page)) {
            if (!token || !userJson) {
                alert("Unauthorized. Please sign in first.");
                window.location.href = 'login.html';
                return;
            }
            try {
                const user = JSON.parse(userJson);
                if (page === 'admin.html' && user.role !== 'admin') {
                    alert("Forbidden. Administrators only.");
                    window.location.href = 'index.html';
                }
            } catch (err) {
                window.location.href = 'login.html';
            }
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
