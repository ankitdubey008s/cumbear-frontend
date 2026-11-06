/**
 * ==========================================================================
 * CUMBEAR — FAPHOUSE AFFILIATE INTEGRATION (v5)
 * --------------------------------------------------------------------------
 * - Fetches live feed via backend proxy (CORS-safe)
 * - Interleaves 1 card after every 5 organic videos
 * - Cards auto-play preview video muted (like a Reel), no controls
 * - Only plays when in viewport (IntersectionObserver) — saves bandwidth
 * - Click ANYWHERE on card → opens FapHouse via window.open (URL hidden until tab opens)
 * - NEVER reveals fhgte.com or fap.cash before click (status bar shows # )
 * - All preview videos blocked from right-click
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.mixAffiliateVideos) return;
  const CFG = window.CUMBEAR;
  if (!CFG || !CFG.faphouse) {
    console.warn('[CumBearFapHouse] config.js not loaded — aborting');
    return;
  }

  const FEED_URL       = CFG.helpers.faphouseFeedApiUrl();
  const AFFILIATE_ID   = CFG.faphouse.affiliateId;
  const LANDER_URL     = CFG.faphouse.landerUrl;
  const INJECT_EVERY   = CFG.faphouse.injectEvery || 5;
  const FEED_CACHE_MS  = CFG.faphouse.feedCacheMs || 10 * 60 * 1000;
  const PLACEHOLDER    = '/cumb.png';

  let livePool = [];
  let livePoolFetchedAt = 0;
  let feedFetchPromise = null;
  let poolCursor = 0;
  const usedIds = new Set();

  /* ==========================================================================
     THUMBNAIL EXTRACTION (kept from v4 — canvas frame from trailer)
     ========================================================================== */
  const THUMB_CACHE_KEY = 'cumbear_fh_thumb_cache_v3';
  const THUMB_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

  function loadThumbCache() {
    try {
      const raw = localStorage.getItem(THUMB_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      const now = Date.now();
      const pruned = {};
      Object.keys(parsed).forEach(function (k) {
        const entry = parsed[k];
        if (entry && entry.ts && (now - entry.ts) < THUMB_CACHE_TTL) {
          pruned[k] = entry;
        }
      });
      return pruned;
    } catch (e) { return {}; }
  }

  function saveThumbCache(map) {
    try { localStorage.setItem(THUMB_CACHE_KEY, JSON.stringify(map)); }
    catch (e) { /* ignore */ }
  }

  let thumbCache = loadThumbCache();

  /* ==========================================================================
     FEED NORMALIZE
     ========================================================================== */
  function normalizeItem(item, index) {
    if (!item || typeof item !== 'object') return null;

    const affiliateUrl = item.affiliateUrl || item.url || item.link || '';
    const trailerUrl   = item.playableUrl || item.trailer || item.trailer_url || '';
    const thumbnailUrl = item.thumbnailUrl || item.thumb || item.thumbnail || '';

    if (!affiliateUrl) return null;
    if (affiliateUrl.indexOf('fap.cash') === 0) return null;

    return {
      _id: 'fh_' + (item._id || item.id || index || Math.random().toString(36).slice(2, 9)),
      title: String(item.title || 'FapHouse Exclusive').slice(0, 200),
      thumbnailUrl: thumbnailUrl,
      playableUrl: trailerUrl,
      affiliateUrl: affiliateUrl,
      duration: item.duration || '—',
      category: item.category || 'FapHouse',
      views: item.views || '—',
      isAffiliate: true
    };
  }

  /* ==========================================================================
     FETCH FEED
     ========================================================================== */
  function fetchLiveFeed() {
    const now = Date.now();
    if (livePool.length > 0 && (now - livePoolFetchedAt) < FEED_CACHE_MS) {
      return Promise.resolve(livePool);
    }
    if (feedFetchPromise) return feedFetchPromise;

    feedFetchPromise = fetch(FEED_URL, { mode: 'cors', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('feed HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        const items = Array.isArray(data) ? data : (data && (data.data || data.videos) || []);
        const normalized = items.map(normalizeItem).filter(Boolean);
        if (normalized.length > 0) {
          livePool = normalized;
          livePoolFetchedAt = Date.now();
        }
        return livePool;
      })
      .catch(function (err) {
        console.warn('[CumBearFapHouse] feed unavailable:', err.message);
        return livePool;
      })
      .finally(function () { feedFetchPromise = null; });

    return feedFetchPromise;
  }

  function pickNextAffiliate() {
    if (!livePool.length) return null;
    for (let i = 0; i < livePool.length; i++) {
      const item = livePool[poolCursor % livePool.length];
      poolCursor++;
      if (!usedIds.has(item._id)) {
        usedIds.add(item._id);
        return item;
      }
    }
    usedIds.clear();
    return livePool[0];
  }

  /* ==========================================================================
     PUBLIC: mix
     ========================================================================== */
  window.mixAffiliateVideos = function (standardVideos) {
    if (!Array.isArray(standardVideos) || standardVideos.length === 0) {
      return standardVideos || [];
    }
    const mixed = [];
    for (let i = 0; i < standardVideos.length; i++) {
      mixed.push(standardVideos[i]);
      if ((i + 1) % INJECT_EVERY === 0) {
        const aff = pickNextAffiliate();
        if (aff) mixed.push(aff);
      }
    }
    return mixed;
  };

  /* ==========================================================================
     BUILD AFFILIATE URL
     ========================================================================== */
  function buildAffiliateUrl(rawUrl) {
    if (!rawUrl) return LANDER_URL;
    try {
      const u = new URL(rawUrl, window.location.origin);
      if (u.hostname === 'fap.cash') return LANDER_URL;
      if (!u.searchParams.has('utm_campaign') && AFFILIATE_ID) {
        u.searchParams.set('utm_campaign', 'ai.' + AFFILIATE_ID);
      }
      return u.toString();
    } catch (e) {
      return LANDER_URL;
    }
  }

  /* ==========================================================================
     INTERSECTION OBSERVER — play preview video only when visible
     ========================================================================== */
  let faphouseObserver = null;

  function setupFaphouseObserver() {
    if (faphouseObserver) return;

    faphouseObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const videoEl = entry.target.querySelector('.faphouse-autoplay-video');
        if (!videoEl) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
          /* Play */
          if (!videoEl.src && videoEl.dataset.src) {
            videoEl.src = videoEl.dataset.src;
          }
          const p = videoEl.play();
          if (p && typeof p.catch === 'function') {
            p.catch(function () {
              videoEl.muted = true;
              videoEl.play().catch(function () {});
            });
          }
          videoEl.classList.add('playing');
        } else {
          /* Pause */
          try {
            videoEl.pause();
            videoEl.classList.remove('playing');
          } catch (e) { /* ignore */ }
        }
      });
    }, { threshold: 0.4, rootMargin: '100px 0px 100px 0px' });
  }

  function observeFaphouseCard(card) {
    setupFaphouseObserver();
    if (faphouseObserver && card) {
      faphouseObserver.observe(card);
    }
  }

  /* ==========================================================================
     RENDER CARD
     ========================================================================== */
  window.renderMixedVideoCard = function (video, onOpen) {
    if (!video) return document.createElement('div');

    const isAff   = !!video.isAffiliate;
    const card    = document.createElement('div');
    card.className = 'video-card' + (isAff ? ' affiliate-video-card' : '');

    const duration  = (video.duration || '—').replace(/^HD\s*/i, '');
    const views     = video.views || '—';
    const title     = String(video.title || 'Featured')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const category  = video.category || (isAff ? 'FapHouse' : 'CumBear');
    const initialThumb = video.thumbnailUrl && video.thumbnailUrl.indexOf('http') === 0
      ? video.thumbnailUrl
      : PLACEHOLDER;

    if (isAff) {
      /* ====================================================================
         FAPHOUSE CARD — autoplay preview video, no image, no link
         Click anywhere → window.open(real URL) (URL not shown before click)
         ==================================================================== */
      card.innerHTML =
        '<div class="video-thumb faphouse-thumb">' +
          '<video class="faphouse-autoplay-video" ' +
                 'muted playsinline webkit-playsinline loop preload="none" ' +
                 'poster="' + initialThumb + '" ' +
                 'data-src="' + (video.playableUrl || '') + '"></video>' +
          '<span class="faphouse-sponsored-badge">SPONSORED</span>' +
          '<span class="duration-badge">' + duration + '</span>' +
        '</div>' +
        '<div class="video-info">' +
          '<div class="video-title">' + title + '</div>' +
          '<div class="video-meta-row">' +
            '<span class="provider-tag faphouse-tag">' + category + '</span>' +
            '<span>•</span>' +
            '<span>' + views + ' views</span>' +
          '</div>' +
        '</div>';

      /* Prevent right-click on preview video */
      const previewVideo = card.querySelector('.faphouse-autoplay-video');
      if (previewVideo) {
        previewVideo.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      }

      /* Card click → open affiliate URL (URL not in href) */
      card.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        /* Use window.open directly — no <a href> to expose URL */
        const finalUrl = buildAffiliateUrl(video.affiliateUrl);
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      });

      /* Observe for autoplay */
      observeFaphouseCard(card);

      return card;
    }

    /* ====================================================================
       ORGANIC CARD (normal preview on hold)
       ==================================================================== */
    card.innerHTML =
      '<div class="video-thumb">' +
        '<img class="hd-thumb" src="' + initialThumb + '" alt="' + title + '" ' +
             'loading="lazy" decoding="async" draggable="false" ' +
             'onerror="this.src=\'/cumb.png\'">' +
        '<div class="preview-video-holder"></div>' +
        '<div class="preview-timeline"><div class="preview-timeline-fill"></div></div>' +
        '<div class="preview-loading"></div>' +
        '<span class="duration-badge">' + duration + '</span>' +
      '</div>' +
      '<div class="video-info">' +
        '<div class="video-title">' + title + '</div>' +
        '<div class="video-meta-row">' +
          '<span class="provider-tag">' + category + '</span>' +
          '<span>•</span>' +
          '<span>' + views + ' views</span>' +
        '</div>' +
      '</div>';

    function handleOpen() {
      if (typeof onOpen === 'function') onOpen();
    }

    if (typeof window.attachHoldAndSlidePreview === 'function') {
      window.attachHoldAndSlidePreview(card, video, handleOpen);
    } else {
      card.addEventListener('click', handleOpen);
    }

    return card;
  };

  /* ==========================================================================
     PREFETCH
     ========================================================================== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { fetchLiveFeed(); });
  } else {
    fetchLiveFeed();
  }
})();
