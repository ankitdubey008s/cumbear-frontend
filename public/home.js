/**
 * ==========================================================================
 * CUMBEAR HOME CONTROLLER (Guaranteed Category Chips & 50-Video Feed)
 * ==========================================================================
 */

(function () {
  'use strict';

  const API_BASE = 'https://cumbear-backend.vercel.app';
  const CRAK_NATIVE_URL = 'https://t.datsk3.com/425367/3788/0?target=nativeads&po=6456&aff_sub5=SF_006OG000004lmDN';

  let currentPage = 1;
  let currentCategory = 'all';
  let currentSort = 'gem';

  const defaultCategories = [
    'all', 'Teen', 'MILF', 'Japanese', 'Anal', 'Amateur',
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

  // Render Category Chips
  function renderCategoryChips(list) {
    const catsBar = document.getElementById('globalHorizontalCats');
    if (!catsBar) return;

    catsBar.innerHTML = '';
    list.forEach(item => {
      const catName = typeof item === 'object' ? item._id : item;
      if (!catName || catName.trim() === '') return;

      const btn = document.createElement('button');
      btn.className = `h-cat-chip ${catName.toLowerCase() === currentCategory.toLowerCase() ? 'active' : ''}`;
      btn.textContent = catName.toLowerCase() === 'all' ? 'All' : catName;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.h-cat-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = catName.toLowerCase();
        currentPage = 1;
        loadVideos();
      });

      catsBar.appendChild(btn);
    });
  }

  async function loadCategories() {
    // 1. Immediately render default categories to avoid layout jump
    renderCategoryChips(defaultCategories);

    // 2. Fetch from backend to sync any new dynamic categories
    try {
      const res = await fetch(`${API_BASE}/api/categories?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        renderCategoryChips(data.data);
      }
    } catch (err) {
      console.warn('Using default category set:', err);
    }

    // 3. Render 20 Image Categories at Bottom
    const bottomGrid = document.getElementById('imageCategoriesGrid');
    if (bottomGrid) {
      bottomGrid.innerHTML = '';
      const showcaseNames = defaultCategories.filter(c => c !== 'all');

      for (let i = 1; i <= 20; i++) {
        const catName = showcaseNames[i - 1] || `Category ${i}`;
        const card = document.createElement('div');
        card.className = 'image-cat-card';
        card.innerHTML = `
          <img src="/categories/${i}.jpg" alt="${catName}" loading="lazy" decoding="async" onerror="this.src='/cumb.png'">
          <div class="image-cat-overlay">
            <span class="image-cat-title">${catName}</span>
          </div>
        `;
        card.addEventListener('click', () => {
          currentCategory = catName.toLowerCase();
          currentPage = 1;
          renderCategoryChips(defaultCategories);
          loadVideos();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        bottomGrid.appendChild(card);
      }
    }
  }

  async function loadVideos() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);font-weight:700;">Loading videos...</div>';

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
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">No videos found.</div>';
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#ef4444;">Error loading videos: ${err.message}</div>`;
    }
  }

  function renderVideoGrid(videos) {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';

    videos.forEach((video, index) => {
      if (index > 0 && index % 5 === 0) {
        const adCard = document.createElement('a');
        adCard.className = 'crak-native-card';
        adCard.href = CRAK_NATIVE_URL;
        adCard.target = '_blank';
        adCard.rel = 'noopener noreferrer';
        adCard.innerHTML = `
          <div class="crak-thumb-box">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=640&h=360&fit=crop" loading="lazy" decoding="async">
            <span class="sponsored-pill">Sponsored</span>
          </div>
          <div class="video-info">
            <div class="crak-title">Meet Local Singles Near You Tonight</div>
            <div class="crak-meta">Verified • Free Access</div>
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
          <img class="hd-thumb" src="${video.thumbnailUrl || '/cumb.png'}" alt="${safeTitle}" loading="lazy" decoding="async" draggable="false" onerror="this.src='/cumb.png'">
          <div class="preview-video-holder"></div>
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

      attachHoldAndSlidePreview(card, video);
      grid.appendChild(card);
    });
  }

  function attachHoldAndSlidePreview(card, video) {
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

  window.resetHomeState = function () {
    currentCategory = 'all';
    currentPage = 1;
    currentSort = 'gem';
    renderCategoryChips(defaultCategories);
    loadVideos();
  };

  window.setCategoryFilter = function (category) {
    currentCategory = category;
    currentPage = 1;
    loadVideos();
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadVideos();
  });
})();
