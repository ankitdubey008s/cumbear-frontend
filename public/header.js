/**
 * ==========================================================================
 * CUMBEAR HEADER COMPONENT CONTROLLER
 * ==========================================================================
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const menuBtn = document.getElementById('menuBtn');
    const homeLogoBtn = document.getElementById('homeLogoBtn');
    const header = document.getElementById('siteHeader');

    // 1. Search Button -> Opens Search/Categories View & Auto-Focuses Input
    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.switchView) {
          window.switchView('categoriesView', true);
        }

        // Give view animation 200ms, then focus the input cleanly
        setTimeout(() => {
          const searchInput = document.getElementById('searchInput');
          if (searchInput) {
            searchInput.focus();
          }
        }, 200);
      });
    }

    // 2. Center Logo -> Returns to Home, resets active filters and pagination
    if (homeLogoBtn) {
      homeLogoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.resetHomeState === 'function') {
          window.resetHomeState();
        }
        if (window.switchView) {
          window.switchView('homeView', true);
        }
      });
    }

    // 3. Hamburger Button -> Opens Off-Canvas Sidebar
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.openSidebar === 'function') {
          window.openSidebar();
        } else {
          const sidebar = document.getElementById('siteSidebar');
          const overlay = document.getElementById('sidebarOverlay');
          if (sidebar) sidebar.classList.add('active');
          if (overlay) overlay.classList.add('active');
        }
      });
    }

    // 4. One UI Dynamic Header Shadow on Scroll
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (header) {
            if (window.scrollY > 15) {
              header.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.75)';
              header.style.borderBottomColor = 'rgba(124, 29, 64, 0.35)';
            } else {
              header.style.boxShadow = 'none';
              header.style.borderBottomColor = 'var(--border-color)';
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  });
})();
