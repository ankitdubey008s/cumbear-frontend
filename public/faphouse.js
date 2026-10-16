/**
 * ==========================================================================
 * CUMBEAR FAPHOUSE IN-FEED MONETIZATION CONTROLLER
 * Injects a native affiliate video card after every 5 regular videos
 * ==========================================================================
 */

(function () {
  'use strict';

  const BACKEND_BASE = 'https://cumbear-backend.vercel.app';
  let faphouseVideos = [];
  let currentIndex = 0;

  async function initFaphouseFeed() {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/faphouse/feed?_=${Date.now()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        faphouseVideos = json.data;
      }
    } catch (e) {
      console.warn('Faphouse feed fallback to static affiliate links');
    }

    // Default high-converting fallbacks if API is offline
    if (faphouseVideos.length === 0) {
      faphouseVideos = [
        {
          _id: 'fap_default_1',
          title: 'Premium Verified VIP Scene Uncut (Watch Free)',
          thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=640&h=360&fit=crop',
          duration: '18:22',
          category: 'Faphouse Exclusive',
          views: '450k',
          affiliateUrl: 'https://fap.cash/content/dump?ai=vIZ',
          isFaphouse: true
        },
        {
          _id: 'fap_default_2',
          title: 'Direct Access 4K Members Video Stream',
          thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=640&h=360&fit=crop',
          duration: '22:15',
          category: 'Top Rated HD',
          views: '610k',
          affiliateUrl: 'https://fap.cash/content/dump?ai=vIZ',
          isFaphouse: true
        }
      ];
    }
  }

  function getNextFaphouseVideo() {
    if (faphouseVideos.length === 0) return null;
    const item = faphouseVideos[currentIndex % faphouseVideos.length];
    currentIndex++;
    return item;
  }

  window.renderFaphouseCard = function (fapItem) {
    if (!fapItem) return document.createElement('div');

    const card = document.createElement('div');
    card.className = 'video-card faphouse-native-card';

    const safeTitle = (fapItem.title || 'Exclusive HD Scene').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const duration = (fapItem.duration || '15:00').replace(/^HD\s*/i, '');
    const views = fapItem.views || '250k';

    card.innerHTML = `
      <a href="${fapItem.affiliateUrl}" target="_blank" rel="noopener noreferrer" class="faphouse-card-link">
        <div class="video-thumb">
          <img class="hd-thumb" src="${fapItem.thumbnailUrl}" alt="${safeTitle}" loading="lazy" decoding="async" onerror="this.src='/cumb.png'">
          <span class="faphouse-sponsored-badge">SPONSORED HD</span>
          <span class="duration-badge">${duration}</span>
        </div>
        <div class="video-info">
          <div class="video-title">${safeTitle}</div>
          <div class="video-meta-row">
            <span class="provider-tag faphouse-tag">★ Faphouse</span>
            <span>•</span>
            <span>${views} views</span>
            <span>•</span>
            <span class="faphouse-action-text">Watch HD ➔</span>
          </div>
        </div>
      </a>
    `;

    return card;
  };

  /**
   * Universal In-Feed Injector: appends regular cards and injects 1 Faphouse card after every 5 videos
   */
  window.appendVideosWithFaphouse = function (container, videoList, cardRenderer) {
    if (!container || !Array.isArray(videoList)) return;

    videoList.forEach((video, index) => {
      // 1. Render normal video card
      const el = cardRenderer(video);
      if (el) container.appendChild(el);

      // 2. Inject Faphouse card every 5 items
      if ((index + 1) % 5 === 0) {
        const fapVideo = getNextFaphouseVideo();
        if (fapVideo) {
          const fapCard = window.renderFaphouseCard(fapVideo);
          container.appendChild(fapCard);
        }
      }
    });
  };

  document.addEventListener('DOMContentLoaded', initFaphouseFeed);
})();
