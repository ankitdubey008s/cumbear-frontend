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
        const countdown = document.getElementById('vastCountdown');
        
        overlay.classList.remove('hidden');
        v.src = adVideoUrl;
        v.muted = false;
        v.play().catch(() => {});
        
        let timeLeft = skipDelay;
        countdown.textContent = timeLeft;
        skipBtn.classList.add('hidden');
        
        const timer = setInterval(() => {
          timeLeft--;
          countdown.textContent = timeLeft;
          if (timeLeft <= 0) {
            skipBtn.classList.remove('hidden');
            skipBtn.textContent = "Skip Ad";
            skipBtn.onclick = () => {
              clearInterval(timer);
              overlay.classList.add('hidden');
              v.pause();
              v.src = "";
              resolve();
            };
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
      const videoEl = document.getElementById('mainVideo');
      
      // 1. Play 7-sec ExoClick VAST Pre-Roll
      await window.playVastPreRoll('https://s.magsrv.com/v1/vast.php?idz=6045632', 7);
      
      // 2. Play Main Video
      videoEl.src = video.playableUrl;
      videoEl.poster = video.thumbnailUrl;
      videoEl.muted = false;
      videoEl.play().catch(() => {});
      
      // Update UI
      document.getElementById('playerTitleDisplayDisplay').textContent = video.title;
      
      // 3. Load Suggestions
      loadSuggestions(video.category, video._id);
    }
  } catch (e) {
    console.error("Player load error:", e);
  }
};

async function loadSuggestions(category, excludeId) {
  const grid = document.getElementById('suggestionsGrid');
  if (!grid) return;
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">Loading...</div>';
  try {
    const res = await fetch(`https://cumbear-backend.vercel.app/api/videos?category=${encodeURIComponent(category)}&limit=50&sort=views`);
    const data = await res.json();
    if (data.success && data.data) {
      const videos = data.data.filter(v => v._id !== excludeId).slice(0, 20);
      grid.innerHTML = '';
      videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        const duration = video.duration ? video.duration.replace('HD ', '') : '00:00';
        card.innerHTML = `
          <div class="video-thumb" onclick="window.openPlayer('${video._id}')">
            <img src="${video.thumbnailUrl}" loading="lazy" onerror="this.src='/cumb.png'">
            <span class="duration-badge">${duration}</span>
          </div>
          <div class="video-info" onclick="window.openPlayer('${video._id}')">
            <div class="video-title">${video.title}</div>
            <div class="video-stats"><span>${video.views ? (video.views/1000).toFixed(1)+'k' : '0'} views</span></div>
          </div>
        `;
        grid.appendChild(card);
      });
    }
  } catch (e) { 
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:red;">Error loading suggestions.</div>'; 
  }
}

window.openPlayer = function(videoId) {
  history.pushState({ view: 'playerView' }, '', `/?v=${videoId}`);
  if (window.switchView) window.switchView('playerView', false);
  window.loadPlayerVideoById(videoId);
};
