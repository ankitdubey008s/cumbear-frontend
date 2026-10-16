/**
 * ==========================================================================
 * CUMBEAR AD UTILITY CONTROLLER
 * Features:
 *  - Zone 6056606 Floating Video Slider Popup on all content views
 *  - Route-targeted Banner Visibility (Home & Search Only)
 *  - Timed Popunders
 * ==========================================================================
 */

(function () {
  'use strict';

  const bannerWrapper = document.getElementById('globalTopBannerWrapper');
  const videoSliderEl = document.getElementById('videoSliderPopup');
  const videoSliderClose = document.getElementById('videoSliderCloseBtn');
  let sliderTimer = null;
  let isSliderClosedByUser = false;

  // Manage Banner and Slider Display Per View
  window.updateAdVisibility = function (activeViewId) {
    // 1. Top Banner Visibility
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

    // 2. Video Slider Popup: Active on Home, Search, and Player; Hidden on Shorts
    if (videoSliderEl) {
      if (activeViewId === 'shortsView') {
        videoSliderEl.style.display = 'none';
      } else if (!isSliderClosedByUser) {
        showVideoSlider();
      }
    }
  };

  // Video Slider Management
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

    // Re-show after 40 seconds to maximize impressions
    if (sliderTimer) clearTimeout(sliderTimer);
    sliderTimer = setTimeout(() => {
      isSliderClosedByUser = false;
      showVideoSlider();
    }, 40000);
  }

  if (videoSliderClose) {
    videoSliderClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideVideoSlider();
    });
  }

  // Hook into router to update slider across page switches
  const originalSwitchView = window.switchView;
  if (typeof originalSwitchView === 'function') {
    window.switchView = function (viewId, pushHistory = true) {
      originalSwitchView(viewId, pushHistory);
      window.updateAdVisibility(viewId);
    };
  }

  // Initial trigger: Show popup after 3 seconds on page load or upon first scroll
  let triggeredInitial = false;
  function triggerInitialSlider() {
    if (!triggeredInitial) {
      triggeredInitial = true;
      showVideoSlider();
    }
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      triggerInitialSlider();
    }
  }, { passive: true });

  setTimeout(triggerInitialSlider, 3500);

  // Background Popunder Trigger on natural body interactions
  const CRAK_POPS_URL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';
  let canPop = false;

  function scheduleNextPop() {
    const randomDelay = Math.floor(Math.random() * (70000 - 35000 + 1)) + 35000;
    setTimeout(() => { canPop = true; }, randomDelay);
  }

  document.body.addEventListener('click', (e) => {
    if (!canPop) return;
    const ignoreTags = ['INPUT', 'TEXTAREA', 'BUTTON', 'A', 'VIDEO'];
    if (ignoreTags.includes(e.target.tagName) || e.target.closest('a') || e.target.closest('button') || e.target.closest('video')) return;

    window.open(CRAK_POPS_URL, '_blank', 'noopener,noreferrer');
    canPop = false;
    scheduleNextPop();
  });

  scheduleNextPop();

  document.addEventListener('DOMContentLoaded', () => {
    window.updateAdVisibility('homeView');
  });
})();
