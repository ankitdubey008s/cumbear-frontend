/**
 * ==========================================================================
 * CUMBEAR CHROME PLAYER CONTROLLER
 * - Native Chrome Video Player (Clean, bug-free, CORS unblocked)
 * - 16:9 5s Pre-Roll Ad Handover
 * - Full-Size Related Thumbnails & Hold-to-Preview
 * ==========================================================================
 */

(function () {
  'use strict';

  const API_BASE = 'https://cumbear-backend.vercel.app';
  const VAST_PLAYER_ZONE = '6056604';
  const VAST_PLAYER_URL = `https://s.magsrv.com/v1/vast.php?idz=${VAST_PLAYER_ZONE}`;
  const DEFAULT_EXOCLICK_CLICK = `https://s.magsrv.com/click.php?idzone=${VAST_PLAYER_ZONE}`;

  let currentVideoData = null;
  let exoclickClickUrl = DEFAULT_EXOCLICK_CLICK;
  let adTimer = null;

  function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  window.loadPlayerVideoById = async function (videoId) {
    const playerView = document.getElementById('playerView');
    if (!playerView) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await fetch(`${API_BASE}/api/videos/${videoId}`);
      const json = await res.json();

      if (json.success && json.data) {
        currentVideoData = json.data;
        mountPlayer();
        loadRelatedVideos(currentVideoData.category);
      }
    } catch (err) {
      console.error('Player load error:', err);
    }
  };

  function mountPlayer() {
    const container = document.getElementById('playerAspectBox');
    const titleEl = document.getElementById('playerTitle');
    if (!container || !currentVideoData) return;

    if (titleEl) titleEl.textContent = currentVideoData.title || 'CumBear Video';

    container.innerHTML = `
      <div class="player-poster-cover" id="playerPosterCover">
        <img class="player-poster-img" src="${currentVideoData.thumbnailUrl || '/cumb.png'}" alt="cover">
        <div class="player-big-play-btn">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>

      <div class="player-vast-overlay hidden" id="playerVastOverlay">
        <video class="player-vast-video" id="playerVastVideo" playsinline webkit-playsinline muted></video>
        
        <div class="vast-player-hud">
          <span class="vast-sponsor-badge">Sponsor Ad</span>
          <button class="vast-skip-btn" id="vastSkipBtn">Ad: 5s</button>
        </div>

        <button class="vast-bottom-cta" id="vastVisitBtn">
          <span>Visit Sponsor Site</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>

      <!-- Pure Native Chrome Player (NO crossorigin attribute so stream loads instantly) -->
      <video class="player-main-video" id="playerMainVideo" controls controlslist="nodownload" playsinline webkit-playsinline preload="auto"></video>
    `;

    bindPlayerEngine();
  }

  function bindPlayerEngine() {
    const posterCover = document.getElementById('playerPosterCover');
    const adOverlay = document.getElementById('playerVastOverlay');
    const adVideo = document.getElementById('playerVastVideo');
    const adSkipBtn = document.getElementById('vastSkipBtn');
    const adVisitBtn = document.getElementById('vastVisitBtn');
    const mainVideo = document.getElementById('playerMainVideo');

    // Tap Poster -> Starts 16:9 Pre-Roll VAST
    posterCover.addEventListener('click', () => {
      posterCover.classList.add('hidden');
      posterCover.style.display = 'none';
      startPreRollAd();
    });

    async function startPreRollAd() {
      adOverlay.classList.remove('hidden');

      let adMediaSrc = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(VAST_PLAYER_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, 'text/xml');

        const mediaFiles = xml.querySelectorAll('MediaFile');
        for (let i = 0; i < mediaFiles.length; i++) {
          const s = (mediaFiles[i].textContent || '').trim();
          if (s.startsWith('http')) {
            adMediaSrc = s;
            break;
          }
        }

        const clickThrough = xml.querySelector('ClickThrough');
        if (clickThrough) {
          const c = (clickThrough.textContent || '').trim();
          if (c.startsWith('http')) exoclickClickUrl = c;
        }
      } catch (err) {
        console.warn('VAST fetch fallback:', err);
      }

      if (!adMediaSrc) {
        adMediaSrc = `https://s.magsrv.com/v1/vast.php?idz=${VAST_PLAYER_ZONE}`;
      }

      adVideo.setAttribute('muted', '');
      adVideo.muted = true;
      adVideo.src = adMediaSrc;
      adVideo.load();
      adVideo.play().catch(() => finishAdAndStartMainVideo());

      let secondsLeft = 5;
      adSkipBtn.textContent = `Ad: ${secondsLeft}s`;
      adSkipBtn.classList.remove('unlocked');

      if (adTimer) clearInterval(adTimer);

      adTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
          adSkipBtn.textContent = `Ad: ${secondsLeft}s`;
        } else {
          clearInterval(adTimer);
          adTimer = null;
          adSkipBtn.classList.add('unlocked');
          adSkipBtn.textContent = 'Skip Ad ✕';
          adSkipBtn.onclick = (e) => {
            e.stopPropagation();
            finishAdAndStartMainVideo();
          };
        }
      }, 1000);

      adVideo.onended = finishAdAndStartMainVideo;
      adVideo.onerror = finishAdAndStartMainVideo;

      const openAdClick = (e) => {
        e.stopPropagation();
        window.open(exoclickClickUrl || DEFAULT_EXOCLICK_CLICK, '_blank', 'noopener,noreferrer');
      };
      adVideo.addEventListener('click', openAdClick);
      adVisitBtn.addEventListener('click', openAdClick);
    }

    function finishAdAndStartMainVideo() {
      if (adTimer) clearInterval(adTimer);
      adVideo.pause();
      adVideo.removeAttribute('src');
      adVideo.load();
      adOverlay.classList.add('hidden');
      adOverlay.style.display = 'none';

      mainVideo.src = currentVideoData.playableUrl;
      mainVideo.defaultPlaybackRate = 1.0;
      mainVideo.playbackRate = 1.0;
      mainVideo.muted = false;
      mainVideo.load();

      mainVideo.play().catch(() => {
        mainVideo.muted = true;
        mainVideo.play();
      });
    }

    const shareBtn = document.getElementById('playerShareBtn');
    const likeBtn = document.getElementById('playerLikeBtn');

    if (shareBtn) {
      shareBtn.onclick = () => {
        const url = window.location.href;
        if (navigator.share) {
          navigator.share({ title: currentVideoData?.title, url }).catch(() => {});
        } else {
          navigator.clipboard.writeText(url);
          alert('Video URL copied to clipboard!');
        }
      };
    }

    if (likeBtn) {
      likeBtn.onclick = () => {
        likeBtn.classList.toggle('liked');
      };
    }
  }

  // Load Related Videos
  async function loadRelatedVideos(category) {
    const grid = document.getElementById('relatedVideoGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="color:var(--text-muted);padding:2rem;">Loading recommendations...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/videos?limit=12&category=${encodeURIComponent(category || 'all')}&_=${Date.now()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        grid.innerHTML = '';
        const filtered = json.data.filter(v => !currentVideoData || v._id !== currentVideoData._id);
        const mixedList = typeof window.mixAffiliateVideos === "function" ? window.mixAffiliateVideos(filtered) : filtered;
        mixedList.forEach(v => {
          if (typeof window.renderMixedVideoCard === "function") {
            grid.appendChild(window.renderMixedVideoCard(v));
          } else {
            const card = document.createElement("div");
          card.className = 'video-card';

          const duration = (v.duration || '00:00').replace(/^HD\s*/i, '');
          const views = formatCount(Math.floor(Math.random() * (10000000 - 10000 + 1)) + 10000);
          const likeRate = Math.floor(Math.random() * (100 - 50 + 1)) + 50;
          const safeTitle = (v.title || 'Untitled Video').replace(/</g, '&lt;').replace(/>/g, '&gt;');

          card.innerHTML = `
            <div class="video-thumb">
              <img class="hd-thumb" src="${v.thumbnailUrl || '/cumb.png'}" alt="${safeTitle}" loading="lazy" decoding="async" draggable="false" onerror="this.src='/cumb.png'">
              <div class="preview-video-holder"></div>
              <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
              <div class="preview-loading"><div class="preview-spinner"></div></div>
              <span class="duration-badge">${duration}</span>
            </div>
            <div class="video-info">
              <div class="video-title">${safeTitle}</div>
              <div class="video-meta-row">
                <span class="provider-tag">${v.category || 'CumBear'}</span>
                <span>•</span>
                <span>${views} views</span>
                <span>•</span>
                <span>${likeRate}%</span>
              </div>
            </div>
          `;

          if (typeof window.attachHoldAndSlidePreview === 'function') {
            window.attachHoldAndSlidePreview(card, v, () => {
              window.loadPlayerVideoById(v._id);
            });
          } else {
            card.addEventListener('click', () => {
              window.loadPlayerVideoById(v._id);
            });
          }

          grid.appendChild(card);
          }
        });
      }
    } catch (e) {
      grid.innerHTML = '';
    }
  }
})();

