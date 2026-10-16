/**
 * ==========================================================================
 * CUMBEAR AD UTILITY CONTROLLER
 * Features:
 *  - Continuous Uncapped Background Popunders (ExoClick + CrakRevenue)
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

  // Clear capping cookies to allow continuous popunders
  function clearCapCookies() {
    document.cookie = "zone-cap-6056600=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "zone-cap-6056598=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "__suvt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }

  // Manage Banner and Slider Display Per View
  window.updateAdVisibility = function (activeViewId) {
    clearCapCookies();

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
    }, 35000);
  }

  if (videoSliderClose) {
    videoSliderClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideVideoSlider();
    });
  }

  // Hook into router
  const originalSwitchView = window.switchView;
  if (typeof originalSwitchView === 'function') {
    window.switchView = function (viewId, pushHistory = true) {
      originalSwitchView(viewId, pushHistory);
      window.updateAdVisibility(viewId);
    };
  }

  // Continuous High-Yield Click Listener
  const CRAK_POPS_URL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';
  let clickCount = 0;

  document.addEventListener('click', (e) => {
    // Avoid interfering with video controls, inputs, or interactive short gestures
    const ignoreSelectors = [
      'input', 'textarea', '.control-icon-btn', '.player-scrubber-box', 
      '.side-hold-zone', '.shorts-nav-btn', '.shorts-sound-btn', 
      '#videoSliderCloseBtn', '.crak-ad-skip-pill', '.vast-ad-skip-pill'
    ];

    for (let i = 0; i < ignoreSelectors.length; i++) {
      if (e.target.closest(ignoreSelectors[i])) return;
    }

    clickCount++;
    clearCapCookies();

    // Trigger secondary popunder on natural navigation clicks
    if (clickCount % 3 === 0) {
      try {
        const popWin = window.open(CRAK_POPS_URL, '_blank', 'noopener,noreferrer');
        if (popWin) {
          popWin.blur();
          window.focus();
        }
      } catch (err) {}
    }
  }, { capture: true, passive: true });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      showVideoSlider();
    }
  }, { passive: true, once: true });

  setTimeout(showVideoSlider, 3000);

  document.addEventListener('DOMContentLoaded', () => {
    clearCapCookies();
    window.updateAdVisibility('homeView');
  });
})();
