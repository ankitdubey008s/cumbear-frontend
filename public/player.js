/**
 * ==========================================================================
 * CUMBEAR CUSTOM WEB PLAYER & 5-SECOND EXOCLICK PRE-ROLL AD ENGINE
 * Zone: 6056604
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
  let hideControlsTimer = null;

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
      <!-- Initial Poster Cover with Glowing Play Button -->
      <div class="player-poster-cover" id="playerPosterCover">
        <img class="player-poster-img" src="${currentVideoData.thumbnailUrl || '/cumb.png'}" alt="cover">
        <div class="player-big-play-btn">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>

      <!-- 16:9 Pre-Roll VAST Video Ad Overlay (ExoClick Zone 6056604) -->
      <div class="player-vast-overlay hidden" id="playerVastOverlay">
        <video class="player-vast-video" id="playerVastVideo" playsinline webkit-playsinline></video>
        
        <div class="vast-player-hud">
          <span class="vast-sponsor-badge">Sponsor Ad</span>
          <button class="vast-skip-btn" id="vastSkipBtn">Ad: 5s</button>
        </div>

        <button class="vast-bottom-cta" id="vastVisitBtn">
          <span>Visit Sponsor Site</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>

      <!-- Main Content Video -->
      <video class="player-main-video" id="playerMainVideo" playsinline webkit-playsinline preload="auto"></video>

      <!-- Custom Chrome Overlay Controls -->
      <div class="custom-controls-layer" id="customControlsLayer">
        <div class="controls-top-bar"></div>

        <div class="controls-bottom-bar">
          <!-- Scrubber Track -->
          <div class="player-scrubber-box" id="playerScrubberBox">
            <div class="player-scrubber-track">
              <div class="player-scrubber-buffer" id="scrubberBuffer"></div>
              <div class="player-scrubber-fill" id="scrubberFill"></div>
              <div class="player-scrubber-thumb" id="scrubberThumb"></div>
            </div>
          </div>

          <!-- Buttons Row -->
          <div class="controls-buttons-row">
            <div class="controls-left-group">
              <button class="control-icon-btn" id="ctrlPlayBtn" aria-label="Play/Pause">
                <svg id="ctrlPlayIcon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <svg id="ctrlPauseIcon" class="hidden" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              </button>

              <button class="control-icon-btn" id="ctrlMuteBtn" aria-label="Mute/Unmute">
                <svg id="ctrlSoundHigh" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                <svg id="ctrlSoundMuted" class="hidden" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              </button>

              <div class="volume-slider-box">
                <input type="range" class="volume-range-input" id="ctrlVolumeInput" min="0" max="1" step="0.05" value="1">
              </div>

              <span class="player-time-display" id="ctrlTimeDisplay">00:00 / 00:00</span>
            </div>

            <div class="controls-right-group">
              <button class="control-icon-btn" id="ctrlFullscreenBtn" aria-label="Fullscreen">
                <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Double Tap Rewind/Forward Indicators -->
      <div class="double-tap-indicator left" id="doubleTapLeft">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
        <span>10s</span>
      </div>
      <div class="double-tap-indicator right" id="doubleTapRight">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
        <span>10s</span>
      </div>
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

    const controlsLayer = document.getElementById('customControlsLayer');
    const ctrlPlayBtn = document.getElementById('ctrlPlayBtn');
    const ctrlPlayIcon = document.getElementById('ctrlPlayIcon');
    const ctrlPauseIcon = document.getElementById('ctrlPauseIcon');
    const ctrlMuteBtn = document.getElementById('ctrlMuteBtn');
    const ctrlSoundHigh = document.getElementById('ctrlSoundHigh');
    const ctrlSoundMuted = document.getElementById('ctrlSoundMuted');
    const ctrlVolumeInput = document.getElementById('ctrlVolumeInput');
    const ctrlTimeDisplay = document.getElementById('ctrlTimeDisplay');
    const ctrlFullscreenBtn = document.getElementById('ctrlFullscreenBtn');

    const scrubberBox = document.getElementById('playerScrubberBox');
    const scrubberFill = document.getElementById('scrubberFill');
    const scrubberThumb = document.getElementById('scrubberThumb');
    const scrubberBuffer = document.getElementById('scrubberBuffer');

    const doubleTapLeft = document.getElementById('doubleTapLeft');
    const doubleTapRight = document.getElementById('doubleTapRight');

    // Tap to Start Flow: triggers 16:9 5s Pre-Roll Ad first
    posterCover.addEventListener('click', () => {
      posterCover.classList.add('hidden');
      startPreRollAd();
    });

    async function startPreRollAd() {
      adOverlay.classList.remove('hidden');

      // 1. Fetch & parse ExoClick 16:9 Pre-Roll VAST
      try {
        const res = await fetch(VAST_PLAYER_URL);
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, 'text/xml');

        const mediaFiles = xml.querySelectorAll('MediaFile');
        let adMediaSrc = null;
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

        if (adMediaSrc) {
          adVideo.src = adMediaSrc;
          adVideo.load();
          adVideo.play().catch(() => {});
        } else {
          // If no media available, fallback to content
          finishAdAndStartMainVideo();
          return;
        }
      } catch (err) {
        console.warn('Pre-roll fetch error, proceeding to content:', err);
        finishAdAndStartMainVideo();
        return;
      }

      // 2. 5-Second Countdown
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

      // Handle ad clicks -> register to ExoClick zone
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

      // Start main content video smoothly
      mainVideo.src = currentVideoData.playableUrl;
      mainVideo.defaultPlaybackRate = 1.0;
      mainVideo.playbackRate = 1.0;
      mainVideo.load();
      mainVideo.play().catch(() => {
        mainVideo.muted = true;
        mainVideo.play();
      });
    }

    // --- Controls Engine ---
    function resetControlsTimer() {
      const box = document.getElementById('playerAspectBox');
      if (box) box.classList.add('controls-active');
      clearTimeout(hideControlsTimer);
      hideControlsTimer = setTimeout(() => {
        if (!mainVideo.paused && box) {
          box.classList.remove('controls-active');
        }
      }, 3000);
    }

    mainVideo.addEventListener('play', () => {
      ctrlPlayIcon.classList.add('hidden');
      ctrlPauseIcon.classList.remove('hidden');
      resetControlsTimer();
    });

    mainVideo.addEventListener('pause', () => {
      ctrlPlayIcon.classList.remove('hidden');
      ctrlPauseIcon.classList.add('hidden');
      const box = document.getElementById('playerAspectBox');
      if (box) box.classList.add('controls-active');
    });

    ctrlPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mainVideo.paused) mainVideo.play();
      else mainVideo.pause();
    });

    // Time & Scrubber updates
    mainVideo.addEventListener('timeupdate', () => {
      const cur = mainVideo.currentTime;
      const dur = mainVideo.duration || 0;
      ctrlTimeDisplay.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;

      if (dur > 0) {
        const pct = (cur / dur) * 100;
        scrubberFill.style.width = `${pct}%`;
        scrubberThumb.style.left = `${pct}%`;
      }
    });

    mainVideo.addEventListener('progress', () => {
      if (mainVideo.buffered.length > 0 && mainVideo.duration > 0) {
        const bufferedEnd = mainVideo.buffered.end(mainVideo.buffered.length - 1);
        const pct = (bufferedEnd / mainVideo.duration) * 100;
        scrubberBuffer.style.width = `${pct}%`;
      }
    });

    // Scrubber Seeking
    scrubberBox.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = scrubberBox.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (mainVideo.duration) {
        mainVideo.currentTime = pos * mainVideo.duration;
      }
    });

    // Volume Control
    ctrlVolumeInput.addEventListener('input', (e) => {
      e.stopPropagation();
      mainVideo.volume = parseFloat(e.target.value);
      mainVideo.muted = mainVideo.volume === 0;
      updateSoundIcons();
    });

    ctrlMuteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mainVideo.muted = !mainVideo.muted;
      updateSoundIcons();
    });

    function updateSoundIcons() {
      if (mainVideo.muted || mainVideo.volume === 0) {
        ctrlSoundHigh.classList.add('hidden');
        ctrlSoundMuted.classList.remove('hidden');
      } else {
        ctrlSoundHigh.classList.remove('hidden');
        ctrlSoundMuted.classList.add('hidden');
      }
    }

    // Fullscreen Toggle
    ctrlFullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const box = document.getElementById('playerAspectBox');
      if (!document.fullscreenElement) {
        box.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Double Tap Rewind/Forward (10s)
    let lastTapTime = 0;
    mainVideo.addEventListener('pointerup', (e) => {
      const now = Date.now();
      const diff = now - lastTapTime;
      const rect = mainVideo.getBoundingClientRect();
      const x = e.clientX - rect.left;

      if (diff < 300) {
        if (x < rect.width * 0.4) {
          mainVideo.currentTime = Math.max(0, mainVideo.currentTime - 10);
          doubleTapLeft.classList.add('show');
          setTimeout(() => doubleTapLeft.classList.remove('show'), 500);
        } else if (x > rect.width * 0.6) {
          mainVideo.currentTime = Math.min(mainVideo.duration, mainVideo.currentTime + 10);
          doubleTapRight.classList.add('show');
          setTimeout(() => doubleTapRight.classList.remove('show'), 500);
        }
      } else {
        resetControlsTimer();
      }
      lastTapTime = now;
    });
  }

  // Related Videos Feed
  async function loadRelatedVideos(category) {
    const grid = document.getElementById('relatedVideoGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="color:var(--text-muted);padding:2rem;">Loading recommendations...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/videos?limit=12&category=${encodeURIComponent(category || 'all')}&_=${Date.now()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        grid.innerHTML = '';
        json.data.forEach(v => {
          if (currentVideoData && v._id === currentVideoData._id) return;
          const card = document.createElement('div');
          card.className = 'video-card';
          card.innerHTML = `
            <div class="video-thumb">
              <img src="${v.thumbnailUrl || '/cumb.png'}" loading="lazy" alt="thumb">
              <span class="duration-badge">${(v.duration || '00:00').replace(/^HD\s*/i, '')}</span>
            </div>
            <div class="video-info">
              <div class="video-title">${(v.title || '').replace(/</g, '&lt;')}</div>
              <div class="video-meta-row">
                <span>${v.category || 'CumBear'}</span>
                <span>•</span>
                <span>${v.views || '120k'} views</span>
              </div>
            </div>
          `;
          card.addEventListener('click', () => {
            window.loadPlayerVideoById(v._id);
          });
          grid.appendChild(card);
        });
      }
    } catch (e) {
      grid.innerHTML = '';
    }
  }
})();
