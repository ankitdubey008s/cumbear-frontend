document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('videoGrid');
  const pag = document.getElementById('paginationContainer');
  const cats = document.getElementById('horizontalCats');
  
  let page = 1;
  let currentCategory = 'all';
  let currentSort = 'gem'; // DEFAULT TO GEM CONTENT
  const API_URL = 'https://cumbear-backend.vercel.app';
  
  const POP_URL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';
  const NATIVE_URL = 'https://t.datsk3.com/425367/3788/0?target=nativeads&po=6456&aff_sub5=SF_006OG000004lmDN';

  // 1. SESSION POPUNDER
  if (!sessionStorage.getItem('popTriggered')) {
    document.body.addEventListener('click', function handleFirstClick(e) {
      if (e.target.tagName === 'A' || e.target.closest('a') || e.target.tagName === 'BUTTON') return;
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

  // 3. Load Videos (WITH CACHE BUSTER & GEM SORT)
  async function loadVideos() {
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">Loading premium content...</div>';
    
    try {
      // Cache buster ensures browser never shows old, stale data
      const cacheBuster = Date.now();
      let url = `${API_URL}/api/videos?page=${page}&limit=50&sort=${currentSort}&_=${cacheBuster}`;
      
      if (currentCategory && currentCategory !== 'all') {
        url += `&category=${encodeURIComponent(currentCategory)}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        renderVideos(data.data);
        renderPagination(data.pagination.totalPages);
      } else {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">No premium videos found in this category.</div>';
      }
    } catch (err) {
      console.error('Fetch error:', err);
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:red;">Error loading videos.</div>`;
    }
  }

  // 4. Render Videos + NATIVE AD
  function renderVideos(videos) {
    grid.innerHTML = '';
    videos.forEach((video, index) => {
      if (index === 5 && page === 1) {
        const adCard = document.createElement('a');
        adCard.href = NATIVE_URL;
        adCard.target = '_blank';
        adCard.rel = 'noopener noreferrer';
        adCard.className = 'video-card native-ad-card';
        adCard.innerHTML = `
          <div class="video-thumb">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=225&fit=crop" loading="lazy" alt="Sponsored">
            <span class="duration-badge">HD</span>
            <span class="sponsored-badge">Sponsored</span>
          </div>
          <div class="video-info">
            <div class="video-title">Meet Local Singles Near You - Click to Chat</div>
            <div class="video-stats"><span>100% Free</span><span>Join Now</span></div>
          </div>
        `;
        grid.appendChild(adCard);
      }

      const card = document.createElement('div');
      card.className = 'video-card';
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
          <div class="video-stats"><span>${video.category || 'Premium'}</span></div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // 5. Render Pagination
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

  window.openPlayer = function(videoId) {
    history.pushState({ view: 'playerView' }, '', `/?v=${videoId}`);
    if (window.switchView) window.switchView('playerView', false);
    if (window.loadPlayerVideoById) window.loadPlayerVideoById(videoId);
  };

  loadCategories();
  loadVideos();
});

// === SHORTS VAST PRE-ROLL (0s Skip) ===
window.playShortsVast = async function(videoElement, mainVideoUrl) {
  return new Promise(async (resolve) => {
    try {
      const response = await fetch('https://s.magsrv.com/v1/vast.php?idzone=6045638');
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const mediaFile = xmlDoc.querySelector("MediaFile");
      
      if (mediaFile && mediaFile.textContent.trim()) {
        const adVideoUrl = mediaFile.textContent.trim();
        videoElement.src = adVideoUrl;
        videoElement.muted = false;
        videoElement.play();
        
        videoElement.onended = () => {
          videoElement.src = mainVideoUrl;
          videoElement.play();
          resolve();
        };
      } else {
        videoElement.src = mainVideoUrl;
        videoElement.play();
        resolve();
      }
    } catch (e) {
      videoElement.src = mainVideoUrl;
      videoElement.play();
      resolve();
    }
  });
};
