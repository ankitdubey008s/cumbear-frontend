/**
 * ==========================================================================
 * CUMBEAR — CRAKREVENUE SMARTLINK CONTROLLER
 * --------------------------------------------------------------------------
 * Two placements, both click-only (never auto-redirects):
 *   1. Sticky bottom banner    (dismissible, 6h cooldown after dismissal)
 *   2. Timed header toast      (every 2 min, 20s visible, 30min dismiss cooldown)
 *
 * Gates:
 *   - window.CumBearConsent.isAdAllowed() === true  (user accepted cookies)
 *   - window.CUMBEAR.crak.enabled === true          (kill switch)
 *   - per-placement cooldown cookies
 *
 * Public API:
 *   window.CumBearCrak.refresh()  → re-evaluate visibility (call after view change)
 *   window.CumBearCrak.hideAll()  → hide both for this session
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.CumBearCrak) return;
  const CFG = window.CUMBEAR;
  if (!CFG || !CFG.crak) {
    console.warn('[CumBearCrak] config.js not loaded — aborting');
    return;
  }

  /* ---------- cookie helpers ---------- */
  const COOKIES = {
    stickyDismissed: 'cumbear_crak_sticky_dismissed',
    timedDismissed: 'cumbear_crak_timed_dismissed',
    timedLastShown: 'cumbear_crak_timed_last_shown'
  };

  function getCookie(name) {
    try {
      const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }

  function setCookie(name, value, ttlMs) {
    try {
      const exp = new Date(Date.now() + ttlMs);
      document.cookie = name + '=' + encodeURIComponent(value) +
        '; expires=' + exp.toUTCString() +
        '; path=/; SameSite=Lax';
    } catch (e) { /* ignore */ }
  }

  /* ---------- gates ---------- */
  function consentAllows() {
    return window.CumBearConsent && window.CumBearConsent.isAdAllowed() === true;
  }

  function enabled() {
    return CFG.crak.enabled === true;
  }

  function isShortsView() {
    return document.body.classList.contains('shorts-mode') ||
      (document.getElementById('shortsView')?.classList.contains('active'));
  }

  function isPlayerView() {
    return document.getElementById('playerView')?.classList.contains('active');
  }

  /* Toast allowed on home + categories (not shorts, not player) */
  function toastAllowedOnCurrentView() {
    return !isShortsView() && !isPlayerView();
  }

  /* Sticky allowed everywhere except shorts (player is fine — sticky sits
     below the fold on player view, not over controls). */
  function stickyAllowedOnCurrentView() {
    return !isShortsView();
  }

  /* ---------- DOM lookups ---------- */
  function stickyEl()    { return document.getElementById('craksmartSticky'); }
  function stickyClose() { return document.getElementById('craksmartStickyClose'); }
  function timedEl()     { return document.getElementById('craksmartTimedSlot'); }
  function timedClose()  { return document.getElementById('craksmartTimedClose'); }
  function timedText()   { return document.getElementById('craksmartTimedText'); }

  /* ---------- sticky banner ---------- */
  let stickyTimer = null;
  let stickyShown = false;

  function scheduleSticky() {
    if (stickyTimer) { clearTimeout(stickyTimer); stickyTimer = null; }
    if (!enabled() || !consentAllows() || stickyShown) return;
    if (getCookie(COOKIES.stickyDismissed)) return;
    if (!stickyAllowedOnCurrentView()) return;

    const el = stickyEl();
    if (!el) return;

    stickyTimer = setTimeout(function () {
      if (!consentAllows() || !enabled() || getCookie(COOKIES.stickyDismissed)) return;
      if (!stickyAllowedOnCurrentView()) return;
      el.classList.remove('hidden');
      stickyShown = true;
    }, CFG.crak.stickyDelayMs);
  }

  function hideSticky(persistDismiss) {
    const el = stickyEl();
    if (!el) return;
    el.classList.add('hidden');
    stickyShown = false;
    if (persistDismiss) {
      setCookie(COOKIES.stickyDismissed, '1', CFG.crak.stickyDismissCooldownMs);
    }
  }

  /* ---------- timed header toast ---------- */
  let timedLoopTimer = null;
  let timedHideTimer = null;
  let timedMessageIndex = 0;
  let timedStarted = false;

  function scheduleTimedOnce(delayMs) {
    if (timedLoopTimer) { clearTimeout(timedLoopTimer); timedLoopTimer = null; }
    if (!enabled() || !consentAllows()) return;
    if (getCookie(COOKIES.timedDismissed)) return;

    timedLoopTimer = setTimeout(function () {
      showTimedToast();
      scheduleTimedOnce(CFG.crak.timedIntervalMs);
    }, delayMs);
  }

  function showTimedToast() {
    if (!consentAllows() || !enabled()) return;
    if (getCookie(COOKIES.timedDismissed)) return;
    if (!toastAllowedOnCurrentView()) return;

    const el = timedEl();
    if (!el) return;

    /* Rotate copy */
    const msgs = CFG.crak.timedMessages || [];
    if (msgs.length) {
      const textEl = timedText();
      if (textEl) textEl.textContent = msgs[timedMessageIndex % msgs.length];
      timedMessageIndex++;
    }

    el.classList.remove('hidden');
    setCookie(COOKIES.timedLastShown, Date.now(), CFG.crak.timedIntervalMs);

    /* Auto-hide after visible duration */
    if (timedHideTimer) clearTimeout(timedHideTimer);
    timedHideTimer = setTimeout(function () {
      el.classList.add('hidden');
    }, CFG.crak.timedVisibleMs);
  }

  function hideTimedToast(persistDismiss) {
    const el = timedEl();
    if (!el) return;
    el.classList.add('hidden');
    if (timedHideTimer) { clearTimeout(timedHideTimer); timedHideTimer = null; }
    if (persistDismiss) {
      setCookie(COOKIES.timedDismissed, '1', CFG.crak.timedDismissCooldownMs);
      if (timedLoopTimer) { clearTimeout(timedLoopTimer); timedLoopTimer = null; }
    }
  }

  /* ---------- wire close buttons ---------- */
  function wireCloseButtons() {
    const sClose = stickyClose();
    if (sClose && !sClose.dataset.wired) {
      sClose.dataset.wired = '1';
      sClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        hideSticky(true);
      });
    }

    const tClose = timedClose();
    if (tClose && !tClose.dataset.wired) {
      tClose.dataset.wired = '1';
      tClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        hideTimedToast(true);
      });
    }

    /* Clicking the timed link should hide the toast afterwards */
    const tLink = document.getElementById('craksmartTimedLink');
    if (tLink && !tLink.dataset.wired) {
      tLink.dataset.wired = '1';
      tLink.addEventListener('click', function () {
        /* Don't preventDefault — user wants the tab to open */
        hideTimedToast(false);
      });
    }
  }

  /* ---------- public API ---------- */
  window.CumBearCrak = {
    refresh: function () {
      /* Re-evaluate on route change */
      if (!stickyAllowedOnCurrentView()) hideSticky(false);
      if (!toastAllowedOnCurrentView()) hideTimedToast(false);

      if (!stickyShown && stickyAllowedOnCurrentView()) scheduleSticky();
      if (!timedStarted && toastAllowedOnCurrentView()) {
        timedStarted = true;
        scheduleTimedOnce(CFG.crak.timedFirstDelayMs);
      }
    },
    hideAll: function () {
      hideSticky(false);
      hideTimedToast(false);
      if (stickyTimer) { clearTimeout(stickyTimer); stickyTimer = null; }
      if (timedLoopTimer) { clearTimeout(timedLoopTimer); timedLoopTimer = null; }
    }
  };

  /* ---------- boot ---------- */
  function boot() {
    wireCloseButtons();

    if (!enabled() || !consentAllows()) {
      /* Wait for consent grant */
      window.addEventListener('cumbear:consent', function handler(ev) {
        if (ev.detail && ev.detail.state === 'all') {
          window.removeEventListener('cumbear:consent', handler);
          /* Only start timers when consent arrives late */
          scheduleSticky();
          if (!timedStarted) {
            timedStarted = true;
            scheduleTimedOnce(CFG.crak.timedFirstDelayMs);
          }
        }
      });
      return;
    }

    scheduleSticky();
    if (!timedStarted) {
      timedStarted = true;
      scheduleTimedOnce(CFG.crak.timedFirstDelayMs);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Re-evaluate when the SPA view changes (script.js sets body.shorts-mode etc.) */
  document.addEventListener('click', function (e) {
    /* Cheap heuristic: any click that lands inside .view-tab or .nav-link
       means the view may change → refresh 50ms later */
    if (e.target && e.target.closest && e.target.closest('.view-tab, .nav-link, [data-view]')) {
      setTimeout(function () { window.CumBearCrak && window.CumBearCrak.refresh(); }, 60);
    }
  }, true);
})();
