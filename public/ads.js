/**
 * ==========================================================================
 * CUMBEAR — AD CONTROLLER (v5)
 * --------------------------------------------------------------------------
 * Changes:
 *   - Banners (mobile 300x250, desktop 728x90) appear INSTANTLY after consent
 *   - Slider popup appears at 0.5s after consent
 *   - Sticky video banner appears at 10s after consent
 *   - 60s cooldown ONLY applies to sticky video (not to banners or slider)
 *   - Sticky click → new CrakRevenue URL t.datsk3.com/425367/5165
 *   - Serves ALL zones on consent, not just current view
 *   - Shorts and player banner zones served when those views activate
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
     STICKY-ONLY COOLDOWN (60s)
     ========================================================================== */
  const COOLDOWN_MS = 60000;
  const COOLDOWN_KEY = 'cumbear_sticky_cooldown_v3';

  const StickyState = {
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

  /* Legacy alias for compatibility */
  window.CumBearAdState = StickyState;

  /* ==========================================================================
     STATE
     ========================================================================== */
  const servedZones = new Set();
  let sliderTimer = null;
  let stickyTimer = null;
  let stickyReopenTimer = null;
  let sliderClosedByUser = false;
  let currentView = 'homeView';
  let stickyEverShown = false;

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
      console.log('[CumBearAds] Served zone', key);
    } catch (e) { /* ignore */ }
  }

  /* ==========================================================================
     VIEW DETECTION
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

  /* ==========================================================================
     SERVE ALL ZONES CURRENTLY IN DOM
     ========================================================================== */
  function serveAllZonesInDom() {
    if (!consentAllows()) return;

    /* Every <ins> with a data-zoneid — serve each unique zone once */
    document.querySelectorAll('ins[data-zoneid]').forEach(function (el) {
      const zoneId = el.getAttribute('data-zoneid');
      if (zoneId) serveOnce(zoneId);
    });
  }

  /* ==========================================================================
     VIDEO SLIDER POPUP — appears at 0.5s, no cooldown
     ========================================================================== */
  function sliderEl() { return document.getElementById('videoSliderPopup'); }
  function sliderCloseBtn() { return document.getElementById('videoSliderCloseBtn'); }

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
      /* No cooldown — just hide for this session */
    }
  }

  /* ==========================================================================
     STICKY VIDEO BANNER — appears at 10s, 60s cooldown on dismiss
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
    if (StickyState.isInCooldown()) return;

    el.classList.remove('hidden');
    stickyEverShown = true;

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
      StickyState.startCooldown();
      /* Re-open after 60s */
      if (stickyReopenTimer) clearTimeout(stickyReopenTimer);
      stickyReopenTimer = setTimeout(function () {
        if (!isShortsView() && !StickyState.isInCooldown()) showSticky();
      }, COOLDOWN_MS);
    }
  }

  /* ==========================================================================
     SCHEDULE STICKY AT 10s (not 2s)
     ========================================================================== */
  function scheduleSticky() {
    if (stickyTimer) { clearTimeout(stickyTimer); stickyTimer = null; }
    if (!consentAllows()) return;
    if (isShortsView()) return;
    if (stickyEverShown) {
      /* Already shown — if in cooldown, re-check when it ends */
      if (StickyState.isInCooldown()) {
        const remaining = StickyState.getCooldownRemaining();
        stickyTimer = setTimeout(scheduleSticky, remaining + 200);
      } else {
        showSticky();
      }
      return;
    }
    /* First time: 10s after consent */
    stickyTimer = setTimeout(function () {
      if (!isShortsView() && !StickyState.isInCooldown()) showSticky();
    }, 10000);
  }

  /* ==========================================================================
     STICKY CLICK → NEW CRAKREVENUE URL
     ========================================================================== */
  const CRAK_VIDEO_URL = 'https://t.datsk3.com/425367/5165?aff_sub5=SF_006OG000004lmDN';

  function wireStickyClick() {
    const link = stickyLinkEl();
    if (!link || link.dataset.wired === '1') return;
    link.dataset.wired = '1';

    /* Kill any href and context menu */
    link.removeAttribute('href');
    link.style.cursor = 'pointer';

    link.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      /* Open in a new tab — URL not visible in this tab's status bar */
      window.open(CRAK_VIDEO_URL, '_blank', 'noopener,noreferrer');
    });

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

    /* Top banner only on home/search */
    const topBanner = document.getElementById('globalTopBannerWrapper');
    if (topBanner) {
      const visible = (currentView === 'homeView' || currentView === 'categoriesView');
      setBannerVisible(topBanner, visible);
    }

    /* Slider — hide on shorts only */
    if (isShortsView()) {
      hideSlider(false);
    }

    /* Sticky — hide on shorts only */
    if (isShortsView()) {
      hideSticky(false);
    }

    /* Serve every zone currently rendered */
    serveAllZonesInDom();

    /* Schedule sticky if not yet shown */
    if (!stickyEverShown && consentAllows() && !isShortsView()) {
      scheduleSticky();
    }
  };

  window.CumBearAds = {
    refreshBanners: function () {
      servedZones.clear();
      serveAllZonesInDom();
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

  function wireSliderFirstScroll() {
    let armed = true;
    const arm = function () {
      if (!armed) return;
      armed = false;
      if (consentAllows() && !isShortsView() && !sliderClosedByUser) {
        showSlider();
      }
    };
    window.addEventListener('scroll', function () {
      if (window.scrollY > 120) arm();
    }, { passive: true });
    /* Show at 0.5s after consent */
    setTimeout(arm, 500);
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
    wireSliderFirstScroll();

    if (consentAllows()) {
      /* Consent already granted — serve all zones NOW */
      window.updateAdVisibility(currentView);
      setTimeout(showSlider, 500);
      scheduleSticky();
    } else {
      /* Wait for consent — then serve everything */
      window.addEventListener('cumbear:consent', function handler(ev) {
        if (ev.detail && ev.detail.state === 'all') {
          window.removeEventListener('cumbear:consent', handler);
          servedZones.clear();
          window.updateAdVisibility(currentView);
          setTimeout(showSlider, 500);
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
