/**
 * ==========================================================================
 * CUMBEAR — AD CONTROLLER (v4)
 * --------------------------------------------------------------------------
 * Zones:
 *   6057032 — mobile 300×250 (home/search/player)
 *   6056586 — desktop 728×90 (home/search/player)
 *   6056606 — video slider popup (bottom-right)
 *   6061614 — mobile 300×100 (player page only — NEW)
 *   6056604 — player VAST pre-roll (handled by player.js)
 *   6056608 — shorts VAST (handled by shorts.js)
 *
 * Sticky video banner:
 *   - Shows after 2s of consent
 *   - Click → CrakRevenue (URL hidden — not visible in href)
 *   - Close → 60s cooldown (shared with slider)
 *
 * Shared 60s cooldown via CumBearAdState:
 *   - Dismissing sticky OR slider hides BOTH for 60s
 *   - After 60s both reappear
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
     SHARED 60s COOLDOWN
     ========================================================================== */
  const COOLDOWN_MS = 60000;
  const COOLDOWN_KEY = 'cumbear_ads_cooldown_ts_v2';

  const AdState = {
    getCooldownRemaining: function () {
      try {
        const ts = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
        if (!ts) return 0;
        const remaining = COOLDOWN_MS - (Date.now() - ts);
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

    /* Top banner */
    if (currentView === 'homeView' || currentView === 'categoriesView') {
      if (document.querySelector('#globalTopBannerWrapper .ad-banner-mobile ins[data-zoneid]')) {
        serveOnce(CFG.exo.zones.mobileBanner);
      }
      if (document.querySelector('#globalTopBannerWrapper .ad-banner-desktop ins[data-zoneid]')) {
        serveOnce(CFG.exo.zones.desktopLeaderboard);
      }
    }

    /* Home bottom */
    if (currentView === 'homeView' && document.getElementById('homeBottomBanner')) {
      serveOnce(CFG.exo.zones.mobileBanner);
      serveOnce(CFG.exo.zones.desktopLeaderboard);
    }

    /* Search */
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

    /* Player — leaderboard above + mobile 300x100 below + bottom banner */
    if (currentView === 'playerView') {
      if (document.getElementById('playerTopBanner')) {
        serveOnce(CFG.exo.zones.mobileBanner);
        serveOnce(CFG.exo.zones.desktopLeaderboard);
      }
      /* NEW: mobile 300x100 mid banner (zone 6061614) */
      if (document.getElementById('playerMidBanner')) {
        serveOnce(CFG.exo.zones.playerMobileMid);
      }
      if (document.getElementById('playerBottomBanner')) {
        serveOnce(CFG.exo.zones.mobileBanner);
        serveOnce(CFG.exo.zones.desktopLeaderboard);
      }
    }
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
      hideSticky(false);
      if (sliderReopenTimer) clearTimeout(sliderReopenTimer);
      sliderReopenTimer = setTimeout(function () {
        sliderClosedByUser = false;
        if (!isShortsView()) showSlider();
      }, COOLDOWN_MS);
    }
  }

  /* ==========================================================================
     STICKY VIDEO BANNER
     ========================================================================== */
  function stickyEl() { return document.getElementById('stickyVideoBanner'); }
  function stickyVideoEl() { return document.getElementById('stickyVideoEl'); }
  function stickyCloseBtn() { return document.getElementById('stickyVideoCloseBtn'); }
  function stickyLinkEl() { return document.getElementById('stickyVideoLink'); }

  function showSticky() {
    const el = stickyEl();
    if (!el) return;
    if (!consentAllows()) return;
    if (isShortsView()) return;
    if (AdState.isInCooldown()) return;

    el.classList.remove('hidden');

    const vid = stickyVideoEl();
    if (vid) {
      vid.muted = true;
      const p = vid.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { /* autoplay blocked */ });
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
      const remaining = AdState.getCooldownRemaining();
      if (remaining > 0) {
        stickyTimer = setTimeout(scheduleSticky, remaining + 200);
      }
      return;
    }
    stickyTimer = setTimeout(function () {
      if (!isShortsView() && !AdState.isInCooldown()) showSticky();
    }, 2000); /* 2s after consent */
  }

  /* ==========================================================================
     STICKY CLICK HANDLER — CrakRevenue redirect (URL hidden)
     ========================================================================== */
  function wireStickyClick() {
    const link = stickyLinkEl();
    if (!link || link.dataset.wired === '1') return;
    link.dataset.wired = '1';

    link.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      /* Get affiliate URL from config (not from href) */
      const affiliateUrl = CFG.crak && CFG.crak.smartlinkDating
        ? CFG.crak.smartlinkDating
        : 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';

      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    });

    /* Block right-click context menu on sticky video */
    const vid = stickyVideoEl();
    if (vid) {
      vid.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
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

    if (isShortsView()) {
      hideSticky(false);
    } else if (!AdState.isInCooldown()) {
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
    }, true);
  }

  function wireStickyClose() {
    const close = stickyCloseBtn();
    if (!close || close.dataset.wired) return;
    close.dataset.wired = '1';
    close.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      hideSticky(true);
    }, true);
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
      if (window.scrollY > (CFG.ux.sliderPopScrollTriggerPx || 120)) arm();
    }, { passive: true });
    setTimeout(arm, CFG.ux.sliderPopFirstDelayMs || 500);
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
    wireStickyClick();
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
