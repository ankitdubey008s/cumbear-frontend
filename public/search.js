/**
 * ==========================================================================
 * CUMBEAR SEARCH & CATEGORIES CONTROLLER
 * ==========================================================================
 */

(function () {
  'use strict';

  const API_BASE = 'https://cumbear-backend.vercel.app';
  let searchPage = 1;
  let activeSearchTerm = '';

  const fallbackCategories = [
    'Teen', 'MILF', 'Japanese', 'Anal', 'Amateur',
    'Blowjob', 'Big Tits', 'Ebony', 'Latina', 'Hardcore',
    'POV', 'Lesbian', 'Threesome', 'Vintage', 'BDSM',
    'Masturbation', 'Creampie', 'Interracial', 'Hentai', 'Compilation'
  ];

  // --- 1. Populate Search Categories Hub (20 Images) ---
  function initCategoriesHub() {
    const hubGrid = document.getElementById('searchCategoriesGrid');
    if (!hubGrid) return;

    hubGrid.innerHTML = '';
    fallbackCategories.forEach((catName, idx) => {
      const imgIdx = idx + 1;
      const card = document.createElement('div');
      card.className = 'image-cat-card';
      card.innerHTML = `
        <img src="/categories/${imgIdx}.jpg" alt="${catName}" loading="lazy" onerror="this.src='/cumb.png'">
        <div class="image-cat-overlay">
          <span class="image-cat-title">${catName}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        executeSearch(catName);
      });
      hubGrid.appendChild(card);
    });
  }

  // --- 2. Execute Search via Backend Search Parameter ---
  async function executeSearch(term, page = 1) {
    if (!term || !term.trim()) return;
    activeSearchTerm = term.trim();
    searchPage = page;

    const hubSection = document.getElementById('searchCategoriesHub');
    const resultsSection = document.getElementById('searchResultsSection');
    const resultTitle = document.getElementById('searchResultTitle');
    const resultsGrid = document.getElementById('searchVideoGrid');
    const input = document.getElementById('searchInput');

    if (input) input.value = activeSearchTerm;
    if (hubSection) hubSection.classList.add('hidden');
    if (resultsSection) resultsSection.classList.remove('hidden');
    if (resultTitle) resultTitle.textContent = `Results for: "${activeSearchTerm}"`;

    if (resultsGrid) {
      resultsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);font-weight:700;">Searching matching scenes...</div>';
    }

    try {
      const res = await fetch(`${API_BASE}/api/videos?page=${searchPage}&limit=50&category=${encodeURIComponent(activeSearchTerm)}&_=${Date.now()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        renderSearchResults(json.data);
        renderSearchPagination(json.pagination ? json.pagination.totalPages : 10);
      } else {
        if (resultsGrid) {
          resultsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">No videos matching "${activeSearchTerm}". Try another search term.</div>`;
        }
      }
    } catch (e) {
      if (resultsGrid) {
        resultsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#ef4444;">Search error: ${e.message}</div>`;
      }
    }
  }

  function renderSearchResults(videos) {
    const grid = document.getElementById('searchVideoGrid');
    if (!grid) return;
    grid.innerHTML = '';

    videos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'video-card';
      const duration = (v.duration || '00:00').replace(/^HD\s*/i, '');
      const safeTitle = (v.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      card.innerHTML = `
        <div class="video-thumb">
          <img src="${v.thumbnailUrl || '/cumb.png'}" loading="lazy" onerror="this.src='/cumb.png'">
          <span class="duration-badge">${duration}</span>
        </div>
        <div class="video-info">
          <div class="video-title">${safeTitle}</div>
          <div class="video-meta-row">
            <span class="provider-tag">${v.category || 'CumBear'}</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        if (window.switchView) window.switchView('playerView', true);
        if (typeof window.loadPlayerVideoById === 'function') {
          window.loadPlayerVideoById(v._id);
        }
      });
      grid.appendChild(card);
    });
  }

  function renderSearchPagination(totalPages) {
    const wrapper = document.getElementById('searchPaginationWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    const max = Math.min(totalPages, 10);
    for (let i = 1; i <= max; i++) {
      const btn = document.createElement('button');
      btn.className = `page-btn ${i === searchPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        executeSearch(activeSearchTerm, i);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      wrapper.appendChild(btn);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCategoriesHub();

    const input = document.getElementById('searchInput');
    const submitBtn = document.getElementById('searchSubmitBtn');
    const backBtn = document.getElementById('backToHubBtn');

    if (submitBtn && input) {
      submitBtn.addEventListener('click', () => executeSearch(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeSearch(input.value);
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const hubSection = document.getElementById('searchCategoriesHub');
        const resultsSection = document.getElementById('searchResultsSection');
        if (resultsSection) resultsSection.classList.add('hidden');
        if (hubSection) hubSection.classList.remove('hidden');
        if (input) input.value = '';
      });
    }
  });

  window.performSearch = executeSearch;
})();
