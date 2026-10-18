/**
 * ==========================================================================
 * CUMBEAR — EXOCLICK BANNER + VIDEO SLIDER CONTROLLER
 * --------------------------------------------------------------------------
 * Handles three placements:
 *   1. Top banner       (mobile rectangle 6057032 / desktop leaderboard 6056586)
 *   2. Bottom banners   (home, search, player — same zones as top)
 *   3. Video slider popup (6056606) — dismissible, 45s reopen
 *
 * Gates:
 *   - window.CumBearConsent.isAdAllowed() === true
 *   - window.CUMBEAR.exo.*  (zone IDs from config.js)
 *
 * Public API:
 *   window.updateAdVisibility(viewId)  → called by script.js on every route change
 *   window.CumBearAds.refreshBanners() → force a re-serve (e.g. after consent late)
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.CumBearAds) return;
  const CFG = window.CUMBEAR;
  if (!CFG) {
    console.warn('[CumBearAds] config.js not loaded — aborting');
    return;
  }

  /* ---------- state ---------- */
  const servedZones = new Set();   // zone IDs we've already pushed
  let sliderTimer = null;
  let sliderReopenTimer = null;
  let sliderClosedByUser = false;
  let currentView = 'homeView';

  /* ---------- consent ---------- */
  function consentAllows() {
    return window.CumBearConsent && window.CumBearConsent.isAdAllowed() === true;
  }

  /* ---------- AdProvider boot ---------- */
  function ensureProviderQueue() {
    window.AdProvider = window.AdProvider || [];
    return window.AdProvider;
  }

  /**
   * Push a serve request for a specific zone, exactly once.
   * The ExoClick provider script processes the queue asynchronously and
   * will find matching <ins data-zoneid="..."> elements on the page.
   */
  function serveOnce(zoneId) {
    const key = String(zoneId);
    if (servedZones.has(key)) return;
    if (!consentAllows()) return;
    try {
      ensureProviderQueue().push({ serve: {} });
      servedZones.add(key);
    } catch (e) {
      console.warn('[CumBearAds] serve failed for zone', zoneId, e);
    }
  }

  /* ---------- banner visibility ---------- */
  function setBannerVisible(wrapperEl, visible) {
    if (!wrapperEl) return;
    if (visible) {
      wrapperEl.classList.remove('hide-global-banner');
      wrapperEl.style.display = '';
    } else {
      wrapperEl.classList.add('hide-global-banner');
      wrapperEl.style.display = 'none';
    }
  }

  /* Push all zones that appear in the DOM now (respecting per-view rules) */
  function serveVisibleBanners() {
    if (!consentAllows()) return;

    /* Top banner is present on home + categories only */
    if (currentView === 'homeView' || currentView === 'categoriesView') {
      if (document.querySelector('#globalTopBannerWrapper .ad-banner-mobile ins[data-zoneid]')) {
        serveOnce(CFG.exo.zones.mobileBanner);
      }
      if (document.querySelector('#globalTopBannerWrapper .ad-banner-desktop ins[data-zoneid]')) {
        serveOnce(CFG.exo.zones.desktopLeaderboard);
      }
    }

    /* Home bottom banner */
    if (currentView === 'homeView' && document.getElementById('homeBottomBanner')) {
      serveOnce(CFG.exo.zones.mobileBanner);
      serveOnce(CFG.exo.zones.desktopLeaderboard);
    }

    /* Search bottom banner (only when results visible) */
    if (currentView === 'categoriesView') {
      const resultsVisible = !document.getElementById('searchResultsSection')?.classList.contains('hidden');
      if (resultsVisible && document.getElementById('searchBottomBanner')) {
        serveOnce(CFG.exo.zones.mobileBanner);
        serveOnce(CFG.exo.zones.desktopLeaderboard);
      }
    }

    /* Player top banner — has its own zone instance in DOM */
    if (currentView === 'playerView' && document.getElementById('playerTopBanner')) {
      serveOnce(CFG.exo.zones.mobileBanner);
      serveOnce(CFG.exo.zones.desktopLeaderboard);
    }
  }

  /* ---------- video slider popup ---------- */
  function sliderEl() { return document.getElementById('videoSliderPopup'); }
  function sliderCloseBtn() { return document.getElementById('videoSliderCloseBtn'); }

  function isShortsView() {
    return document.body.classList.contains('shorts-mode') ||
      (document.getElementById('shortsView')?.classList.contains('active'));
  }

  function showSlider() {
    const el = sliderEl();
    if (!el) return;
    if (!consentAllows()) return;
    if (isShortsView()) return;
    if (sliderClosedByUser) return;

    el.hidden = false;
    el.classList.remove('hidden');
    serveOnce(CFG.exo.zones.videoSlider);
  }

  function hideSlider(markClosed) {
    const el = sliderEl();
    if (!el) return;
    el.hidden = true;
    el.classList.add('hidden');
    if (markClosed) {
      sliderClosedByUser = true;
      /* Reopen after the configured cooldown, but only during this session */
      if (sliderReopenTimer) clearTimeout(sliderReopenTimer);
      sliderReopenTimer = setTimeout(function () {
        sliderClosedByUser = false;
        if (!isShortsView()) showSlider();
      }, CFG.ux.sliderPopDismissCooldownMs);
    }
  }

  /* ---------- public API ---------- */
  window.updateAdVisibility = function (viewId) {
    currentView = viewId || 'homeView';

    /* --- top banner --- */
    const topBanner = document.getElementById('globalTopBannerWrapper');
    if (topBanner) {
      const visible = (currentView === 'homeView' || currentView === 'categoriesView');
      setBannerVisible(topBanner, visible);
    }

    /* --- video slider --- */
    if (isShortsView()) {
      hideSlider(false);           /* hide, but don't treat as "dismissed" */
    } else if (!sliderClosedByUser) {
      /* Only show after the user is on an ad-friendly view */
      if (currentView === 'homeView' || currentView === 'categoriesView' || currentView === 'playerView') {
        if (sliderTimer) { clearTimeout(sliderTimer); sliderTimer = null; }
        sliderTimer = setTimeout(showSlider, 300);
      }
    }

    /* --- bottom banners: serve on first reveal --- */
    serveVisibleBanners();
  };

  window.CumBearAds = {
    refreshBanners: function () {
      /* Reset served state so next push re-requests (useful after late consent) */
      servedZones.clear();
      serveVisibleBanners();
    }
  };

  /* ---------- one-time wiring ---------- */
  function wireSliderClose() {
    const close = sliderCloseBtn();
    if (!close || close.dataset.wired) return;
    close.dataset.wired = '1';
    close.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      hideSlider(true);
    });
  }

  function wireFirstScrollTrigger() {
    let armed = true;
    const arm = function () {
      if (!armed) return;
      armed = false;
      if (consentAllows() && !isShortsView()) showSlider();
    };

    window.addEventListener('scroll', function () {
      if (window.scrollY > CFG.ux.sliderPopScrollTriggerPx) arm();
    }, { passive: true });

    /* Fallback: after the configured delay, show once (whichever happens first) */
    setTimeout(arm, CFG.ux.sliderPopFirstDelayMs);
  }

  /* ---------- wrap switchView ONCE (safe) ---------- */
  function wrapSwitchViewOnce() {
    if (!window.switchView) return;
    if (window.switchView.__cumbearWrapped) return; /* already wrapped */

    const original = window.switchView;
    const wrapped = function (viewId, pushHistory) {
      const ret = original.apply(this, arguments);
      try {
        window.updateAdVisibility(viewId);
      } catch (e) {
        console.warn('[CumBearAds] updateAdVisibility failed:', e);
      }
      return ret;
    };
    wrapped.__cumbearWrapped = true;

    window.switchView = wrapped;
  }

  /* ---------- boot ---------- */
  function boot() {
    wireSliderClose();
    wrapSwitchViewOnce();
    wireFirstScrollTrigger();

    if (consentAllows()) {
      /* Initial pass for whatever view is active right now */
      window.updateAdVisibility(currentView);
    } else {
      /* Wait for consent, then serve everything on first grant */
      window.addEventListener('cumbear:consent', function handler(ev) {
        if (ev.detail && ev.detail.state === 'all') {
          window.removeEventListener('cumbear:consent', handler);
          servedZones.clear();
          window.updateAdVisibility(currentView);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
