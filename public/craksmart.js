/**
 * ==========================================================================
 * CUMBEAR — CRAKREVENUE COORDINATOR
 * --------------------------------------------------------------------------
 * The actual sticky video banner is now owned by ads.js.
 * This file just handles the affiliate URL and any remaining legacy hooks.
 *
 * Kept separate from ads.js so:
 *   - CrakRevenue can be disabled by removing the <script> tag
 *   - The CrakRevenue URL lives in config.js only (one place to change)
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.CumBearCrak) return;
  const CFG = window.CUMBEAR;
  if (!CFG || !CFG.crak) return;

  if (!CFG.crak.enabled) {
    /* Kill switch — hide the sticky banner entirely */
    const el = document.getElementById('stickyVideoBanner');
    if (el) el.remove();
    window.CumBearCrak = { enabled: false };
    return;
  }

  window.CumBearCrak = {
    enabled: true,
    /* For debug: force-show both banners (bypasses cooldown) */
    forceShow: function () {
      if (window.CumBearAds) {
        try { window.CumBearAds.refreshBanners(); } catch (e) { /* ignore */ }
      }
    },
    /* For debug: reset cooldown */
    resetCooldown: function () {
      try { localStorage.removeItem('cumbear_ads_cooldown_ts'); }
      catch (e) { /* ignore */ }
    }
  };
})();
