/**
 * ==========================================================================
 * CUMBEAR — EXOCLICK POPUNDER CONTROLLER
 * --------------------------------------------------------------------------
 * Compliant class-trigger popunder. Fires ONLY when:
 *   1. Consent state is 'all'  (see consent.js)
 *   2. The 24h cooldown cookie is not set
 *   3. An element with class `exo-pop-trigger` is clicked
 *      OR window.CumBearPopunder.trigger() is called directly
 *      (e.g. from player.js first-play, or shorts.js first-tap)
 *
 * Zone selection:
 *   - Mobile (touch-capable, UA-based) → CONFIG.exo.zones.mobilePopunder (6056600)
 *   - Desktop                         → CONFIG.exo.zones.webPopunder   (6056598)
 *
 * Public API:
 *   window.CumBearPopunder.trigger() → boolean  (true if we actually attempted)
 *   window.CumBearPopunder.isAvailable() → boolean
 * ==========================================================================
 */
(function () {
  'use strict';

  /* ---------- guards ---------- */
  if (window !== window.top) return;                  // never run inside iframes
  if (window.CumBearPopunder) return;                 // double-load guard
  const CFG = window.CUMBEAR;
  if (!CFG) {
    console.warn('[CumBearPopunder] config.js not loaded — aborting');
    return;
  }

  const COOLDOWN_COOKIE = CFG.consent.cookies.popunder;
  const COOLDOWN_MS     = CFG.consent.popunderCooldownMs;
  const TRIGGER_CLASS   = CFG.exo.popunderTriggerClass;

  /* ---------- mobile / desktop detection ---------- */
  function isMobile() {
    try {
      if (navigator.userAgentData && navigator.userAgentData.mobile) return true;
    } catch (e) { /* ignore */ }
    return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile|WebOS|BlackBerry/i
      .test(navigator.userAgent || '');
  }

  function zoneForDevice() {
    return isMobile() ? CFG.exo.zones.mobilePopunder : CFG.exo.zones.webPopunder;
  }

  /* ---------- state ---------- */
  let initialized = false;
  let providerReady = false;
  let providerFailed = false;

  /* ---------- consent gate ---------- */
  function consentAllows() {
    return window.CumBearConsent && window.CumBearConsent.isAdAllowed() === true;
  }

  /* ---------- cooldown gate ---------- */
  function cooldownAllows() {
    try {
      const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOLDOWN_COOKIE + '=([^;]+)'));
      return !m; // cookie exists → still in cooldown
    } catch (e) {
      return true; // storage blocked → allow (server still caps)
    }
  }

  function markCooldown() {
    try {
      const exp = new Date(Date.now() + COOLDOWN_MS);
      document.cookie = COOLDOWN_COOKIE + '=' + Date.now() +
        '; expires=' + exp.toUTCString() +
        '; path=/; SameSite=Lax';
    } catch (e) { /* ignore */ }
  }

  /* ---------- provider boot ---------- */
  function ensureProviderReady() {
    if (providerReady) return true;
    if (providerFailed) return false;
    try {
      window.AdProvider = window.AdProvider || [];
      /* The provider script from ExoClick auto-processes this queue.
         Pushing { serve: {} } is what triggers banner renders.
         For popunder we just ensure the global array exists. */
      providerReady = true;
      return true;
    } catch (e) {
      providerFailed = true;
      console.warn('[CumBearPopunder] AdProvider init failed:', e);
      return false;
    }
  }

  /* ---------- init (loads the ExoClick popunder tag script) ---------- */
  function initPopunder() {
    if (initialized) return;
    if (!consentAllows()) return;

    initialized = true;

    /* Build a minimal ExoClick popMagic config — but only AFTER consent.
       The actual popMagic bootstrap is delivered by ExoClick's script;
       we inject it here rather than in index.html so it never loads
       before consent. */
    injectPopMagicScript();
  }

  function injectPopMagicScript() {
    if (document.getElementById('cumbear-popmagic')) return;

    const zoneId = zoneForDevice();

    /* The tag below is the standard ExoClick popunder embed.
       KEY DIFFERENCE from old project:
         trigger_method: 2   ← class-based trigger (compliant)
         trigger_class:  'exo-pop-trigger'
         capping_enabled: true, frequency_period: 1440 (min), frequency_count: 1
       This ensures ExoClick itself also enforces "1 per 24h" server-side. */
    const inline = document.createElement('script');
    inline.id = 'cumbear-popmagic';
    inline.type = 'application/javascript';
    inline.textContent = buildPopMagicConfig(zoneId);
    document.body.appendChild(inline);
  }

  function buildPopMagicConfig(zoneId) {
    /* Returned as a string so it can be injected as inline script.
       We do NOT ship the full popMagic library inline — ExoClick's own
       hosted script (loaded from a.pemsrv.com) does that automatically
       when the adConfig has idzone + ads_host. */
    const cfg = {
      ads_host: 'a.pemsrv.com',
      syndication_host: 's.pemsrv.com',
      idzone: parseInt(zoneId, 10),
      popup_fallback: false,
      popup_force: false,
      chrome_enabled: true,
      new_tab: false,
      frequency_period: 1440,          // minutes → 24h (ExoClick server-side cap)
      frequency_count: 1,
      trigger_method: 2,               // ← class-trigger only (compliant)
      trigger_class: TRIGGER_CLASS,
      trigger_delay: 0,
      capping_enabled: true,
      tcf_enabled: true,
      agego_cross_site_enabled: true,
      only_inline: false
    };

    /* Loader: fetch ExoClick's hosted loader that reads adConfig from window.
       This is the ONLY supported way to init popunder via class trigger.
       The hosted script is https://<ads_host>/popunder1000.js */
    return `
(function(){
  var adConfig = ${JSON.stringify(cfg)};
  window.cumbearPopunderConfig = adConfig;
  if (window.__cumbearPopunderLoaded) return;
  window.__cumbearPopunderLoaded = true;

  /* Merge adConfig into the queue consumed by the hosted loader */
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://' + adConfig.ads_host + '/popunder1000.js';
  for (var k in adConfig) {
    if (Object.prototype.hasOwnProperty.call(adConfig, k)) {
      s.setAttribute('data-msg-' + k, adConfig[k]);
    }
  }
  s.onerror = function () {
    window.__cumbearPopunderLoaded = false;
    console.warn('[CumBearPopunder] hosted loader failed to load');
  };
  document.body.appendChild(s);
})();
    `.trim();
  }

  /* ---------- public trigger ---------- */
  function attemptTrigger(source) {
    if (!consentAllows()) return false;
    if (!cooldownAllows()) return false;
    if (!ensureProviderReady()) return false;

    /* Fire ExoClick via the class-trigger hook.
       We dispatch a synthetic click on a hidden anchor that carries the
       trigger class — this is the documented flow for programmatic triggers
       (e.g. first video tap) that must still route through ExoClick's
       attribution logic. */
    try {
      const anchor = document.createElement('a');
      anchor.href = '#';
      anchor.className = TRIGGER_CLASS;
      anchor.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
      anchor.setAttribute('data-cumbear-popunder-source', source || 'manual');
      document.body.appendChild(anchor);

      /* Dispatch a real "trusted-ish" click — ExoClick's popMagic requires
         user gesture context, so this MUST be called from within a click handler
         (which is why player.js and shorts.js call it synchronously). */
      anchor.click();

      setTimeout(function () { anchor.remove(); }, 2000);

      markCooldown();
      return true;
    } catch (e) {
      console.warn('[CumBearPopunder] trigger failed:', e);
      return false;
    }
  }

  window.CumBearPopunder = {
    trigger: function (source) { return attemptTrigger(source); },
    isAvailable: function () {
      return consentAllows() && cooldownAllows() && !providerFailed;
    },
    /* For debugging: force-reset the cooldown */
    resetCooldown: function () {
      try {
        document.cookie = COOLDOWN_COOKIE + '=; max-age=0; path=/; SameSite=Lax';
      } catch (e) { /* ignore */ }
    }
  };

  /* ---------- auto-wire ---------- */
  function attachClassTriggers() {
    /* Any element with class `exo-pop-trigger` gets a click listener.
       Because ExoClick's own script also binds via trigger_class, this
       listener is a safety net + cooldown tracker. */
    document.addEventListener('click', function (e) {
      const trigger = e.target && e.target.closest && e.target.closest('.' + TRIGGER_CLASS);
      if (!trigger) return;
      /* Popunder tag itself fires; we just record the cooldown timestamp. */
      if (consentAllows() && cooldownAllows()) {
        markCooldown();
      }
    }, true);
  }

  function boot() {
    if (!consentAllows()) {
      /* Not consented yet — wait for user to accept. */
      window.addEventListener('cumbear:consent', function handler(ev) {
        if (ev.detail && ev.detail.state === 'all') {
          initPopunder();
          window.removeEventListener('cumbear:consent', handler);
        }
      });
      return;
    }
    initPopunder();
  }

  /* ---------- run ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      attachClassTriggers();
      boot();
    });
  } else {
    attachClassTriggers();
    boot();
  }
})();
