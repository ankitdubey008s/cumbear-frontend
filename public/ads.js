/**
 * ==========================================================================
 * CUMBEAR AD UTILITY CONTROLLER
 * Features: Route-targeted Banner Visibility (Home & Search Only) & Popunders
 * ==========================================================================
 */

(function () {
  'use strict';

  const bannerWrapper = document.getElementById('globalTopBannerWrapper');
  const videoSliderEl = document.getElementById('videoSliderPopup');
  const videoSliderClose = document.getElementById('videoSliderCloseBtn');
  let sliderTimer = null;
  let hasScrolled = false;

  // Function to manage banner display per view
  window.updateAdVisibility = function (activeViewId) {
    if (!bannerWrapper) return;

    // Show ONLY on homeView and categoriesView (search results)
    if (activeViewId === 'homeView' || activeViewId === 'categoriesView') {
      bannerWrapper.classList.remove('hide-global-banner');
      bannerWrapper.style.display = 'flex';
      try {
        (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
      } catch (e) {}
    } else {
      // Completely hide on playerView and shortsView
      bannerWrapper.classList.add('hide-global-banner');
      bannerWrapper.style.display = 'none';
    }

    // Hide video slider on shorts as well
    if (activeViewId === 'shortsView' && videoSliderEl) {
      videoSliderEl.style.display = 'none';
    }
  };

  // Attach to global view switcher
  const originalSwitchView = window.switchView;
  if (typeof originalSwitchView === 'function') {
    window.switchView = function (viewId, pushHistory = true) {
      originalSwitchView(viewId, pushHistory);
      window.updateAdVisibility(viewId);
    };
  }

  // Video Slider Management
  function showVideoSlider() {
    if (!videoSliderEl) return;
    const isRestricted = document.getElementById('shortsView')?.classList.contains('active') ||
                         document.getElementById('playerView')?.classList.contains('active');
    if (isRestricted) return;

    videoSliderEl.style.display = 'block';
    try {
      (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
    } catch (e) {}
  }

  function hideVideoSlider() {
    if (!videoSliderEl) return;
    videoSliderEl.style.display = 'none';

    if (sliderTimer) clearTimeout(sliderTimer);
    sliderTimer = setTimeout(showVideoSlider, 45000);
  }

  if (videoSliderClose) {
    videoSliderClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideVideoSlider();
    });
  }

  window.addEventListener('scroll', () => {
    if (!hasScrolled && window.scrollY > 150) {
      hasScrolled = true;
      setTimeout(showVideoSlider, 3000);
    }
  }, { passive: true });

  // Popunder trigger on natural body interaction
  const CRAK_POPS_URL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';
  let canPop = false;

  function scheduleNextPop() {
    const randomDelay = Math.floor(Math.random() * (75000 - 35000 + 1)) + 35000;
    setTimeout(() => { canPop = true; }, randomDelay);
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

  document.addEventListener('DOMContentLoaded', () => {
    // Initial check on load
    window.updateAdVisibility('homeView');
  });
})();
