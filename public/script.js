/**
 * CUMBEAR — SPA router (v4)
 * Routes: / , /shorts , /categories , /video/:id , /watch/:id
 * Back from player returns to previous SPA page (usually home), not out of site.
 */
(function () {
  'use strict';
  if (window.__cumbearRouterLoaded) return;
  window.__cumbearRouterLoaded = true;

  var VIEWS = ['homeView', 'shortsView', 'categoriesView', 'playerView', 'notFoundView'];
  var ROUTES = {
    '/': 'homeView',
    '/shorts': 'shortsView',
    '/categories': 'categoriesView'
  };
  var VIEW_ROUTES = {
    homeView: '/',
    shortsView: '/shorts',
    categoriesView: '/categories',
    notFoundView: '/'
  };

  var currentView = 'homeView';
  var currentVideoId = null;

  function applyVerifiedState() {
    var gate = document.getElementById('ageGate');
    var app = document.getElementById('mainApp');
    if (gate) gate.classList.add('hidden');
    if (app) {
      app.classList.remove('hidden');
      app.style.display = '';
    }
  }
  function verifyAge() { applyVerifiedState(); }
  window.verifyAge = verifyAge;
  function checkAgeGate() {
    applyVerifiedState();
    return true;
  }

  function setActiveView(targetViewId) {
    VIEWS.forEach(function (v) {
      var el = document.getElementById(v);
      if (!el) return;
      if (v === targetViewId) {
        el.classList.add('active');
        el.classList.remove('hidden');
        el.style.display = '';
      } else {
        el.classList.remove('active');
        el.classList.add('hidden');
      }
    });
  }

  function toggleBodyClasses(viewId) {
    document.body.classList.toggle('shorts-mode', viewId === 'shortsView');
    document.body.classList.toggle('player-mode', viewId === 'playerView');
    document.body.classList.toggle('categories-mode', viewId === 'categoriesView');
  }

  function handleShortsLifecycle(prevView, newView) {
    if (newView === 'shortsView') {
      if (typeof window.loadShorts === 'function') window.loadShorts();
    } else if (prevView === 'shortsView') {
      if (typeof window.stopShorts === 'function') {
        try { window.stopShorts(); } catch (e) {}
      }
    }
  }

  function handlePlayerLifecycle(prevView, newView) {
    if (prevView === 'playerView' && newView !== 'playerView') {
      if (typeof window.stopPlayer === 'function') {
        try { window.stopPlayer(); } catch (e) {}
      }
      currentVideoId = null;
    }
  }

  function updateTabStates(viewId) {
    document.querySelectorAll('.view-tab').forEach(function (tab) {
      var target = tab.getAttribute('data-view');
      tab.classList.toggle('active', target === viewId);
    });
  }

  function notifySubscribers(viewId, prevView) {
    try {
      window.dispatchEvent(
        new CustomEvent('cumbear:viewChanged', {
          detail: { view: viewId, prev: prevView, videoId: currentVideoId }
        })
      );
    } catch (e) {}
    try {
      if (typeof window.updateAdVisibility === 'function') window.updateAdVisibility(viewId);
    } catch (e) {}
  }

  function pathForPlayer(videoId) {
    return '/video/' + encodeURIComponent(videoId);
  }

  /**
   * @param {string} targetViewId
   * @param {boolean} [pushHistory=true]
   * @param {string|null} [videoId]
   */
  window.switchView = function (targetViewId, pushHistory, videoId) {
    if (VIEWS.indexOf(targetViewId) === -1) return;
    var prev = currentView;
    var doPush = pushHistory !== false;

    if (targetViewId === 'playerView' && videoId) {
      currentVideoId = String(videoId);
    }

    currentView = targetViewId;
    setActiveView(targetViewId);
    toggleBodyClasses(targetViewId);
    updateTabStates(targetViewId === 'playerView' ? 'homeView' : targetViewId);
    handleShortsLifecycle(prev, targetViewId);
    handlePlayerLifecycle(prev, targetViewId);
    notifySubscribers(targetViewId, prev);

    if (doPush) {
      try {
        if (targetViewId === 'playerView' && currentVideoId) {
          var p = pathForPlayer(currentVideoId);
          if (window.location.pathname !== p) {
            window.history.pushState(
              { view: 'playerView', videoId: currentVideoId },
              '',
              p
            );
          } else {
            window.history.replaceState(
              { view: 'playerView', videoId: currentVideoId },
              '',
              p
            );
          }
        } else if (targetViewId !== 'playerView') {
          var route = VIEW_ROUTES[targetViewId] || '/';
          if (window.location.pathname !== route) {
            window.history.pushState({ view: targetViewId, videoId: null }, '', route);
          } else {
            window.history.replaceState({ view: targetViewId, videoId: null }, '', route);
          }
        }
      } catch (e) {}
    }

    try {
      window.scrollTo({ top: 0, behavior: doPush ? 'smooth' : 'auto' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  function parseRoute() {
    var path = window.location.pathname || '/';
    var watch = path.match(/^\/(?:watch|video)\/([A-Za-z0-9_-]+)\/?$/);
    if (watch) {
      return { view: 'playerView', videoId: watch[1] };
    }
    // Shorts share → same as video share: open player if /shorts/:id
    var shortId = path.match(/^\/shorts\/([A-Za-z0-9_-]+)\/?$/);
    if (shortId) {
      return { view: 'playerView', videoId: shortId[1] };
    }
    if (ROUTES[path]) {
      return { view: ROUTES[path], videoId: null };
    }
    if (path === '/' || path === '') {
      return { view: 'homeView', videoId: null };
    }
    return { view: 'notFoundView', videoId: null };
  }

  function applyRoute(route, pushHistory) {
    if (route.videoId) {
      window.switchView('playerView', pushHistory === true, route.videoId);
      if (typeof window.loadPlayerVideoById === 'function') {
        window.loadPlayerVideoById(route.videoId);
      } else {
        setTimeout(function () {
          if (typeof window.loadPlayerVideoById === 'function') {
            window.loadPlayerVideoById(route.videoId);
          }
        }, 50);
      }
      return;
    }
    window.switchView(route.view, pushHistory === true);
  }

  /* Browser Back / Forward */
  window.addEventListener('popstate', function (event) {
    var route;
    if (event && event.state && event.state.view) {
      route = {
        view: event.state.view,
        videoId: event.state.videoId || null
      };
    } else {
      route = parseRoute();
    }

    /* Leaving player via Back → prefer home if state missing */
    if (!event.state && currentView === 'playerView' && route.view === 'playerView' && !route.videoId) {
      route = { view: 'homeView', videoId: null };
    }

    if (route.view === 'playerView' && route.videoId) {
      currentVideoId = route.videoId;
      window.switchView('playerView', false, route.videoId);
      if (typeof window.loadPlayerVideoById === 'function') {
        window.loadPlayerVideoById(route.videoId);
      }
      return;
    }

    currentVideoId = null;
    window.switchView(route.view || 'homeView', false);
  });

  /* Seed history so first Back from deep-linked player goes Home, not off-site */
  function seedHistory() {
    var route = parseRoute();
    try {
      if (route.view === 'playerView' && route.videoId) {
        /* Ensure a home entry exists under the player entry */
        window.history.replaceState({ view: 'homeView', videoId: null }, '', '/');
        window.history.pushState(
          { view: 'playerView', videoId: route.videoId },
          '',
          pathForPlayer(route.videoId)
        );
      } else {
        window.history.replaceState(
          { view: route.view, videoId: null },
          '',
          window.location.pathname || '/'
        );
      }
    } catch (e) {}
    applyRoute(route, false);
  }

  function wireTabs() {
    document.querySelectorAll('.view-tab[data-view], .nav-link[data-view]').forEach(function (btn) {
      if (btn.dataset.routerWired) return;
      btn.dataset.routerWired = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var v = btn.getAttribute('data-view');
        if (v) window.switchView(v, true);
      });
    });
  }

  function wireLogo() {
    var logo = document.getElementById('homeLogoBtn');
    if (!logo || logo.dataset.routerWired) return;
    logo.dataset.routerWired = '1';
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      window.switchView('homeView', true);
    });
  }

  function boot() {
    applyVerifiedState();
    wireTabs();
    wireLogo();
    seedHistory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Low network hint (dismissible, light) */
  (function netHint() {
    var lastShown = 0;
    function show(msg) {
      var now = Date.now();
      if (now - lastShown < 60000) return;
      lastShown = now;
      var t = document.getElementById('cumbearNetToast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'cumbearNetToast';
        t.className = 'cumbear-net-toast';
        t.style.cssText =
          'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;' +
          'background:#1a1a1a;color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;' +
          'max-width:90%;opacity:0;transition:opacity .25s';
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.style.opacity = '1';
      setTimeout(function () {
        t.style.opacity = '0';
      }, 4000);
    }
    function check() {
      try {
        var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!c) return;
        if (c.saveData) show('Low connection — data saver is on');
        else if (typeof c.downlink === 'number' && c.downlink > 0 && c.downlink < 1)
          show('Internet speed looks low — videos may buffer');
        else if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g')
          show('Very slow network detected');
      } catch (e) {}
    }
    window.addEventListener('online', function () {
      lastShown = 0;
      show('Back online');
    });
    window.addEventListener('offline', function () {
      lastShown = 0;
      show('No internet connection');
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
    else check();
  })();
})();

