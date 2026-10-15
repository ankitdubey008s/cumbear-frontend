/**
 * ==========================================================================
 * CUMBEAR PLAYER CONTROLLER
 * Features: 7-Sec Skip ExoClick VAST Pre-Roll, 50 Related Gems & Actions
 * ==========================================================================
 */

(function () {
  'use strict';

  const API_BASE = 'https://cumbear-backend.vercel.app';
  const VAST_PLAYER_URL = 'https://s.magsrv.com/v1/vast.php?idz=6045632';

  let currentVideo = null;

  function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  // --- 1. Load Single Video By ID ---
  window.loadPlayerVideoById = async function (videoId) {
    const titleEl = document.getElementById('playerTitle');
    const videoEl = document.getElementById('mainPlayerVideo');

    if (titleEl) titleEl.textContent = 'Loading scene...';

    try {
      const res = await fetch(`${API_BASE}/api/videos/${videoId}`);
      const json = await res.json();

      if (json.success && json.data) {
        currentVideo = json.data;
        history.replaceState({ view: 'playerView' }, '', `/?v=${currentVideo._id}`);

        // Update Metadata
        if (titleEl) titleEl.textContent = currentVideo.title;
        document.getElementById('playerLikeCount').textContent = formatCount(Math.floor(Math.random() * 50000) + 5000);
        document.getElementById('playerViewsCount').textContent = formatCount(Math.floor(Math.random() * 8000000) + 100000);

        // Run Pre-roll Ad then execute main video
        await playVastPreRoll(videoEl, currentVideo.playableUrl);

        // Load 50 Related Suggestions
        loadRelatedVideos(currentVideo.category);
      }
    } catch (err) {
      if (titleEl) titleEl.textContent = 'Error loading video.';
      console.error(err);
    }
  };

  // --- 2. 7-Second Skip ExoClick VAST Pre-Roll Engine ---
  async function playVastPreRoll(mainVideoEl, sourceUrl) {
    const overlay = document.getElementById('playerVastOverlay');
    const vastVideo = document.getElementById('playerVastVideo');
    const skipBtn = document.getElementById('playerVastSkipBtn');

    if (!overlay || !vastVideo || !skipBtn) {
      mainVideoEl.src = sourceUrl;
      mainVideoEl.play().catch(() => {});
      return;
    }

    try {
      const res = await fetch(VAST_PLAYER_URL);
      const xmlText = await res.text();
      const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
      const adUrl = xml.querySelector('MediaFile')?.textContent?.trim();

      if (adUrl) {
        overlay.classList.remove('hidden');
        vastVideo.src = adUrl;
        vastVideo.muted = false;

        let timeLeft = 7;
        skipBtn.textContent = `Skip in ${timeLeft}s`;
        skipBtn.classList.remove('ready');

        await vastVideo.play();

        const timer = setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            clearInterval(timer);
            skipBtn.textContent = 'Skip Ad ✕';
            skipBtn.classList.add('ready');
            skipBtn.onclick = () => finishAd();
          } else {
            skipBtn.textContent = `Skip in ${timeLeft}s`;
          }
        }, 1000);

        function finishAd() {
          clearInterval(timer);
          vastVideo.pause();
          vastVideo.removeAttribute('src');
          overlay.classList.add('hidden');

          mainVideoEl.src = sourceUrl;
          mainVideoEl.play().catch(() => {});
        }

        vastVideo.onended = finishAd;
        vastVideo.onerror = finishAd;
        return;
      }
    } catch (e) {
      console.warn('Player VAST failed, bypassing:', e);
    }

    // Fallback if ad is blocked/unavailable
    overlay.classList.add('hidden');
    mainVideoEl.src = sourceUrl;
    mainVideoEl.play().catch(() => {});
  }

  // --- 3. Load 50 Related Suggestions ---
  async function loadRelatedVideos(category) {
    const grid = document.getElementById('relatedVideoGrid');
    if (!grid) return;

    try {
      const res = await fetch(`${API_BASE}/api/videos?page=1&limit=50&category=${encodeURIComponent(category || 'all')}&_=${Date.now()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        grid.innerHTML = '';
        json.data.forEach(v => {
          if (currentVideo && v._id === currentVideo._id) return;

          const card = document.createElement('div');
          card.className = 'video-card';
          const duration = (v.duration || '00:00').replace(/^HD\s*/i, '');
          const safeTitle = (v.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');

          card.innerHTML = `
            <div class="video-thumb">
              <img src="${v.thumbnailUrl || '/cumb.png'}" loading="lazy" onerror="this.src='/cumb.png'">
              <span class="duration-badge">${duration}</span>
            </div>
            <div class="video-info">
              <div class="video-title">${safeTitle}</div>
              <div class="video-meta-row">
                <span class="provider-tag">${v.category || 'CumBear'}</span>
                <span>•</span>
                <span>${formatCount(Math.floor(Math.random() * 500000) + 10000)} views</span>
              </div>
            </div>
          `;
          card.addEventListener('click', () => {
            window.loadPlayerVideoById(v._id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          grid.appendChild(card);
        });
      }
    } catch (e) {
      console.warn('Failed loading related suggestions:', e);
    }
  }

  // Action Buttons
  document.addEventListener('DOMContentLoaded', () => {
    const likeBtn = document.getElementById('playerLikeBtn');
    const shareBtn = document.getElementById('playerShareBtn');

    if (likeBtn) {
      likeBtn.addEventListener('click', () => {
        likeBtn.classList.toggle('active');
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (!currentVideo) return;
        const shareUrl = `${window.location.origin}/?v=${currentVideo._id}`;
        if (navigator.share) {
          navigator.share({ title: currentVideo.title, url: shareUrl }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
        }
      });
    }
  });
})();
