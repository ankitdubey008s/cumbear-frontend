/**
 * ==========================================================================
 * CUMBEAR — SEARCH & CATEGORIES CONTROLLER
 * --------------------------------------------------------------------------
 * Handles the Search/Categories view:
 *   - Categories hub (image grid)
 *   - Search results grid with FapHouse injection
 *   - Live search-as-you-type (debounced)
 *   - State preservation via sessionStorage
 *
 * Uses:
 *   - window.attachHoldAndSlidePreview  (attach-preview.js)
 *   - window.mixAffiliateVideos         (faphouse.js)
 *   - window.renderMixedVideoCard       (faphouse.js)
 *   - window.CumBearAds.refreshBanners  (ads.js)
 *
 * Exposes:
 *   window.performSearch(term, page)  → programmatic search
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearSearchLoaded) return;
  window.__cumbearSearchLoaded = true;

  const CFG = window.CUMBEAR;
  if (!CFG) {
    console.warn('[CumBearSearch] config.js not loaded — aborting');
    return;
  }

  const SESSION_KEY = 'cumbear_search_state_v1';
  const DEBOUNCE_MS = 300;

  const FALLBACK_CATEGORIES = [
    'Teen', 'MILF', 'Japanese', 'Anal', 'Amateur',
    'Blowjob', 'Big Tits', 'Ebony', 'Latina', 'Hardcore',
    'POV', 'Lesbian', 'Threesome', 'Vintage', 'BDSM',
    'Masturbation', 'Creampie', 'Interracial', 'Hentai', 'Compilation'
  ];

  let searchPage   = 1;
  let activeSearchTerm = '';
  let activeFetchId = 0;
  let searchInFlight = false;
  let debounceTimer = null;
  let hubInitialized = false;

  /* ---------- utils ---------- */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function stableViews(id) { return 10000 + (hashString(String(id) + 'v') % 9990000); }
  function stableLikeRate(id) { return 55 + (hashString(String(id) + 'l') % 44); }

  function formatCount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  /* ---------- state persistence ---------- */
  function saveState() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        term: activeSearchTerm,
        page: searchPage,
        ts: Date.now()
      }));
    } catch (e) { /* ignore */ }
  }

  function readState() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.term !== 'string') return null;
      /* Ignore states older than 30 minutes */
      if (parsed.ts && Date.now() - parsed.ts > 30 * 60 * 1000) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function clearState() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  /* ---------- categories hub ---------- */
  function initCategoriesHub() {
    if (hubInitialized) return;
    const hubGrid = document.getElementById('searchCategoriesGrid');
    if (!hubGrid) return;

    hubGrid.innerHTML = '';

    FALLBACK_CATEGORIES.forEach(function (catName, idx) {
      const imgIdx = idx + 1;
      const card = document.createElement('div');
      card.className = 'image-cat-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', 'Search ' + catName + ' videos');
      card.innerHTML =
        '<img src="/categories/' + imgIdx + '.jpg" alt="' + escapeHtml(catName) + '" ' +
             'loading="lazy" decoding="async" onerror="this.src=\'/cumb.png\'">' +
        '<div class="image-cat-overlay">' +
          '<span class="image-cat-title">' + escapeHtml(catName) + '</span>' +
        '</div>';

      const activate = function () { executeSearch(catName, 1); };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });

      hubGrid.appendChild(card);
    });

    hubInitialized = true;
  }

  /* ---------- main search ---------- */
  function executeSearch(term, page) {
    term = (term || '').trim();
    if (!term) return;
    if (searchInFlight) return;

    activeSearchTerm = term;
    searchPage = page || 1;

    const hub       = document.getElementById('searchCategoriesHub');
    const results   = document.getElementById('searchResultsSection');
    const title     = document.getElementById('searchResultTitle');
    const grid      = document.getElementById('searchVideoGrid');
    const input     = document.getElementById('searchInput');
    const clearBtn  = document.getElementById('clearSearchBtn');

    if (input)     input.value = activeSearchTerm;
    if (clearBtn)  clearBtn.classList.remove('hidden');
    if (hub)       hub.classList.add('hidden');
    if (results)   results.classList.remove('hidden');
    if (title)     title.textContent = 'Results for: "' + activeSearchTerm + '"';

    if (grid) {
      grid.innerHTML =
        '<div class="grid-status">Searching…</div>';
    }

    saveState();

    activeFetchId++;
    const myId = activeFetchId;
    searchInFlight = true;

    const url = CFG.helpers.videoListUrl({
      page: searchPage,
      limit: 50,
      search: activeSearchTerm,
      _: Date.now()
    });

    fetch(url, { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (myId !== activeFetchId) return;
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          renderResults(json.data);
          renderPagination(json.pagination ? json.pagination.totalPages : 1);
        } else {
          if (grid) {
            grid.innerHTML =
              '<div class="grid-empty">' +
                '<p>No results for "' + escapeHtml(activeSearchTerm) + '".</p>' +
                '<button id="searchResetBtn" class="page-btn" style="margin-top:12px;">Back to categories</button>' +
              '</div>';
            const btn = document.getElementById('searchResetBtn');
            if (btn) btn.addEventListener('click', backToHub);
          }
          renderPagination(0);
        }
      })
      .catch(function (err) {
        if (myId !== activeFetchId) return;
        console.error('[CumBearSearch] error:', err);
        if (grid) {
          grid.innerHTML =
            '<div class="grid-empty">' +
              '<p>Search failed. Please check your connection.</p>' +
              '<button id="searchRetryBtn" class="page-btn" style="margin-top:12px;">Retry</button>' +
            '</div>';
          const btn = document.getElementById('searchRetryBtn');
          if (btn) btn.addEventListener('click', function () {
            executeSearch(activeSearchTerm, searchPage);
          });
        }
      })
      .finally(function () {
        if (myId === activeFetchId) searchInFlight = false;
      });
  }

  /* ---------- render ---------- */
  function renderResults(videos) {
    const grid = document.getElementById('searchVideoGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const mixed = (typeof window.mixAffiliateVideos === 'function')
      ? window.mixAffiliateVideos(videos)
      : videos;

    mixed.forEach(function (video) {
      if (typeof window.renderMixedVideoCard === 'function') {
        const card = window.renderMixedVideoCard(video, function () {
          openPlayer(video._id);
        });
        grid.appendChild(card);
        return;
      }

      /* Fallback renderer (rare) */
      const card = document.createElement('div');
      card.className = 'video-card';

      const duration = (video.duration || '00:00').replace(/^HD\s*/i, '');
      const views = formatCount(stableViews(video._id));
      const likeRate = stableLikeRate(video._id);
      const safeTitle = escapeHtml(video.title || 'Untitled');

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
        window.attachHoldAndSlidePreview(card, video, function () {
          openPlayer(video._id);
        });
      } else {
        card.addEventListener('click', function () { openPlayer(video._id); });
      }

      grid.appendChild(card);
    });

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
    const wrapper = document.getElementById('searchPaginationWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    totalPages = Math.max(0, parseInt(totalPages, 10) || 0);
    if (totalPages <= 1) return;

    const maxPages = Math.min(totalPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-btn' + (i === searchPage ? ' active' : '');
      btn.textContent = i;
      btn.addEventListener('click', function () {
        if (searchPage === i) return;
        executeSearch(activeSearchTerm, i);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      wrapper.appendChild(btn);
    }
  }

  /* ---------- back to hub ---------- */
  function backToHub() {
    const hub     = document.getElementById('searchCategoriesHub');
    const results = document.getElementById('searchResultsSection');
    const input   = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (results) results.classList.add('hidden');
    if (hub)     hub.classList.remove('hidden');
    if (input)   input.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    activeSearchTerm = '';
    searchPage = 1;
    clearState();
  }

  /* ---------- wiring ---------- */
  function wireInput() {
    const input     = document.getElementById('searchInput');
    const submitBtn = document.getElementById('searchSubmitBtn');
    const clearBtn  = document.getElementById('clearSearchBtn');
    const backBtn   = document.getElementById('backToHubBtn');

    if (input) {
      input.addEventListener('input', function () {
        if (clearBtn) {
          clearBtn.classList.toggle('hidden', !input.value.trim());
        }
        if (debounceTimer) clearTimeout(debounceTimer);
        const val = input.value.trim();
        if (val.length < 2) return;   /* don't fire on 1-char */
        debounceTimer = setTimeout(function () {
          executeSearch(val, 1);
        }, DEBOUNCE_MS);
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
          executeSearch(input.value, 1);
        }
      });
    }

    if (submitBtn && input) {
      submitBtn.addEventListener('click', function () {
        if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
        executeSearch(input.value, 1);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', backToHub);
    }

    if (backBtn) {
      backBtn.addEventListener('click', backToHub);
    }
  }

  /* ---------- restore on return ---------- */
  function restoreIfNeeded() {
    const state = readState();
    if (!state || !state.term) return;
    /* Only restore if we came back to search/categories view — script.js
       will call this only when the view is (re)activated. */
    executeSearch(state.term, state.page || 1);
  }

  /* ---------- init ---------- */
  function init() {
    initCategoriesHub();
    wireInput();

    /* Only auto-restore when user lands back on categoriesView */
    document.addEventListener('cumbear:viewChanged', function (ev) {
      if (ev && ev.detail && ev.detail.view === 'categoriesView') {
        restoreIfNeeded();
      }
    });
  }

  window.performSearch = executeSearch;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
