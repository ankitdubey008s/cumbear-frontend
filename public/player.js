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
        const overlay = document.createElement('div');
        overlay.className = 'vast-overlay';
        overlay.innerHTML = `
          <video id="vastVideoPlayer" autoplay playsinline style="width:100%;height:100%;object-fit:contain;background:#000;"></video>
          <button id="vastSkipBtnPlayer" class="vast-skip-btn">Skip in ${skipDelay}s</button>
        `;
        document.body.appendChild(overlay);
        
        const v = document.getElementById('vastVideoPlayer');
        v.src = adVideoUrl;
        v.muted = false;
        
        let timeLeft = skipDelay;
        const skipBtn = document.getElementById('vastSkipBtnPlayer');
        
        const timer = setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            skipBtn.textContent = "Skip Ad";
            skipBtn.style.background = "rgba(124, 29, 64, 0.9)";
            skipBtn.onclick = () => { clearInterval(timer); overlay.remove(); resolve(); };
          } else {
            skipBtn.textContent = `Skip in ${timeLeft}s`;
          }
        }, 1000);
        
        v.onended = () => { clearInterval(timer); overlay.remove(); resolve(); };
        v.onerror = () => { clearInterval(timer); overlay.remove(); resolve(); };
      } else { resolve(); }
    } catch (e) { console.error("VAST error:", e); resolve(); }
  });
};

window.loadPlayerVideoById = async function(videoId) {
  try {
    const res = await fetch(`https://cumbear-backend.vercel.app/api/videos/${videoId}`);
    const data = await res.json();
    if (data.success && data.data) {
      const video = data.data;
      const videoEl = document.getElementById('mainVideo'); // FIXED ID
      
      await window.playVastPreRoll('https://s.magsrv.com/v1/vast.php?idz=6045632', 7);
      
      videoEl.src = video.playableUrl;
      videoEl.poster = video.thumbnailUrl;
      videoEl.muted = false;
      videoEl.play().catch(() => {});
      
      document.getElementById('playerTitleDisplay').textContent = video.title; // FIXED ID
      loadSuggestions(video.category, video._id);
    }
  } catch (e) { console.error("Player load error:", e); }
};

async function loadSuggestions(category, excludeId) {
  const grid = document.getElementById('suggestionsGrid');
  if (!grid) return;
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">Loading...</div>';
  try {
    const res = await fetch(`https://cumbear-backend.vercel.app/api/videos?category=${encodeURIComponent(category)}&limit=12&sort=views`);
    const data = await res.json();
    if (data.success && data.data) {
      const videos = data.data.filter(v => v._id !== excludeId);
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
  } catch (e) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:red;">Error loading suggestions.</div>'; }
}
