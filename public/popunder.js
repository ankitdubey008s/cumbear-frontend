/**
 * ==========================================================================
 * CUMBEAR — POPUNDER CONTROLLER (v3)
 * --------------------------------------------------------------------------
 * Uses ExoClick / MagSrv hosted loader (a.pemsrv.com/popunder1000.js).
 * Zones from config:
 *   mobile → 6056600 | desktop → 6056598
 *
 * Gates:
 *   1. Consent accepted (CumBearConsent)
 *   2. Local 24h cooldown cookie
 *   3. ExoClick frequency_count: 1 / 1440 min
 *
 * Public API:
 *   window.CumBearPopunder.trigger(source) → boolean
 *   window.CumBearPopunder.isAvailable() → boolean
 *   window.CumBearPopunder.resetCooldown()
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window !== window.top) return;
  if (window.CumBearPopunder) return;

  const CFG = window.CUMBEAR;
  if (!CFG || !CFG.exo) {
    console.warn('[CumBearPopunder] config.js not loaded — aborting');
    return;
  }

  const COOLDOWN_COOKIE = (CFG.consent && CFG.consent.cookies && CFG.consent.cookies.popunder) || 'cumbear_pop_ts';
  const COOLDOWN_MS = (CFG.consent && CFG.consent.popunderCooldownMs) || (24 * 60 * 60 * 1000);
  const TRIGGER_CLASS = CFG.exo.popunderTriggerClass || 'exo-pop-trigger';
  const ADS_HOST = CFG.exo.popAdsHost || 'a.pemsrv.com';
  const SYN_HOST = CFG.exo.popSyndicationHost || 's.pemsrv.com';

  let initialized = false;
  let loaderFailed = false;

  function isMobile() {
    try {
      if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
        return navigator.userAgentData.mobile;
      }
    } catch (e) { /* ignore */ }
    return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile|WebOS|BlackBerry/i.test(
      navigator.userAgent || ''
    );
  }

  function zoneForDevice() {
    const z = CFG.exo.zones || {};
    return isMobile() ? String(z.mobilePopunder || '6056600') : String(z.webPopunder || '6056598');
  }

  function consentAllows() {
    if (window.CumBearConsent && typeof window.CumBearConsent.isAdAllowed === 'function') {
      return window.CumBearConsent.isAdAllowed() === true;
    }
    /* Fallback: if consent module missing, allow after age gate only */
    try {
      return sessionStorage.getItem('cumbear_age_verified') === 'true';
    } catch (e) {
      return true;
    }
  }

  function cooldownAllows() {
    try {
      const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOLDOWN_COOKIE + '=([^;]+)'));
      return !m;
    } catch (e) {
      return true;
    }
  }

  function markCooldown() {
    try {
      const exp = new Date(Date.now() + COOLDOWN_MS);
      document.cookie =
        COOLDOWN_COOKIE + '=' + Date.now() +
        '; expires=' + exp.toUTCString() +
        '; path=/; SameSite=Lax';
    } catch (e) { /* ignore */ }
  }

  /**
   * Inject ExoClick hosted popunder loader with data-msg-* attributes.
   * Official pattern used by MagSrv / ExoClick publishers.
   */
  function injectLoader() {
    if (document.getElementById('cumbear-popunder-loader')) return;
    if (loaderFailed) return;

    const zoneId = zoneForDevice();
    const s = document.createElement('script');
    s.id = 'cumbear-popunder-loader';
    s.async = true;
    s.type = 'application/javascript';
    s.src = 'https://' + ADS_HOST + '/popunder1000.js';

    const attrs = {
      idzone: zoneId,
      ads_host: ADS_HOST,
      syndication_host: SYN_HOST,
      popup_fallback: 'false',
      popup_force: 'false',
      chrome_enabled: 'true',
      new_tab: 'false',
      frequency_period: '1440',
      frequency_count: '1',
      /* 1 = any trusted click (document) — matches official tags for fill */
      trigger_method: '1',
      trigger_class: TRIGGER_CLASS,
      trigger_delay: '0',
      capping_enabled: 'true',
      tcf_enabled: 'true',
      agego_cross_site_enabled: 'true',
      only_inline: 'false'
    };

    Object.keys(attrs).forEach(function (k) {
      s.setAttribute('data-msg-' + k, attrs[k]);
    });

    s.onerror = function () {
      loaderFailed = true;
      console.warn('[CumBearPopunder] loader failed:', s.src);
    };

    (document.body || document.documentElement).appendChild(s);
  }

  function initPopunder() {
    if (initialized) return;
    if (!consentAllows()) return;
    initialized = true;
    injectLoader();
  }

  function attemptTrigger(source) {
    if (!consentAllows()) return false;
    if (!cooldownAllows()) return false;

    if (!initialized) initPopunder();

    try {
      /* Ensure a visible click path exists for class-based fallback */
      const anchor = document.createElement('a');
      anchor.href = '#cumbear-pop';
      anchor.className = TRIGGER_CLASS;
      anchor.setAttribute('data-cumbear-pop-source', source || 'manual');
      anchor.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(function () {
        try { anchor.remove(); } catch (e) { /* ignore */ }
      }, 1500);

      markCooldown();
      return true;
    } catch (e) {
      console.warn('[CumBearPopunder] trigger failed:', e);
      return false;
    }
  }

  window.CumBearPopunder = {
    trigger: function (source) {
      return attemptTrigger(source);
    },
    isAvailable: function () {
      return consentAllows() && cooldownAllows() && !loaderFailed;
    },
    resetCooldown: function () {
      try {
        document.cookie = COOLDOWN_COOKIE + '=; max-age=0; path=/; SameSite=Lax';
      } catch (e) { /* ignore */ }
    }
  };

  function boot() {
    if (consentAllows()) {
      initPopunder();
    } else {
      window.addEventListener('cumbear:consent', function () {
        initPopunder();
      });
      /* Poll briefly in case consent was set before listener */
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (consentAllows()) {
          clearInterval(t);
          initPopunder();
        } else if (tries > 40) {
          clearInterval(t);
        }
      }, 500);
    }

    /* Track native document clicks that fire the pop for cooldown */
    document.addEventListener(
      'click',
      function () {
        if (!initialized) return;
        if (consentAllows() && cooldownAllows()) {
          /* Exo may fire on this click; mark after short delay if cookie still free */
          setTimeout(function () {
            /* Only mark if Exo likely consumed the session — still safe to mark once per day */
          }, 100);
        }
      },
      true
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
