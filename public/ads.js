/**
 * ==========================================================================
 * CUMBEAR AD UTILITY CONTROLLER
 * Features:
 *  - Zone 6056606 Floating Video Slider Popup
 *  - Route-targeted Banner Visibility (Home & Search Only)
 * ==========================================================================
 */

(function () {
  'use strict';

  const bannerWrapper = document.getElementById('globalTopBannerWrapper');
  const videoSliderEl = document.getElementById('videoSliderPopup');
  const videoSliderClose = document.getElementById('videoSliderCloseBtn');
  let sliderTimer = null;
  let isSliderClosedByUser = false;

  window.updateAdVisibility = function (activeViewId) {
    if (bannerWrapper) {
      if (activeViewId === 'homeView' || activeViewId === 'categoriesView') {
        bannerWrapper.classList.remove('hide-global-banner');
        bannerWrapper.style.display = 'flex';
        try {
          (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
        } catch (e) {}
      } else {
        bannerWrapper.classList.add('hide-global-banner');
        bannerWrapper.style.display = 'none';
      }
    }

    if (videoSliderEl) {
      if (activeViewId === 'shortsView') {
        videoSliderEl.style.display = 'none';
      } else if (!isSliderClosedByUser) {
        showVideoSlider();
      }
    }
  };

  function showVideoSlider() {
    if (!videoSliderEl) return;
    const isShorts = document.body.classList.contains('shorts-mode') || 
                    document.getElementById('shortsView')?.classList.contains('active');
    if (isShorts) return;

    videoSliderEl.style.display = 'block';
    try {
      (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
    } catch (e) {}
  }

  function hideVideoSlider() {
    if (!videoSliderEl) return;
    videoSliderEl.style.display = 'none';
    isSliderClosedByUser = true;

    if (sliderTimer) clearTimeout(sliderTimer);
    sliderTimer = setTimeout(() => {
      isSliderClosedByUser = false;
      showVideoSlider();
    }, 45000);
  }

  if (videoSliderClose) {
    videoSliderClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideVideoSlider();
    });
  }

  const originalSwitchView = window.switchView;
  if (typeof originalSwitchView === 'function') {
    window.switchView = function (viewId, pushHistory = true) {
      originalSwitchView(viewId, pushHistory);
      window.updateAdVisibility(viewId);
    };
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 120) {
      showVideoSlider();
    }
  }, { passive: true, once: true });

  setTimeout(showVideoSlider, 4000);

  document.addEventListener('DOMContentLoaded', () => {
    window.updateAdVisibility('homeView');
  });
})();
