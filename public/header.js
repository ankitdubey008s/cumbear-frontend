/**
 * ==========================================================================
 * CUMBEAR — HEADER CONTROLLER
 * --------------------------------------------------------------------------
 * Wires three buttons exactly once:
 *   1. Menu   → openSidebar()
 *   2. Logo   → resetHomeState() + switchView('homeView')
 *   3. Search → switchView('categoriesView') + focus input after view shown
 *
 * Adds `.scrolled` class to header when window.scrollY > 15 (avoids inline
 * style thrash; CSS handles the actual shadow via .scrolled).
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearHeaderLoaded) return;
  window.__cumbearHeaderLoaded = true;

  function wireMenu(btn) {
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.openSidebar === 'function') {
        window.openSidebar();
      } else {
        /* Fallback if sidebar.js hasn't loaded yet */
        const sidebar = document.getElementById('siteSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  function wireLogo(btn) {
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof window.resetHomeState === 'function') {
        try { window.resetHomeState(); } catch (err) { /* ignore */ }
      }
      if (typeof window.switchView === 'function') {
        window.switchView('homeView', true);
      }
    });
  }

  function wireSearch(btn) {
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();

      const focusInput = function () {
        const input = document.getElementById('searchInput');
        if (input) {
          try { input.focus({ preventScroll: true }); }
          catch (err) { input.focus(); }
        }
      };

      /* If already on categoriesView, focus immediately */
      if (window.getCurrentView && window.getCurrentView() === 'categoriesView') {
        focusInput();
        return;
      }

      /* Otherwise switch and wait for view-changed event */
      if (typeof window.switchView === 'function') {
        /* Attach one-shot listener before the switch */
        const onSwitch = function (ev) {
          if (ev && ev.detail && ev.detail.view === 'categoriesView') {
            window.removeEventListener('cumbear:viewChanged', onSwitch);
            /* Small delay so the view is actually painted before focus */
            setTimeout(focusInput, 60);
          }
        };
        window.addEventListener('cumbear:viewChanged', onSwitch);

        window.switchView('categoriesView', true);

        /* Safety fallback if event never fires */
        setTimeout(function () {
          window.removeEventListener('cumbear:viewChanged', onSwitch);
          if (window.getCurrentView && window.getCurrentView() === 'categoriesView') {
            focusInput();
          }
        }, 400);
      } else {
        /* No router available — just try to focus */
        focusInput();
      }
    });
  }

  /* ---------- scroll shadow (CSS class, not inline style) ---------- */
  function wireScrollShadow() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    let ticking = false;
    const onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('scrolled', window.scrollY > 15);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    /* Apply once on init in case page is loaded already scrolled */
    header.classList.toggle('scrolled', window.scrollY > 15);
  }

  function init() {
    wireMenu(document.getElementById('menuBtn'));
    wireLogo(document.getElementById('homeLogoBtn'));
    wireSearch(document.getElementById('searchBtn'));
    wireScrollShadow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
