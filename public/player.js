// === VAST PRE-ROLL PLAYER LOGIC ===
window.playVastPreRoll = async function(vastUrl, skipDelay, mainVideoUrl, videoElement) {
  return new Promise(async (resolve) => {
    try {
      const response = await fetch(vastUrl);
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const mediaFile = xmlDoc.querySelector("MediaFile");
      
      if (mediaFile && mediaFile.textContent.trim()) {
        const adVideoUrl = mediaFile.textContent.trim();
        
        // Create Overlay
        const overlay = document.createElement('div');
        overlay.className = 'vast-overlay';
        overlay.innerHTML = `
          <video id="vastVideo" autoplay playsinline style="width:100%; height:100%; object-fit:contain; background:#000;"></video>
          <button id="vastSkip" class="vast-skip-btn">Skip in ${skipDelay}s</button>
        `;
        document.body.appendChild(overlay);
        
        const v = document.getElementById('vastVideo');
        v.src = adVideoUrl;
        v.muted = false; // Unmute for ad
        
        let timeLeft = skipDelay;
        const skipBtn = document.getElementById('vastSkip');
        
        const timer = setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            skipBtn.textContent = "Skip Ad";
            skipBtn.style.background = "rgba(124, 29, 64, 0.9)";
            skipBtn.onclick = () => {
              clearInterval(timer);
              overlay.remove();
              resolve();
            };
          } else {
            skipBtn.textContent = `Skip in ${timeLeft}s`;
          }
        }, 1000);

        v.onended = () => {
          clearInterval(timer);
          overlay.remove();
          resolve();
        };
        
        v.onerror = () => {
          clearInterval(timer);
          overlay.remove();
          resolve(); // Proceed on error
        };
      } else {
        resolve(); // No ad found, proceed
      }
    } catch (e) {
      console.error("VAST error:", e);
      resolve(); // Proceed on error
    }
  });
};

// Override the default player loader to inject VAST
const originalLoadPlayer = window.loadPlayerVideoById;
window.loadPlayerVideoById = async function(videoId) {
  try {
    const res = await fetch(`https://cumbear-backend.vercel.app/api/videos/${videoId}`);
    const data = await res.json();
    if (data.success && data.data) {
      const video = data.data;
      const videoEl = document.getElementById('mainPlayerVideo');
      
      if (videoEl) {
        // 1. Play VAST Pre-Roll (7 second skip)
        await window.playVastPreRoll(
          'https://s.magsrv.com/v1/vast.php?idz=6045632', 
          7, 
          video.playableUrl, 
          videoEl
        );
        
        // 2. Play Main Video
        videoEl.src = video.playableUrl;
        videoEl.muted = false;
        videoEl.play();
        
        // Update UI
        document.getElementById('playerTitle').textContent = video.title;
        document.getElementById('playerCategory').textContent = video.category || 'Premium';
      }
    }
  } catch (e) {
    console.error("Player load error:", e);
  }
};
