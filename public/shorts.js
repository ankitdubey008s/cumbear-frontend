/**
 * ==========================================================================
 * CUMBEAR SHORTS CONTROLLER (In-Stream Vertical VAST Ad Engine Fix)
 * ==========================================================================
 */

(function () {
  'use strict';

  const API_BASE = 'https://cumbear-backend.vercel.app';
  const VAST_SHORTS_URL = 'https://s.magsrv.com/v1/vast.php?idzone=6056608';
  const CRAK_SHORTS_INTERSTITIAL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';

  let shortsData = [];
  let isVastPreRollPlayed = false;
  let activeVideoElement = null;
  let currentActiveShort = null;
  let isGlobalMuted = true;

  function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  window.loadShorts = async function (targetId = null) {
    const container = document.getElementById('shortsContainer');
    if (!container) return;

    document.body.classList.add('shorts-mode');
    isVastPreRollPlayed = false;

    container.innerHTML = '<div style="color:#ffffff;text-align:center;padding:4rem;font-weight:700;">Loading CumBear Shorts...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/videos?page=1&limit=50&sort=gem&_=${Date.now()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        shortsData = json.data;

        if (targetId) {
          const targetIndex = shortsData.findIndex(v => v._id === targetId);
          if (targetIndex > -1) {
            const [matched] = shortsData.splice(targetIndex, 1);
            shortsData.unshift(matched);
          }
        }
        renderShortsFeed();
      } else {
        container.innerHTML = '<div style="color:#ffffff;text-align:center;padding:4rem;">No shorts available.</div>';
      }
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;text-align:center;padding:4rem;">Error: ${err.message}</div>`;
    }
  };

  function renderShortsFeed() {
    const container = document.getElementById('shortsContainer');
    container.innerHTML = '';

    shortsData.forEach((video, index) => {
      if (index > 0 && index % 10 === 0) {
        const adCard = document.createElement('a');
        adCard.className = 'crak-short-interstitial';
        adCard.href = CRAK_SHORTS_INTERSTITIAL;
        adCard.target = '_blank';
        adCard.rel = 'noopener noreferrer';
        adCard.innerHTML = `
          <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=720&h=1280&fit=crop" loading="lazy" decoding="async">
          <div class="crak-short-badge">Sponsored Short</div>
          <div class="crak-short-cta-box">Tap to Meet Verified Babes Online</div>
        `;
        container.appendChild(adCard);
      }

      const card = document.createElement('div');
      card.className = 'short-card-item';
      card.dataset.index = index;
      card.dataset.id = video._id;

      const randomLikes = formatCount(Math.floor(Math.random() * (100000 - 1000 + 1)) + 1000);
      const randomViews = formatCount(Math.floor(Math.random() * (10000000 - 10000 + 1)) + 1000);
      const safeTitle = (video.title || 'Untitled Short').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      card.innerHTML = `
        <div class="shorts-top-bar">
          <button class="shorts-nav-btn back-btn-trigger" aria-label="Back to Home">
            <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>

          <button class="shorts-sound-btn sound-btn-trigger" aria-label="Toggle Sound">
            <svg class="icon-muted ${isGlobalMuted ? '' : 'hidden'}" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            <svg class="icon-unmuted ${isGlobalMuted ? 'hidden' : ''}" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            <span class="sound-label">${isGlobalMuted ? 'UNMUTE' : 'MUTE'}</span>
          </button>
        </div>

        <!-- 9:16 Vertical In-Stream Overlay Stage -->
        <div class="ad-instream-stage hidden">
          <video class="ad-instream-video" muted playsinline webkit-playsinline preload="auto"></video>
          <div class="ad-instream-badge">Ad: <span class="ad-timer-count">3</span>s</div>
        </div>

        <!-- 16:9 Stage for Content Video -->
        <div class="short-video-stage">
          <img class="short-poster-img" src="${video.thumbnailUrl || '/cumb.png'}" loading="eager" alt="poster">
          <video class="short-video-element" playsinline webkit-playsinline loop preload="auto" data-src="${video.playableUrl}" oncontextmenu="return false;"></video>

          <div class="center-play-hud">
            <svg class="hud-play" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <svg class="hud-pause hidden" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </div>

          <div class="double-tap-heart">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
        </div>

        <div class="speed-indicator-pill">
          <span>⚡ 2X SPEED</span>
        </div>

        <div class="side-hold-zone left"></div>
        <div class="side-hold-zone right"></div>
        <div class="short-scrim"></div>

        <div class="short-progress-track">
          <div class="short-progress-fill"></div>
        </div>

        <div class="short-action-stack">
          <button class="short-btn-unit like-btn" aria-label="Like">
            <div class="short-btn-icon">
              <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <span class="short-btn-label">${randomLikes}</span>
          </button>

          <div class="short-btn-unit">
            <div class="short-btn-icon">
              <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <span class="short-btn-label">${randomViews}</span>
          </div>

          <button class="short-btn-unit share-btn" aria-label="Share">
            <div class="short-btn-icon">
              <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <span class="short-btn-label">Share</span>
          </button>

          <button class="short-btn-unit more-btn" aria-label="More options">
            <div class="short-btn-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </div>
            <span class="short-btn-label">More</span>
          </button>
        </div>

        <div class="short-info-zone">
          <div class="short-creator">
            <span class="short-creator-badge"></span>
            <span>CumBear</span>
          </div>
          <div class="short-title-text">${safeTitle}</div>
          <button class="watch-full-btn" data-id="${video._id}">
            <span>Watch Full Video</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="preview-ended-overlay hidden">
          <div class="preview-ended-title">3-Minute Preview Ended</div>
          <div class="preview-ended-subtitle">Watch the full video on CumBear Player</div>
          <button class="watch-full-btn" data-id="${video._id}">Watch Full Scene</button>
        </div>
      `;

      attachShortCardEvents(card, video);
      container.appendChild(card);
    });

    setupShortsObserver();
  }

  function attachShortCardEvents(card, video) {
    const backBtn = card.querySelector('.back-btn-trigger');
    const soundBtn = card.querySelector('.sound-btn-trigger');
    const watchFullBtns = card.querySelectorAll('.watch-full-btn');
    const likeBtn = card.querySelector('.like-btn');
    const shareBtn = card.querySelector('.share-btn');
    const moreBtn = card.querySelector('.more-btn');
    const videoEl = card.querySelector('video.short-video-element');
    const poster = card.querySelector('.short-poster-img');
    const progressFill = card.querySelector('.short-progress-fill');
    const endedOverlay = card.querySelector('.preview-ended-overlay');
    const speedPill = card.querySelector('.speed-indicator-pill');
    const heart = card.querySelector('.double-tap-heart');
    const hud = card.querySelector('.center-play-hud');
    const hudPlay = card.querySelector('.hud-play');
    const hudPause = card.querySelector('.hud-pause');
    const sideZones = card.querySelectorAll('.side-hold-zone');

    let lastTap = 0;
    let holdTimer = null;
    let isSpeedLocked = false;
    let isHoldingSpeed = false;
    let holdStartY = 0;

    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.stopShorts();
        document.body.classList.remove('shorts-mode');
        if (window.switchView) window.switchView('homeView', true);
      });
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isGlobalMuted = !isGlobalMuted;
        updateSoundStateAcrossAllShorts();
      });
    }

    watchFullBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.stopShorts();
        document.body.classList.remove('shorts-mode');
        const vidId = btn.dataset.id || video._id;
        if (window.switchView) window.switchView('playerView', true);
        if (typeof window.loadPlayerVideoById === 'function') {
          window.loadPlayerVideoById(vidId);
        }
      });
    });

    videoEl.addEventListener('playing', () => {
      poster.classList.add('loaded');
    });

    function showHud(isPaused) {
      if (isPaused) {
        hudPlay.classList.remove('hidden');
        hudPause.classList.add('hidden');
      } else {
        hudPlay.classList.add('hidden');
        hudPause.classList.remove('hidden');
      }
      hud.classList.add('show');
      setTimeout(() => { hud.classList.remove('show'); }, 500);
    }

    function triggerLike() {
      likeBtn.classList.add('liked');
      heart.classList.remove('animate');
      void heart.offsetWidth;
      heart.classList.add('animate');
    }

    card.addEventListener('pointerup', (e) => {
      if (e.target.closest('.short-action-stack') || e.target.closest('.watch-full-btn') || e.target.closest('.shorts-top-bar')) return;
      if (isHoldingSpeed) return;

      const now = Date.now();
      if (now - lastTap < 300) {
        triggerLike();
      } else {
        setTimeout(() => {
          if (Date.now() - lastTap >= 280) {
            if (videoEl.paused) {
              videoEl.play();
              showHud(false);
            } else {
              videoEl.pause();
              showHud(true);
            }
          }
        }, 280);
      }
      lastTap = now;
    });

    sideZones.forEach(zone => {
      zone.addEventListener('pointerdown', (e) => {
        holdStartY = e.clientY;
        holdTimer = setTimeout(() => {
          isHoldingSpeed = true;
          videoEl.playbackRate = 2.0;
          speedPill.classList.add('active');
          speedPill.innerHTML = '<span>⚡ 2X SPEED (Pull down to lock)</span>';
        }, 300);
      });

      zone.addEventListener('pointermove', (e) => {
        if (!isHoldingSpeed) return;
        const deltaY = e.clientY - holdStartY;
        if (deltaY > 50 && !isSpeedLocked) {
          isSpeedLocked = true;
          speedPill.classList.add('locked');
          speedPill.innerHTML = '<span>🔒 2X SPEED LOCKED</span>';
        }
      });

      const releaseSpeed = () => {
        clearTimeout(holdTimer);
        if (isHoldingSpeed && !isSpeedLocked) {
          isHoldingSpeed = false;
          videoEl.playbackRate = 1.0;
          speedPill.classList.remove('active');
        }
      };

      zone.addEventListener('pointerup', releaseSpeed);
      zone.addEventListener('pointercancel', releaseSpeed);
      zone.addEventListener('pointerleave', releaseSpeed);
    });

    card.addEventListener('click', () => {
      if (isSpeedLocked) {
        isSpeedLocked = false;
        isHoldingSpeed = false;
        videoEl.playbackRate = 1.0;
        speedPill.classList.remove('active', 'locked');
      }
    });

    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        likeBtn.classList.toggle('liked');
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/shorts/${video._id}`;
        if (navigator.share) {
          navigator.share({ title: video.title, url: shareUrl }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareUrl);
          alert('Short URL copied to clipboard!');
        }
      });
    }

    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentActiveShort = video;
        const modal = document.getElementById('shortsMoreModal');
        if (modal) modal.classList.remove('hidden');
      });
    }

    videoEl.ontimeupdate = () => {
      const current = videoEl.currentTime;
      if (progressFill) {
        progressFill.style.width = `${Math.min(100, (current / 180) * 100)}%`;
      }
      if (current >= 180) {
        videoEl.pause();
        if (endedOverlay) endedOverlay.classList.remove('hidden');
      }
    };
  }

  function updateSoundStateAcrossAllShorts() {
    document.querySelectorAll('.short-card-item').forEach(card => {
      const v = card.querySelector('video.short-video-element');
      const soundBtn = card.querySelector('.sound-btn-trigger');
      if (!v || !soundBtn) return;

      v.muted = isGlobalMuted;
      const iconMuted = soundBtn.querySelector('.icon-muted');
      const iconUnmuted = soundBtn.querySelector('.icon-unmuted');
      const soundLabel = soundBtn.querySelector('.sound-label');

      if (isGlobalMuted) {
        iconMuted.classList.remove('hidden');
        iconUnmuted.classList.add('hidden');
        soundLabel.textContent = 'UNMUTE';
      } else {
        iconMuted.classList.add('hidden');
        iconUnmuted.classList.remove('hidden');
        soundLabel.textContent = 'MUTE';
      }
    });
  }

  function setupShortsObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const videoEl = entry.target.querySelector('video.short-video-element');
        const shortIndex = parseInt(entry.target.dataset.index, 10);
        const shortId = entry.target.dataset.id;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          activeVideoElement = videoEl;
          history.replaceState({ view: 'shortsView' }, '', `/shorts/${shortId}`);
          playActiveShort(entry.target, videoEl, shortIndex);
        } else {
          if (videoEl) {
            videoEl.pause();
            videoEl.currentTime = 0;
            videoEl.playbackRate = 1.0;
          }
        }
      });
    }, { threshold: 0.7 });

    document.querySelectorAll('.short-card-item').forEach(el => observer.observe(el));
  }

  // Robust VAST Media Extractor with Multiple Fallbacks
  async function resolveVastMediaUrl(vastUrl) {
    // 1. Direct fetch attempt
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s max wait

      const res = await fetch(vastUrl, { signal: controller.signal, credentials: 'omit' });
      clearTimeout(timeoutId);

      const xmlText = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      const mediaFiles = xmlDoc.querySelectorAll('MediaFile');
      for (let i = 0; i < mediaFiles.length; i++) {
        const src = (mediaFiles[i].textContent || '').trim();
        if (src.startsWith('http')) {
          return src;
        }
      }

      // Check CDATA content
      const cdataMatches = xmlText.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/i);
      if (cdataMatches && cdataMatches[0]) {
        return cdataMatches[0].replace(/&amp;/g, '&');
      }
    } catch (e) {
      console.warn('VAST fetch attempt failed, using direct stream resolution:', e.message);
    }

    // 2. Fallback to direct ExoClick CDN media source
    return 'https://s.magsrv.com/v1/vast.php?idzone=6056608';
  }

  async function playActiveShort(cardElement, videoEl, index) {
    if (!videoEl) return;

    const adStage = cardElement.querySelector('.ad-instream-stage');
    const adVideo = cardElement.querySelector('.ad-instream-video');
    const timerText = cardElement.querySelector('.ad-timer-count');

    // Fire in-stream VAST on initial video
    if (index === 0 && !isVastPreRollPlayed && adStage && adVideo) {
      isVastPreRollPlayed = true;

      const mediaUrl = await resolveVastMediaUrl(VAST_SHORTS_URL);

      if (mediaUrl) {
        adStage.classList.remove('hidden');
        adVideo.setAttribute('muted', '');
        adVideo.muted = true;
        adVideo.setAttribute('playsinline', '');
        adVideo.setAttribute('webkit-playsinline', '');
        adVideo.src = mediaUrl;
        adVideo.load();

        // Attempt playback immediately
        const playPromise = adVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Ad auto-play prevented, proceeding to content:', err);
            finishAdAndPlayContent();
          });
        }

        let secondsLeft = 3;
        if (timerText) timerText.textContent = secondsLeft;

        const countdownInterval = setInterval(() => {
          secondsLeft--;
          if (timerText) timerText.textContent = secondsLeft;
          if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            finishAdAndPlayContent();
          }
        }, 1000);

        function finishAdAndPlayContent() {
          clearInterval(countdownInterval);
          adVideo.pause();
          adVideo.removeAttribute('src');
          adVideo.load();
          adStage.classList.add('hidden');

          // Smooth handoff to 16:9 main video
          if (videoEl.src !== videoEl.dataset.src) {
            videoEl.src = videoEl.dataset.src;
            videoEl.load();
          }
          videoEl.muted = isGlobalMuted;
          videoEl.play().catch(() => {
            videoEl.muted = true;
            videoEl.play();
          });
        }

        adVideo.onended = finishAdAndPlayContent;
        adVideo.onerror = finishAdAndPlayContent;
        return;
      }
    }

    if (adStage) adStage.classList.add('hidden');

    if (videoEl.src !== videoEl.dataset.src) {
      videoEl.src = videoEl.dataset.src;
      videoEl.load();
    }
    videoEl.muted = isGlobalMuted;
    videoEl.play().catch(() => {
      videoEl.muted = true;
      videoEl.play();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('shortsMoreModal');
    const closeBtn = document.getElementById('closeMoreModal');
    const downloadBtn = document.getElementById('downloadShortBtn');

    if (closeBtn && modal) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        modal.classList.add('hidden');
      };
    }

    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      };
    }

    if (downloadBtn) {
      downloadBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentActiveShort) return;
        if (modal) modal.classList.add('hidden');

        try {
          const videoUrl = currentActiveShort.playableUrl;
          const fileName = `CumBear_${currentActiveShort._id || 'short'}.mp4`;
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } catch (err) {
          const link = document.createElement('a');
          link.href = currentActiveShort.playableUrl;
          link.download = `CumBear_${currentActiveShort._id}.mp4`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };
    }
  });

  window.stopShorts = function () {
    if (activeVideoElement) activeVideoElement.pause();
    document.querySelectorAll('.short-video-element').forEach(v => {
      v.pause();
      v.currentTime = 0;
    });
    document.querySelectorAll('.ad-instream-video').forEach(a => {
      a.pause();
      a.removeAttribute('src');
    });
  };
})();
