/**
 * ==========================================================================
 * CUMBEAR PURE FRONTEND FAPHOUSE ENGINE (NO BACKEND REQUIRED)
 * Tracking ID: ai=vIZ
 * Rules:
 *  - Interleaves 1 FapHouse affiliate video after every 5 standard videos
 *  - 100% Client-side: Zero MongoDB writes, zero backend dependencies
 *  - Full Hold-to-Preview support using FapHouse trailer previews
 *  - Global click interception: Tapping any affiliate card opens FapHouse in a new tab
 * ==========================================================================
 */

(function () {
  'use strict';

  const AFFILIATE_ID = 'vIZ';

  // 1. Curated High-Converting FapHouse Pool (Direct CDN thumbnails & trailers)
  const faphousePool = [
    {
      _id: 'fh_1',
      title: 'Passionate Step-Sister Gets Caught In The Shower',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=720&h=405&fit=crop',
      playableUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      affiliateUrl: `https://fap.cash/content/dump?ai=${AFFILIATE_ID}&forient=straight&fowner=all`,
      duration: '24:18',
      category: 'FapHouse Exclusive',
      views: '482k',
      isAffiliate: true
    },
    {
      _id: 'fh_2',
      title: 'Busty Blonde Model Begs For Deep Sensual Massage',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=720&h=405&fit=crop',
      playableUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      affiliateUrl: `https://fap.cash/content/dump?ai=${AFFILIATE_ID}&forient=straight&fowner=all`,
      duration: '31:05',
      category: 'Premium HD',
      views: '619k',
      isAffiliate: true
    },
    {
      _id: 'fh_3',
      title: 'Hot College Roommates Share Intense Secret Night',
      thumbnailUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=720&h=405&fit=crop',
      playableUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      affiliateUrl: `https://fap.cash/content/dump?ai=${AFFILIATE_ID}&forient=straight&fowner=all`,
      duration: '19:42',
      category: 'FapHouse Gold',
      views: '730k',
      isAffiliate: true
    },
    {
      _id: 'fh_4',
      title: 'Horny Brunette Seduces Her Strict Personal Trainer',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=720&h=405&fit=crop',
      playableUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      affiliateUrl: `https://fap.cash/content/dump?ai=${AFFILIATE_ID}&forient=straight&fowner=all`,
      duration: '27:14',
      category: 'Verified 4K',
      views: '540k',
      isAffiliate: true
    },
    {
      _id: 'fh_5',
      title: 'Wild Hotel Encounter With Busty Russian Babe',
      thumbnailUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=720&h=405&fit=crop',
      playableUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      affiliateUrl: `https://fap.cash/content/dump?ai=${AFFILIATE_ID}&forient=straight&fowner=all`,
      duration: '22:50',
      category: 'FapHouse Exclusive',
      views: '890k',
      isAffiliate: true
    },
    {
      _id: 'fh_6',
      title: 'Naughty Secretary Takes Full Control After Office Hours',
      thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=720&h=405&fit=crop',
      playableUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      affiliateUrl: `https://fap.cash/content/dump?ai=${AFFILIATE_ID}&forient=straight&fowner=all`,
      duration: '35:12',
      category: 'Studio Premium',
      views: '1.2M',
      isAffiliate: true
    }
  ];

  let currentPool = [...faphousePool];

  // Optional background sync with live FapHouse JSON feed
  async function syncLiveFaphouseFeed() {
    try {
      const feedUrl = `https://fap.cash/content/dump?ai=${AFFILIATE_ID}&forient=straight&fcats=!&fres=all&fperiod=day&furls=c1&fthumbs=mmsmall&ftcnt=1&ford=dt&fdelim=%7C&fformat=json&fowner=all&ftsize=small&url=on&title=on&cats=on&dur=on&trailer=on&thumbs=on`;
      const res = await fetch(feedUrl, { mode: 'cors' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        currentPool = data.map((item, idx) => ({
          _id: `fh_live_${idx}`,
          title: item.title || 'Exclusive Studio Scene',
          thumbnailUrl: Array.isArray(item.thumbs) ? item.thumbs[0] : (item.thumb || item.thumbs),
          playableUrl: item.trailer || item.trailer_url || '',
          affiliateUrl: item.url,
          duration: item.duration ? `${Math.floor(item.duration / 60)}:${item.duration % 60 < 10 ? '0' : ''}${item.duration % 60}` : '18:30',
          category: Array.isArray(item.cats) ? item.cats[0] : (item.cats || 'FapHouse'),
          views: `${Math.floor(Math.random() * 500 + 100)}k`,
          isAffiliate: true
        })).filter(doc => doc.affiliateUrl && doc.thumbnailUrl);
      }
    } catch (e) {
      // Gracefully defaults to high-converting built-in pool
    }
  }

  /**
   * Interleaves 1 FapHouse affiliate video after every 5 standard videos
   */
  window.mixAffiliateVideos = function (standardVideos) {
    if (!Array.isArray(standardVideos) || standardVideos.length === 0) {
      return standardVideos || [];
    }

    const mixed = [];
    let poolIdx = 0;

    for (let i = 0; i < standardVideos.length; i++) {
      mixed.push(standardVideos[i]);

      // Every 5 videos, insert 1 FapHouse affiliate card
      if ((i + 1) % 5 === 0 && currentPool.length > 0) {
        const affDoc = currentPool[poolIdx % currentPool.length];
        mixed.push(affDoc);
        poolIdx++;
      }
    }

    return mixed;
  };

  /**
   * Universal Video Card Renderer with Dual Routing
   */
  window.renderMixedVideoCard = function (video) {
    const card = document.createElement('div');
    card.className = 'video-card' + (video.isAffiliate ? ' affiliate-video-card' : '');
    if (video.isAffiliate) {
      card.dataset.affUrl = video.affiliateUrl;
    }

    const duration = (video.duration || '00:00').replace(/^HD\s*/i, '');
    const views = video.views || `${Math.floor(Math.random() * 400 + 40)}k`;
    const safeTitle = (video.title || 'Featured Scene').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const categoryTag = video.category || (video.isAffiliate ? 'FapHouse' : 'CumBear');

    card.innerHTML = `
      <div class="video-thumb">
        <img class="hd-thumb" src="${video.thumbnailUrl || '/cumb.png'}" alt="${safeTitle}" loading="lazy" decoding="async" draggable="false" onerror="this.src='/cumb.png'">
        <div class="preview-video-holder"></div>
        <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
        <div class="preview-loading"><div class="preview-spinner"></div></div>
        <span class="duration-badge">${duration}</span>
        ${video.isAffiliate ? '<span class="affiliate-badge" style="background:#e11d48;color:#fff;font-weight:800;font-size:0.65rem;padding:2px 6px;border-radius:4px;position:absolute;top:8px;left:8px;z-index:4;">PREMIUM</span>' : ''}
      </div>
      <div class="video-info">
        <div class="video-title">${safeTitle}</div>
        <div class="video-meta-row">
          <span class="provider-tag">${categoryTag}</span>
          <span>•</span>
          <span>${views} views</span>
        </div>
      </div>
    `;

    const handleClick = () => {
      if (video.isAffiliate && video.affiliateUrl) {
        window.open(video.affiliateUrl, '_blank', 'noopener,noreferrer');
      } else {
        if (window.switchView) window.switchView('playerView', true);
        if (typeof window.loadPlayerVideoById === 'function') {
          window.loadPlayerVideoById(video._id);
        }
      }
    };

    if (typeof window.attachHoldAndSlidePreview === 'function') {
      window.attachHoldAndSlidePreview(card, video, handleClick);
    } else {
      card.addEventListener('click', handleClick);
    }

    return card;
  };

  // 2. Global Event Delegation: Guarantees affiliate cards route to FapHouse
  document.addEventListener('click', (e) => {
    const affCard = e.target.closest('.affiliate-video-card');
    if (affCard && affCard.dataset.affUrl) {
      e.preventDefault();
      e.stopPropagation();
      window.open(affCard.dataset.affUrl, '_blank', 'noopener,noreferrer');
    }
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    syncLiveFaphouseFeed();
  });
})();
