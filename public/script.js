/**
 * ==========================================================================
 * CUMBEAR SPA CORE ROUTER & LIFECYCLE (2026 Engine)
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- 1. Age Verification Gate Logic ---
  window.verifyAge = function () {
    try {
      localStorage.setItem('cumbear_age_verified', '1');
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
    const gate = document.getElementById('ageGate');
    const app = document.getElementById('mainApp');
    if (gate) gate.classList.add('hidden');
    if (app) app.classList.remove('hidden');

    // Trigger router and resolve initial state once verified
    initRouter();
    resolveInitialRoute();
  };

  function checkAgeStatus() {
    let verified = false;
    try {
      verified = localStorage.getItem('cumbear_age_verified') === '1';
    } catch (e) {
      verified = false;
    }

    const gate = document.getElementById('ageGate');
    const app = document.getElementById('mainApp');

    if (verified) {
      if (gate) gate.classList.add('hidden');
      if (app) app.classList.remove('hidden');
      initRouter();
      resolveInitialRoute();
    } else {
      if (gate) gate.classList.remove('hidden');
      if (app) app.classList.add('hidden');
    }
  }

  // --- 2. View Switching & Router Engine ---
  const validViews = ['homeView', 'shortsView', 'categoriesView', 'playerView'];

  window.switchView = function (viewId, pushHistory = true) {
    if (!validViews.includes(viewId)) {
      viewId = 'homeView';
    }

    // Stop and unload shorts playback if navigating away from shorts
    if (viewId !== 'shortsView' && typeof window.stopShorts === 'function') {
      window.stopShorts();
    }

    // Pause player video if navigating away from player
    if (viewId !== 'playerView') {
      const playerVid = document.getElementById('mainPlayerVideo');
      if (playerVid && !playerVid.paused) {
        playerVid.pause();
      }
    }

    // Toggle active classes on sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.add('hidden');
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(viewId);
    if (targetSec) {
      targetSec.classList.remove('hidden');
      targetSec.classList.add('active');
    }

    // Sync active state on tabs (Home/Shorts pill buttons)
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-view') === viewId);
    });

    // Sync active state on sidebar links
    document.querySelectorAll('.site-sidebar .nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewId);
    });

    // Update Browser History Stack
    if (pushHistory) {
      let targetPath = '/';
      if (viewId === 'shortsView') targetPath = '/shorts';
      else if (viewId === 'categoriesView') targetPath = '/?categories=1';
      else if (viewId === 'homeView') targetPath = '/';

      history.pushState({ view: viewId }, '', targetPath);
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 3. Initial URL & Deep-Link Resolver ---
  function resolveInitialRoute() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // Deep link: Shorts URL (e.g. /shorts or /shorts/123)
    if (path.startsWith('/shorts')) {
      const parts = path.split('/').filter(Boolean);
      const shortId = parts[1] || null;
      window.switchView('shortsView', false);
      if (typeof window.loadShorts === 'function') {
        window.loadShorts(shortId);
      }
      return;
    }

    // Deep link: Player Video URL (/?v=VIDEO_ID)
    if (params.has('v')) {
      const videoId = params.get('v');
      window.switchView('playerView', false);
      if (typeof window.loadPlayerVideoById === 'function') {
        window.loadPlayerVideoById(videoId);
      }
      return;
    }

    // Deep link: Category filter (/?category=MILF)
    if (params.has('category')) {
      const category = params.get('category');
      window.switchView('homeView', false);
      if (typeof window.setCategoryFilter === 'function') {
        window.setCategoryFilter(category);
      }
      return;
    }

    // Deep link: Search term (/?search=blonde)
    if (params.has('search')) {
      const searchTerm = params.get('search');
      window.switchView('categoriesView', false);
      if (typeof window.performSearch === 'function') {
        window.performSearch(searchTerm);
      }
      return;
    }

    // Default route
    window.switchView('homeView', false);
  }

  // --- 4. History Popstate Listener ---
  function initRouter() {
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        window.switchView(e.state.view, false);
      } else {
        resolveInitialRoute();
      }
    });

    // Delegate view-tab clicks (Home / Shorts pills)
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.view-tab');
      if (tab) {
        e.preventDefault();
        const targetView = tab.getAttribute('data-view');
        if (targetView) {
          window.switchView(targetView, true);
          if (targetView === 'shortsView' && typeof window.loadShorts === 'function') {
            window.loadShorts();
          }
        }
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAgeStatus);
  } else {
    checkAgeStatus();
  }
})();
