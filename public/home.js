/**
 * ==========================================================================
 * CUMBEAR — HOME CONTROLLER
 * --------------------------------------------------------------------------
 * Fetches videos + categories, renders the grid with FapHouse injection,
 * wires pagination, category chips, and sort dropdown.
 *
 * Uses:
 *   - window.mixAffiliateVideos(videos)       (faphouse.js)
 *   - window.renderMixedVideoCard(video)      (faphouse.js → attach-preview.js)
 *   - window.CumBearAds.refreshBanners()      (ads.js)
 *
 * Exposes:
 *   window.resetHomeState()      → reset filters + reload
 *   window.setCategoryFilter(c)  → set category programmatically
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearHomeLoaded) return;
  window.__cumbearHomeLoaded = true;

  const CFG = window.CUMBEAR;
  if (!CFG) {
    console.warn('[CumBearHome] config.js not loaded — aborting');
    return;
  }

  /* ---------- state ---------- */
  let currentPage     = 1;
  let currentCategory = 'all';
  let currentSort     = 'gem';
  let activeFetchId   = 0;   /* guards against race between rapid page switches */

  const CATEGORY_CACHE_KEY = 'cumbear_categories_v1';
  const CATEGORY_CACHE_MS  = 5 * 60 * 1000;   /* 5 min */

  const DEFAULT_CATEGORIES = [
    'all', 'Teen', 'MILF', 'Japanese', 'Anal', 'Amateur',
    'Blowjob', 'Big Tits', 'Ebony', 'Latina', 'Hardcore',
    'POV', 'Lesbian', 'Threesome', 'Vintage', 'BDSM',
    'Masturbation', 'Creampie', 'Interracial', 'Hentai', 'Compilation'
  ];

  /* ---------- deterministic pseudo-random (stable stats per card) ---------- */
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function stableViews(id) {
    const n = 10000 + (hashString(String(id) + 'v') % 9990000);
    return n;
  }

  function stableLikeRate(id) {
    return 55 + (hashString(String(id) + 'l') % 44);
  }

  function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- categories cache ---------- */
  function readCategoryCache() {
    try {
      const raw = localStorage.getItem(CATEGORY_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== 'number' || !Array.isArray(parsed.list)) return null;
      if (Date.now() - parsed.ts > CATEGORY_CACHE_MS) return null;
      return parsed.list;
    } catch (e) { return null; }
  }

  function writeCategoryCache(list) {
    try {
      localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify({ ts: Date.now(), list: list }));
    } catch (e) { /* ignore */ }
  }

  /* ---------- category chips ---------- */
  function renderCategoryChips(list) {
    const bar = document.getElementById('globalHorizontalCats');
    if (!bar) return;

    /* Preserve the "All" chip; rebuild the rest */
    const wasScrolled = bar.scrollLeft;
    bar.innerHTML = '';

    list.forEach(function (item) {
      /* New backend shape: { _id, label, count } */
      /* Old shape (fallback): plain string or { _id } */
      let filterValue, displayLabel;
      if (typeof item === 'object' && item) {
        filterValue = item._id;
        displayLabel = item.label || item._id;
      } else {
        filterValue = item;
        displayLabel = item;
      }
      if (!filterValue || String(filterValue).trim() === '') return;

      const btn = document.createElement('button');
      btn.className = 'h-cat-chip' +
        (String(filterValue).toLowerCase() === currentCategory.toLowerCase() ? ' active' : '');
      btn.type = 'button';
      btn.textContent = (String(filterValue).toLowerCase() === 'all')
        ? 'All'
        : displayLabel;

      btn.addEventListener('click', function () {
        if (currentCategory === String(filterValue).toLowerCase()) return;
        bar.querySelectorAll('.h-cat-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentCategory = String(filterValue).toLowerCase();
        currentPage = 1;
        loadVideos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      bar.appendChild(btn);
    });

    /* Restore horizontal scroll position */
    bar.scrollLeft = wasScrolled;
  }

  /* ---------- bottom "Explore Categories" grid ---------- */
  function renderImageCategories() {
    const grid = document.getElementById('imageCategoriesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const showcase = DEFAULT_CATEGORIES.filter(function (c) { return c !== 'all'; });

    for (let i = 1; i <= 20; i++) {
      const name = showcase[i - 1] || ('Category ' + i);
      const card = document.createElement('div');
      card.className = 'image-cat-card';
      card.innerHTML =
        '<img src="/categories/' + i + '.jpg" alt="' + escapeHtml(name) + '" ' +
             'loading="lazy" decoding="async" ' +
             'onerror="this.src=\'/cumb.png\'">' +
        '<div class="image-cat-overlay">' +
          '<span class="image-cat-title">' + escapeHtml(name) + '</span>' +
        '</div>';

      card.addEventListener('click', function () {
        currentCategory = name.toLowerCase();
        currentPage = 1;
        renderCategoryChips(DEFAULT_CATEGORIES);
        loadVideos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      grid.appendChild(card);
    }
  }

  /* ---------- video fetch + render ---------- */
  function loadVideos() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;

    /* Race guard */
    activeFetchId++;
    const myFetchId = activeFetchId;

    grid.innerHTML =
      '<div class="grid-status">Loading videos…</div>';

    const params = {
      page: currentPage,
      limit: 50,
      sort: currentSort,
      _: Date.now()
    };
    if (currentCategory && currentCategory !== 'all') {
      params.category = currentCategory;
    }

    const url = CFG.helpers.videoListUrl(params);

    fetch(url, { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (myFetchId !== activeFetchId) return;   /* a newer fetch superseded us */
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          renderVideoGrid(json.data);
          renderPagination(json.pagination ? json.pagination.totalPages : 10);
        } else {
          grid.innerHTML =
            '<div class="grid-empty">' +
              '<p>No videos found in this category.</p>' +
              '<button id="resetFiltersBtn" class="page-btn" style="margin-top:12px;">Show all videos</button>' +
            '</div>';
          const resetBtn = document.getElementById('resetFiltersBtn');
          if (resetBtn) {
            resetBtn.addEventListener('click', function () { window.resetHomeState(); });
          }
          renderPagination(0);
        }
      })
      .catch(function (err) {
        if (myFetchId !== activeFetchId) return;
        console.error('[CumBearHome] loadVideos error:', err);
        grid.innerHTML =
          '<div class="grid-empty">' +
            '<p>Could not load videos right now. Please check your connection.</p>' +
            '<button id="retryLoadBtn" class="page-btn" style="margin-top:12px;">Retry</button>' +
          '</div>';
        const retryBtn = document.getElementById('retryLoadBtn');
        if (retryBtn) retryBtn.addEventListener('click', loadVideos);
      });
  }

  function renderVideoGrid(videos) {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;
    grid.innerHTML = '';

    /* Mix in FapHouse affiliate cards every 5 videos */
    const mixed = (typeof window.mixAffiliateVideos === 'function')
      ? window.mixAffiliateVideos(videos)
      : videos;

    mixed.forEach(function (video) {
      /* Use the shared renderer if available (handles affiliate + organic) */
      if (typeof window.renderMixedVideoCard === 'function') {
        const card = window.renderMixedVideoCard(video, function () {
          openPlayer(video._id);
        });
        grid.appendChild(card);
        return;
      }

      /* Fallback: build card manually if faphouse.js failed to load */
      const card = document.createElement('div');
      card.className = 'video-card';

      const duration = (video.duration || '00:00').replace(/^HD\s*/i, '');
      const views = formatCount(stableViews(video._id));
      const likeRate = stableLikeRate(video._id);
      const safeTitle = escapeHtml(video.title || 'Untitled Video');

      card.innerHTML =
        '<div class="video-thumb">' +
          '<img class="hd-thumb" src="' + (video.thumbnailUrl || '/cumb.png') + '" ' +
               'alt="' + safeTitle + '" loading="lazy" decoding="async" draggable="false" ' +
               'onerror="this.src=\'/cumb.png\'">' +
          '<div class="preview-video-holder"></div>' +
          '<div class="preview-timeline"><div class="preview-timeline-fill"></div></div>' +
          '<div class="preview-loading"><div class="preview-spinner"></div></div>' +
          '<span class="duration-badge">' + duration + '</span>' +
        '</div>' +
        '<div class="video-info">' +
          '<div class="video-title">' + safeTitle + '</div>' +
          '<div class="video-meta-row">' +
            '<span class="provider-tag">' + escapeHtml(video.category || 'CumBear') + '</span>' +
            '<span>•</span><span>' + views + ' views</span>' +
            '<span>•</span><span>' + likeRate + '%</span>' +
          '</div>' +
        '</div>';

      if (typeof window.attachHoldAndSlidePreview === 'function') {
        window.attachHoldAndSlidePreview(card, video, function () { openPlayer(video._id); });
      } else {
        card.addEventListener('click', function () { openPlayer(video._id); });
      }

      grid.appendChild(card);
    });

    /* Tell ads.js to (re)serve banners for the newly rendered zone tags */
    if (window.CumBearAds && typeof window.CumBearAds.refreshBanners === 'function') {
      try { window.CumBearAds.refreshBanners(); } catch (e) { /* ignore */ }
    }
  }

  function openPlayer(videoId) {
    if (!videoId) return;
    if (window.switchView) window.switchView('playerView', true);
    if (typeof window.loadPlayerVideoById === 'function') {
      window.loadPlayerVideoById(videoId);
    }
  }

  /* ---------- pagination ---------- */
  function renderPagination(totalPages) {
    const wrapper = document.getElementById('paginationWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    totalPages = Math.max(0, parseInt(totalPages, 10) || 0);
    if (totalPages <= 1) return;

    const maxPages = Math.min(totalPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      btn.addEventListener('click', function () {
        if (currentPage === i) return;
        currentPage = i;
        loadVideos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      wrapper.appendChild(btn);
    }
  }

  /* ---------- sort dropdown ---------- */
  function wireSortDropdown() {
    const filterBtn   = document.getElementById('filterDropdownBtn');
    const filterMenu  = document.getElementById('filterMenu');
    const sortLabel   = document.getElementById('currentSortLabel');
    if (!filterBtn || !filterMenu) return;

    filterBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
    });

    filterMenu.querySelectorAll('.filter-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        filterMenu.querySelectorAll('.filter-option').forEach(function (o) {
          o.classList.remove('active');
        });
        opt.classList.add('active');
        currentSort = opt.getAttribute('data-sort') || 'gem';
        if (sortLabel) sortLabel.textContent = opt.textContent.trim();
        filterMenu.classList.remove('show');
        currentPage = 1;
        loadVideos();
      });
    });

    document.addEventListener('click', function () { filterMenu.classList.remove('show'); });
  }

  /* ---------- public API ---------- */
  window.resetHomeState = function () {
    currentCategory = 'all';
    currentPage = 1;
    currentSort = 'gem';
    const sortLabel = document.getElementById('currentSortLabel');
    if (sortLabel) sortLabel.textContent = 'Popularity';
    document.querySelectorAll('.filter-option').forEach(function (o) {
      o.classList.toggle('active', o.getAttribute('data-sort') === 'gem');
    });
    renderCategoryChips(DEFAULT_CATEGORIES);
    loadVideos();
  };

  window.setCategoryFilter = function (category) {
    if (!category) return;
    currentCategory = String(category).toLowerCase();
    currentPage = 1;
    loadVideos();
  };

  /* ---------- init ---------- */
  function initCategories() {
    /* 1. Immediate render — no layout jump */
    renderCategoryChips(DEFAULT_CATEGORIES);

    /* 2. Try cache first */
    const cached = readCategoryCache();
    if (cached && cached.length > 0) {
      renderCategoryChips(cached);
      return;
    }

    /* 3. Live fetch (won't block initial render) */
    fetch(CFG.helpers.categoriesUrl(), { credentials: 'omit' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (json) {
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          writeCategoryCache(json.data);
          renderCategoryChips(json.data);
        }
      })
      .catch(function (err) {
        console.warn('[CumBearHome] category fetch failed, using defaults:', err.message);
      });
  }

  function init() {
    renderImageCategories();
    initCategories();
    wireSortDropdown();
    loadVideos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
