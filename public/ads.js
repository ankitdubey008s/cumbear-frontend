/**
 * ==========================================================================
 * CUMBEAR — AD CONTROLLER (v3)
 * --------------------------------------------------------------------------
 * Manages three placements:
 *   1. Top banner       (mobile rectangle / desktop leaderboard)
 *   2. Bottom banners   (home / search / player)
 *   3. Video slider popup (zone 6056606)
 *   + Sticky video banner (uses /sticky-ad.mp4, opens CrakRevenue on tap)
 *
 * Shared 60s cooldown via window.CumBearAdState:
 *   - Dismissing either sticky or slider hides BOTH for 60s
 *   - After 60s both reappear (if view allows)
 *
 * Public API:
 *   window.updateAdVisibility(viewId)
 *   window.CumBearAds.refreshBanners()
 *   window.CumBearAds.hideSticky()   → user-initiated close
 *   window.CumBearAds.hideSlider()   → user-initiated close
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

  /* ==========================================================================
     SHARED AD STATE — 60s cooldown after any dismiss
     ========================================================================== */
  const COOLDOWN_MS = 60000;
  const COOLDOWN_KEY = 'cumbear_ads_cooldown_ts';

  const AdState = {
    getCooldownRemaining: function () {
      try {
        const ts = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
        if (!ts) return 0;
        const elapsed = Date.now() - ts;
        const remaining = COOLDOWN_MS - elapsed;
        return remaining > 0 ? remaining : 0;
      } catch (e) { return 0; }
    },
    startCooldown: function () {
      try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())); }
      catch (e) { /* ignore */ }
    },
    isInCooldown: function () { return this.getCooldownRemaining() > 0; }
  };

  window.CumBearAdState = AdState;

  /* ==========================================================================
     STATE
     ========================================================================== */
  const servedZones = new Set();
  let sliderTimer = null;
  let sliderReopenTimer = null;
  let sliderClosedByUser = false;
  let currentView = 'homeView';
  let stickyTimer = null;
  let stickyReopenTimer = null;

  function consentAllows() {
    return window.CumBearConsent && window.CumBearConsent.isAdAllowed() === true;
  }

  function ensureProviderQueue() {
    window.AdProvider = window.AdProvider || [];
    return window.AdProvider;
  }

  function serveOnce(zoneId) {
    const key = String(zoneId);
    if (servedZones.has(key)) return;
    if (!consentAllows()) return;
    try {
      ensureProviderQueue().push({ serve: {} });
      servedZones.add(key);
    } catch (e) { /* ignore */ }
  }

  /* ==========================================================================
     BANNER VISIBILITY
     ========================================================================== */
  function setBannerVisible(wrapper, visible) {
    if (!wrapper) return;
    if (visible) {
      wrapper.classList.remove('hide-global-banner');
      wrapper.style.display = '';
    } else {
      wrapper.classList.add('hide-global-banner');
      wrapper.style.display = 'none';
    }
  }

  function serveVisibleBanners() {
    if (!consentAllows()) return;

    if (currentView === 'homeView' || currentView === 'categoriesView') {
      if (document.querySelector('#globalTopBannerWrapper .ad-banner-mobile ins[data-zoneid]')) {
        serveOnce(CFG.exo.zones.mobileBanner);
      }
      if (document.querySelector('#globalTopBannerWrapper .ad-banner-desktop ins[data-zoneid]')) {
        serveOnce(CFG.exo.zones.desktopLeaderboard);
      }
    }

    if (currentView === 'homeView' && document.getElementById('homeBottomBanner')) {
      serveOnce(CFG.exo.zones.mobileBanner);
      serveOnce(CFG.exo.zones.desktopLeaderboard);
    }

    if (currentView === 'categoriesView') {
      const resultsVisible = !document.getElementById('searchResultsSection')?.classList.contains('hidden');
      if (resultsVisible && document.getElementById('searchBottomBanner')) {
        serveOnce(CFG.exo.zones.mobileBanner);
        serveOnce(CFG.exo.zones.desktopLeaderboard);
      }
      if (resultsVisible && document.getElementById('searchTopBanner')) {
        serveOnce(CFG.exo.zones.mobileBanner);
        serveOnce(CFG.exo.zones.desktopLeaderboard);
      }
    }

    if (currentView === 'playerView' && document.getElementById('playerTopBanner')) {
      serveOnce(CFG.exo.zones.mobileBanner);
      serveOnce(CFG.exo.zones.desktopLeaderboard);
    }
  }

  /* ==========================================================================
     VIEW HELPERS
     ========================================================================== */
  function isShortsView() {
    return document.body.classList.contains('shorts-mode') ||
      (document.getElementById('shortsView')?.classList.contains('active'));
  }
  function isPlayerView() {
    return document.body.classList.contains('player-mode') ||
      (document.getElementById('playerView')?.classList.contains('active'));
  }

  /* ==========================================================================
     VIDEO SLIDER POPUP
     ========================================================================== */
  function sliderEl() { return document.getElementById('videoSliderPopup'); }
  function sliderCloseBtn() { return document.getElementById('videoSliderCloseBtn'); }

  function showSlider() {
    const el = sliderEl();
    if (!el) return;
    if (!consentAllows()) return;
    if (isShortsView()) return;
    if (sliderClosedByUser) return;
    if (AdState.isInCooldown()) return;

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
      AdState.startCooldown();
      hideSticky(false); /* ALSO hide sticky — shared cooldown */
      if (sliderReopenTimer) clearTimeout(sliderReopenTimer);
      sliderReopenTimer = setTimeout(function () {
        sliderClosedByUser = false;
        if (!isShortsView()) showSlider();
        /* Sticky reopens via its own timer */
      }, COOLDOWN_MS);
    }
  }

  /* ==========================================================================
     STICKY VIDEO BANNER
     ========================================================================== */
  function stickyEl() { return document.getElementById('stickyVideoBanner'); }
  function stickyVideoEl() { return document.getElementById('stickyVideoEl'); }
  function stickyCloseBtn() { return document.getElementById('stickyVideoCloseBtn'); }

  function showSticky() {
    const el = stickyEl();
    if (!el) return;
    if (!consentAllows()) return;
    if (isShortsView()) return; /* never on shorts */
    if (AdState.isInCooldown()) return;

    el.classList.remove('hidden');

    const vid = stickyVideoEl();
    if (vid) {
      vid.muted = true;
      const p = vid.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { /* autoplay blocked, thumbnail shows */ });
      }
    }
  }

  function hideSticky(markCooldown) {
    const el = stickyEl();
    if (!el) return;
    el.classList.add('hidden');

    const vid = stickyVideoEl();
    if (vid) {
      try { vid.pause(); } catch (e) { /* ignore */ }
    }

    if (markCooldown) {
      AdState.startCooldown();
      hideSlider(false);
      if (stickyReopenTimer) clearTimeout(stickyReopenTimer);
      stickyReopenTimer = setTimeout(function () {
        if (!isShortsView()) showSticky();
      }, COOLDOWN_MS);
    }
  }

  function scheduleSticky() {
    if (stickyTimer) { clearTimeout(stickyTimer); stickyTimer = null; }
    if (!consentAllows()) return;
    if (isShortsView()) return;
    if (AdState.isInCooldown()) {
      /* Re-check when cooldown ends */
      const remaining = AdState.getCooldownRemaining();
      if (remaining > 0) {
        stickyTimer = setTimeout(scheduleSticky, remaining + 200);
      }
      return;
    }
    stickyTimer = setTimeout(function () {
      if (!isShortsView() && !AdState.isInCooldown()) showSticky();
    }, 12000); /* 12s initial delay */
  }

  /* ==========================================================================
     PUBLIC API
     ========================================================================== */
  window.updateAdVisibility = function (viewId) {
    currentView = viewId || 'homeView';

    const topBanner = document.getElementById('globalTopBannerWrapper');
    if (topBanner) {
      const visible = (currentView === 'homeView' || currentView === 'categoriesView');
      setBannerVisible(topBanner, visible);
    }

    if (isShortsView()) {
      hideSlider(false);
      hideSticky(false);
    } else if (!sliderClosedByUser && !AdState.isInCooldown()) {
      if (currentView === 'homeView' || currentView === 'categoriesView' || currentView === 'playerView') {
        if (sliderTimer) { clearTimeout(sliderTimer); sliderTimer = null; }
        sliderTimer = setTimeout(showSlider, 300);
      }
    }

    /* Sticky: hide on player? Keep visible — user asked for it, but shorts hides */
    if (isShortsView()) {
      hideSticky(false);
    } else if (!AdState.isInCooldown()) {
      /* Re-show sticky if it was hidden by view change (but not by user) */
      const el = stickyEl();
      if (el && el.classList.contains('hidden')) {
        scheduleSticky();
      }
    }

    serveVisibleBanners();
  };

  window.CumBearAds = {
    refreshBanners: function () {
      servedZones.clear();
      serveVisibleBanners();
    },
    hideSticky: function () { hideSticky(true); },
    hideSlider: function () { hideSlider(true); }
  };

  /* ==========================================================================
     WIRING
     ========================================================================== */
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

  function wireStickyClose() {
    const close = stickyCloseBtn();
    if (!close || close.dataset.wired) return;
    close.dataset.wired = '1';
    close.addEventListener('click', function (e) {
      /* Stop propagation so this NEVER triggers the CrakRevenue link */
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      hideSticky(true);
    }, true); /* capture phase to catch it first */
  }

  function wireFirstScrollTrigger() {
    let armed = true;
    const arm = function () {
      if (!armed) return;
      armed = false;
      if (consentAllows() && !isShortsView() && !AdState.isInCooldown()) {
        showSlider();
      }
    };
    window.addEventListener('scroll', function () {
      if (window.scrollY > CFG.ux.sliderPopScrollTriggerPx) arm();
    }, { passive: true });
    setTimeout(arm, CFG.ux.sliderPopFirstDelayMs);
  }

  function wrapSwitchViewOnce() {
    if (!window.switchView) return;
    if (window.switchView.__cumbearWrapped) return;
    const original = window.switchView;
    const wrapped = function (viewId, pushHistory) {
      const ret = original.apply(this, arguments);
      try { window.updateAdVisibility(viewId); }
      catch (e) { /* ignore */ }
      return ret;
    };
    wrapped.__cumbearWrapped = true;
    window.switchView = wrapped;
  }

  function boot() {
    wireSliderClose();
    wireStickyClose();
    wrapSwitchViewOnce();
    wireFirstScrollTrigger();

    if (consentAllows()) {
      window.updateAdVisibility(currentView);
      scheduleSticky();
    } else {
      window.addEventListener('cumbear:consent', function handler(ev) {
        if (ev.detail && ev.detail.state === 'all') {
          window.removeEventListener('cumbear:consent', handler);
          servedZones.clear();
          window.updateAdVisibility(currentView);
          scheduleSticky();
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
