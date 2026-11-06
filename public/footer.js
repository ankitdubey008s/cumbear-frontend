/**
 * ==========================================================================
 * CUMBEAR — FOOTER UTILITIES
 * --------------------------------------------------------------------------
 * - Auto-updates copyright year (all .site-footer instances)
 * - Enforces target/rel attributes on external links
 * - Adds rel="sponsored" to advertising/partner links
 * - Runs on initial load and on player view change (its footer renders later)
 *
 * Public API:
 *   window.refreshFooter()  → re-run all footer logic
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearFooterLoaded) return;
  window.__cumbearFooterLoaded = true;

  const SPONSORED_KEYWORDS = ['advertise', 'webmaster', 'partnership', 'program'];

  function isExternalHttp(href) {
    if (!href) return false;
    return /^https?:\/\//i.test(href);
  }

  function isMailto(href) {
    return href && /^mailto:/i.test(href);
  }

  function isSponsored(href) {
    if (!href) return false;
    const lower = href.toLowerCase();
    return SPONSORED_KEYWORDS.some(function (kw) { return lower.indexOf(kw) !== -1; });
  }

  /* ---------- update copyright year ---------- */
  function updateCopyright(footer) {
    const yearEls = footer.querySelectorAll('.copyright-year');
    const currentYear = String(new Date().getFullYear());

    if (yearEls.length > 0) {
      yearEls.forEach(function (el) { el.textContent = currentYear; });
      return;
    }

    /* Fallback: rewrite the © block if no span exists */
    const copyrightEl = footer.querySelector('.copyright');
    if (!copyrightEl) return;

    const text = copyrightEl.innerHTML || '';
    /* Only touch if a 4-digit year appears */
    if (!/\b20\d{2}\b/.test(text)) return;
    copyrightEl.innerHTML = text.replace(/\b20\d{2}\b/g, currentYear);
  }

  /* ---------- fix external link attributes ---------- */
  function normalizeLinks(footer) {
    const links = footer.querySelectorAll('a[href]');
    links.forEach(function (link) {
      const href = link.getAttribute('href');

      if (!href) return;

      /* mailto: — no target changes */
      if (isMailto(href)) return;

      /* External http(s) links */
      if (isExternalHttp(href)) {
        /* Ensure safe target + rel */
        if (link.getAttribute('target') !== '_blank') {
          link.setAttribute('target', '_blank');
        }

        const existingRel = (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
        const requiredRel = ['noopener', 'noreferrer'];
        if (isSponsored(href)) requiredRel.push('sponsored');

        let newRel = existingRel.slice();
        requiredRel.forEach(function (r) {
          if (newRel.indexOf(r) === -1) newRel.push(r);
        });
        link.setAttribute('rel', newRel.join(' '));
      }
    });
  }

  /* ---------- main ---------- */
  function processAllFooters() {
    const footers = document.querySelectorAll('.site-footer');
    if (footers.length === 0) return;

    footers.forEach(function (footer) {
      try {
        updateCopyright(footer);
        normalizeLinks(footer);
      } catch (e) {
        console.warn('[CumBearFooter] processing error:', e);
      }
    });
  }

  window.refreshFooter = processAllFooters;

  /* ---------- init ---------- */
  function init() {
    processAllFooters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Player view has its own footer; re-run when we land there */
  document.addEventListener('cumbear:viewChanged', function (ev) {
    if (ev && ev.detail && ev.detail.view === 'playerView') {
      /* Delay slightly so any lazy-rendered footer is in the DOM */
      setTimeout(processAllFooters, 50);
    }
  });
})();
