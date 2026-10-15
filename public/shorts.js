document.addEventListener('DOMContentLoaded', () => {
  const shortsContainer = document.getElementById('shortsContainer');
  const API_URL = 'https://cumbear-backend.vercel.app';
  const VAST_URL = 'https://s.magsrv.com/v1/vast.php?idzone=6045638'; // 3-sec skip ExoClick
  const CRAK_URL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';
  
  let shortsData = [];
  let isVastLoaded = false;
  let activeObserver = null;

  async function loadShorts() {
    if (!shortsContainer) return;
    shortsContainer.innerHTML = '<div style="color:white;text-align:center;padding:2rem;">Loading Shorts...</div>';
    try {
      const res = await fetch(`${API_URL}/api/videos?page=1&limit=30&sort=newest&_=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        shortsData = data.data;
        renderShorts();
      }
    } catch (err) {
      console.error('Shorts fetch error:', err);
      shortsContainer.innerHTML = '<div style="color:red;text-align:center;padding:2rem;">Failed to load shorts.</div>';
    }
  }

  function renderShorts() {
    shortsContainer.innerHTML = '';
    
    // Add Back Button
    const backBtn = document.createElement('button');
    backBtn.className = 'shorts-back-btn';
    backBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';
    backBtn.onclick = () => { if (window.switchView) window.switchView('homeView', true); };
    shortsContainer.appendChild(backBtn);

    shortsData.forEach((video, index) => {
      // Inject CrakRevenue Ad every 10 shorts
      if (index > 0 && index % 10 === 0) {
        const adCard = document.createElement('a');
        adCard.className = 'short-item crak-ad-card';
        adCard.href = CRAK_URL;
        adCard.target = '_blank';
        adCard.rel = 'noopener noreferrer';
        adCard.innerHTML = `
          <div style="text-align:center; color:white; padding:2rem;">
            <div style="font-size:3rem; margin-bottom:1rem;">🔥</div>
            <h3 style="font-size:1.2rem; font-weight:800; margin-bottom:0.5rem;">Premium Singles Near You</h3>
            <p style="color:#a1a1aa; font-size:0.9rem;">Click to join 100% free</p>
            <div style="margin-top:1.5rem; background:#7c1d40; padding:0.75rem 1.5rem; border-radius:8px; font-weight:700;">Tap to View</div>
          </div>
        `;
        shortsContainer.appendChild(adCard);
      }

      const randomLikes = Math.floor(Math.random() * 99000) + 1000;
      const randomViews = Math.floor(Math.random() * 490000) + 10000;
      
      const item = document.createElement('div');
      item.className = 'short-item';
      item.dataset.index = index;
      item.innerHTML = `
        <video class="short-video" loop playsinline muted preload="metadata" data-src="${video.playableUrl}"></video>
        
        <!-- 3-Minute Limit Overlay -->
        <div class="end-overlay hidden">
          <h3>Preview Ended</h3>
          <p style="color:#a1a1aa; font-size:0.9rem; margin-bottom:1rem;">3-minute limit reached</p>
          <button class="watch-full-btn-end" onclick="window.openPlayer('${video._id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Watch Full Video
          </button>
        </div>

        <div class="short-overlay">
          <div class="short-info">
            <div class="short-channel">CumBear</div>
            <div class="short-title">${(video.title || 'Untitled').replace(/</g, '&lt;')}</div>
            <button class="watch-full-btn" onclick="window.openPlayer('${video._id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Watch full video
            </button>
          </div>
          
          <div class="short-actions">
            <div class="action-btn-wrapper" onclick="this.querySelector('.action-icon').classList.toggle('liked')">
              <div class="action-icon"><svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></div>
              <span class="action-label">${(randomLikes/1000).toFixed(1)}k</span>
            </div>
            <div class="action-btn-wrapper">
              <div class="action-icon"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div>
              <span class="action-label">${(randomViews/1000).toFixed(1)}k</span>
            </div>
            <div class="action-btn-wrapper" onclick="shareShort('${video.title.replace(/'/g, "\\'")}')">
              <div class="action-icon"><svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></div>
              <span class="action-label">Share</span>
            </div>
            <div class="action-btn-wrapper" onclick="openMoreMenu('${video._id}')">
              <div class="action-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></div>
              <span class="action-label">More</span>
            </div>
          </div>
        </div>
        <div class="short-timeline"><div class="short-timeline-fill"></div></div>
      `;
      shortsContainer.appendChild(item);
    });
    
    setupIntersectionObserver();
  }

  function setupIntersectionObserver() {
    if (activeObserver) activeObserver.disconnect();
    activeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const vid = entry.target.querySelector('.short-video');
        const endOverlay = entry.target.querySelector('.end-overlay');
        const timeline = entry.target.querySelector('.short-timeline-fill');
        
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          playShort(vid, entry.target.dataset.index, timeline, endOverlay);
        } else {
          vid.pause();
          vid.currentTime = 0;
          if (timeline) timeline.style.width = '0%';
        }
      });
    }, { threshold: 0.6 });
    
    document.querySelectorAll('.short-item').forEach(item => {
      if (!item.classList.contains('crak-ad-card')) activeObserver.observe(item);
    });
  }

  async function playShort(videoEl, index, timeline, endOverlay) {
    // Play 3-sec VAST ad ONLY on the very first short
    if (index === 0 && !isVastLoaded) {
      isVastLoaded = true;
      try {
        const res = await fetch(VAST_URL);
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        const adUrl = xml.querySelector("MediaFile")?.textContent.trim();
        
        if (adUrl) {
          videoEl.src = adUrl;
          videoEl.muted = false;
          await videoEl.play();
          
          // Auto-skip after 3 seconds
          setTimeout(() => {
            videoEl.src = videoEl.dataset.src;
            videoEl.muted = true;
            videoEl.loop = true;
            videoEl.play().catch(() => {});
          }, 3000);
          return;
        }
      } catch (e) { console.log("VAST skipped", e); }
    }
    
    // Normal short playback
    videoEl.src = videoEl.dataset.src;
    videoEl.muted = true;
    videoEl.loop = true;
    videoEl.play().catch(() => {});
    
    // 3-Minute (180s) Limit Logic
    videoEl.addEventListener('timeupdate', function checkTime() {
      if (videoEl.currentTime >= 180) {
        videoEl.pause();
        if (endOverlay) endOverlay.classList.remove('hidden');
        if (timeline) timeline.style.width = '100%';
        videoEl.removeEventListener('timeupdate', checkTime);
      } else {
        if (timeline) timeline.style.width = `${(videoEl.currentTime / 180) * 100}%`;
      }
    });
  }

  window.loadShorts = loadShorts;
  window.stopShorts = () => {
    document.querySelectorAll('.short-video').forEach(v => { v.pause(); v.src = ''; });
  };
  window.shareShort = (title) => {
    if (navigator.share) navigator.share({ title: 'CumBear Short', text: title, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }
  };
  window.openMoreMenu = (videoId) => {
    // Simple prompt for now, can be upgraded to a modal
    const action = prompt("Choose an action:\n1. Download Video\n2. Support\n3. Help\n4. Report\n(Enter number)");
    if (action === '1') {
      alert("Download started! (Logo watermark will be applied)");
      // In a real app, this would trigger a backend download endpoint
    } else if (action === '2' || action === '3' || action === ' and 4') {
      window.open('https://support.cumbear.in', '_blank');
    }
  };
});
