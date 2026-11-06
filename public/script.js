/**
 * ==========================================================================
 * CUMBEAR — CORE SPA ROUTER & VIEW CONTROLLER (v3)
 * --------------------------------------------------------------------------
 * Age gate, switchView, history, deep-link /watch/:id
 * Dispatches cumbear:viewChanged for search / ads / shorts
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearRouterLoaded) return;
  window.__cumbearRouterLoaded = true;

  const VIEWS = ['homeView', 'shortsView', 'categoriesView', 'playerView', 'notFoundView'];

  const ROUTES = {
    '/': 'homeView',
    '/shorts': 'shortsView',
    '/categories': 'categoriesView'
  };

  const VIEW_ROUTES = {
    homeView: '/',
    shortsView: '/shorts',
    categoriesView: '/categories'
  };

  let currentView = 'homeView';
  let ageVerified = false;

  
  /* AGE GATE BYPASS — gate removed from HTML */
  function applyVerifiedState() {
    const gate = document.getElementById('ageGate');
    const app = document.getElementById('mainApp');
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
      const el = document.getElementById(v);
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
        try {
          window.stopShorts();
        } catch (e) { /* ignore */ }
      }
    }
  }

  function handlePlayerLifecycle(prevView, newView) {
    if (prevView === 'playerView' && newView !== 'playerView') {
      if (typeof window.stopPlayer === 'function') {
        try {
          window.stopPlayer();
        } catch (e) { /* ignore */ }
      }
    }
  }

  function updateTabStates(viewId) {
    document.querySelectorAll('.view-tab').forEach(function (tab) {
      const target = tab.getAttribute('data-view');
      tab.classList.toggle('active', target === viewId);
    });
  }

  function notifySubscribers(viewId, prevView) {
    try {
      window.dispatchEvent(
        new CustomEvent('cumbear:viewChanged', {
          detail: { view: viewId, prev: prevView }
        })
      );
    } catch (e) { /* ignore */ }

    try {
      if (typeof window.updateAdVisibility === 'function') {
        window.updateAdVisibility(viewId);
      }
    } catch (e) { /* ignore */ }

    try {
      if (window.CumBearCrak && typeof window.CumBearCrak.refresh === 'function') {
        window.CumBearCrak.refresh();
      }
    } catch (e) { /* ignore */ }
  }

  window.switchView = function (targetViewId, pushHistory) {
    if (VIEWS.indexOf(targetViewId) === -1) return;
    const prev = currentView;
    if (targetViewId === currentView && targetViewId !== 'playerView') return;

    currentView = targetViewId;
    setActiveView(targetViewId);
    toggleBodyClasses(targetViewId);
    updateTabStates(targetViewId);
    handleShortsLifecycle(prev, targetViewId);
    handlePlayerLifecycle(prev, targetViewId);
    notifySubscribers(targetViewId, prev);

    if (pushHistory !== false && targetViewId !== 'playerView') {
      const route = VIEW_ROUTES[targetViewId];
      if (route && window.location.pathname !== route) {
        try {
          window.history.pushState({ view: targetViewId }, '', route);
        } catch (e) { /* ignore */ }
      }
    }

    const behavior = pushHistory === false ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior: behavior });
  };

  window.getCurrentView = function () {
    return currentView;
  };

  function parseRoute() {
    const path = window.location.pathname || '/';
    const watch = path.match(/^\/(?:watch|video)\/([A-Za-z0-9_-]+)\/?$/);
    if (watch) {
      return { view: 'playerView', videoId: watch[1] };
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
      window.switchView('playerView', false);
      if (typeof window.loadPlayerVideoById === 'function') {
        window.loadPlayerVideoById(route.videoId);
      } else {
        setTimeout(function () {
          if (typeof window.loadPlayerVideoById === 'function') {
            window.loadPlayerVideoById(route.videoId);
          }
        }, 200);
      }
      return;
    }
    window.switchView(route.view, pushHistory === true);
  }

  window.addEventListener('popstate', function (event) {
    const route =
      event && event.state && event.state.view
        ? { view: event.state.view, videoId: event.state.videoId || null }
        : parseRoute();

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

  function wireAgeGateButton() {
    const btn = document.querySelector('.btn-enter');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', function () {
      verifyAge();
    });
  }

  function init() {
    wireViewTabs();
    wireAgeGateButton();
    try { checkAgeGate(); } catch(e) {}
    try { var app=document.getElementById("mainApp"); if(app){ app.classList.remove("hidden"); app.style.display=""; } } catch(e) {}

    const initialRoute = parseRoute();
    if (initialRoute.view !== 'homeView' || initialRoute.videoId) {
      const tryApply = function () {
        const app = document.getElementById('mainApp');
        if (app && !app.classList.contains('hidden')) {
          applyRoute(initialRoute, false);
        } else {
          const gateBtn = document.querySelector('.btn-enter');
          if (gateBtn) {
            gateBtn.addEventListener(
              'click',
              function () {
                setTimeout(function () {
                  applyRoute(initialRoute, false);
                }, 40);
              },
              { once: true }
            );
          }
        }
      };
      tryApply();
      setTimeout(tryApply, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Low network hint */
  (function netHint(){
    function show(msg){
      var t = document.getElementById('cumbearNetToast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'cumbearNetToast';
        t.className = 'cumbear-net-toast';
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function(){ t.classList.remove('show'); }, 4000);
    }
    function check(){
      try {
        var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!c) return;
        if (c.saveData) { show('Low connection — data saver is on'); return; }
        var dl = c.downlink; // Mbps
        if (typeof dl === 'number' && dl > 0 && dl < 1) {
          show('Internet speed is low — videos may buffer');
        }
        if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g') {
          show('Very slow network detected');
        }
      } catch(e) {}
    }
    window.addEventListener('online', function(){ show('Back online'); });
    window.addEventListener('offline', function(){ show('No internet connection'); });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
    else check();
    setInterval(check, 30000);
  })();


  /* Low network hint */
  (function netHint(){
    function show(msg){
      var t = document.getElementById('cumbearNetToast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'cumbearNetToast';
        t.className = 'cumbear-net-toast';
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function(){ t.classList.remove('show'); }, 4000);
    }
    function check(){
      try {
        var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!c) return;
        if (c.saveData) { show('Low connection — data saver is on'); return; }
        var dl = c.downlink; // Mbps
        if (typeof dl === 'number' && dl > 0 && dl < 1) {
          show('Internet speed is low — videos may buffer');
        }
        if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g') {
          show('Very slow network detected');
        }
      } catch(e) {}
    }
    window.addEventListener('online', function(){ show('Back online'); });
    window.addEventListener('offline', function(){ show('No internet connection'); });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
    else check();
    setInterval(check, 30000);
  })();

})();