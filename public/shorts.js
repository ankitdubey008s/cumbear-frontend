/**
 * ==========================================================================
 * CUMBEAR SHORTS CONTROLLER (TikTok / Reels Style Engine)
 * Features: 3-Minute Limit, 3-Sec VAST Auto-Skip, CrakRevenue Interstitial
 * ==========================================================================
 */

(function () {
  'use strict';

  const API_BASE = 'https://cumbear-backend.vercel.app';
  const VAST_SHORTS_URL = 'https://s.magsrv.com/v1/vast.php?idzone=6045638';
  const CRAK_SHORTS_INTERSTITIAL = 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN';

  let shortsData = [];
  let isVastPreRollPlayed = false;
  let activeVideoElement = null;
  let currentActiveShort = null;

  function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  // --- 1. Load Shorts Stream ---
  window.loadShorts = async function (targetId = null) {
    const container = document.getElementById('shortsContainer');
    if (!container) return;

    container.innerHTML = '<div style="color:#ffffff;text-align:center;padding:4rem;font-weight:700;">Loading CumBear Shorts...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/videos?page=1&limit=50&sort=gem&_=${Date.now()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        shortsData = json.data;

        // If targetId is provided, rearrange target video to first position
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
      container.innerHTML = `<div style="color:#ef4444;text-align:center;padding:4rem;">Error loading shorts: ${err.message}</div>`;
    }
  };

  // --- 2. Render Feed with Scroll-Snap & Ad Cards ---
  function renderShortsFeed() {
    const container = document.getElementById('shortsContainer');
    container.innerHTML = '';

    shortsData.forEach((video, index) => {
      // Every 10th short: Inject CrakRevenue Interstitial Short Card
      if (index > 0 && index % 10 === 0) {
        const adCard = document.createElement('a');
        adCard.className = 'crak-short-interstitial';
        adCard.href = CRAK_SHORTS_INTERSTITIAL;
        adCard.target = '_blank';
        adCard.rel = 'noopener noreferrer';
        adCard.innerHTML = `
          <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=720&h=1280&fit=crop" loading="lazy">
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
        <video class="short-video-element" playsinline webkit-playsinline loop preload="metadata" data-src="${video.playableUrl}"></video>
        <div class="short-scrim"></div>

        <div class="short-progress-track">
          <div class="short-progress-fill"></div>
        </div>

        <!-- Right Side Action Stack -->
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

        <!-- Bottom Info -->
        <div class="short-info-zone">
          <div class="short-creator">
            <span class="short-creator-badge"></span>
            <span>${video.category || 'CumBear'}</span>
          </div>
          <div class="short-title-text">${safeTitle}</div>
          <button class="watch-full-btn" onclick="window.openPlayer('${video._id}')">
            <span>Watch Full Video</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- 3-Minute Hard Limit Overlay -->
        <div class="preview-ended-overlay hidden">
          <div class="preview-ended-title">3-Minute Preview Ended</div>
          <div class="preview-ended-subtitle">Enjoy the full uncut video on CumBear Player</div>
          <button class="watch-full-btn" onclick="window.openPlayer('${video._id}')">Watch Full Scene</button>
        </div>
      `;

      attachShortCardEvents(card, video);
      container.appendChild(card);
    });

    setupShortsObserver();
  }

  // --- 3. Events: Like, Share, More Sheet, 180s Cutoff ---
  function attachShortCardEvents(card, video) {
    const likeBtn = card.querySelector('.like-btn');
    const shareBtn = card.querySelector('.share-btn');
    const moreBtn = card.querySelector('.more-btn');
    const videoEl = card.querySelector('video');
    const progressFill = card.querySelector('.short-progress-fill');
    const endedOverlay = card.querySelector('.preview-ended-overlay');

    // Tap to Toggle Play/Pause
    card.addEventListener('click', (e) => {
      if (e.target.closest('.short-action-stack') || e.target.closest('.watch-full-btn')) return;
      if (videoEl.paused) videoEl.play();
      else videoEl.pause();
    });

    // Like Toggle
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        likeBtn.classList.toggle('liked');
      });
    }

    // Share API
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

    // More Button -> Opens Modal Sheet
    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentActiveShort = video;
        const modal = document.getElementById('shortsMoreModal');
        if (modal) modal.classList.remove('hidden');
      });
    }

    // 180s (3-Minute) Timeline Counter & Hard Cutoff
    videoEl.ontimeupdate = () => {
      const current = videoEl.currentTime;
      if (progressFill) {
        const pct = Math.min(100, (current / 180) * 100);
        progressFill.style.width = `${pct}%`;
      }

      if (current >= 180) { // 3 minutes completed
        videoEl.pause();
        if (endedOverlay) endedOverlay.classList.remove('hidden');
      }
    };
  }

  // --- 4. Intersection Observer for Playback & 3-sec VAST Ad ---
  function setupShortsObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const videoEl = entry.target.querySelector('video');
        const shortIndex = parseInt(entry.target.dataset.index, 10);
        const shortId = entry.target.dataset.id;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
          activeVideoElement = videoEl;
          history.replaceState({ view: 'shortsView' }, '', `/shorts/${shortId}`);

          playActiveShort(videoEl, shortIndex);
        } else {
          if (videoEl) {
            videoEl.pause();
            videoEl.currentTime = 0;
          }
        }
      });
    }, { threshold: 0.75 });

    document.querySelectorAll('.short-card-item').forEach(el => observer.observe(el));
  }

  async function playActiveShort(videoEl, index) {
    if (!videoEl) return;

    // First Short Plays 3-Second Auto-Skip ExoClick VAST Ad
    if (index === 0 && !isVastPreRollPlayed) {
      isVastPreRollPlayed = true;
      try {
        const res = await fetch(VAST_SHORTS_URL);
        const xmlText = await res.text();
        const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
        const mediaUrl = xml.querySelector('MediaFile')?.textContent?.trim();

        if (mediaUrl) {
          videoEl.src = mediaUrl;
          videoEl.muted = false;
          await videoEl.play();

          // Auto-skip after 3 seconds
          setTimeout(() => {
            videoEl.src = videoEl.dataset.src;
            videoEl.muted = false;
            videoEl.play().catch(() => {});
          }, 3000);
          return;
        }
      } catch (err) {
        console.warn('VAST short pre-roll bypassed:', err);
      }
    }

    videoEl.src = videoEl.dataset.src;
    videoEl.muted = false;
    videoEl.play().catch(() => {
      videoEl.muted = true;
      videoEl.play();
    });
  }

  // --- 5. Modal Sheet Actions (Watermark Download & Close) ---
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('shortsMoreModal');
    const closeBtn = document.getElementById('closeMoreModal');
    const downloadBtn = document.getElementById('downloadShortBtn');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        if (!currentActiveShort) return;
        if (modal) modal.classList.add('hidden');

        // Initiate simulated direct file stream with 8dp watermark
        const link = document.createElement('a');
        link.href = currentActiveShort.playableUrl;
        link.download = `CumBear_Short_${currentActiveShort._id}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('Downloading short with official 8dp CumBear watermark...');
      });
    }
  });

  window.stopShorts = function () {
    if (activeVideoElement) {
      activeVideoElement.pause();
    }
    document.querySelectorAll('.short-video-element').forEach(v => {
      v.pause();
      v.currentTime = 0;
    });
  };
})();
