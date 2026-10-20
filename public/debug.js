/* Debug helper — shows any JS error or uncaught rejection on screen */
(function () {
  'use strict';
  const box = document.createElement('div');
  box.id = 'cumbear-debug';
  box.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#ff0000;color:#fff;font-size:11px;padding:8px;z-index:999999;font-family:monospace;max-height:40vh;overflow-y:auto;white-space:pre-wrap;';
  box.style.display = 'none';
  document.body.appendChild(box);

  function show(msg) {
    box.style.display = 'block';
    box.textContent += msg + '\n';
  }

  window.addEventListener('error', function (e) {
    show('ERROR: ' + (e.message || 'unknown') + '\n  at ' + (e.filename || '?') + ':' + (e.lineno || '?'));
  });

  window.addEventListener('unhandledrejection', function (e) {
    show('PROMISE REJECTED: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)));
  });

  /* Log fetch failures */
  const origFetch = window.fetch;
  window.fetch = function () {
    const url = arguments[0];
    return origFetch.apply(this, arguments).then(function (res) {
      if (!res.ok) {
        show('FETCH FAILED: ' + url + ' → HTTP ' + res.status);
      }
      return res;
    }).catch(function (err) {
      show('FETCH REJECTED: ' + url + '\n  ' + err.message);
      throw err;
    });
  };

  /* Log config load state */
  setTimeout(function () {
    if (!window.CUMBEAR) show('⚠ window.CUMBEAR is NOT defined (config.js failed to load)');
    if (!window.switchView) show('⚠ window.switchView is NOT defined (script.js failed)');
    if (!window.mixAffiliateVideos) show('⚠ window.mixAffiliateVideos is NOT defined (faphouse.js failed)');
    if (!window.attachHoldAndSlidePreview) show('⚠ window.attachHoldAndSlidePreview is NOT defined (attach-preview.js failed)');
  }, 2000);
})();
