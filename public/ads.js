/**
 * ==========================================================================
 * CUMBEAR AD MONETIZATION ENGINE (ExoClick & CrakRevenue Controller)
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- 1. Sticky Bottom Banner Controller (30s Reappear Cycle) ---
  const stickyContainer = document.getElementById('stickyAdContainer');
  const stickyCloseBtn = document.getElementById('stickyCloseBtn');
  let stickyTimer = null;

  function showStickyAd() {
    if (!stickyContainer) return;

    // Do not show sticky banner on shorts view to preserve 100dvh full immersion
    const isShortsView = document.getElementById('shortsView')?.classList.contains('active');
    if (isShortsView) {
      stickyContainer.style.display = 'none';
      return;
    }

    stickyContainer.style.display = 'flex';

    // Push serve call to ExoClick AdProvider
    try {
      (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
    } catch (err) {
      console.warn('AdProvider sticky serve error:', err);
    }
  }

  function hideStickyAd() {
    if (!stickyContainer) return;
    stickyContainer.style.display = 'none';

    // Reset and reappear automatically after 30 seconds
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

  // --- 2. Instant Message Ad Controller (Zone 6045630) ---
  const instantMsgEl = document.getElementById('instantMsgAd');
  let instantMsgInterval = null;
  let hasScrolled = false;

  function triggerInstantMessage() {
    if (!instantMsgEl) return;

    // Do not overlay on top of shorts
    const isShortsView = document.getElementById('shortsView')?.classList.contains('active');
    if (isShortsView) return;

    instantMsgEl.classList.remove('hidden');
    instantMsgEl.style.display = 'block';

    try {
      (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
    } catch (err) {}

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (instantMsgEl) {
        instantMsgEl.classList.add('hidden');
        instantMsgEl.style.display = 'none';
      }
    }, 5000);
  }

  // Activate instant message repeat loop upon first user scroll
  window.addEventListener('scroll', () => {
    if (!hasScrolled && window.scrollY > 100) {
      hasScrolled = true;
      triggerInstantMessage();

      // Repeat every 60 seconds
      instantMsgInterval = setInterval(() => {
        triggerInstantMessage();
      }, 60000);
    }
  }, { passive: true });

  // --- 3. View Switch Ad Sync ---
  // When switching between Home/Shorts/Player, adapt the ads dynamically
  const originalSwitchView = window.switchView;
  if (originalSwitchView) {
    window.switchView = function (viewId, pushHistory = true) {
      originalSwitchView(viewId, pushHistory);

      if (viewId === 'shortsView') {
        // Hide sticky banner and instant message while on Shorts
        if (stickyContainer) stickyContainer.style.display = 'none';
        if (instantMsgEl) instantMsgEl.style.display = 'none';
      } else {
        // Restore sticky banner when returning to Home or Player
        showStickyAd();
      }
    };
  }

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Initial display of sticky banner after 2 seconds
    setTimeout(() => {
      showStickyAd();
    }, 2000);
  });
})();
