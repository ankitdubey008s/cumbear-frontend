
node -c faphouse.js && echo "✅ Syntax OK"

grep -c "extractFrame" faphouse.js             # → 2+
grep -c "queueExtraction" faphouse.js          # → 2+
grep -c "crossOrigin = 'anonymous'" faphouse.js  # → 1
grep -c "THUMB_CACHE_KEY" faphouse.js          # → 2+
grep -c "MAX_CONCURRENT = 2" faphouse.js       # → 1
grep -c "fhgte.com\|fap.cash" faphouse.js      # → 2 (both strings)

git add faphouse.js home.css
git commit -m "FapHouse v4: canvas frame extraction from trailer (confirmed CDN CORS *), cached in localStorage"
git push/**
 * ==========================================================================
 * CUMBEAR — FAPHOUSE AFFILIATE INTEGRATION (v4)
 * --------------------------------------------------------------------------
 * Confirmed via live tests:
 *   - FapHouse CSV only has 5 columns: #URL|#TITLE|#CATEGORIES|#DURATION|#TRAILER
 *   - FapHouse thumbnail static URLs (thumb-ah.flixcdn.com/xc/XX/CODE/<size>/1.jpg) all 404
 *   - FapHouse trailer CDN sends `access-control-allow-origin: *` → canvas extraction works
 *
 * Solution: extract frame @ 0.5s from trailer via offscreen <video> + <canvas>.
 * Result is a data: URI, cached in localStorage per trailer URL.
 *
 * Behavior:
 *   - Card renders immediately with /cumb.png placeholder
 *   - Async canvas extraction swaps in real thumbnail ~200ms later
 *   - Subsequent renders use cached data URI (instant)
 *   - All clicks route to fhgte.com with utm_campaign=ai.vIZ (paying affiliate)
 *   - All cards use hold-to-preview v2 engine
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
     THUMBNAIL EXTRACTION — canvas from trailer
     ========================================================================== */
  const THUMB_CACHE_KEY = 'cumbear_fh_thumb_cache_v3';
  const THUMB_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; /* 7 days */

  function loadThumbCache() {
    try {
      const raw = localStorage.getItem(THUMB_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      /* Prune old entries */
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
    catch (e) {
      /* localStorage full — drop oldest half */
      try {
        const keys = Object.keys(map);
        if (keys.length > 20) {
          const trimmed = {};
          keys.slice(-20).forEach(function (k) { trimmed[k] = map[k]; });
          localStorage.setItem(THUMB_CACHE_KEY, JSON.stringify(trimmed));
        }
      } catch (err) { /* give up */ }
    }
  }

  let thumbCache = loadThumbCache();

  /* Extract frame @ 0.5s from trailer → data URI (JPEG ~75% quality) */
  function extractFrame(trailerUrl) {
    if (!trailerUrl) return Promise.resolve(PLACEHOLDER);

    /* Cached? */
    const cached = thumbCache[trailerUrl];
    if (cached && cached.url) {
      return Promise.resolve(cached.url);
    }

    return new Promise(function (resolve) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.preload = 'auto';
      video.src = trailerUrl;

      let resolved = false;
      const finish = function (url) {
        if (resolved) return;
        resolved = true;
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch (e) { /* ignore */ }
        thumbCache[trailerUrl] = { url: url, ts: Date.now() };
        saveThumbCache(thumbCache);
        resolve(url);
      };

      /* 4s hard timeout */
      const timer = setTimeout(function () { finish(PLACEHOLDER); }, 4000);

      video.addEventListener('error', function () {
        clearTimeout(timer);
        finish(PLACEHOLDER);
      }, { once: true });

      video.addEventListener('loadedmetadata', function () {
        /* Seek to 10% or 0.5s — avoids black frames at t=0 */
        const t = Math.min(0.5, (video.duration || 1) * 0.1);
        try { video.currentTime = t; }
        catch (e) { /* ignore */ }
      }, { once: true });

      video.addEventListener('seeked', function () {
        try {
          const canvas = document.createElement('canvas');
          canvas.width  = video.videoWidth  || 320;
          canvas.height = video.videoHeight || 180;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          clearTimeout(timer);
          finish(dataUrl);
        } catch (e) {
          clearTimeout(timer);
          finish(PLACEHOLDER);
        }
      }, { once: true });

      const p = video.play();
      if (p && typeof p.catch === 'function') {
        /* Autoplay blocked → load without playing, seeks still fire */
        p.catch(function () {
          try { video.load(); }
          catch (e) { clearTimeout(timer); finish(PLACEHOLDER); }
        });
      }
    });
  }

  /* Queue: max 2 concurrent extractions to not spam the CDN */
  const extractQueue = [];
  let activeExtractions = 0;
  const MAX_CONCURRENT = 2;

  function queueExtraction(trailerUrl) {
    return new Promise(function (resolve) {
      extractQueue.push({ url: trailerUrl, resolve: resolve });
      processQueue();
    });
  }

  function processQueue() {
    while (activeExtractions < MAX_CONCURRENT && extractQueue.length > 0) {
      const task = extractQueue.shift();
      activeExtractions++;
      extractFrame(task.url).then(function (url) {
        activeExtractions--;
        task.resolve(url);
        processQueue();
      }).catch(function () {
        activeExtractions--;
        task.resolve(PLACEHOLDER);
        processQueue();
      });
    }
  }

  /* ==========================================================================
     FEED NORMALIZATION
     ========================================================================== */
  function normalizeItem(item, index) {
    if (!item || typeof item !== 'object') return null;

    const affiliateUrl = item.affiliateUrl || item.url || item.link || '';
    const trailerUrl   = item.playableUrl || item.trailer || item.trailer_url || '';
    const thumbnailUrl = item.thumbnailUrl || item.thumb || item.thumbnail || '';

    if (!affiliateUrl) return null;
    /* Reject anything still pointing at fap.cash — that's the broken dashboard */
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
     PUBLIC API
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

  window.renderMixedVideoCard = function (video, onOpen) {
    if (!video) return document.createElement('div');

    const isAff   = !!video.isAffiliate;
    const card    = document.createElement('div');
    card.className = 'video-card' + (isAff ? ' affiliate-video-card' : '');
    if (isAff && video.affiliateUrl) card.dataset.affUrl = video.affiliateUrl;

    const duration  = (video.duration || '—').replace(/^HD\s*/i, '');
    const views     = video.views || '—';
    const title     = String(video.title || 'Featured')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const category  = video.category || (isAff ? 'FapHouse' : 'CumBear');

    /* Initial thumbnail = feed thumbnail if provided, else placeholder */
    const initialThumb = video.thumbnailUrl && video.thumbnailUrl.indexOf('http') === 0
      ? video.thumbnailUrl
      : PLACEHOLDER;

    card.innerHTML =
      '<div class="video-thumb">' +
        '<img class="hd-thumb" src="' + initialThumb + '" alt="' + title + '" ' +
             'loading="lazy" decoding="async" draggable="false" ' +
             'onerror="this.src=\'/cumb.png\'">' +
        '<div class="preview-video-holder"></div>' +
        '<div class="preview-timeline"><div class="preview-timeline-fill"></div></div>' +
        '<div class="preview-loading"></div>' +
        '<span class="duration-badge">' + duration + '</span>' +
        (isAff ? '<span class="faphouse-sponsored-badge">SPONSORED</span>' : '') +
      '</div>' +
      '<div class="video-info">' +
        '<div class="video-title">' + title + '</div>' +
        '<div class="video-meta-row">' +
          '<span class="provider-tag' + (isAff ? ' faphouse-tag' : '') + '">' + category + '</span>' +
          '<span>•</span>' +
          '<span>' + views + ' views</span>' +
        '</div>' +
      '</div>';

    /* Async canvas extraction for affiliate cards with trailer but no thumbnail */
    if (isAff && video.playableUrl && !video.thumbnailUrl) {
      const img = card.querySelector('.hd-thumb');
      /* Update the video object so preview also uses it (harmless) */
      queueExtraction(video.playableUrl).then(function (url) {
        if (url && url !== PLACEHOLDER && img) {
          img.src = url;
          video.thumbnailUrl = url;
        }
      });
    }

    function handleOpen() {
      if (isAff && video.affiliateUrl) {
        window.open(buildAffiliateUrl(video.affiliateUrl), '_blank', 'noopener,noreferrer');
      } else if (typeof onOpen === 'function') {
        onOpen();
      }
    }

    if (typeof window.attachHoldAndSlidePreview === 'function') {
      window.attachHoldAndSlidePreview(card, video, handleOpen);
    } else {
      card.addEventListener('click', handleOpen);
    }

    return card;
  };

  /* Prefetch feed on load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { fetchLiveFeed(); });
  } else {
    fetchLiveFeed();
  }
})();
