document.addEventListener('DOMContentLoaded', () => {
  const shortsContainer = document.getElementById('shortsContainer');
  const API_URL = 'https://cumbear-backend.vercel.app';
  const VAST_URL = 'https://s.magsrv.com/v1/vast.php?idzone=6045638';
  let shortsData = [];
  let isVastLoaded = false;

  async function loadShorts() {
    if (!shortsContainer) return;
    shortsContainer.innerHTML = '<div style="color:white;text-align:center;padding:2rem;">Loading Shorts...</div>';
    try {
      const res = await fetch(`${API_URL}/api/videos?page=1&limit=20&sort=newest&_=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) { shortsData = data.data; renderShorts(); }
    } catch (err) { shortsContainer.innerHTML = '<div style="color:red;text-align:center;padding:2rem;">Failed to load shorts.</div>'; }
  }

  function renderShorts() {
    shortsContainer.innerHTML = '';
    shortsData.forEach((video, index) => {
      const card = document.createElement('div');
      card.className = 'short-item'; // FIXED CLASS
      card.dataset.index = index;
      const duration = video.duration ? video.duration.replace('HD ', '') : '00:00';
      
      card.innerHTML = `
        <video class="short-video" loop playsinline muted preload="metadata" data-src="${video.playableUrl}"></video>
        <div class="short-overlay">
          <div class="short-info">
            <h3>${(video.title || 'Untitled').replace(/</g, '&lt;')}</h3>
            <span class="short-category">${video.category || 'Premium'} • ${duration}</span>
          </div>
          <div class="short-actions">
            <button class="short-action-btn like-btn">❤️</button>
            <button class="short-action-btn share-btn">↗️</button>
          </div>
        </div>
      `;
      
      card.querySelector('.like-btn').addEventListener('click', (e) => { e.stopPropagation(); e.currentTarget.classList.toggle('liked'); });
      card.querySelector('.share-btn').addEventListener('click', (e) => { e.stopPropagation(); if(navigator.share) navigator.share({title:video.title, url:window.location.href}); });
      shortsContainer.appendChild(card);
    });
    setupIntersectionObserver();
  }

  function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('.short-video');
        if (entry.isIntersecting && entry.intersectionRatio > 0.8) { playShort(video, parseInt(entry.target.dataset.index)); } 
        else { video.pause(); video.currentTime = 0; }
      });
    }, { threshold: 0.8 });
    document.querySelectorAll('.short-item').forEach(card => observer.observe(card));
  }

  async function playShort(videoEl, index) {
    if (index === 0 && !isVastLoaded) {
      isVastLoaded = true;
      try {
        const res = await fetch(VAST_URL);
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        const adUrl = xml.querySelector("MediaFile")?.textContent.trim();
        if (adUrl) {
          videoEl.src = adUrl; videoEl.muted = false; videoEl.loop = false;
          await videoEl.play();
          videoEl.onended = () => { videoEl.src = videoEl.dataset.src; videoEl.muted = true; videoEl.loop = true; videoEl.play(); };
          return;
        }
      } catch (e) { console.log("VAST skipped", e); }
    }
    videoEl.src = videoEl.dataset.src; videoEl.muted = true; videoEl.loop = true;
    videoEl.play().catch(() => {});
  }

  window.loadShorts = loadShorts;
  window.stopShorts = () => { document.querySelectorAll('.short-video').forEach(v => { v.pause(); v.src = ''; }); };
});
