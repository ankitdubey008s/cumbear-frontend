window.playVastPreRoll = async function(vastUrl, skipDelay) {
  return new Promise(async (resolve) => {
    try {
      const response = await fetch(vastUrl);
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const mediaFile = xmlDoc.querySelector("MediaFile");
      
      if (mediaFile && mediaFile.textContent.trim()) {
        const adVideoUrl = mediaFile.textContent.trim();
        const overlay = document.getElementById('vastOverlay');
        const v = document.getElementById('vastVideo');
        const skipBtn = document.getElementById('vastSkipBtn');
        
        overlay.classList.remove('hidden');
        v.src = adVideoUrl;
        v.muted = false;
        v.play().catch(() => {});
        
        let timeLeft = skipDelay;
        skipBtn.classList.remove('hidden');
        skipBtn.textContent = `Skip in ${timeLeft}s`;
        
        const timer = setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            skipBtn.textContent = "Skip Ad";
            skipBtn.style.background = "var(--accent-burgundy)";
            skipBtn.onclick = () => {
              clearInterval(timer);
              overlay.classList.add('hidden');
              v.pause();
              v.src = "";
              resolve();
            };
          } else {
            skipBtn.textContent = `Skip in ${timeLeft}s`;
          }
        }, 1000);
        
        v.onended = () => { clearInterval(timer); overlay.classList.add('hidden'); resolve(); };
        v.onerror = () => { clearInterval(timer); overlay.classList.add('hidden'); resolve(); };
      } else {
        resolve(); // No ad found
      }
    } catch (e) {
      console.error("VAST error:", e);
      resolve(); // Proceed on error
    }
  });
};

window.loadPlayerVideoById = async function(videoId) {
  try {
    const res = await fetch(`https://cumbear-backend.vercel.app/api/videos/${videoId}`);
    const data = await res.json();
    if (data.success && data.data) {
      const video = data.data;
      const videoEl = document.getElementById('mainVideo'); // FIXED ID
      
      // 1. Play VAST Pre-Roll (7 second skip)
      await window.playVastPreRoll('https://s.magsrv.com/v1/vast.php?idz=6045632', 7);
      
      // 2. Play Main Video
      videoEl.src = video.playableUrl;
      videoEl.muted = false;
      videoEl.play().catch(() => {});
      
      // Update UI (FIXED IDs)
      document.getElementById('playerTitleDisplay').textContent = video.title;
      
      // Load suggestions
      if (window.loadSuggestions) window.loadSuggestions(video.category);
    }
  } catch (e) {
    console.error("Player load error:", e);
  }
};

window.loadSuggestions = async function(category) {
  const grid = document.getElementById('suggestionsGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;">Loading...</div>';
  try {
    const res = await fetch(`https://cumbear-backend.vercel.app/api/videos?category=${encodeURIComponent(category)}&limit=10&sort=views`);
    const data = await res.json();
    if (data.success && data.data) {
      grid.innerHTML = '';
      data.data.forEach(v => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
          <div class="video-thumb" onclick="window.openPlayer('${v._id}')">
            <img src="${v.thumbnailUrl}" loading="lazy" onerror="this.src='/cumb.png'">
            <span class="duration-badge">${v.duration.replace('HD ', '')}</span>
          </div>
          <div class="video-info" onclick="window.openPlayer('${v._id}')">
            <div class="video-title">${v.title}</div>
            <div class="video-stats"><span>${v.views ? (v.views/1000).toFixed(1)+'k' : '0'} views</span></div>
          </div>
        `;
        grid.appendChild(card);
      });
    }
  } catch (e) { console.error(e); }
};

window.openPlayer = function(videoId) {
  history.pushState({ view: 'playerView' }, '', `/?v=${videoId}`);
  window.switchView('playerView', false);
  window.loadPlayerVideoById(videoId);
};
