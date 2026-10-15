/**
 * ==========================================================================
 * CUMBEAR AD UTILITY CONTROLLER (ExoClick Sizing, Banners & Popunders)
 * ==========================================================================
 */

(function () {
  'use strict';

  const stickyContainer = document.getElementById('stickyAdContainer');
  const stickyCloseBtn = document.getElementById('stickyCloseBtn');
  let stickyTimer = null;

  function showStickyAd() {
    if (!stickyContainer) return;
    const isShortsView = document.getElementById('shortsView')?.classList.contains('active');
    if (isShortsView) {
      stickyContainer.style.display = 'none';
      return;
    }

    stickyContainer.style.display = 'flex';
    try {
      (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
    } catch (err) {}
  }

  function hideStickyAd() {
    if (!stickyContainer) return;
    stickyContainer.style.display = 'none';

    if (stickyTimer) clearTimeout(stickyTimer);
    stickyTimer = setTimeout(() => {
      showStickyAd();
    }, 30000);
  }

  if (stickyCloseBtn) {
    stickyCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideStickyAd();
    });
  }

  // --- Instant Message Ad (Auto-Hides in 5s, repeats every 60s) ---
  const instantMsgEl = document.getElementById('instantMsgAd');
  let hasScrolled = false;

  function triggerInstantMessage() {
    if (!instantMsgEl) return;
    const isShortsView = document.getElementById('shortsView')?.classList.contains('active');
    if (isShortsView) return;

    instantMsgEl.classList.remove('hidden');
    instantMsgEl.style.display = 'block';

    try {
      (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
    } catch (err) {}

    setTimeout(() => {
      if (instantMsgEl) {
        instantMsgEl.classList.add('hidden');
        instantMsgEl.style.display = 'none';
      }
    }, 5000);
  }

  window.addEventListener('scroll', () => {
    if (!hasScrolled && window.scrollY > 120) {
      hasScrolled = true;
      triggerInstantMessage();

      setInterval(() => {
        triggerInstantMessage();
      }, 60000);
    }
  }, { passive: true });

  // --- Random Popunder Trigger (Between 45s and 90s) ---
  const POP_URL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';
  let canPop = false;

  function scheduleNextPop() {
    const randomDelay = Math.floor(Math.random() * (90000 - 45000 + 1)) + 45000;
    setTimeout(() => {
      canPop = true;
    }, randomDelay);
  }

  document.body.addEventListener('click', (e) => {
    if (!canPop) return;
    const ignoreTags = ['INPUT', 'TEXTAREA', 'BUTTON'];
    if (ignoreTags.includes(e.target.tagName)) return;

    window.open(POP_URL, '_blank', 'noopener,noreferrer');
    canPop = false;
    scheduleNextPop();
  });

  scheduleNextPop();

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(showStickyAd, 1500);
  });
})();
