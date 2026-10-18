/**
 * ==========================================================================
 * CUMBEAR — COOKIE CONSENT CONTROLLER
 * Single source of truth for cookie + advertising consent.
 *
 * Usage from other modules:
 *   if (window.CumBearConsent && window.CumBearConsent.isAdAllowed()) { ... }
 *   window.addEventListener('cumbear:consent', e => { ... e.detail.state ... });
 *
 * State: 'all' | 'essential' | null  (null = not yet chosen)
 * Persisted: localStorage + first-party cookie, 30-day expiry.
 * ==========================================================================
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cumbear_consent_v1';
  const COOKIE_NAME = 'cumbear_consent';
  const COOKIE_MAX_AGE = 2592000; // 30 days in seconds

  /* ---------- storage helpers (safe against private browsing) ---------- */
  const safeStorage = {
    _mem: null,
    read() {
      try {
        return window.localStorage.getItem(STORAGE_KEY);
      } catch (e) {
        return this._mem;
      }
    },
    write(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch (e) {
        this._mem = value;
      }
    },
    remove() {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        this._mem = null;
      }
    }
  };

  /* ---------- cookie helpers ---------- */
  function setCookie(value) {
    try {
      document.cookie = COOKIE_NAME + '=' + encodeURIComponent(value) +
        '; max-age=' + COOKIE_MAX_AGE +
        '; path=/; SameSite=Lax';
    } catch (e) { /* ignore */ }
  }

  function clearCookie() {
    try {
      document.cookie = COOKIE_NAME +
        '=; max-age=0; path=/; SameSite=Lax';
    } catch (e) { /* ignore */ }
  }

  function readCookie() {
    try {
      const m = document.cookie.match(/(?:^|;\s*)cumbear_consent=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }

  /* ---------- state ---------- */
  let state = null; // 'all' | 'essential' | null
  const listeners = new Set();

  function isValidChoice(v) {
    return v === 'all' || v === 'essential';
  }

  function loadStored() {
    const ls = safeStorage.read();
    if (isValidChoice(ls)) return ls;
    const ck = readCookie();
    if (isValidChoice(ck)) return ck;
    return null;
  }

  function persist(choice) {
    if (!isValidChoice(choice)) return;
    state = choice;
    safeStorage.write(choice);
    setCookie(choice);
    emit();
  }

  function emit() {
    const detail = { state: state };
    try {
      window.dispatchEvent(new CustomEvent('cumbear:consent', { detail: detail }));
    } catch (e) { /* ignore */ }
    listeners.forEach(function (fn) {
      try { fn(detail); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- public API ---------- */
  const CumBearConsent = {
    get state() { return state; },

    isAdAllowed: function () {
      return state === 'all';
    },

    isAtLeastEssential: function () {
      return state === 'all' || state === 'essential';
    },

    grant: function (choice) {
      if (!isValidChoice(choice)) return;
      persist(choice);
      hideBanner();
    },

    revoke: function () {
      state = null;
      safeStorage.remove();
      clearCookie();
      emit();
      showBanner();
    },

    onChange: function (fn) {
      if (typeof fn !== 'function') return function () {};
      listeners.add(fn);
      return function () { listeners.delete(fn); };
    },

    /* Manually open the banner (e.g. from a "Cookie Settings" menu link) */
    open: function () {
      showBanner();
    }
  };

  window.CumBearConsent = CumBearConsent;

  /* ---------- banner show/hide ---------- */
  function getBanner() {
    return document.getElementById('cookieConsent');
  }

  function showBanner() {
    const banner = getBanner();
    if (!banner) return;
    banner.classList.remove('hidden');
    banner.removeAttribute('aria-hidden');
  }

  function hideBanner() {
    const banner = getBanner();
    if (!banner) return;
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
  }

  /* ---------- wire buttons ---------- */
  function wireButtons() {
    const essentialBtn = document.getElementById('consentEssentialBtn');
    const acceptBtn = document.getElementById('consentAcceptBtn');

    if (essentialBtn) {
      essentialBtn.addEventListener('click', function (e) {
        e.preventDefault();
        CumBearConsent.grant('essential');
      });
    }
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function (e) {
        e.preventDefault();
        CumBearConsent.grant('all');
      });
    }
  }

  /* ---------- init ---------- */
  function init() {
    wireButtons();

    const stored = loadStored();
    if (stored) {
      state = stored;
      hideBanner();
      emit();
    } else {
      state = null;
      showBanner();
      /* Emit immediately so ad modules know consent is pending (not allowed) */
      emit();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
