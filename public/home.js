document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('videoGrid');
  const pag = document.getElementById('paginationContainer');
  const cats = document.getElementById('horizontalCats');
  
  let page = 1;
  let currentCategory = 'all';
  const API_URL = 'https://cumbear-backend.vercel.app';

  // 1. Load Categories
  async function loadCategories() {
    if (!cats) return;
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      if (data.success && data.data) {
        cats.innerHTML = '';
        data.data.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = `h-cat-chip ${cat._id === 'all' ? 'active' : ''}`;
          btn.dataset.cat = cat._id;
          // Capitalize first letter
          btn.textContent = cat._id.charAt(0).toUpperCase() + cat._id.slice(1);
          btn.onclick = () => {
            document.querySelectorAll('.h-cat-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat._id;
            page = 1;
            loadVideos();
          };
          cats.appendChild(btn);
        });
      }
    } catch (err) {
      console.error('Category load error:', err);
    }
  }

  // 2. Load Videos
  async function loadVideos() {
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">Loading videos...</div>';
    
    try {
      let url = `${API_URL}/api/videos?page=${page}&limit=50`;
      if (currentCategory && currentCategory !== 'all') {
        url += `&category=${encodeURIComponent(currentCategory)}`;
      }
      
      console.log('🔍 Fetching:', url);
      const res = await fetch(url);
      const data = await res.json();
      console.log('✅ API Response:', data);
      
      if (data.success && data.data && data.data.length > 0) {
        renderVideos(data.data);
        renderPagination(data.pagination.totalPages);
      } else {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">No videos found in this category.</div>';
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      // FIXED: Using backticks (`) so ${err.message} actually evaluates!
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:red;">Error loading videos: ${err.message}</div>`;
    }
  }

  // 3. Render Videos Grid
  function renderVideos(videos) {
    grid.innerHTML = '';
    videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'video-card';
      
      // Basic XSS protection for title
      const safeTitle = (video.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const duration = video.duration ? video.duration.replace('HD ', '') : '00:00';
      const thumb = video.thumbnailUrl || '/cumb.png';
      
      card.innerHTML = `
        <div class="video-thumb" onclick="window.openPlayer('${video._id}')">
          <img src="${thumb}" loading="lazy" onerror="this.src='/cumb.png'" alt="Thumbnail">
          <span class="duration-badge">${duration}</span>
        </div>
        <div class="video-info" onclick="window.openPlayer('${video._id}')">
          <div class="video-title">${safeTitle}</div>
          <div class="video-stats">
            <span>${video.category || 'Uncategorized'}</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // 4. Render Pagination
  function renderPagination(totalPages) {
    if (!pag) return;
    pag.innerHTML = '';
    const maxPages = Math.min(totalPages, 10); // Show max 10 pages for simplicity
    for (let i = 1; i <= maxPages; i++) {
      const btn = document.createElement('button');
      btn.className = `page-btn ${i === page ? 'active' : ''}`;
      btn.textContent = i;
      btn.onclick = () => {
        page = i;
        loadVideos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      pag.appendChild(btn);
    }
  }

  // 5. Global Player Opener
  window.openPlayer = function(videoId) {
    // Update URL without reloading the page
    history.pushState({ view: 'playerView' }, '', `/?v=${videoId}`);
    // Trigger the player view switch (defined in script.js)
    if (window.switchView) {
      window.switchView('playerView', false);
    }
    // Trigger the player to load the video (defined in player.js or script.js)
    if (window.loadPlayerVideoById) {
      window.loadPlayerVideoById(videoId);
    }
  };

  // Initial Load
  loadCategories();
  loadVideos();
});
