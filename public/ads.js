/**
 * CumBear ads — official tags + card-open gate for interstitial
 */
(function () {
  'use strict';
  if (window.CumBearAds) return;

  var INTERSTITIAL_GAP_MS = 5 * 60 * 1000;
  var STORAGE_KEY = 'cumbear_interstitial_ts';

  function consentOk() {
    try {
      if (window.CumBearConsent && window.CumBearConsent.isAdAllowed)
        return window.CumBearConsent.isAdAllowed() === true;
    } catch (e) {}
    return true;
  }

  function serve() {
    if (!consentOk()) return;
    window.AdProvider = window.AdProvider || [];
    try {
      window.AdProvider.push({ serve: {} });
    } catch (e) {}
  }

  function interstitialDue() {
    try {
      var last = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
      if (last && Date.now() - last < INTERSTITIAL_GAP_MS) return false;
    } catch (e) {}
    return true;
  }

  function markInterstitial() {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (e) {}
  }

  /**
   * Card → player: re-serve Exo tags so fullpage interstitial can fire on the click,
   * then open player. Network owns interstitial UI (no custom modal).
   */
  function beforeOpenPlayer(onDone) {
    if (typeof onDone !== 'function') onDone = function () {};
    serve();
    if (interstitialDue()) {
      markInterstitial();
      /* Give AdProvider a moment to bind the user gesture */
      setTimeout(function () {
        onDone();
      }, 350);
    } else {
      onDone();
    }
  }

  function openCrak(url) {
    var u =
      url ||
      (window.CUMBEAR && window.CUMBEAR.crak && (window.CUMBEAR.crak.dating || window.CUMBEAR.crak.pps)) ||
      '#';
    try {
      window.open(u, '_blank', 'noopener,noreferrer');
    } catch (e) {
      location.href = u;
    }
  }

  document.addEventListener(
    'click',
    function (e) {
      var a = e.target && e.target.closest && e.target.closest('[data-crak-gate="1"]');
      if (!a) return;
      var key = 'crak_' + (a.href || '');
      var n = 0;
      try {
        n = parseInt(sessionStorage.getItem(key) || '0', 10) || 0;
      } catch (err) {}
      if (n < 1) {
        e.preventDefault();
        try {
          sessionStorage.setItem(key, '1');
        } catch (err) {}
        openCrak();
      }
    },
    true
  );

  /* Double-tap blank area → Exo popunder (not Juicy) */
  var lastTap = 0;
  document.addEventListener(
    'click',
    function (e) {
      if (e.target.closest('a, button, video, input, .video-card, .short-card-item, .view-tab')) return;
      var now = Date.now();
      if (now - lastTap < 350) {
        lastTap = 0;
        try {
          if (window.CumBearPopunder && window.CumBearPopunder.trigger) {
            window.CumBearPopunder.trigger('double-tap');
          } else if (window.CUMBEAR && window.CUMBEAR.helpers && window.CUMBEAR.helpers.exoPopLinkUrl) {
            var u = window.CUMBEAR.helpers.exoPopLinkUrl();
            if (u) window.open(u, '_blank', 'noopener,noreferrer');
          }
        } catch (err) {}
      } else {
        lastTap = now;
      }
    },
    false
  );

  window.CumBearAds = {
    serve: serve,
    refreshBanners: serve,
    openCrak: openCrak,
    beforeOpenPlayer: beforeOpenPlayer,
    showInterstitialThen: beforeOpenPlayer
  };
  window.updateAdVisibility = function () {
    serve();
  };

  function boot() {
    if (consentOk()) serve();
    window.addEventListener('load', function () {
      if (consentOk()) serve();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

