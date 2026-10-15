/**
 * ==========================================================================
 * CUMBEAR AD UTILITY CONTROLLER (ExoClick & CrakRevenue Integration)
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- 1. Video Slider Popup Ad (Zone 6056606) ---
  const videoSliderEl = document.getElementById('videoSliderPopup');
  const videoSliderClose = document.getElementById('videoSliderCloseBtn');
  let sliderTimer = null;
  let hasScrolled = false;

  function showVideoSlider() {
    if (!videoSliderEl) return;
    const isShortsView = document.getElementById('shortsView')?.classList.contains('active');
    if (isShortsView) {
      videoSliderEl.style.display = 'none';
      return;
    }

    videoSliderEl.style.display = 'block';
    try {
      (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
    } catch (e) {}
  }

  function hideVideoSlider() {
    if (!videoSliderEl) return;
    videoSliderEl.style.display = 'none';

    // Reappear after 45 seconds
    if (sliderTimer) clearTimeout(sliderTimer);
    sliderTimer = setTimeout(() => {
      showVideoSlider();
    }, 45000);
  }

  if (videoSliderClose) {
    videoSliderClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideVideoSlider();
    });
  }

  // Trigger slider after scroll down
  window.addEventListener('scroll', () => {
    if (!hasScrolled && window.scrollY > 150) {
      hasScrolled = true;
      setTimeout(showVideoSlider, 3000);
    }
  }, { passive: true });

  // --- 2. CrakRevenue Dating Popunder on User Click ---
  const CRAK_POPS_URL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';
  let canPop = false;

  function scheduleNextPop() {
    const randomDelay = Math.floor(Math.random() * (75000 - 35000 + 1)) + 35000;
    setTimeout(() => {
      canPop = true;
    }, randomDelay);
  }

  document.body.addEventListener('click', (e) => {
    if (!canPop) return;
    const ignoreTags = ['INPUT', 'TEXTAREA', 'BUTTON', 'A'];
    if (ignoreTags.includes(e.target.tagName) || e.target.closest('a') || e.target.closest('button')) return;

    window.open(CRAK_POPS_URL, '_blank', 'noopener,noreferrer');
    canPop = false;
    scheduleNextPop();
  });

  scheduleNextPop();

  // Hide ads on shorts view
  const originalSwitchView = window.switchView;
  if (originalSwitchView) {
    window.switchView = function (viewId, pushHistory = true) {
      originalSwitchView(viewId, pushHistory);

      if (viewId === 'shortsView') {
        if (videoSliderEl) videoSliderEl.style.display = 'none';
      }
    };
  }
})();
