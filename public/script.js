/**
 * ==========================================================================
 * CUMBEAR — CORE SPA ROUTER & VIEW CONTROLLER
 * --------------------------------------------------------------------------
 * - Age gate
 * - switchView(targetView, pushHistory)  [public API]
 * - History management (pushState / popstate)
 * - Deep-link: /watch/:id auto-mounts player
 * - Dispatches `cumbear:viewChanged` for downstream subscribers
 *   (search.js restores state, craksmart.js re-evaluates placement)
 *
 * Public API:
 *   window.verifyAge()
 *   window.switchView(viewId, pushHistory)
 *   window.getCurrentView()
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearRouterLoaded) return;
  window.__cumbearRouterLoaded = true;

  const VIEWS = ['homeView', 'shortsView', 'categoriesView', 'playerView'];

  /* Route → view mapping */
  const ROUTES = {
    '/': 'homeView',
    '/shorts': 'shortsView',
    '/categories': 'categoriesView'
    /* /watch/:id handled separately */
  };

  /* View → route for pushState */
  const VIEW_ROUTES = {
    homeView: '/',
    shortsView: '/shorts',
    categoriesView: '/categories'
    /* playerView uses /watch/:id set by player.js */
  };

  /* ---------- state ---------- */
  let currentView = 'homeView';

  /* In-memory verification flag (survives storage block) */
  let ageVerified = false;

  /* ============================================================
     AGE GATE
     ============================================================ */
  function applyVerifiedState() {
    const gate = document.getElementById('ageGate');
    const app  = document.getElementById('mainApp');
    if (gate) gate.classList.add('hidden');
    if (app)  app.classList.remove('hidden');
    ageVerified = true;
  }

  function verifyAge() {
    applyVerifiedState();
    try { sessionStorage.setItem('cumbear_age_verified', 'true'); }
    catch (e) { /* ignore — in-memory flag covers this session */ }
  }

  window.verifyAge = verifyAge;

  function checkAgeGate() {
    try {
      if (sessionStorage.getItem('cumbear_age_verified') === 'true') {
        applyVerifiedState();
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  /* ============================================================
     VIEW SWITCHING
     ============================================================ */
  function setActiveView(targetViewId) {
    VIEWS.forEach(function (v) {
      const el = document.getElementById(v);
      if (!el) return;
      if (v === targetViewId) {
        el.classList.remove('hidden');
        el.classList.add('active');
      } else {
        el.classList.add('hidden');
        el.classList.remove('active');
      }
    });
    currentView = targetViewId;
  }

  function toggleBodyClasses(viewId) {
    document.body.classList.toggle('shorts-mode', viewId === 'shortsView');
    document.body.classList.toggle('player-mode', viewId === 'playerView');
  }

  function handleShortsLifecycle(prevView, newView) {
    if (newView === 'shortsView' && prevView !== 'shortsView') {
      if (typeof window.loadShorts === 'function') {
        window.loadShorts();
      }
    }
    if (prevView === 'shortsView' && newView !== 'shortsView') {
      if (typeof window.stopShorts === 'function') {
        try { window.stopShorts(); } catch (e) { /* ignore */ }
      }
    }
  }

  function handlePlayerLifecycle(prevView, newView) {
    if (prevView === 'playerView' && newView !== 'playerView') {
      if (typeof window.stopPlayer === 'function') {
        try { window.stopPlayer(); } catch (e) { /* ignore */ }
      }
    }
  }

  function updateTabStates(viewId) {
    document.querySelectorAll('.view-tab').forEach(function (tab) {
      const isActive = tab.getAttribute('data-view') === viewId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function notifySubscribers(viewId, prevView) {
    /* cumbear:viewChanged — used by search.js, craksmart.js */
    try {
      window.dispatchEvent(new CustomEvent('cumbear:viewChanged', {
        detail: { view: viewId, previous: prevView }
      }));
    } catch (e) { /* ignore */ }

    /* Update ad visibility — the wrapped switchView in ads.js does this,
       but we also call explicitly to cover non-ads.js environments. */
    try {
      if (typeof window.updateAdVisibility === 'function') {
        window.updateAdVisibility(viewId);
      }
    } catch (e) { /* ignore */ }

    /* Re-evaluate CrakRevenue placements per view */
    try {
      if (window.CumBearCrak && typeof window.CumBearCrak.refresh === 'function') {
        window.CumBearCrak.refresh();
      }
    } catch (e) { /* ignore */ }
  }

  /* Public API */
  window.switchView = function (targetViewId, pushHistory) {
    if (VIEWS.indexOf(targetViewId) === -1) return;

    const prevView = currentView;
    if (prevView === targetViewId && pushHistory === false) return;

    setActiveView(targetViewId);
    toggleBodyClasses(targetViewId);
    updateTabStates(targetViewId);

    /* Lifecycle hooks */
    handleShortsLifecycle(prevView, targetViewId);
    handlePlayerLifecycle(prevView, targetViewId);

    /* History */
    if (pushHistory === true) {
      const route = VIEW_ROUTES[targetViewId];
      if (route && window.location.pathname !== route) {
        try {
          history.pushState({ view: targetViewId }, '', route);
        } catch (e) { /* ignore */ }
      }
    }

    /* Notify downstream */
    notifySubscribers(targetViewId, prevView);

    /* Scroll to top — smooth only on genuine navigation */
    const behavior = (prevView === targetViewId) ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior: behavior });
  };

  window.getCurrentView = function () { return currentView; };

  /* ============================================================
     HISTORY & ROUTING
     ============================================================ */
  function parseRoute() {
    const path = window.location.pathname || '/';
    if (path === '/' || path === '') return { view: 'homeView', path: path };

    /* /watch/:id */
    const watchMatch = path.match(/^\/watch\/([A-Za-z0-9_-]+)\/?$/);
    if (watchMatch) {
      return { view: 'playerView', videoId: watchMatch[1], path: path };
    }

    /* /shorts */
    if (path === '/shorts' || path === '/shorts/') {
      return { view: 'shortsView', path: path };
    }

    /* /categories */
    if (path === '/categories' || path === '/categories/') {
      return { view: 'categoriesView', path: path };
    }

    /* Unknown path → home */
    return { view: 'homeView', path: '/' };
  }

  function applyRoute(route, pushHistory) {
    if (route.view === 'playerView' && route.videoId) {
      /* Show player view, then ask player.js to load the video */
      window.switchView('playerView', false);
      if (typeof window.loadPlayerVideoById === 'function') {
        window.loadPlayerVideoById(route.videoId);
      } else {
        /* player.js might still be deferred — retry once */
        setTimeout(function () {
          if (typeof window.loadPlayerVideoById === 'function') {
            window.loadPlayerVideoById(route.videoId);
          }
        }, 150);
      }
      return;
    }
    window.switchView(route.view, pushHistory === true);
  }

  window.addEventListener('popstate', function (event) {
    /* Prefer state stored by our own pushState; fallback to URL parse */
    const route = (event && event.state && event.state.view)
      ? { view: event.state.view, videoId: event.state.videoId }
      : parseRoute();

    /* Skip if no actual change */
    if (route.view === currentView && !route.videoId) return;

    if (route.videoId && route.view === 'playerView') {
      if (typeof window.loadPlayerVideoById === 'function') {
        window.switchView('playerView', false);
        window.loadPlayerVideoById(route.videoId);
      }
      return;
    }
    window.switchView(route.view, false);
  });

  /* ============================================================
     WIRE VIEW TABS (Home / Shorts buttons at top of home view)
     ============================================================ */
  function wireViewTabs() {
    document.querySelectorAll('.view-tab').forEach(function (tab) {
      if (tab.dataset.wired) return;
      tab.dataset.wired = '1';
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        const target = tab.getAttribute('data-view');
        if (target) window.switchView(target, true);
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    wireViewTabs();

    /* If already verified this session, skip gate */
    checkAgeGate();

    /* Handle direct URL on first load (/watch/:id, /shorts, /categories) */
    const initialRoute = parseRoute();
    if (initialRoute.view !== 'homeView' || initialRoute.videoId) {
      /* Defer until app is visible (age gate may still be up) */
      const tryApply = function () {
        if (document.getElementById('mainApp') &&
            !document.getElementById('mainApp').classList.contains('hidden')) {
          applyRoute(initialRoute, false);
        } else {
          /* Wait for age gate click */
          const gateBtn = document.querySelector('.btn-enter');
          if (gateBtn) {
            gateBtn.addEventListener('click', function () {
              setTimeout(function () { applyRoute(initialRoute, false); }, 30);
            }, { once: true });
          }
        }
      };
      /* Try immediately, then after DOM settles */
      tryApply();
      setTimeout(tryApply, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
