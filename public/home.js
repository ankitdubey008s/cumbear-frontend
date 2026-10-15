document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('videoGrid');
  const pag = document.getElementById('paginationContainer');
  const cats = document.getElementById('horizontalCats');
  const filterBtn = document.getElementById('filterBtn');
  const filterMenu = document.getElementById('filterMenu');

  let page = 1;
  let currentCategory = 'all';
  let currentSort = ''; // '' = popularity/gem, 'newest', 'views', 'duration'
  const API_URL = 'https://cumbear-backend.vercel.app';
  const CRAK_URL = 'https://t.datsk3.com/425367/3788/0?target=nativeads&po=6456&aff_sub5=SF_006OG000004lmDN';

  // 1. Filter Dropdown Toggle
  if (filterBtn && filterMenu) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => filterMenu.classList.remove('show'));
    
    filterMenu.querySelectorAll('.filter-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        filterMenu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        currentSort = opt.getAttribute('data-sort') || '';
        filterBtn.querySelector('span').textContent = opt.textContent;
        filterMenu.classList.remove('show');
        page = 1;
        loadVideos();
      });
    });
  }

  // 2. Load Horizontal Categories
  async function loadCategories() {
    if (!cats) return;
    try {
      const res = await fetch(`${API_URL}/api/categories?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.data) {
        cats.innerHTML = '';
        data.data.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = `h-cat-chip ${cat._id === 'all' ? 'active' : ''}`;
          btn.dataset.cat = cat._id;
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
    } catch (err) { console.error('Category load error:', err); }
  }

  // 3. Load Videos (50 per page)
  async function loadVideos() {
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">Loading premium gems...</div>';
    try {
      let url = `${API_URL}/api/videos?page=${page}&limit=50&_=${Date.now()}`;
      if (currentSort) url += `&sort=${currentSort}`;
      if (currentCategory && currentCategory !== 'all') url += `&category=${encodeURIComponent(currentCategory)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        renderVideos(data.data);
        renderPagination(data.pagination.totalPages);
      } else {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">No videos found.</div>';
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:red;">Error: ${err.message}</div>`;
    }
  }

  // 4. Render Grid with CrakRevenue Ads Every 5 Videos
  function renderVideos(videos) {
    grid.innerHTML = '';
    videos.forEach((video, index) => {
      // Inject CrakRevenue Smartlink Ad every 5 videos (index 4, 9, 14, etc.)
      if (index > 0 && index % 5 === 0) {
        const adCard = document.createElement('a');
        adCard.href = CRAK_URL;
        adCard.target = '_blank';
        adCard.rel = 'noopener noreferrer';
        adCard.className = 'video-card native-ad-card';
        adCard.innerHTML = `
          <div class="video-thumb">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=225&fit=crop" loading="lazy">
            <span class="duration-badge">HD</span>
            <span class="sponsored-badge">Sponsored</span>
          </div>
          <div class="video-info">
            <div class="video-title">Meet Local Singles Near You</div>
            <div class="video-stats"><span>100% Free</span><span>•</span><span>Join Now</span></div>
          </div>
        `;
        grid.appendChild(adCard);
      }

      // Normal Video Card
      const card = document.createElement('div');
      card.className = 'video-card';
      const safeTitle = (video.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const duration = video.duration ? video.duration.replace('HD ', '') : '00:00';
      const randomViews = Math.floor(Math.random() * 90000) + 10000;
      
      card.innerHTML = `
        <div class="video-thumb">
          <img src="${video.thumbnailUrl || '/cumb.png'}" loading="lazy" onerror="this.src='/cumb.png'">
          <video muted playsinline preload="metadata"></video>
          <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
          <div class="preview-loading"><div class="preview-spinner"></div></div>
          <span class="duration-badge">${duration}</span>
        </div>
        <div class="video-info">
          <div class="video-title">${safeTitle}</div>
          <div class="video-stats">
            <span>${video.category || 'Premium'}</span>
            <span>•</span>
            <span>${(randomViews/1000).toFixed(1)}k views</span>
          </div>
        </div>
      `;
      
      // Attach Hold-to-Preview Gesture
      setupPreviewGesture(card, video);
      
      // Click to open player (if not an ad)
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.native-ad-card')) {
          window.openPlayer(video._id);
        }
      });
      
      grid.appendChild(card);
    });
  }

  // 5. Hold-to-Preview Logic (2x Speed, Max 1 Minute)
  function setupPreviewGesture(card, video) {
    const thumb = card.querySelector('.video-thumb');
    const vid = card.querySelector('video');
    const timeline = thumb.querySelector('.preview-timeline');
    const loading = thumb.querySelector('.preview-loading');
    let pressTimer;
    let isPlaying = false;

    const startPreview = (e) => {
      if (e.type === 'touchstart') e.preventDefault(); // Prevent scroll on mobile
      pressTimer = setTimeout(() => {
        isPlaying = true;
        card.classList.add('preview-active');
        thumb.classList.add('previewing');
        timeline.classList.add('active');
        loading.classList.add('active');
        
        vid.src = video.playableUrl;
        vid.muted = true;
        vid.playbackRate = 2.0; // 2x speed
        vid.play().catch(() => {});
        
        vid.oncanplay = () => {
          loading.classList.remove('active');
          thumb.classList.add('video-ready');
        };

        // Auto-stop after 30 seconds of real-time (which is 1 minute of video at 2x)
        setTimeout(() => { if (isPlaying) stopPreview(); }, 30000);
      }, 500); // 500ms hold to trigger
    };

    const stopPreview = () => {
      clearTimeout(pressTimer);
      if (isPlaying) {
        isPlaying = false;
        vid.pause();
        vid.removeAttribute('src');
        vid.load();
        card.classList.remove('preview-active');
        thumb.classList.remove('previewing', 'video-ready');
        timeline.classList.remove('active');
        loading.classList.remove('active');
      }
    };

    thumb.addEventListener('mousedown', startPreview);
    thumb.addEventListener('touchstart', startPreview, { passive: false });
    thumb.addEventListener('mouseup', stopPreview);
    thumb.addEventListener('mouseleave', stopPreview);
    thumb.addEventListener('touchend', stopPreview);
    thumb.addEventListener('touchcancel', stopPreview);
    // Also stop if user scrolls away
    window.addEventListener('scroll', stopPreview, { passive: true });
    window.addEventListener('touchmove', stopPreview, { passive: true });
  }

  // 6. Pagination (Max 10 pages)
  function renderPagination(totalPages) {
    if (!pag) return;
    pag.innerHTML = '';
    const maxPages = Math.min(totalPages, 10);
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

  // 7. Global Functions
  window.openPlayer = function(videoId) {
    history.pushState({ view: 'playerView' }, '', `/?v=${videoId}`);
    if (window.switchView) window.switchView('playerView', false);
    if (window.loadPlayerVideoById) window.loadPlayerVideoById(videoId);
  };

  window.loadHomeVideos = loadVideos;
  window.resetHomeState = () => { 
    currentCategory = 'all'; 
    currentSort = ''; 
    page = 1; 
    if (filterBtn) filterBtn.querySelector('span').textContent = 'Popularity';
    document.querySelectorAll('.h-cat-chip').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.h-cat-chip[data-cat="all"]');
    if (allBtn) allBtn.classList.add('active');
    loadVideos(); 
  };

  // Initialize
  loadCategories();
  loadVideos();
});
