/**
 * ==========================================================================
 * CUMBEAR SHORTS CONTROLLER
 * Features: Seamless 16:9 Video Stream with Vertical CrakRevenue 5-Second
 * Unskippable Interstitials Every 3 Shorts
 * ==========================================================================
 */

(function () {
  'use strict';

  const API_BASE = 'https://cumbear-backend.vercel.app';
  // CrakRevenue Pre-roll / SmartLink URL
  const CRAK_PREROLL_URL = 'https://t.datsk3.com/425367/3788/0?target=prerolls&po=6456&aff_sub5=SF_006OG000004lmDN';

  let shortsData = [];
  let activeVideoElement = null;
  let currentActiveShort = null;
  let isGlobalMuted = true;
  let activeAdTimer = null;

  function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  window.loadShorts = async function (targetId = null) {
    const container = document.getElementById('shortsContainer');
    if (!container) return;

    document.body.classList.add('shorts-mode');
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

    const adThumbnails = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=720&h=1280&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=720&h=1280&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=720&h=1280&fit=crop'
    ];

    shortsData.forEach((video, index) => {
      // 1. Render Video Card
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

      // 2. Insert 5-Second Locked Vertical Ad AFTER EVERY 3 SHORTS
      if ((index + 1) % 3 === 0) {
        const adImage = adThumbnails[(index / 3) % adThumbnails.length];
        const adCard = document.createElement('div');
        adCard.className = 'crak-short-ad-card';
        adCard.dataset.isAd = 'true';

        adCard.innerHTML = `
          <div class="crak-ad-media-box" onclick="window.open('${CRAK_PREROLL_URL}', '_blank', 'noopener,noreferrer')">
            <img src="${adImage}" loading="lazy" alt="Sponsor Media">
            <div class="crak-ad-gradient-scrim"></div>
          </div>

          <button class="crak-ad-skip-pill" data-seconds="5">
            Ad: 5s
          </button>

          <div class="crak-ad-info-box">
            <span class="crak-ad-sponsor-badge">Sponsored Short</span>
            <h3 class="crak-ad-headline">Tap to Meet Real Babes Live Tonight</h3>
            <a href="${CRAK_PREROLL_URL}" target="_blank" rel="noopener noreferrer" class="crak-ad-cta-btn">
              Watch Live Uncut Stream ➔
            </a>
          </div>
        `;

        container.appendChild(adCard);
      }
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
    const container = document.getElementById('shortsContainer');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // A. If Current Item is an Ad Card
        if (entry.target.dataset.isAd === 'true') {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            handleAdCardLock(entry.target, container);
          } else {
            // Cancel timer if user managed to swipe away
            if (activeAdTimer) clearInterval(activeAdTimer);
          }
          return;
        }

        // B. If Current Item is a Regular Short Video
        const videoEl = entry.target.querySelector('video.short-video-element');
        const shortId = entry.target.dataset.id;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          activeVideoElement = videoEl;
          history.replaceState({ view: 'shortsView' }, '', `/shorts/${shortId}`);

          if (videoEl.src !== videoEl.dataset.src) {
            videoEl.src = videoEl.dataset.src;
            videoEl.load();
          }
          videoEl.muted = isGlobalMuted;
          videoEl.play().catch(() => {
            videoEl.muted = true;
            videoEl.play();
          });
        } else {
          if (videoEl) {
            videoEl.pause();
            videoEl.currentTime = 0;
            videoEl.playbackRate = 1.0;
          }
        }
      });
    }, { threshold: 0.7 });

    document.querySelectorAll('.short-card-item, .crak-short-ad-card').forEach(el => observer.observe(el));
  }

  // --- 5-Second Unskippable Countdown & Lock Controller ---
  function handleAdCardLock(adElement, container) {
    // Pause any background video
    if (activeVideoElement) activeVideoElement.pause();

    const skipBtn = adElement.querySelector('.crak-ad-skip-pill');
    if (!skipBtn) return;

    // 1. Lock scrolling on the shorts feed
    container.classList.add('scroll-locked');
    skipBtn.classList.remove('unlocked');

    let seconds = 5;
    skipBtn.textContent = `Ad: ${seconds}s`;

    if (activeAdTimer) clearInterval(activeAdTimer);

    activeAdTimer = setInterval(() => {
      seconds--;
      if (seconds > 0) {
        skipBtn.textContent = `Ad: ${seconds}s`;
      } else {
        clearInterval(activeAdTimer);
        activeAdTimer = null;

        // 2. Unlock scroll & activate skip button
        container.classList.remove('scroll-locked');
        skipBtn.classList.add('unlocked');
        skipBtn.textContent = 'Skip Ad ✕';

        skipBtn.onclick = (e) => {
          e.stopPropagation();
          // Scroll smoothly to next short card
          const nextCard = adElement.nextElementSibling;
          if (nextCard) {
            nextCard.scrollIntoView({ behavior: 'smooth' });
          }
        };
      }
    }, 1000);
  }

  // Dismiss more sheet
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('shortsMoreModal');
    const closeBtn = document.getElementById('closeMoreModal');
    if (closeBtn && modal) {
      closeBtn.onclick = () => modal.classList.add('hidden');
    }
  });

  window.stopShorts = function () {
    if (activeAdTimer) clearInterval(activeAdTimer);
    if (activeVideoElement) activeVideoElement.pause();
    document.querySelectorAll('.short-video-element').forEach(v => {
      v.pause();
      v.currentTime = 0;
    });
    const container = document.getElementById('shortsContainer');
    if (container) container.classList.remove('scroll-locked');
  };
})();
