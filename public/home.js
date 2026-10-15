/**
 * ==========================================================================
 * CUMBEAR HOME VIEW CONTROLLER (Hold-to-Preview Engine & In-Feed Ads)
 * ==========================================================================
 */

(function () {
  'use strict';

  const API_BASE = 'https://cumbear-backend.vercel.app';
  const CRAK_NATIVE_URL = 'https://t.datsk3.com/425367/3788/0?target=nativeads&po=6456&aff_sub5=SF_006OG000004lmDN';

  let currentPage = 1;
  let currentCategory = 'all';
  let currentSort = 'gem';

  // Format random/raw views cleanly (e.g. 1.2M, 45.3k)
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

  // --- 1. Load Categories Bar & Bottom Image Showcase ---
  async function loadCategories() {
    const catsBar = document.getElementById('horizontalCats');
    const bottomGrid = document.getElementById('imageCategoriesGrid');

    try {
      const res = await fetch(`${API_BASE}/api/categories?t=${Date.now()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && catsBar) {
        catsBar.innerHTML = '';
        data.data.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = `h-cat-chip ${cat._id === currentCategory ? 'active' : ''}`;
          btn.textContent = cat._id === 'all' ? 'All' : cat._id;
          btn.addEventListener('click', () => {
            document.querySelectorAll('.h-cat-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat._id;
            currentPage = 1;
            loadVideos();
          });
          catsBar.appendChild(btn);
        });
      }
    } catch (err) {
      console.warn('Failed to load dynamic categories:', err);
    }

    // Render 20 Image Categories
    if (bottomGrid) {
      bottomGrid.innerHTML = '';
      const fallbackNames = [
        'Teen', 'MILF', 'Japanese', 'Anal', 'Amateur',
        'Blowjob', 'Big Tits', 'Ebony', 'Latina', 'Hardcore',
        'POV', 'Lesbian', 'Threesome', 'Vintage', 'BDSM',
        'Masturbation', 'Creampie', 'Interracial', 'Hentai', 'Compilation'
      ];

      for (let i = 1; i <= 20; i++) {
        const catName = fallbackNames[i - 1] || `Category ${i}`;
        const card = document.createElement('div');
        card.className = 'image-cat-card';
        card.innerHTML = `
          <img src="/categories/${i}.jpg" alt="${catName}" loading="lazy" onerror="this.src='/cumb.png'">
          <div class="image-cat-overlay">
            <span class="image-cat-title">${catName}</span>
          </div>
        `;
        card.addEventListener('click', () => {
          currentCategory = catName.toLowerCase();
          currentPage = 1;
          if (window.switchView) window.switchView('homeView', true);
          loadVideos();
        });
        bottomGrid.appendChild(card);
      }
    }
  }

  // --- 2. Load Videos with Gem Algorithm ---
  async function loadVideos() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);font-weight:700;">Loading premium videos...</div>';

    try {
      let url = `${API_BASE}/api/videos?page=${currentPage}&limit=50&sort=${currentSort}&_=${Date.now()}`;
      if (currentCategory && currentCategory !== 'all') {
        url += `&category=${encodeURIComponent(currentCategory)}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        renderVideoGrid(json.data);
        renderPagination(json.pagination ? json.pagination.totalPages : 10);
      } else {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">No videos found in this category.</div>';
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#ef4444;">Error loading videos: ${err.message}</div>`;
    }
  }

  // --- 3. Render Grid with In-Feed Native Ads ---
  function renderVideoGrid(videos) {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';

    videos.forEach((video, index) => {
      // In-Feed Native Ad after every 5th video card (CrakRevenue SmartLink)
      if (index > 0 && index % 5 === 0) {
        const adCard = document.createElement('a');
        adCard.className = 'crak-native-card';
        adCard.href = CRAK_NATIVE_URL;
        adCard.target = '_blank';
        adCard.rel = 'noopener noreferrer';
        adCard.innerHTML = `
          <div class="crak-thumb-box">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=280&fit=crop" loading="lazy">
            <span class="sponsored-pill">Sponsored</span>
          </div>
          <div class="video-info">
            <div class="crak-title">Meet Horny Local Singles Near You Tonight</div>
            <div class="crak-meta">Verified Hookups • Free Access</div>
          </div>
        `;
        grid.appendChild(adCard);
      }

      const card = document.createElement('div');
      card.className = 'video-card';

      const duration = (video.duration || '00:00').replace(/^HD\s*/i, '');
      const views = formatCount(getRandomViews());
      const likeRate = getRandomLikeRate();
      const safeTitle = (video.title || 'Untitled Video').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      card.innerHTML = `
        <div class="video-thumb">
          <img src="${video.thumbnailUrl || '/cumb.png'}" alt="${safeTitle}" loading="lazy" onerror="this.src='/cumb.png'">
          <video muted playsinline webkit-playsinline preload="metadata"></video>
          <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
          <div class="preview-loading"><div class="preview-spinner"></div></div>
          <span class="duration-badge">${duration}</span>
        </div>
        <div class="video-info">
          <div class="video-title">${safeTitle}</div>
          <div class="video-meta-row">
            <span class="provider-tag">${video.category || 'CumBear'}</span>
            <span>•</span>
            <span>${views} views</span>
            <span>•</span>
            <span>${likeRate}%</span>
          </div>
        </div>
      `;

      // Attach hold-to-preview and click-to-play listeners
      attachHoldToPreview(card, video);
      grid.appendChild(card);
    });
  }

  // --- 4. Hold-To-Preview Engine (500ms PointerHold -> 2.0x Preview -> 60s max) ---
  function attachHoldToPreview(card, video) {
    const thumb = card.querySelector('.video-thumb');
    const title = card.querySelector('.video-title');
    const videoEl = card.querySelector('video');
    const timeline = card.querySelector('.preview-timeline');
    const timelineFill = card.querySelector('.preview-timeline-fill');
    const loading = card.querySelector('.preview-loading');

    let pressTimer = null;
    let previewDurationTimer = null;
    let isPreviewing = false;
    let startX = 0;
    let startY = 0;

    function stopPreview() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (previewDurationTimer) {
        clearTimeout(previewDurationTimer);
        previewDurationTimer = null;
      }

      if (isPreviewing) {
        isPreviewing = false;
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();

        thumb.classList.remove('previewing');
        title.classList.remove('previewing-text');
        if (timeline) timeline.classList.remove('active');
        if (loading) loading.classList.remove('active');
        if (timelineFill) timelineFill.style.width = '0%';
      }
    }

    function startPreview() {
      // Stop all active previews across the document
      document.querySelectorAll('.video-thumb.previewing').forEach(el => {
        const v = el.querySelector('video');
        if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
        el.classList.remove('previewing');
      });

      isPreviewing = true;
      thumb.classList.add('previewing');
      title.classList.add('previewing-text');
      if (timeline) timeline.classList.add('active');
      if (loading) loading.classList.add('active');

      videoEl.src = video.playableUrl;
      videoEl.muted = true;
      videoEl.playbackRate = 2.0; // Play at 2x speed for rapid preview

      videoEl.oncanplay = () => {
        if (loading) loading.classList.remove('active');
        videoEl.play().catch(() => stopPreview());
      };

      videoEl.ontimeupdate = () => {
        if (videoEl.currentTime > 60) { // Max 1 minute preview
          stopPreview();
          return;
        }
        if (timelineFill) {
          const progress = (videoEl.currentTime / 60) * 100;
          timelineFill.style.width = `${progress}%`;
        }
      };

      videoEl.onerror = () => stopPreview();

      // Fallback auto-cutoff at 60 seconds
      previewDurationTimer = setTimeout(() => {
        stopPreview();
      }, 60000);
    }

    // Distinguish between pointer scroll, click, and long hold
    thumb.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      stopPreview();

      pressTimer = setTimeout(() => {
        startPreview();
      }, 500); // 500ms hold triggers instant preview
    });

    thumb.addEventListener('pointermove', (e) => {
      if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      }
    });

    thumb.addEventListener('pointerup', () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (isPreviewing) {
        stopPreview();
      } else {
        // Simple tap -> Open video in Player View
        openPlayer(video._id);
      }
    });

    thumb.addEventListener('pointercancel', stopPreview);
    thumb.addEventListener('pointerleave', stopPreview);

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

  // --- 5. Pagination Buttons (1 to 10) ---
  function renderPagination(totalPages) {
    const wrapper = document.getElementById('paginationWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    const maxPages = Math.min(totalPages, 10);

    for (let i = 1; i <= maxPages; i++) {
      const btn = document.createElement('button');
      btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        currentPage = i;
        loadVideos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      wrapper.appendChild(btn);
    }
  }

  // Filter Dropdown Handler
  const filterBtn = document.getElementById('filterDropdownBtn');
  const filterMenu = document.getElementById('filterMenu');
  const currentSortLabel = document.getElementById('currentSortLabel');

  if (filterBtn && filterMenu) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
    });

    document.querySelectorAll('.filter-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        currentSort = opt.getAttribute('data-sort') || 'gem';
        if (currentSortLabel) currentSortLabel.textContent = opt.textContent;
        filterMenu.classList.remove('show');
        currentPage = 1;
        loadVideos();
      });
    });

    document.addEventListener('click', () => {
      filterMenu.classList.remove('show');
    });
  }

  // Global APIs
  window.resetHomeState = function () {
    currentCategory = 'all';
    currentPage = 1;
    currentSort = 'gem';
    loadVideos();
  };

  window.setCategoryFilter = function (category) {
    currentCategory = category;
    currentPage = 1;
    loadVideos();
  };

  // Run on initialization
  document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadVideos();
  });
})();
