// ============================================
// CUMBEAR ULTRA PREMIUM - Header Logic
// Version: 2.0 Enhanced
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const searchBtn = document.getElementById('searchBtn');
    const homeLogoBtn = document.getElementById('homeLogoBtn');
    const header = document.getElementById('siteHeader');

    // 1. Menu Button (Hamburger) -> Opens Sidebar
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            // Hook into global sidebar logic if available, otherwise fallback
            if (window.openSidebar) {
                window.openSidebar();
            } else {
                const sidebar = document.getElementById('siteSidebar');
                const overlay = document.getElementById('sidebarOverlay');
                if (sidebar && overlay) {
                    sidebar.classList.add('active');
                    overlay.classList.add('active');
                }
            }
        });
    }

    // 2. Search Button -> Opens Search View & Auto-Focuses Input
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            // Use global router to switch to search/categories view
            if (window.switchView) {
                window.switchView('categoriesView', true);
            }
            
            // Premium UX: Automatically focus the search input after transition
            setTimeout(() => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    // Scroll to top to ensure input is visible
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 350); // Matches the CSS transition time
        });
    }

    // 3. Logo Click -> Go Home (Smoothly & Resets State)
    if (homeLogoBtn) {
        homeLogoBtn.addEventListener('click', () => {
            // Use the global router to go home (handles history API perfectly)
            if (window.switchView) {
                window.switchView('homeView', true);
            }
            
            // Reset home filters/pagination if the function exists
            if (window.resetHomeState) {
                window.resetHomeState();
            }
        });
    }

    // 4. Premium Scroll Effect (Dynamic Header Shadow)
    // Adds a subtle burgundy-tinted shadow when the user scrolls down
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
                header.style.borderBottomColor = 'rgba(124, 29, 64, 0.3)'; // Subtle burgundy glow
            } else {
                header.style.boxShadow = 'none';
                header.style.borderBottomColor = 'var(--border-color)';
            }
        }, { passive: true });
    }
});
