/**
 * ==========================================================================
 * CUMBEAR — HOME CONTROLLER (v2, fragment-optimized)
 * --------------------------------------------------------------------------
 * Thin controller: fetch → mix with FapHouse → append to grid.
 * All card rendering and preview attachment delegated to faphouse.js.
 *
 * Perf:
 *   - Single DocumentFragment append (one reflow, not 50)
 *   - Cached stable views/likes per _id
 *   - Race guard for rapid category switches
 *   - Category list cached in localStorage for 5 minutes
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
  let activeFetchId   = 0;

  /* Perf: cache stable stats per _id */
  const viewsCache = new Map();
  const likesCache = new Map();

  const CATEGORY_CACHE_KEY = 'cumbear_categories_v2';
  const CATEGORY_CACHE_MS  = 5 * 60 * 1000;

  const DEFAULT_CATEGORIES = [
    { _id: 'all', label: 'All' },
    { _id: 'teen', label: 'Teen' },
    { _id: 'milf', label: 'MILF' },
    { _id: 'japanese', label: 'Japanese' },
    { _id: 'anal', label: 'Anal' },
    { _id: 'amateur', label: 'Amateur' },
    { _id: 'blowjob', label: 'Blowjob' },
    { _id: 'big-tits', label: 'Big Tits' },
    { _id: 'ebony', label: 'Ebony' },
    { _id: 'latina', label: 'Latina' },
    { _id: 'hardcore', label: 'Hardcore' },
    { _id: 'pov', label: 'POV' },
    { _id: 'lesbian', label: 'Lesbian' },
    { _id: 'threesome', label: 'Threesome' },
    { _id: 'vintage', label: 'Vintage' },
    { _id: 'bdsm', label: 'BDSM' },
    { _id: 'masturbation', label: 'Masturbation' },
    { _id: 'creampie', label: 'Creampie' },
    { _id: 'interracial', label: 'Interracial' },
    { _id: 'hentai', label: 'Hentai' },
    { _id: 'compilation', label: 'Compilation' }
  ];

  /* ---------- utils ---------- */
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function stableViews(id) {
    let v = viewsCache.get(id);
    if (v === undefined) {
      v = 10000 + (hashString(String(id) + 'v') % 9990000);
      viewsCache.set(id, v);
    }
    return v;
  }

  function stableLikeRate(id) {
    let l = likesCache.get(id);
    if (l === undefined) {
      l = 55 + (hashString(String(id) + 'l') % 44);
      likesCache.set(id, l);
    }
    return l;
  }

  function formatCount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- category cache ---------- */
  function readCategoryCache() {
    try {
      const raw = localStorage.getItem(CATEGORY_CACHE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || typeof p.ts !== 'number' || !Array.isArray(p.list)) return null;
      if (Date.now() - p.ts > CATEGORY_CACHE_MS) return null;
      return p.list;
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

    bar.innerHTML = '';
    const frag = document.createDocumentFragment();

    list.forEach(function (item) {
      let value, label;
      if (typeof item === 'object' && item) {
        value = item._id;
        label = item.label || item._id;
      } else {
        value = item;
        label = item;
      }
      if (!value) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'h-cat-chip' +
        (String(value).toLowerCase() === currentCategory.toLowerCase() ? ' active' : '');
      btn.textContent = (String(value).toLowerCase() === 'all') ? 'All' : label;

      btn.addEventListener('click', function () {
        if (currentCategory === String(value).toLowerCase()) return;
        bar.querySelectorAll('.h-cat-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentCategory = String(value).toLowerCase();
        currentPage = 1;
        loadVideos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      frag.appendChild(btn);
    });

    bar.appendChild(frag);
  }

  /* ---------- bottom category tiles ---------- */
  function renderImageCategories() {
    const grid = document.getElementById('imageCategoriesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    const showcase = DEFAULT_CATEGORIES.filter(function (c) { return c._id !== 'all'; });

    for (let i = 1; i <= 20; i++) {
      const cat = showcase[i - 1] || { _id: 'category-' + i, label: 'Category ' + i };
      const card = document.createElement('div');
      card.className = 'image-cat-card';
      card.innerHTML =
        '<img src="/categories/' + i + '.jpg" alt="' + escapeHtml(cat.label) + '" ' +
             'loading="lazy" decoding="async" ' +
             'onerror="this.src=\'/cumb.png\'">' +
        '<div class="image-cat-overlay">' +
          '<span class="image-cat-title">' + escapeHtml(cat.label) + '</span>' +
        '</div>';

      card.addEventListener('click', function () {
        currentCategory = cat._id;
        currentPage = 1;
        renderCategoryChips(DEFAULT_CATEGORIES);
        loadVideos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      frag.appendChild(card);
    }
    grid.appendChild(frag);
  }

  /* ---------- load videos ---------- */
  function loadVideos() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;

    activeFetchId++;
    const myId = activeFetchId;

    grid.innerHTML = '<div class="grid-status">Loading videos…</div>';

    const params = {
      page: currentPage,
      limit: 50,
      sort: currentSort,
      _: Date.now()
    };
    if (currentCategory && currentCategory !== 'all') {
      params.category = currentCategory;
    }

    fetch(CFG.helpers.videoListUrl(params), { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (myId !== activeFetchId) return;
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
          if (resetBtn) resetBtn.addEventListener('click', window.resetHomeState);
          renderPagination(0);
        }
      })
      .catch(function (err) {
        if (myId !== activeFetchId) return;
        console.error('[CumBearHome] loadVideos error:', err);
        grid.innerHTML =
          '<div class="grid-empty">' +
            '<p>Could not load videos. Check your connection.</p>' +
            '<button id="retryLoadBtn" class="page-btn" style="margin-top:12px;">Retry</button>' +
          '</div>';
        const retryBtn = document.getElementById('retryLoadBtn');
        if (retryBtn) retryBtn.addEventListener('click', loadVideos);
      });
  }

  /* ---------- render grid (fragment) ---------- */
  function renderVideoGrid(videos) {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;
    grid.innerHTML = '';

    /* Mix in FapHouse (every 5) */
    const mixed = (typeof window.mixAffiliateVideos === 'function')
      ? window.mixAffiliateVideos(videos)
      : videos;

    const frag = document.createDocumentFragment();
    const hasRenderer = typeof window.renderMixedVideoCard === 'function';

    mixed.forEach(function (video) {
      if (hasRenderer) {
        /* faphouse.js handles both organic + affiliate */
        const card = window.renderMixedVideoCard(video, function () {
          openPlayer(video._id);
        });
        /* Mark as e2e — CSS handles sizing */
        card.classList.add('e2e');
        frag.appendChild(card);
        return;
      }

      /* Emergency fallback (should never happen if faphouse.js is loaded) */
      const card = document.createElement('div');
      card.className = 'video-card e2e';
      const dur = (video.duration || '00:00').replace(/^HD\s*/i, '');
      const views = formatCount(stableViews(video._id));
      const likeRate = stableLikeRate(video._id);
      const safe = escapeHtml(video.title || 'Untitled');
      card.innerHTML =
        '<div class="video-thumb">' +
          '<img src="' + (video.thumbnailUrl || '/cumb.png') + '" alt="' + safe + '" loading="lazy" onerror="this.src=\'/cumb.png\'">' +
          '<div class="preview-video-holder"></div>' +
          '<div class="preview-timeline"><div class="preview-timeline-fill"></div></div>' +
          '<div class="preview-loading"></div>' +
          '<span class="duration-badge">' + dur + '</span>' +
        '</div>' +
        '<div class="video-info">' +
          '<div class="video-title">' + safe + '</div>' +
          '<div class="video-meta-row">' +
            '<span class="provider-tag">' + escapeHtml(video.category || 'CumBear') + '</span>' +
            '<span>•</span><span>' + views + ' views</span>' +
            '<span>•</span><span>' + likeRate + '%</span>' +
          '</div>' +
        '</div>';
      card.addEventListener('click', function () { openPlayer(video._id); });
      frag.appendChild(card);
    });

    /* Single reflow */
    grid.appendChild(frag);

    /* Serve banners once */
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

    const frag = document.createDocumentFragment();
    const max = Math.min(totalPages, 10);
    for (let i = 1; i <= max; i++) {
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
      frag.appendChild(btn);
    }
    wrapper.appendChild(frag);
  }

  /* ---------- sort dropdown ---------- */
  function wireSortDropdown() {
    const filterBtn  = document.getElementById('filterDropdownBtn');
    const filterMenu = document.getElementById('filterMenu');
    const sortLabel  = document.getElementById('currentSortLabel');
    if (!filterBtn || !filterMenu) return;

    filterBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
    });

    filterMenu.querySelectorAll('.filter-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        filterMenu.querySelectorAll('.filter-option').forEach(function (o) { o.classList.remove('active'); });
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

  window.setCategoryFilter = function (c) {
    if (!c) return;
    currentCategory = String(c).toLowerCase();
    currentPage = 1;
    loadVideos();
  };

  /* ---------- init categories ---------- */
  function initCategories() {
    renderCategoryChips(DEFAULT_CATEGORIES);

    const cached = readCategoryCache();
    if (cached && cached.length > 0) {
      renderCategoryChips(cached);
      return;
    }

    fetch(CFG.helpers.categoriesUrl(), { credentials: 'omit' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (json) {
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          writeCategoryCache(json.data);
          renderCategoryChips(json.data);
        }
      })
      .catch(function () { /* use defaults */ });
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
