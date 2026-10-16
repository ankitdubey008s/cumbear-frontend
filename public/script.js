/**
 * ==========================================================================
 * CUMBEAR CORE APP CONTROLLER & ROUTER
 * ==========================================================================
 */

(function () {
  'use strict';

  function verifyAge() {
    const ageGate = document.getElementById('ageGate');
    const mainApp = document.getElementById('mainApp');
    if (ageGate) ageGate.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    try { sessionStorage.setItem('cumbear_age_verified', 'true'); } catch (e) {}
  }

  window.verifyAge = verifyAge;

  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (sessionStorage.getItem('cumbear_age_verified') === 'true') {
        const ageGate = document.getElementById('ageGate');
        const mainApp = document.getElementById('mainApp');
        if (ageGate) ageGate.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
      }
    } catch (e) {}

    // Global listener for ALL buttons that have data-view="shortsView"
    document.querySelectorAll('[data-view="shortsView"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.switchView('shortsView', true);
      });
    });

    // Global listener for ALL buttons that have data-view="homeView"
    document.querySelectorAll('[data-view="homeView"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.switchView('homeView', true);
      });
    });
  });

  window.switchView = function (targetViewId, pushHistory = true) {
    const views = ['homeView', 'shortsView', 'categoriesView', 'playerView'];

    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    const activeEl = document.getElementById(targetViewId);
    if (activeEl) {
      activeEl.classList.remove('hidden');
      activeEl.classList.add('active');
    }

    // Toggle immersion class for Shorts
    if (targetViewId === 'shortsView') {
      document.body.classList.add('shorts-mode');
      if (typeof window.loadShorts === 'function') {
        window.loadShorts();
      }
    } else {
      document.body.classList.remove('shorts-mode');
      if (typeof window.stopShorts === 'function') {
        window.stopShorts();
      }
    }

    // Update Banner and Ad visibility
    if (typeof window.updateAdVisibility === 'function') {
      window.updateAdVisibility(targetViewId);
    }

    // Update bottom/tab button states
    document.querySelectorAll('.view-tab').forEach(tab => {
      if (tab.getAttribute('data-view') === targetViewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (pushHistory) {
      history.pushState({ view: targetViewId }, '', targetViewId === 'homeView' ? '/' : `/#${targetViewId}`);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Header Logo click handler
  document.addEventListener('DOMContentLoaded', () => {
    const logoBtn = document.getElementById('homeLogoBtn');
    if (logoBtn) {
      logoBtn.addEventListener('click', () => {
        window.switchView('homeView', true);
        if (typeof window.resetHomeState === 'function') {
          window.resetHomeState();
        }
      });
    }
  });

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
      window.switchView(e.state.view, false);
    } else {
      window.switchView('homeView', false);
    }
  });
})();
