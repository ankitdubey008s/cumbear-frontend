// ============================================
// CUMBEAR ULTRA PREMIUM - Footer & Bottom Nav
// Version: 2.0 Enhanced
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const bottomNav = document.getElementById('bottomNav');
    let lastScrollY = window.scrollY;
    let scrollTimeout;

    // --- 1. Navigation Click Handlers ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');
            
            // Update active state visually
            navItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            
            // Use global router to switch views
            if (window.switchView) {
                window.switchView(targetView, true);
            }
            
            // Trigger Shorts loading specifically if switching to shorts
            if (targetView === 'shortsView' && window.loadShorts) {
                window.loadShorts();
            }
            
            // Always show footer when navigating
            bottomNav.classList.remove('footer-hidden');
        });
    });

    // --- 2. Premium Auto-Hide on Scroll ---
    // Hides the footer when scrolling down to give more screen space, 
    // and reveals it instantly when scrolling up.
    window.addEventListener('scroll', () => {
        // Clear previous timeout to prevent jitter
        clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            const currentScrollY = window.scrollY;
            
            // Only hide if scrolled down more than 100px and moving down
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                bottomNav.classList.add('footer-hidden');
            } else {
                bottomNav.classList.remove('footer-hidden');
            }
            
            lastScrollY = currentScrollY;
        }, 100); // 100ms debounce for buttery smooth performance
    }, { passive: true });

    // --- 3. Global Router Hook ---
    // Intercepts the global switchView function to ensure the bottom nav 
    // always stays in sync, even if navigation happens from the sidebar or header.
    const originalSwitchView = window.switchView;
    if (originalSwitchView) {
        window.switchView = function(viewId, pushHistory = true) {
            // Call the original router logic
            originalSwitchView(viewId, pushHistory);
            
            // Sync bottom nav active state
            navItems.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
            });
            
            // Always reveal footer when switching views via router
            bottomNav.classList.remove('footer-hidden');
        };
    }
});
