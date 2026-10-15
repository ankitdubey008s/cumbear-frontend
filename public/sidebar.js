/**
 * ==========================================================================
 * CUMBEAR SIDEBAR & PWA INSTALL CONTROLLER
 * ==========================================================================
 */

(function () {
  'use strict';

  let deferredPrompt = null;

  // Catch PWA install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('siteSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('closeSidebar');
    const installBtn = document.getElementById('appInstallBtn');
    const themeBtn = document.getElementById('themeToggleBtn');
    const navLinks = document.querySelectorAll('.site-sidebar .nav-link');

    // --- Sidebar Open / Close API ---
    window.openSidebar = function () {
      if (sidebar) sidebar.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    window.closeSidebar = function () {
      if (sidebar) sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', window.closeSidebar);
    }

    if (overlay) {
      overlay.addEventListener('click', window.closeSidebar);
    }

    // --- Sidebar Navigation Links ---
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        if (targetView && window.switchView) {
          window.closeSidebar();
          window.switchView(targetView, true);

          if (targetView === 'shortsView' && typeof window.loadShorts === 'function') {
            window.loadShorts();
          }
        }
      });
    });

    // --- PWA Installation Trigger ---
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            console.log('User accepted CumBear install');
          }
          deferredPrompt = null;
        } else {
          alert('To install CumBear App:\n\nTap browser menu (⋮) -> Select "Add to Home Screen" or "Install App".');
        }
      });
    }

    // --- Theme Toggle System ---
    const savedTheme = localStorage.getItem('cumbear_theme') || 'dark';
    applyTheme(savedTheme);

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
      });
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('cumbear_theme', theme);
      } catch (e) {}

      if (themeBtn) {
        themeBtn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
      }
    }
  });
})();
