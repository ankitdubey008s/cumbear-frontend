/**
 * ==========================================================================
 * CUMBEAR — SHORTS CONTROLLER (v2)
 * --------------------------------------------------------------------------
 * - Leaderboard below top-bar (mobile rectangle / desktop leaderboard)
 * - First short: poster + play button; first tap fires popunder
 * - After first tap: autoplay subsequent shorts
 * - Vertical ExoClick VAST every 3 shorts (5s skip, 6s hard timeout)
 * - Network isolation: only visible short has src set
 * - Per-short URL: /shorts/:id
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearShortsLoaded) return;
  window.__cumbearShortsLoaded = true;

  const CFG = window.CUMBEAR;
  if (!CFG) {
    console.warn('[CumBearShorts] config.js not loaded — aborting');
    return;
  }

  const ZONES         = CFG.exo.zones;
  const CONSENT       = CFG.consent;
  const COOLDOWNS     = CONSENT.cookies;
  const AD_EVERY      = 3;
  const AD_SKIP_MS    = 5000;
  const AD_LOCK_MAX   = 6000;
  const PREVIEW_MAX   = CFG.ux.shortsPreviewMaxSeconds;

  let shortsData         = [];
  let activeVideoEl      = null;
  let observer           = null;
  let isGlobalMuted      = true;
  let currentVastReqId   = 0;
  let adSkipTimer        = null;
  let adLockTimer        = null;
  let exoclickClickUrl   = CFG.helpers.clickUrl(ZONES.shortsVast);
  let firstInteraction   = false;

  /* ---------- utils ---------- */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatCount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function stableViews(id) { return 10000 + (hashString(String(id) + 'v') % 9990000); }
  function stableLikes(id) { return 1000 + (hashString(String(id) + 'l') % 99000); }

  function consentAllows() {
    return window.CumBearConsent && window.CumBearConsent.isAdAllowed() === true;
  }

  function cooldownAllows(name) {
    try {
      const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
      return !m;
    } catch (e) { return true; }
  }

  /* ---------- leaderboard ---------- */
  function mountLeaderboard() {
    const slot = document.getElementById('shortsLeaderboard');
    if (!slot || slot.dataset.mounted) return;
    slot.dataset.mounted = '1';

    slot.innerHTML =
      '<div class="ad-banner-mobile">' +
        '<ins class="eas6a97888e2" data-zoneid="6057032"></ins>' +
      '</div>' +
      '<div class="ad-banner-desktop">' +
        '<ins class="eas6a97888e2" data-zoneid="6056586"></ins>' +
      '</div>';

    if (window.CumBearAds && typeof window.CumBearAds.refreshBanners === 'function') {
      try { window.CumBearAds.refreshBanners(); } catch (e) { /* ignore */ }
    }
  }

  /* ---------- load ---------- */
  window.loadShorts = function (targetId) {
    const container = document.getElementById('shortsContainer');
    if (!container) return;

    document.body.classList.add('shorts-mode');
    firstInteraction = false;
    mountLeaderboard();

    container.innerHTML = '<div class="shorts-loading">Loading CumBear Shorts…</div>';

    fetch(CFG.helpers.videoListUrl({ page: 1, limit: 50, sort: 'gem', _: Date.now() }), { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (!json || !json.success || !Array.isArray(json.data) || json.data.length === 0) {
          container.innerHTML = '<div class="shorts-empty">No shorts available.</div>';
          return;
        }

        shortsData = json.data;
        if (targetId) {
          const idx = shortsData.findIndex(function (v) { return v._id === targetId; });
          if (idx > -1) {
            const item = shortsData.splice(idx, 1)[0];
            shortsData.unshift(item);
          }
        }
        renderFeed();
      })
      .catch(function (err) {
        console.error('[CumBearShorts] load error:', err);
        container.innerHTML = '<div class="shorts-empty">Could not load shorts. Retry from Home.</div>';
      });
  };

  /* ---------- render ---------- */
  function renderFeed() {
    const container = document.getElementById('shortsContainer');
    if (!container) return;
    container.innerHTML = '';

    const frag = document.createDocumentFragment();

    shortsData.forEach(function (video, index) {
      frag.appendChild(buildShortCard(video, index));
      if ((index + 1) % AD_EVERY === 0) {
        frag.appendChild(buildVastCard(index));
      }
    });

    container.appendChild(frag);
    wireStaticButtons();
    setupObserver();
  }

  /* ---------- short card ---------- */
  function buildShortCard(video, index) {
    const card = document.createElement('div');
    card.className = 'short-card-item';
    card.dataset.index = index;
    card.dataset.id = video._id;

    const likes   = formatCount(stableLikes(video._id));
    const views   = formatCount(stableViews(video._id));
    const title   = escapeHtml(video.title || 'Untitled Short');
    const thumb   = escapeHtml(video.thumbnailUrl || '/cumb.png');
    const eager   = index === 0 ? 'eager' : 'lazy';
    const isFirst = index === 0;

    card.innerHTML =
      '<div class="shorts-top-bar">' +
        '<button class="shorts-nav-btn back-btn-trigger" aria-label="Back">' +
          '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
        '</button>' +
        '<button class="shorts-sound-btn sound-btn-trigger" aria-label="Toggle Sound">' +
          '<svg class="icon-muted" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>' +
          '<svg class="icon-unmuted hidden" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>' +
          '<span class="sound-label">UNMUTE</span>' +
        '</button>' +
      '</div>' +

      '<div class="short-video-stage">' +
        '<img class="short-poster-img" src="' + thumb + '" loading="' + eager + '" alt="poster">' +
        '<video class="short-video-element" playsinline webkit-playsinline loop preload="none" ' +
                'data-src="' + escapeHtml(video.playableUrl || '') + '"></video>' +

        (isFirst
          ? '<div class="first-short-play-cover" id="firstShortPlayCover">' +
              '<div class="first-play-btn-circle">' +
                '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
              '</div>' +
            '</div>'
          : '') +

        '<div class="center-play-hud">' +
          '<svg class="hud-play" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
          '<svg class="hud-pause hidden" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
        '</div>' +

        '<div class="double-tap-heart">' +
          '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
        '</div>' +
      '</div>' +

      '<div class="speed-indicator-pill"><span>⚡ 2X SPEED</span></div>' +
      '<div class="side-hold-zone left"></div>' +
      '<div class="side-hold-zone right"></div>' +
      '<div class="short-scrim"></div>' +

      '<div class="short-progress-track"><div class="short-progress-fill"></div></div>' +

      '<div class="short-action-stack">' +
        '<button class="short-btn-unit like-btn" aria-label="Like">' +
          '<div class="short-btn-icon"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></div>' +
          '<span class="short-btn-label">' + likes + '</span>' +
        '</button>' +

        '<div class="short-btn-unit">' +
          '<div class="short-btn-icon"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>' +
          '<span class="short-btn-label">' + views + '</span>' +
        '</div>' +

        '<button class="short-btn-unit share-btn" aria-label="Share">' +
          '<div class="short-btn-icon"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>' +
          '<span class="short-btn-label">Share</span>' +
        '</button>' +

        '<button class="short-btn-unit more-btn" aria-label="More">' +
          '<div class="short-btn-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg></div>' +
          '<span class="short-btn-label">More</span>' +
        '</button>' +
      '</div>' +

      '<div class="short-info-zone">' +
        '<div class="short-creator"><span class="short-creator-badge"></span><span>CumBear</span></div>' +
        '<div class="short-title-text">' + title + '</div>' +
        '<button class="watch-full-btn" data-id="' + video._id + '">' +
          '<span>Watch Full Video</span>' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</button>' +
      '</div>' +

      '<div class="preview-ended-overlay hidden">' +
        '<div class="preview-ended-title">Preview Ended</div>' +
        '<div class="preview-ended-subtitle">Watch the full video on CumBear Player</div>' +
        '<button class="watch-full-btn" data-id="' + video._id + '">Watch Full Scene</button>' +
      '</div>';

    wireShortCard(card, video, index);
    return card;
  }

  /* ---------- VAST card ---------- */
  function buildVastCard(index) {
    const card = document.createElement('div');
    card.className = 'exoclick-short-vast-card';
    card.dataset.isVastAd = 'true';
    card.dataset.adIndex = index;

    card.innerHTML =
      '<button class="vast-ad-skip-pill" type="button" disabled>Ad: 5s</button>' +
      '<div class="vast-vertical-stage">' +
        '<video class="vast-vertical-video" muted playsinline webkit-playsinline preload="none"></video>' +
      '</div>' +
      '<div class="ad-bottom-cta-container">' +
        '<span class="ad-sponsor-label">Sponsored</span>' +
        '<button class="ad-visit-site-btn" type="button">' +
          '<span>Visit Site</span>' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
        '</button>' +
      '</div>';

    const stage    = card.querySelector('.vast-vertical-stage');
    const visitBtn = card.querySelector('.ad-visit-site-btn');
    const skipBtn  = card.querySelector('.vast-ad-skip-pill');

    const openAd = function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.open(exoclickClickUrl, '_blank', 'noopener,noreferrer');
    };
    if (stage)    stage.addEventListener('click', openAd);
    if (visitBtn) visitBtn.addEventListener('click', openAd);

    if (skipBtn) {
      skipBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const next = card.nextElementSibling;
        if (next) next.scrollIntoView({ behavior: 'smooth' });
      });
    }

    return card;
  }

  /* ---------- short card gestures ---------- */
  function wireShortCard(card, video, index) {
    const videoEl      = card.querySelector('video.short-video-element');
    const poster       = card.querySelector('.short-poster-img');
    const progressFill = card.querySelector('.short-progress-fill');
    const endedOverlay = card.querySelector('.preview-ended-overlay');
    const speedPill    = card.querySelector('.speed-indicator-pill');
    const heart        = card.querySelector('.double-tap-heart');
    const hud          = card.querySelector('.center-play-hud');
    const hudPlay      = card.querySelector('.hud-play');
    const hudPause     = card.querySelector('.hud-pause');
    const sideZones    = card.querySelectorAll('.side-hold-zone');
    const firstPlay    = card.querySelector('#firstShortPlayCover');
    const backBtn      = card.querySelector('.back-btn-trigger');
    const soundBtn     = card.querySelector('.sound-btn-trigger');
    const likeBtn      = card.querySelector('.like-btn');
    const shareBtn     = card.querySelector('.share-btn');
    const moreBtn      = card.querySelector('.more-btn');
    const fullBtns     = card.querySelectorAll('.watch-full-btn');

    videoEl.playbackRate = 1.0;

    /* First short: tap to fire popunder + play */
    if (index === 0 && firstPlay) {
      firstPlay.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        firstPlay.classList.add('hidden');
        firstInteraction = true;

        try {
          if (
            consentAllows() &&
            cooldownAllows(COOLDOWNS.shortsFirstTap) &&
            window.CumBearPopunder &&
            typeof window.CumBearPopunder.trigger === 'function'
          ) {
            window.CumBearPopunder.trigger('shorts-first-tap');
            CFG.helpers.markCooldown(COOLDOWNS.shortsFirstTap, CONSENT.shortsFirstTapCooldownMs);
          }
        } catch (err) { /* never block */ }

        /* Load + play */
        if (!videoEl.src || videoEl.src !== videoEl.dataset.src) {
          videoEl.src = videoEl.dataset.src;
          videoEl.load();
        }
        videoEl.muted = isGlobalMuted;
        videoEl.play().catch(function () {
          videoEl.muted = true;
          videoEl.play().catch(function () { /* ignore */ });
        });
      });
    }

    /* Back */
    if (backBtn) {
      backBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        window.stopShorts();
        document.body.classList.remove('shorts-mode');
        if (window.switchView) window.switchView('homeView', true);
      });
    }

    /* Sound */
    if (soundBtn) {
      soundBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        isGlobalMuted = !isGlobalMuted;
        syncMute();
      });
    }

    /* Watch full */
    fullBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        window.stopShorts();
        document.body.classList.remove('shorts-mode');
        const id = btn.dataset.id || video._id;
        if (window.switchView) window.switchView('playerView', true);
        if (typeof window.loadPlayerVideoById === 'function') window.loadPlayerVideoById(id);
      });
    });

    /* Like / share / more */
    if (likeBtn) {
      likeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        likeBtn.classList.toggle('liked');
        if (likeBtn.classList.contains('liked') && heart) {
          heart.classList.remove('animate');
          void heart.offsetWidth;
          heart.classList.add('animate');
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const url = window.location.origin + '/shorts/' + encodeURIComponent(video._id);
        if (navigator.share) {
          navigator.share({ title: video.title, url: url }).catch(function () { /* ignore */ });
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { /* toasts go through player */ });
        }
      });
    }

    if (moreBtn) {
      moreBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const modal = document.getElementById('shortsMoreModal');
        if (modal) modal.classList.remove('hidden');
      });
    }

    /* Center HUD */
    function showCenterHud(paused) {
      if (!hud) return;
      if (hudPlay)  hudPlay.classList.toggle('hidden', !paused);
      if (hudPause) hudPause.classList.toggle('hidden', paused);
      hud.classList.add('show');
      setTimeout(function () { hud.classList.remove('show'); }, 400);
    }

    /* Progress + 3-min stop */
    videoEl.addEventListener('timeupdate', function () {
      if (progressFill) {
        progressFill.style.width = Math.min(100, (videoEl.currentTime / PREVIEW_MAX) * 100) + '%';
      }
      if (videoEl.currentTime >= PREVIEW_MAX) {
        videoEl.pause();
        if (endedOverlay) endedOverlay.classList.remove('hidden');
      }
    });

    videoEl.addEventListener('playing', function () {
      if (poster) poster.classList.add('loaded');
      if (endedOverlay) endedOverlay.classList.add('hidden');
    });

    videoEl.addEventListener('canplay', function () {
      if (!videoEl.paused) return;
      const p = videoEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { /* user gesture needed */ });
      }
    }, { once: true });

    /* Taps */
    let lastTap = 0;
    let singleTapTimer = null;
    let holdTimer = null;
    let holdStartY = 0;
    let isHoldingSpeed = false;
    let isSpeedLocked = false;

    card.addEventListener('pointerup', function (e) {
      if (e.target.closest('.short-action-stack') ||
          e.target.closest('.watch-full-btn') ||
          e.target.closest('.shorts-top-bar') ||
          e.target.closest('#firstShortPlayCover') ||
          e.target.closest('.preview-ended-overlay')) return;

      if (isHoldingSpeed) return;

      if (isSpeedLocked) {
        isSpeedLocked = false;
        isHoldingSpeed = false;
        videoEl.playbackRate = 1.0;
        if (speedPill) speedPill.classList.remove('active', 'locked');
        return;
      }

      const now = Date.now();
      const diff = now - lastTap;

      if (diff > 0 && diff < 300) {
        if (singleTapTimer) { clearTimeout(singleTapTimer); singleTapTimer = null; }
        if (heart) {
          heart.classList.remove('animate');
          void heart.offsetWidth;
          heart.classList.add('animate');
        }
        if (likeBtn) likeBtn.classList.add('liked');
        lastTap = 0;
      } else {
        lastTap = now;
        singleTapTimer = setTimeout(function () {
          singleTapTimer = null;
          if (videoEl.paused) {
            videoEl.play().catch(function () { /* ignore */ });
            showCenterHud(false);
          } else {
            videoEl.pause();
            showCenterHud(true);
          }
        }, 280);
      }
    });

    /* 2x hold */
    sideZones.forEach(function (zone) {
      zone.addEventListener('pointerdown', function (e) {
        holdStartY = e.clientY;
        holdTimer = setTimeout(function () {
          isHoldingSpeed = true;
          videoEl.playbackRate = 2.0;
          if (speedPill) {
            speedPill.classList.add('active');
            speedPill.innerHTML = '<span>⚡ 2X SPEED (Pull down to lock)</span>';
          }
        }, 300);
      });
      zone.addEventListener('pointermove', function (e) {
        if (!isHoldingSpeed || isSpeedLocked) return;
        if (e.clientY - holdStartY > 50) {
          isSpeedLocked = true;
          if (speedPill) {
            speedPill.classList.add('locked');
            speedPill.innerHTML = '<span>🔒 2X SPEED LOCKED</span>';
          }
        }
      });
      const release = function () {
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        if (isHoldingSpeed && !isSpeedLocked) {
          isHoldingSpeed = false;
          videoEl.playbackRate = 1.0;
          if (speedPill) speedPill.classList.remove('active');
        }
      };
      zone.addEventListener('pointerup', release);
      zone.addEventListener('pointercancel', release);
      zone.addEventListener('pointerleave', release);
    });
  }

  /* ---------- mute sync ---------- */
  function syncMute() {
    document.querySelectorAll('.short-card-item').forEach(function (card) {
      const v = card.querySelector('video.short-video-element');
      const btn = card.querySelector('.sound-btn-trigger');
      if (!v || !btn) return;
      v.muted = isGlobalMuted;
      const iM = btn.querySelector('.icon-muted');
      const iU = btn.querySelector('.icon-unmuted');
      const lbl = btn.querySelector('.sound-label');
      if (iM)  iM.classList.toggle('hidden', !isGlobalMuted);
      if (iU)  iU.classList.toggle('hidden', isGlobalMuted);
      if (lbl) lbl.textContent = isGlobalMuted ? 'UNMUTE' : 'MUTE';
    });
  }

  /* ---------- observer ---------- */
  function setupObserver() {
    if (observer) { observer.disconnect(); observer = null; }
    const container = document.getElementById('shortsContainer');
    if (!container) return;

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const el = entry.target;

        if (el.dataset.isVastAd === 'true') {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) activateVast(el, container);
          else deactivateVast(el, container);
          return;
        }

        const videoEl = el.querySelector('video.short-video-element');
        const poster  = el.querySelector('.short-poster-img');
        const idx     = parseInt(el.dataset.index, 10);
        const id      = el.dataset.id;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          /* First short: don't autoplay until cover tapped */
          if (idx === 0 && !firstInteraction) {
            const cover = el.querySelector('#firstShortPlayCover');
            if (cover && !cover.classList.contains('hidden')) {
              activeVideoEl = null;
              return;
            }
          }

          /* Pause others */
          document.querySelectorAll('video.short-video-element').forEach(function (v) {
            if (v !== videoEl && !v.paused) v.pause();
          });

          activeVideoEl = videoEl;

          try {
            history.replaceState({ view: 'shortsView', videoId: id }, '', '/shorts/' + encodeURIComponent(id));
          } catch (err) { /* ignore */ }

          if (!videoEl.src || videoEl.src !== videoEl.dataset.src) {
            videoEl.src = videoEl.dataset.src;
            videoEl.load();
          }

          videoEl.playbackRate = 1.0;
          videoEl.muted = isGlobalMuted;
          const p = videoEl.play();
          if (p && typeof p.catch === 'function') {
            p.catch(function () {
              videoEl.muted = true;
              videoEl.play().catch(function () { /* ignore */ });
            });
          }
        } else {
          if (videoEl) {
            try {
              videoEl.pause();
              videoEl.removeAttribute('src');
              videoEl.load();
              videoEl.currentTime = 0;
            } catch (err) { /* ignore */ }
            if (poster) poster.classList.remove('loaded');
          }
        }
      });
    }, { threshold: 0.6, rootMargin: '20% 0px 20% 0px' });

    container.querySelectorAll('.short-card-item, .exoclick-short-vast-card').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- VAST activation ---------- */
  async function activateVast(card, container) {
    if (activeVideoEl) {
      try { activeVideoEl.pause(); } catch (e) { /* ignore */ }
    }
    const adVideo = card.querySelector('.vast-vertical-video');
    const skipBtn = card.querySelector('.vast-ad-skip-pill');
    if (!adVideo || !skipBtn) return;

    if (card.dataset.adLoaded === '1') {
      try { adVideo.play().catch(function () {}); } catch (e) { /* ignore */ }
      return;
    }

    const reqId = ++currentVastReqId;

    container.classList.add('scroll-locked');
    if (adLockTimer) clearTimeout(adLockTimer);
    adLockTimer = setTimeout(function () {
      container.classList.remove('scroll-locked');
      adLockTimer = null;
    }, AD_LOCK_MAX);

    skipBtn.disabled = true;
    skipBtn.classList.remove('unlocked');
    skipBtn.textContent = 'Ad: 5s';

    let mediaUrl = null;
    let clickThroughUrl = null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(function () { controller.abort(); }, 2500);
      const res = await fetch(CFG.helpers.vastUrl(ZONES.shortsVast), { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        const xml  = new DOMParser().parseFromString(text, 'text/xml');

        const files = xml.querySelectorAll('MediaFile');
        for (let i = 0; i < files.length; i++) {
          const s = (files[i].textContent || '').trim();
          if (s.indexOf('http') === 0) { mediaUrl = s; break; }
        }

        const ct = xml.querySelector('ClickThrough');
        if (ct) {
          const c = (ct.textContent || '').trim();
          if (c.indexOf('http') === 0) clickThroughUrl = c;
        }
      }
    } catch (err) { /* ignore */ }

    if (reqId !== currentVastReqId) return;

    if (clickThroughUrl) exoclickClickUrl = clickThroughUrl;

    if (!mediaUrl) {
      container.classList.remove('scroll-locked');
      if (adLockTimer) { clearTimeout(adLockTimer); adLockTimer = null; }
      skipBtn.disabled = false;
      skipBtn.classList.add('unlocked');
      skipBtn.textContent = 'Skip ✕';
      return;
    }

    card.dataset.adLoaded = '1';
    adVideo.src = mediaUrl;
    adVideo.muted = true;
    adVideo.load();
    adVideo.play().catch(function () { /* ignore */ });

    let s = Math.ceil(AD_SKIP_MS / 1000);
    skipBtn.textContent = 'Ad: ' + s + 's';

    if (adSkipTimer) clearInterval(adSkipTimer);
    adSkipTimer = setInterval(function () {
      s--;
      if (s > 0) {
        skipBtn.textContent = 'Ad: ' + s + 's';
      } else {
        clearInterval(adSkipTimer);
        adSkipTimer = null;
        container.classList.remove('scroll-locked');
        if (adLockTimer) { clearTimeout(adLockTimer); adLockTimer = null; }
        skipBtn.disabled = false;
        skipBtn.classList.add('unlocked');
        skipBtn.textContent = 'Skip Ad ✕';
      }
    }, 1000);
  }

  function deactivateVast(card, container) {
    container.classList.remove('scroll-locked');
    if (adLockTimer) { clearTimeout(adLockTimer); adLockTimer = null; }
    if (adSkipTimer) { clearInterval(adSkipTimer); adSkipTimer = null; }
    const adVideo = card.querySelector('.vast-vertical-video');
    if (adVideo && card.dataset.adLoaded === '1') {
      try {
        adVideo.pause();
        adVideo.removeAttribute('src');
        adVideo.load();
      } catch (e) { /* ignore */ }
      card.dataset.adLoaded = '';
    }
  }

  /* ---------- static ---------- */
  function wireStaticButtons() {
    const modal = document.getElementById('shortsMoreModal');
    const closeBtn = document.getElementById('closeMoreModal');
    if (closeBtn && !closeBtn.dataset.wired) {
      closeBtn.dataset.wired = '1';
      closeBtn.addEventListener('click', function () {
        if (modal) modal.classList.add('hidden');
      });
    }
  }

  /* ---------- stop ---------- */
  window.stopShorts = function () {
    if (observer) { observer.disconnect(); observer = null; }
    if (adSkipTimer) { clearInterval(adSkipTimer); adSkipTimer = null; }
    if (adLockTimer) { clearTimeout(adLockTimer); adLockTimer = null; }

    document.querySelectorAll('.short-video-element, .vast-vertical-video').forEach(function (v) {
      try {
        v.pause();
        v.removeAttribute('src');
        v.load();
      } catch (e) { /* ignore */ }
    });

    const container = document.getElementById('shortsContainer');
    if (container) container.classList.remove('scroll-locked');

    activeVideoEl = null;
    currentVastReqId = 0;
  };
})();
