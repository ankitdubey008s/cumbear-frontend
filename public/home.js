document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('videoGrid');
  const pag = document.getElementById('paginationContainer');
  const cats = document.getElementById('horizontalCats');
  
  let page = 1;
  let currentCategory = 'all';
  let currentSort = 'gem';
  const API_URL = 'https://cumbear-backend.vercel.app';
  
  const POP_URL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';
  const NATIVE_URL = 'https://t.datsk3.com/425367/3788/0?target=nativeads&po=6456&aff_sub5=SF_006OG000004lmDN';

  // 1. FIXED POPUNDER: Ignores Nav, Sidebar, and UI elements
  if (!sessionStorage.getItem('popTriggered')) {
    document.body.addEventListener('click', function handleFirstClick(e) {
      // IGNORE clicks on links, buttons, nav, sidebar, and ads
      const ignoreTargets = ['A', 'BUTTON', 'INPUT', 'TEXTAREA'];
      const ignoreClasses = ['nav-link', 'sidebar', 'sidebar-overlay', 'h-cat-chip', 'page-btn', 'view-tab', 'menu-btn'];
      
      if (ignoreTargets.includes(e.target.tagName)) return;
      if (e.target.closest('a') || e.target.closest('button')) return;
      if (ignoreClasses.some(cls => e.target.closest(`.${cls}`))) return;

      window.open(POP_URL, '_blank', 'noopener,noreferrer');
      sessionStorage.setItem('popTriggered', 'true');
      document.body.removeEventListener('click', handleFirstClick);
    }, { capture: true });
  }

  // 2. Load Categories
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

  // 3. Load Videos
  async function loadVideos() {
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">Loading premium gems...</div>';
    
    try {
      let url = `${API_URL}/api/videos?page=${page}&limit=50&sort=${currentSort}&_=${Date.now()}`;
      if (currentCategory && currentCategory !== 'all') url += `&category=${encodeURIComponent(currentCategory)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        renderVideos(data.data);
        renderPagination(data.pagination.totalPages);
      } else {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">No gems found.</div>';
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:red;">Error: ${err.message}</div>`;
    }
  }

  // 4. Render Grid
  function renderVideos(videos) {
    grid.innerHTML = '';
    videos.forEach((video, index) => {
      if (index === 5 && page === 1) {
        const adCard = document.createElement('a');
        adCard.href = NATIVE_URL;
        adCard.target = '_blank';
        adCard.rel = 'noopener noreferrer';
        adCard.className = 'video-card native-ad-card';
        adCard.innerHTML = `<div class="video-thumb"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=225&fit=crop" loading="lazy"><span class="duration-badge">HD</span><span class="sponsored-badge">Sponsored</span></div><div class="video-info"><div class="video-title">Meet Local Singles Near You</div><div class="video-stats"><span>100% Free</span><span>Join Now</span></div></div>`;
        grid.appendChild(adCard);
      }

      const card = document.createElement('div');
      card.className = 'video-card';
      const safeTitle = (video.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const duration = video.duration ? video.duration.replace('HD ', '') : '00:00';
      
      card.innerHTML = `<div class="video-thumb" onclick="window.openPlayer('${video._id}')"><img src="${video.thumbnailUrl || '/cumb.png'}" loading="lazy" onerror="this.src='/cumb.png'"><span class="duration-badge">${duration}</span></div><div class="video-info" onclick="window.openPlayer('${video._id}')"><div class="video-title">${safeTitle}</div><div class="video-stats"><span>${video.category || 'Premium'}</span></div></div>`;
      grid.appendChild(card);
    });
  }

  function renderPagination(totalPages) {
    if (!pag) return;
    pag.innerHTML = '';
    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
      const btn = document.createElement('button');
      btn.className = `page-btn ${i === page ? 'active' : ''}`;
      btn.textContent = i;
      btn.onclick = () => { page = i; loadVideos(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      pag.appendChild(btn);
    }
  }

  window.openPlayer = function(videoId) {
    history.pushState({ view: 'playerView' }, '', `/?v=${videoId}`);
    if (window.switchView) window.switchView('playerView', false);
    if (window.loadPlayerVideoById) window.loadPlayerVideoById(videoId);
  };

  window.loadHomeVideos = loadVideos;
  window.resetHomeState = () => { currentCategory = 'all'; page = 1; loadVideos(); };

  loadCategories();
  loadVideos();
});
