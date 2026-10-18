/**
 * ==========================================================================
 * CUMBEAR — FAPHOUSE IN-FEED AFFILIATE INTEGRATION
 * --------------------------------------------------------------------------
 * Interleaves 1 FapHouse card after every N organic videos (N = 5).
 *
 * Feeds:
 *   - Live FapHouse JSON dump (from CONFIG.faphouse.feedUrl), 10-min memory cache.
 *   - Offline fallback pool (only used if the live feed is unreachable).
 *
 * Public API (used by home.js / search.js / player.js):
 *   window.mixAffiliateVideos(videosArray)         → array with affiliate items spliced in
 *   window.renderMixedVideoCard(video, onOpen)     → <div> card element
 *
 * Each affiliate card:
 *   - has data-aff-url (real FapHouse affiliate link with ai=vIZ)
 *   - opens in a NEW TAB when clicked (never navigates the current page)
 *   - supports hold-to-preview using the FapHouse trailer
 *   - is labelled SPONSORED / PREMIUM so users know
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

  /* Route FapHouse feed through our Vercel backend proxy to avoid the
     browser CORS block on fap.cash. The backend already handles
     timeouts, caching, and field normalization. */
  const FEED_URL        = CFG.helpers.faphouseFeedApiUrl();
  const AFFILIATE_ID    = CFG.faphouse.affiliateId;
  const LANDER_URL      = CFG.faphouse.landerUrl;
  const INJECT_EVERY    = CFG.faphouse.injectEvery || 5;
  const FEED_CACHE_MS   = CFG.faphouse.feedCacheMs || 10 * 60 * 1000;

  /* ---------- runtime state ---------- */
  let livePool = [];            /* items from live feed */
  let livePoolFetchedAt = 0;
  let feedFetchPromise = null;
  let poolCursor = 0;           /* rotates across calls */
  const usedIds = new Set();    /* prevents same item twice on one page render cycle */

  /* ---------- offline fallback pool ----------
     These are ONLY shown if the live feed cannot be reached.
     Placeholders are deliberately neutral — we don't fabricate porn metadata.
  */
  const FALLBACK_POOL = [
    {
      _id: 'fh_fallback_1',
      title: 'Exclusive FapHouse Premium Scene — Watch Free Preview',
      thumbnailUrl: '/cumb.png',
      playableUrl: '',
      affiliateUrl: 'https://fap.cash/content/dump?ai=' + AFFILIATE_ID + '&forient=straight&fowner=all',
      duration: '—',
      category: 'FapHouse',
      views: '—',
      isAffiliate: true
    }
  ];

  /* ---------- helpers ---------- */
  function safeInt(v, fallback) {
    const n = parseInt(v, 10);
    return isNaN(n) ? fallback : n;
  }

  function formatDurationSeconds(sec) {
    sec = safeInt(sec, 0);
    if (sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function normalizeItem(item, index) {
    /* FapHouse live feed field naming varies slightly between dumps.
       Accept all variants without crashing. */
    if (!item || typeof item !== 'object') return null;

    const thumbs = item.thumbs || item.thumb || item.thumbnail || item.preview_url || '';
    const thumbnailUrl = Array.isArray(thumbs) ? thumbs[0] : thumbs;
    const affiliateUrl = item.url || item.link || item.affiliate_link || '';
    const playableUrl  = item.trailer || item.trailer_url || '';

    if (!thumbnailUrl || !affiliateUrl) return null;

    const title = (item.title || item.name || 'FapHouse Exclusive').toString().slice(0, 140);
    const cats  = item.cats || item.category || 'FapHouse';
    const category = Array.isArray(cats) ? (cats[0] || 'FapHouse') : cats;

    return {
      _id: 'fh_' + (item.id || item.video_id || index || Math.random().toString(36).slice(2, 9)),
      title: title,
      thumbnailUrl: thumbnailUrl,
      playableUrl: playableUrl,
      affiliateUrl: affiliateUrl,
      duration: item.duration ? formatDurationSeconds(item.duration) : (item.dur || '—'),
      category: category,
      views: item.views ? String(item.views) : '—',
      isAffiliate: true
    };
  }

  /* ---------- live feed fetch (cached, deduped) ---------- */
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
        const normalized = items
          .map(normalizeItem)
          .filter(Boolean);
        if (normalized.length > 0) {
          livePool = normalized;
          livePoolFetchedAt = Date.now();
        }
        return livePool;
      })
      .catch(function (err) {
        console.warn('[CumBearFapHouse] live feed unavailable, using fallback:', err.message);
        return livePool; /* keep previous cache or empty */
      })
      .finally(function () {
        feedFetchPromise = null;
      });

    return feedFetchPromise;
  }

  /* ---------- pool picker ---------- */
  function pickNextAffiliate() {
    const pool = livePool.length > 0 ? livePool : FALLBACK_POOL;
    if (!pool.length) return null;

    /* Skip items already used in this page render cycle */
    for (let attempts = 0; attempts < pool.length; attempts++) {
      const item = pool[poolCursor % pool.length];
      poolCursor++;
      if (!usedIds.has(item._id)) {
        usedIds.add(item._id);
        return item;
      }
    }
    /* All used — reset and reuse the first */
    usedIds.clear();
    return pool[0];
  }

  /* ---------- public: interleave ---------- */
  window.mixAffiliateVideos = function (standardVideos) {
    if (!Array.isArray(standardVideos) || standardVideos.length === 0) {
      return standardVideos || [];
    }

    const mixed = [];
    let injected = 0;

    for (let i = 0; i < standardVideos.length; i++) {
      mixed.push(standardVideos[i]);

      /* Inject after item #5, #10, #15, … (i.e. when (i+1) % 5 === 0) */
      if ((i + 1) % INJECT_EVERY === 0) {
        const aff = pickNextAffiliate();
        if (aff) {
          mixed.push(aff);
          injected++;
        }
      }
    }

    return mixed;
  };

  /* ---------- public: render one card ---------- */
  window.renderMixedVideoCard = function (video, onOpen) {
    if (!video) return document.createElement('div');

    const card = document.createElement('div');
    card.className = 'video-card' + (video.isAffiliate ? ' affiliate-video-card' : '');
    if (video.isAffiliate && video.affiliateUrl) {
      card.dataset.affUrl = video.affiliateUrl;
    }

    const duration = (video.duration || '—').replace(/^HD\s*/i, '');
    const views    = video.views || '—';
    const safeTitle = String(video.title || 'Featured')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const categoryTag = video.category || (video.isAffiliate ? 'FapHouse' : 'CumBear');

    const sponsoredBadge = video.isAffiliate
      ? '<span class="faphouse-sponsored-badge">SPONSORED</span>'
      : '';

    card.innerHTML =
      '<div class="video-thumb">' +
        '<img class="hd-thumb" src="' + (video.thumbnailUrl || '/cumb.png') + '" ' +
             'alt="' + safeTitle + '" loading="lazy" decoding="async" draggable="false" ' +
             'onerror="this.src=\'/cumb.png\'">' +
        '<div class="preview-video-holder"></div>' +
        '<div class="preview-timeline"><div class="preview-timeline-fill"></div></div>' +
        '<div class="preview-loading"><div class="preview-spinner"></div></div>' +
        '<span class="duration-badge">' + duration + '</span>' +
        sponsoredBadge +
      '</div>' +
      '<div class="video-info">' +
        '<div class="video-title">' + safeTitle + '</div>' +
        '<div class="video-meta-row">' +
          '<span class="provider-tag ' + (video.isAffiliate ? 'faphouse-tag' : '') + '">' + categoryTag + '</span>' +
          '<span>•</span>' +
          '<span>' + views + ' views</span>' +
        '</div>' +
      '</div>';

    /* ---------- click / open handler ---------- */
    function buildAffiliateUrl(rawUrl) {
      if (!rawUrl) return LANDER_URL;
      try {
        const u = new URL(rawUrl, window.location.origin);
        /* FapHouse affiliate tracking uses utm_campaign=ai.<id>, NOT ai=<id> */
        if (!u.searchParams.has('utm_campaign') && AFFILIATE_ID) {
          u.searchParams.set('utm_campaign', 'ai.' + AFFILIATE_ID);
        }
        return u.toString();
      } catch (e) {
        /* Fallback: crude string append */
        if (rawUrl.indexOf('utm_campaign=') === -1 && AFFILIATE_ID) {
          return rawUrl + (rawUrl.indexOf('?') === -1 ? '?' : '&') +
                 'utm_campaign=ai.' + AFFILIATE_ID;
        }
        return rawUrl;
      }
    }

    function handleOpen() {
      if (video.isAffiliate && video.affiliateUrl) {
        const finalUrl = buildAffiliateUrl(video.affiliateUrl);
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      } else if (typeof onOpen === 'function') {
        onOpen();
      }
    }

    /* Use the shared hold-to-preview engine if available */
    if (typeof window.attachHoldAndSlidePreview === 'function') {
      window.attachHoldAndSlidePreview(card, video, handleOpen);
    } else {
      /* Fallback: plain click only (safe if attach-preview.js not yet loaded) */
      card.addEventListener('click', handleOpen);
    }

    return card;
  };

  /* ---------- prefetch live feed early ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { fetchLiveFeed(); });
  } else {
    fetchLiveFeed();
  }
})();
