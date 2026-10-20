/**
 * ==========================================================================
 * CUMBEAR — COOKIE CONSENT (single-button, glass)
 * --------------------------------------------------------------------------
 * Single "OK" button grants 'all' consent.
 * No 'essential only' split — simplified per product decision.
 *
 * Public API:
 *   window.CumBearConsent.state → 'all' | null
 *   window.CumBearConsent.isAdAllowed() → boolean
 *   window.CumBearConsent.grant('all')
 *   window.CumBearConsent.revoke()
 *   window.CumBearConsent.onChange(fn) → unsubscribe
 *   window.CumBearConsent.open() → reopen banner
 * ==========================================================================
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cumbear_consent_v2';
  const COOKIE_NAME = 'cumbear_consent';
  const COOKIE_MAX_AGE = 2592000; /* 30 days */

  /* ---------- safe storage ---------- */
  const safeStorage = {
    _mem: null,
    read() {
      try { return window.localStorage.getItem(STORAGE_KEY); }
      catch (e) { return this._mem; }
    },
    write(v) {
      try { window.localStorage.setItem(STORAGE_KEY, v); }
      catch (e) { this._mem = v; }
    },
    remove() {
      try { window.localStorage.removeItem(STORAGE_KEY); }
      catch (e) { this._mem = null; }
    }
  };

  /* ---------- cookie ---------- */
  function setCookie(v) {
    try {
      document.cookie = COOKIE_NAME + '=' + encodeURIComponent(v) +
        '; max-age=' + COOKIE_MAX_AGE + '; path=/; SameSite=Lax';
    } catch (e) { /* ignore */ }
  }

  function clearCookie() {
    try { document.cookie = COOKIE_NAME + '=; max-age=0; path=/; SameSite=Lax'; }
    catch (e) { /* ignore */ }
  }

  function readCookie() {
    try {
      const m = document.cookie.match(/(?:^|;\s*)cumbear_consent=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }

  /* ---------- state ---------- */
  let state = null;
  const listeners = new Set();

  function loadStored() {
    const ls = safeStorage.read();
    if (ls === 'all') return 'all';
    const ck = readCookie();
    if (ck === 'all') return 'all';
    return null;
  }

  function persist() {
    state = 'all';
    safeStorage.write('all');
    setCookie('all');
    emit();
  }

  function emit() {
    try {
      window.dispatchEvent(new CustomEvent('cumbear:consent', {
        detail: { state: state }
      }));
    } catch (e) { /* ignore */ }
    listeners.forEach(function (fn) {
      try { fn({ state: state }); } catch (e) { /* ignore */ }
    });
  }

  function showBanner() {
    const banner = document.getElementById('cookieConsent');
    if (!banner) return;
    banner.classList.remove('hidden');
    banner.removeAttribute('aria-hidden');
  }

  function hideBanner() {
    const banner = document.getElementById('cookieConsent');
    if (!banner) return;
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
  }

  /* ---------- API ---------- */
  const CumBearConsent = {
    get state() { return state; },
    isAdAllowed: function () { return state === 'all'; },
    grant: function () { persist(); hideBanner(); },
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
    open: function () { showBanner(); }
  };

  window.CumBearConsent = CumBearConsent;

  /* ---------- init ---------- */
  function init() {
    const btn = document.getElementById('consentAcceptBtn');
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        CumBearConsent.grant();
      });
    }

    const stored = loadStored();
    if (stored) {
      state = stored;
      hideBanner();
      emit();
    } else {
      state = null;
      showBanner();
      emit();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
