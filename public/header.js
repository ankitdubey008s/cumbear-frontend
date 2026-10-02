/**
 * CUMBEAR HEADER ENGINE v2.0
 * Smart header with scroll behavior, haptic feedback
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const searchBtn = document.getElementById('searchBtn');
    const homeLogoBtn = document.getElementById('homeLogoBtn');
    const header = document.getElementById('siteHeader');
    
    let lastScrollY = 0;
    let ticking = false;

    // Smart header hide/show on scroll
    function updateHeader() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
            // Scrolling down - hide header
            header.style.transform = 'translateY(-100%)';
            header.style.opacity = '0';
        } else {
            // Scrolling up - show header
            header.style.transform = 'translateY(0)';
            header.style.opacity = '1';
        }
        
        // Add background blur when scrolled
        if (currentScrollY > 20) {
            header.style.backdropFilter = 'blur(20px) saturate(180%)';
            header.style.webkitBackdropFilter = 'blur(20px) saturate(180%)';
            header.style.backgroundColor = 'var(--bg-primary)';
        } else {
            header.style.backdropFilter = 'none';
            header.style.webkitBackdropFilter = 'none';
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });

    // Menu Button - Open Sidebar
    menuBtn?.addEventListener('click', () => {
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(15);
        
        // Dispatch custom event for sidebar to handle
        window.dispatchEvent(new CustomEvent('sidebar:open'));
    });

    // Search Button - Open Categories/Search
    searchBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(15);
        
        if (window.showCategoriesView) {
            window.showCategoriesView();
        } else if (window.switchView) {
            window.switchView('categoriesView', true);
        }
    });

    // Logo Click - Go Home with animation
    homeLogoBtn?.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(20);
        
        // If already on home, scroll to top with bounce
        const homeView = document.getElementById('homeView');
        if (homeView?.classList.contains('active')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Subtle pulse animation on logo
            const img = homeLogoBtn.querySelector('img');
            img.style.transform = 'scale(0.9)';
            setTimeout(() => img.style.transform = '', 200);
            return;
        }
        
        // Switch to home view
        if (window.switchView) {
            window.switchView('homeView', true);
        }
        
        // Reset home state
        if (window.resetHomeState) window.resetHomeState();
    });

    // Keyboard accessibility for logo
    homeLogoBtn?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            homeLogoBtn.click();
        }
    });
});

