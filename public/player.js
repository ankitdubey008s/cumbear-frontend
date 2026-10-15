/**
 * ==========================================================================
 * CUMBEAR PLAYER CONTROLLER
 * Features: Native Player, Actual Poster Cover, 1s Hold & Slide-to-Preview
 *           for Recommended Videos Grid
 * ==========================================================================
 */

(function () {
  'use strict';

  const API_BASE = 'https://cumbear-backend.vercel.app';
  const VAST_PLAYER_URL = 'https://s.magsrv.com/v1/vast.php?idz=6056604';

  let currentVideo = null;

  function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  function getRandomViews() {
    return Math.floor(Math.random() * (10000000 - 10000 + 1)) + 10000;
  }

  function getRandomLikeRate() {
    return Math.floor(Math.random() * (100 - 50 + 1)) + 50;
  }

  function generateVttBlob(title, langLabel) {
    const vtt = `WEBVTT\n\n00:00:01.000 --> 00:00:05.000\n[${langLabel}] ${title}\n\n00:00:06.000 --> 00:00:15.000\nWatch uncut scenes on CumBear.in\n`;
    return URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
  }

  window.loadPlayerVideoById = async function (videoId) {
    const titleEl = document.getElementById('playerTitle');
    const videoEl = document.getElementById('mainPlayerVideo');
    const posterCover = document.getElementById('playerPosterCover');
    const posterImg = document.getElementById('playerPosterImg');

    if (titleEl) titleEl.textContent = 'Loading video...';

    if (videoEl) {
      videoEl.pause();
      videoEl.src = '';
      videoEl.load();
    }

    try {
      const res = await fetch(`${API_BASE}/api/videos/${videoId}`);
      const json = await res.json();

      if (json.success && json.data) {
        currentVideo = json.data;
        history.replaceState({ view: 'playerView' }, '', `/?v=${currentVideo._id}`);

        if (titleEl) titleEl.textContent = currentVideo.title;
        document.getElementById('playerLikeCount').textContent = formatCount(Math.floor(Math.random() * 50000) + 5000);
        document.getElementById('playerViewsCount').textContent = formatCount(Math.floor(Math.random() * 8000000) + 100000);

        if (posterImg) {
          posterImg.src = currentVideo.thumbnailUrl || '/cumb.png';
          posterImg.onerror = () => { posterImg.src = '/cumb.png'; };
        }
        if (posterCover) {
          posterCover.classList.remove('hidden');
          posterCover.onclick = async () => {
            posterCover.classList.add('hidden');
            await startPlaybackSequence(videoEl, currentVideo);
          };
        }

        videoEl.setAttribute('controls', '');
        videoEl.setAttribute('controlslist', 'nodownload');
        videoEl.setAttribute('playsinline', '');
        videoEl.setAttribute('webkit-playsinline', '');
        videoEl.oncontextmenu = (e) => e.preventDefault();

        videoEl.querySelectorAll('track').forEach(t => t.remove());
        const languages = [
          { code: 'en', label: 'English', default: true },
          { code: 'es', label: 'Spanish' },
          { code: 'fr', label: 'French' },
          { code: 'de', label: 'German' },
          { code: 'hi', label: 'Hindi' },
          { code: 'ja', label: 'Japanese' },
          { code: 'zh', label: 'Chinese' },
          { code: 'ru', label: 'Russian' }
        ];

        languages.forEach(lang => {
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.srclang = lang.code;
          track.label = lang.label;
          track.src = generateVttBlob(currentVideo.title, lang.label);
          if (lang.default) track.default = true;
          videoEl.appendChild(track);
        });

        loadRelatedVideos(currentVideo.category);
      }
    } catch (err) {
      if (titleEl) titleEl.textContent = 'Error loading video.';
      console.error(err);
    }
  };

  async function startPlaybackSequence(videoEl, video) {
    await playVastPreRoll(videoEl, video.playableUrl);
  }

  async function playVastPreRoll(mainVideoEl, sourceUrl) {
    const overlay = document.getElementById('playerVastOverlay');
    const vastVideo = document.getElementById('playerVastVideo');
    const skipBtn = document.getElementById('playerVastSkipBtn');

    if (!overlay || !vastVideo || !skipBtn) {
      mainVideoEl.src = sourceUrl;
      mainVideoEl.load();
      mainVideoEl.play().catch(() => {});
      return;
    }

    try {
      const res = await fetch(VAST_PLAYER_URL);
      const xmlText = await res.text();
      const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
      const mediaUrl = xml.querySelector('MediaFile')?.textContent?.trim();

      if (mediaUrl) {
        overlay.classList.remove('hidden');
        vastVideo.src = mediaUrl;
        vastVideo.muted = true;
        vastVideo.playsInline = true;

        let timeLeft = 7;
        skipBtn.textContent = `Skip in ${timeLeft}s`;
        skipBtn.classList.remove('ready');

        await vastVideo.play().catch(() => {});

        vastVideo.addEventListener('click', () => { vastVideo.muted = false; }, { once: true });

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
          mainVideoEl.load();
          mainVideoEl.play().catch(() => {
            mainVideoEl.muted = true;
            mainVideoEl.play();
          });
        }

        vastVideo.onended = finishAd;
        vastVideo.onerror = finishAd;
        return;
      }
    } catch (e) {
      console.warn('Player VAST bypassed:', e);
    }

    overlay.classList.add('hidden');
    mainVideoEl.src = sourceUrl;
    mainVideoEl.load();
    mainVideoEl.play().catch(() => {});
  }

  // --- Recommended Videos (Same card design & Hold-to-Preview) ---
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
          const views = formatCount(getRandomViews());
          const likeRate = getRandomLikeRate();
          const safeTitle = (v.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

          attachHoldAndSlidePreview(card, v);
          grid.appendChild(card);
        });
      }
    } catch (e) {
      console.warn('Failed loading suggestions:', e);
    }
  }

  function attachHoldAndSlidePreview(card, video) {
    const thumb = card.querySelector('.video-thumb');
    const title = card.querySelector('.video-title');
    const holder = card.querySelector('.preview-video-holder');
    const timeline = card.querySelector('.preview-timeline');
    const timelineFill = card.querySelector('.preview-timeline-fill');
    const loading = card.querySelector('.preview-loading');

    let pressTimer = null;
    let isPreviewPlaying = false;
    let startX = 0;
    let startY = 0;
    let heldDown = false;
    let videoEl = null;

    thumb.addEventListener('contextmenu', (e) => e.preventDefault());
    thumb.querySelectorAll('img').forEach(img => {
      img.addEventListener('dragstart', (e) => e.preventDefault());
    });

    function stopPreview() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (isPreviewPlaying) {
        isPreviewPlaying = false;
        if (videoEl) {
          videoEl.pause();
          videoEl.src = '';
          videoEl.load();
          videoEl.remove();
          videoEl = null;
        }
        thumb.classList.remove('previewing');
        title.classList.remove('previewing-text');
        if (timeline) timeline.classList.remove('active');
        if (loading) loading.classList.remove('active');
        if (timelineFill) timelineFill.style.width = '0%';
      }
    }

    function startPreview() {
      document.querySelectorAll('.video-thumb.previewing').forEach(el => {
        const v = el.querySelector('video');
        if (v) { v.pause(); v.src = ''; v.load(); v.remove(); }
        el.classList.remove('previewing');
      });

      isPreviewPlaying = true;
      thumb.classList.add('previewing');
      title.classList.add('previewing-text');
      if (timeline) timeline.classList.add('active');
      if (loading) loading.classList.add('active');

      videoEl = document.createElement('video');
      videoEl.setAttribute('muted', '');
      videoEl.muted = true;
      videoEl.setAttribute('playsinline', '');
      videoEl.setAttribute('webkit-playsinline', '');
      videoEl.preload = 'auto';
      videoEl.src = video.playableUrl;
      videoEl.playbackRate = 1.0;

      videoEl.oncanplay = () => {
        if (loading) loading.classList.remove('active');
        videoEl.play().catch(() => stopPreview());
      };

      videoEl.ontimeupdate = () => {
        if (videoEl.currentTime > 60) {
          stopPreview();
          return;
        }
        if (timelineFill) {
          timelineFill.style.width = `${(videoEl.currentTime / 60) * 100}%`;
        }
      };

      videoEl.onerror = () => stopPreview();
      holder.appendChild(videoEl);
    }

    thumb.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      heldDown = true;

      if (isPreviewPlaying) {
        stopPreview();
        heldDown = false;
        return;
      }

      pressTimer = setTimeout(() => {
        if (heldDown) {
          startPreview();
        }
      }, 1000);
    });

    thumb.addEventListener('pointermove', (e) => {
      if (!heldDown && !isPreviewPlaying) return;

      const diffX = Math.abs(e.clientX - startX);
      const diffY = Math.abs(e.clientY - startY);

      if (!isPreviewPlaying && (diffX > 10 || diffY > 10)) {
        clearTimeout(pressTimer);
        pressTimer = null;
      } else if (isPreviewPlaying && videoEl && videoEl.duration) {
        const rect = thumb.getBoundingClientRect();
        const scrubRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        videoEl.currentTime = scrubRatio * Math.min(videoEl.duration, 60);
      }
    });

    thumb.addEventListener('pointerup', () => {
      heldDown = false;
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
        if (!isPreviewPlaying) {
          stopPreview();
          window.loadPlayerVideoById(video._id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });

    thumb.addEventListener('pointercancel', () => {
      heldDown = false;
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });

    card.querySelector('.video-info').addEventListener('click', () => {
      stopPreview();
      window.loadPlayerVideoById(video._id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

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
