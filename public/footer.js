/**
 * CUMBEAR FOOTER ENGINE v2.0
 * Smart bottom nav with gesture handling, scroll detection
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const bottomNav = document.getElementById('bottomNav');
    
    let lastScrollY = window.scrollY;
    let scrollTimeout = null;
    let isNavVisible = true;

    // Navigation click handling
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(20);
            
            const targetView = item.getAttribute('data-view');
            
            // Update active state immediately for responsiveness
            navItems.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-current', 'false');
            });
            item.classList.add('active');
            item.setAttribute('aria-current', 'page');
            
            // Switch view
            if (window.switchView) {
                window.switchView(targetView, true);
            }
            
            // Load shorts if needed
            if (targetView === 'shortsView' && window.loadShorts) {
                window.loadShorts();
            }
        });
    });

    // Smart hide/show on scroll with debounce
    function handleScroll() {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY;
        
        // Show nav when near bottom (user might want to navigate)
        const nearBottom = (window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight - 100;
        
        if (nearBottom && !isNavVisible) {
            showNav();
        } else if (scrollDelta > 10 && currentScrollY > 100 && !nearBottom) {
            // Scrolling down - hide
            hideNav();
        } else if (scrollDelta < -5) {
            // Scrolling up - show
            showNav();
        }
        
        lastScrollY = currentScrollY;
    }

    function hideNav() {
        if (!isNavVisible) return;
        isNavVisible = false;
        bottomNav.style.transform = `translateY(calc(100% + var(--safe-bottom, 0px)))`;
        bottomNav.style.opacity = '0';
        
        // Also hide sticky ad
        const stickyAd = document.getElementById('stickyAdContainer');
        if (stickyAd) stickyAd.style.transform = 'translateY(100%)';
    }

    function showNav() {
        if (isNavVisible) return;
        isNavVisible = true;
        bottomNav.style.transform = 'translateY(0)';
        bottomNav.style.opacity = '1';
        
        // Show sticky ad
        const stickyAd = document.getElementById('stickyAdContainer');
        if (stickyAd) stickyAd.style.transform = 'translateY(0)';
    }

    // Throttled scroll listener
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
        
        // Clear existing timeout
        clearTimeout(scrollTimeout);
        
        // Show nav after scroll stops
        scrollTimeout = setTimeout(() => {
            showNav();
        }, 1500);
    }, { passive: true });

    // Override switchView to sync nav state
    const originalSwitchView = window.switchView;
    if (originalSwitchView) {
        window.switchView = function(viewId, pushHistory = true) {
            originalSwitchView(viewId, pushHistory);
            
            // Sync nav items
            navItems.forEach(btn => {
                const isActive = btn.getAttribute('data-view') === viewId;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-current', isActive ? 'page' : 'false');
            });
            
            // Always show nav on view switch
            showNav();
        };
    }

    // Touch gesture: swipe up from bottom to show nav when hidden
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const windowHeight = window.innerHeight;
        
        // If touching near bottom edge and nav is hidden, show it
        if (touchStartY > windowHeight - 20 && touchY < touchStartY - 30 && !isNavVisible) {
            showNav();
        }
    }, { passive: true });
});

