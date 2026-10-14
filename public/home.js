document.addEventListener('DOMContentLoaded', () => {
  const videoGrid = document.getElementById('videoGrid');
  const paginationContainer = document.getElementById('paginationContainer');
  const horizontalCats = document.getElementById('horizontalCats');
  const filterBtn = document.getElementById('filterBtn');
  const filterMenu = document.getElementById('filterMenu');

  let currentPage = 1;
  let currentCategory = 'all';
  let currentSort = 'gem'; // 'gem', 'newest', 'views', 'duration'
  const API_URL = 'https://cumbear-backend.vercel.app';

  // 1. Filter Dropdown Toggle
  if (filterBtn && filterMenu) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      filterMenu.classList.remove('show');
    });

    filterMenu.querySelectorAll('.filter-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        filterMenu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        currentSort = opt.getAttribute('data-sort') || 'gem';
        filterBtn.querySelector('span').textContent = opt.textContent;
        filterMenu.classList.remove('show');
        currentPage = 1;
        loadHomeVideos();
      });
    });
  }

  // 2. Load Horizontal Categories
  async function loadCategories() {
    if (!horizontalCats) return;
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      if (data.success && data.data) {
        horizontalCats.innerHTML = '';
        // "All" button first
        const allBtn = document.createElement('button');
        allBtn.className = 'h-cat-chip active';
        allBtn.dataset.cat = 'all';
        allBtn.textContent = 'All';
        allBtn.onclick = () => setCategory('all', allBtn);
        horizontalCats.appendChild(allBtn);

        // Add top categories
        data.data.filter(c => c._id !== 'all').slice(0, 15).forEach(cat => {
          const btn = document.createElement('button');
          btn.className = 'h-cat-chip';
          btn.dataset.cat = cat._id;
          btn.textContent = cat._id.charAt(0).toUpperCase() + cat._id.slice(1);
          btn.onclick = () => setCategory(cat._id, btn);
          horizontalCats.appendChild(btn);
        });
      }
    } catch (err) {
      console.error('Category load error:', err);
    }
  }

  // 3. Set Category Helper
  window.setCategory = function(catId, btnElement) {
    currentCategory = catId;
    currentPage = 1;
    document.querySelectorAll('.h-cat-chip').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    loadHomeVideos();
  };

  // 4. Load Videos (The Core Engine)
  window.loadHomeVideos = async function() {
    if (!videoGrid) return;
    videoGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">Loading premium gems...</div>';
    
    try {
      let url = `${API_URL}/api/videos?page=${currentPage}&limit=50&sort=${currentSort}`;
      if (currentCategory && currentCategory !== 'all') {
        url += `&category=${encodeURIComponent(currentCategory)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        renderVideos(data.data);
        renderPagination(data.pagination.totalPages);
      } else {
        videoGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">No videos found for this selection.</div>';
        if (paginationContainer) paginationContainer.innerHTML = '';
      }
    } catch (err) {
      videoGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:red;">Error loading videos. Check connection.</div>`;
    }
  };

  // 5. Render Video Grid
  function renderVideos(videos) {
    videoGrid.innerHTML = '';
    videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'video-card';
      
      const safeTitle = (video.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const duration = video.duration ? video.duration.replace('HD ', '') : '00:00';
      const views = video.views ? (video.views / 1000).toFixed(1) + 'k' : '0';

      card.innerHTML = `
        <div class="video-thumb" onclick="window.openPlayer('${video._id}')">
          <img src="${video.thumbnailUrl || '/cumb.png'}" loading="lazy" onerror="this.src='/cumb.png'" alt="${safeTitle}">
          <span class="duration-badge">${duration}</span>
        </div>
        <div class="video-info" onclick="window.openPlayer('${video._id}')">
          <div class="video-title">${safeTitle}</div>
          <div class="video-stats">
            <span>${video.category || 'Premium'}</span>
            <span>•</span>
            <span>${views} views</span>
          </div>
        </div>
      `;
      videoGrid.appendChild(card);
    });
  }

  // 6. Render Pagination
  function renderPagination(totalPages) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    const maxPages = Math.min(totalPages, 10); // Max 10 pages for UX
    
    for (let i = 1; i <= maxPages; i++) {
      const btn = document.createElement('button');
      btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.onclick = () => {
        currentPage = i;
        loadHomeVideos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      paginationContainer.appendChild(btn);
    }
  }

  // 7. Global Player Opener
  window.openPlayer = function(videoId) {
    history.pushState({ view: 'playerView' }, '', `/?v=${videoId}`);
    window.switchView('playerView', false);
    if (window.loadPlayerVideoById) {
      window.loadPlayerVideoById(videoId);
    }
  };

  // 8. Reset State (called when leaving home view)
  window.resetHomeState = function() {
    currentCategory = 'all';
    currentPage = 1;
    currentSort = 'gem';
    if (filterBtn) filterBtn.querySelector('span').textContent = 'Popular';
    document.querySelectorAll('.h-cat-chip').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.h-cat-chip[data-cat="all"]');
    if (allBtn) allBtn.classList.add('active');
  };

  // Initialize
  loadCategories();
  loadHomeVideos();
});
