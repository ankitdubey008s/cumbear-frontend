/**
 * CumBear ads — serve only; networks own UI
 */
(function () {
  'use strict';
  if (window.CumBearAds) return;
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
    try { window.AdProvider.push({ serve: {} }); } catch (e) {}
  }
  function openCrak(url) {
    var u = url || (window.CUMBEAR && window.CUMBEAR.crak && window.CUMBEAR.crak.pps) || '#';
    try { window.open(u, '_blank', 'noopener,noreferrer'); } catch (e) { location.href = u; }
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('[data-crak-gate="1"]');
    if (!a) return;
    var key = 'crak_' + (a.href || '');
    var n = 0;
    try { n = parseInt(sessionStorage.getItem(key) || '0', 10) || 0; } catch (err) {}
    if (n < 1) {
      e.preventDefault();
      try { sessionStorage.setItem(key, '1'); } catch (err) {}
      openCrak(window.CUMBEAR && window.CUMBEAR.crak && window.CUMBEAR.crak.dating);
    }
  }, true);
  window.CumBearAds = {
    serve: serve,
    refreshBanners: serve,
    openCrak: openCrak,
    beforeOpenPlayer: function (cb) { serve(); if (typeof cb === 'function') cb(); }
  };
  window.updateAdVisibility = function () { serve(); };
  function boot() {
    if (consentOk()) serve();
    window.addEventListener('load', function () { if (consentOk()) serve(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
