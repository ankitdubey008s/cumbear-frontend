/**
 * ==========================================================================
 * CUMBEAR SEARCH CONTROLLER (Guaranteed 50 Videos & Interactive Gestures)
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

  function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  function getRandomViews() {
    return Math.floor(Math.random() * (10000000 - 10000 + 1)) + 10000;
  }

  function getRandomLikeRate() {
    return Math.floor(Math.random() * (100 - 50 + 1)) + 50;
  }

  function initCategoriesHub() {
    const hubGrid = document.getElementById('searchCategoriesGrid');
    if (!hubGrid) return;

    hubGrid.innerHTML = '';
    fallbackCategories.forEach((catName, idx) => {
      const imgIdx = idx + 1;
      const card = document.createElement('div');
      card.className = 'image-cat-card';
      card.innerHTML = `
        <img src="/categories/${imgIdx}.jpg" alt="${catName}" loading="lazy" decoding="async" onerror="this.src='/cumb.png'">
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
      resultsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);font-weight:700;">Loading 50 matching videos...</div>';
    }

    try {
      // Uses the new search query pipeline
      const res = await fetch(`${API_BASE}/api/videos?page=${searchPage}&limit=50&search=${encodeURIComponent(activeSearchTerm)}&_=${Date.now()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        renderSearchResults(json.data);
        renderSearchPagination(json.pagination ? json.pagination.totalPages : 10);
      } else {
        if (resultsGrid) {
          resultsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">No videos found.</div>';
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
      const views = formatCount(getRandomViews());
      const likeRate = getRandomLikeRate();
      const safeTitle = (v.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      card.innerHTML = `
        <div class="video-thumb">
          <img class="hd-thumb" src="${v.thumbnailUrl || '/cumb.png'}" alt="${safeTitle}" loading="lazy" decoding="async" draggable="false" onerror="this.src='/cumb.png'">
          <div class="preview-video-holder"></div>
          <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
          <div class="preview-loading"><div class="preview-spinner"></div></div>
          <span class="duration-badge">${duration}</span>
        </div>
        <div class="video-info">
          <div class="video-title">${safeTitle}</div>
          <div class="video-meta-row">
            <span class="provider-tag">${v.category || 'CumBear'}</span>
            <span>•</span>
            <span>${views} views</span>
            <span>•</span>
            <span>${likeRate}%</span>
          </div>
        </div>
      `;

      attachSearchGestures(card, v);
      grid.appendChild(card);
    });
  }

  function attachSearchGestures(card, video) {
    const thumb = card.querySelector('.video-thumb');
    const title = card.querySelector('.video-title');
    const holder = card.querySelector('.preview-video-holder');
    const timeline = card.querySelector('.preview-timeline');
    const timelineFill = card.querySelector('.preview-timeline-fill');
    const loading = card.querySelector('.preview-loading');

    let pressTimer = null;
    let isPreviewPlaying = false;
    let startX = 0;
    let startY = 0;
    let heldDown = false;
    let videoEl = null;

    thumb.addEventListener('contextmenu', (e) => e.preventDefault());
    thumb.querySelectorAll('img').forEach(img => img.addEventListener('dragstart', (e) => e.preventDefault()));

    function stopPreview() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (isPreviewPlaying) {
        isPreviewPlaying = false;
        if (videoEl) {
          videoEl.pause();
          videoEl.src = '';
          videoEl.load();
          videoEl.remove();
          videoEl = null;
        }
        thumb.classList.remove('previewing');
        title.classList.remove('previewing-text');
        if (timeline) timeline.classList.remove('active');
        if (loading) loading.classList.remove('active');
        if (timelineFill) timelineFill.style.width = '0%';
      }
    }

    function startPreview() {
      document.querySelectorAll('.video-thumb.previewing').forEach(el => {
        const v = el.querySelector('video');
        if (v) { v.pause(); v.src = ''; v.load(); v.remove(); }
        el.classList.remove('previewing');
      });

      isPreviewPlaying = true;
      thumb.classList.add('previewing');
      title.classList.add('previewing-text');
      if (timeline) timeline.classList.add('active');
      if (loading) loading.classList.add('active');

      videoEl = document.createElement('video');
      videoEl.setAttribute('muted', '');
      videoEl.muted = true;
      videoEl.setAttribute('playsinline', '');
      videoEl.setAttribute('webkit-playsinline', '');
      videoEl.preload = 'auto';
      videoEl.src = video.playableUrl;
      videoEl.playbackRate = 1.0;

      videoEl.oncanplay = () => {
        if (loading) loading.classList.remove('active');
        videoEl.play().catch(() => stopPreview());
      };

      videoEl.ontimeupdate = () => {
        if (videoEl.currentTime > 60) {
          stopPreview();
          return;
        }
        if (timelineFill) {
          timelineFill.style.width = `${(videoEl.currentTime / 60) * 100}%`;
        }
      };

      videoEl.onerror = () => stopPreview();
      holder.appendChild(videoEl);
    }

    thumb.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      heldDown = true;

      if (isPreviewPlaying) {
        stopPreview();
        heldDown = false;
        return;
      }

      pressTimer = setTimeout(() => {
        if (heldDown) {
          startPreview();
        }
      }, 1000);
    });

    thumb.addEventListener('pointermove', (e) => {
      if (!heldDown && !isPreviewPlaying) return;

      const diffX = Math.abs(e.clientX - startX);
      const diffY = Math.abs(e.clientY - startY);

      if (!isPreviewPlaying && (diffX > 10 || diffY > 10)) {
        clearTimeout(pressTimer);
        pressTimer = null;
      } else if (isPreviewPlaying && videoEl && videoEl.duration) {
        const rect = thumb.getBoundingClientRect();
        const scrubRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        videoEl.currentTime = scrubRatio * Math.min(videoEl.duration, 60);
      }
    });

    thumb.addEventListener('pointerup', () => {
      heldDown = false;
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
        if (!isPreviewPlaying) {
          openPlayer(video._id);
        }
      }
    });

    thumb.addEventListener('pointercancel', () => {
      heldDown = false;
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });

    card.querySelector('.video-info').addEventListener('click', () => {
      stopPreview();
      openPlayer(video._id);
    });
  }

  function openPlayer(videoId) {
    if (window.switchView) {
      window.switchView('playerView', true);
    }
    if (typeof window.loadPlayerVideoById === 'function') {
      window.loadPlayerVideoById(videoId);
    }
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
