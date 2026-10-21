/**
 * ==========================================================================
 * CUMBEAR — VIDEO PLAYER CONTROLLER (v3)
 * --------------------------------------------------------------------------
 * Per user spec:
 *   - Every video: poster → tap → pre-roll VAST → main video plays
 *   - FIRST video only: fire popunder once per 24h (not every video)
 *   - Right-click blocked on player + poster
 *   - No crossorigin attribute (w4nkr.com has no CORS → would break playback)
 *   - Related videos use edge-to-edge grid + FapHouse injection
 *   - Per-video URL: /watch/:id
 *   - Like state persisted per video
 *   - Share copies /watch/:id URL
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearPlayerLoaded) return;
  window.__cumbearPlayerLoaded = true;

  const CFG = window.CUMBEAR;
  if (!CFG) {
    console.warn('[CumBearPlayer] config.js not loaded — aborting');
    return;
  }

  const ZONES          = CFG.exo.zones;
  const CONSENT        = CFG.consent;
  const COOLDOWNS      = CONSENT.cookies;
  const LIKED_KEY      = function (id) { return 'cumbear_liked_' + id; };

  let currentVideoData = null;
  let adTimer          = null;
  let adFinished       = false;
  let exoclickClickUrl = CFG.helpers.clickUrl(ZONES.playerVast);
  let currentLoadId    = 0;

  /* ==========================================================================
     UTILS
     ========================================================================== */
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
  function stableLikeRate(id) { return 55 + (hashString(String(id) + 'l') % 44); }

  function consentAllows() {
    return window.CumBearConsent && window.CumBearConsent.isAdAllowed() === true;
  }

  function showToast(text) {
    let t = document.getElementById('cumbear-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'cumbear-toast';
      t.className = 'cumbear-toast';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('visible');
    setTimeout(function () { t.classList.remove('visible'); }, 2200);
  }

  /* ==========================================================================
     STOP PLAYER (cleanup)
     ========================================================================== */
  window.stopPlayer = function () {
    if (adTimer) { clearInterval(adTimer); adTimer = null; }
    adFinished = false;
    const adVideo = document.getElementById('playerVastVideo');
    if (adVideo) {
      try {
        adVideo.pause();
        adVideo.removeAttribute('src');
        adVideo.load();
      } catch (e) { /* ignore */ }
    }
    const mainVideo = document.getElementById('mainPlayerVideo');
    if (mainVideo) {
      try {
        mainVideo.pause();
        mainVideo.removeAttribute('src');
        mainVideo.load();
      } catch (e) { /* ignore */ }
    }
  };

  /* ==========================================================================
     LOAD VIDEO
     ========================================================================== */
  window.loadPlayerVideoById = function (videoId) {
    if (!videoId) return;

    window.stopPlayer();
    currentVideoData = null;
    currentLoadId++;
    const myId = currentLoadId;

    const titleEl = document.getElementById('playerTitle');
    if (titleEl) titleEl.textContent = 'Loading video…';

    try {
      history.replaceState(
        { view: 'playerView', videoId: videoId },
        '',
        '/watch/' + encodeURIComponent(videoId)
      );
    } catch (e) { /* ignore */ }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetch(CFG.helpers.singleVideoUrl(videoId), { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (myId !== currentLoadId) return;
        if (!json || !json.success || !json.data) {
          throw new Error(json && json.error ? json.error : 'Video not found');
        }
        currentVideoData = json.data;
        mountPlayer();
        loadRelatedVideos(currentVideoData.category);
      })
      .catch(function (err) {
        if (myId !== currentLoadId) return;
        console.error('[CumBearPlayer] load error:', err);
        showPlayerError();
      });
  };

  function showPlayerError() {
    const container = document.getElementById('playerAspectBox');
    if (container) {
      container.innerHTML =
        '<div class="player-error-state">' +
          '<p>Video could not be loaded.</p>' +
          '<button class="page-btn" onclick="window.switchView(\'homeView\', true);">Browse videos</button>' +
        '</div>';
    }
    const titleEl = document.getElementById('playerTitle');
    if (titleEl) titleEl.textContent = 'Video unavailable';
  }

  /* ==========================================================================
     MOUNT PLAYER
     ========================================================================== */
  function mountPlayer() {
    const container = document.getElementById('playerAspectBox');
    const titleEl   = document.getElementById('playerTitle');
    if (!container || !currentVideoData) return;

    const safeTitle = escapeHtml(currentVideoData.title || 'CumBear Video');
    if (titleEl) titleEl.textContent = currentVideoData.title || 'CumBear Video';

    const isLiked = (function () {
      try { return localStorage.getItem(LIKED_KEY(currentVideoData._id)) === '1'; }
      catch (e) { return false; }
    })();

    const views     = formatCount(stableViews(currentVideoData._id));
    const likeRate  = stableLikeRate(currentVideoData._id);
    const likeCount = Math.max(1, Math.round(stableViews(currentVideoData._id) * likeRate / 100));

    /* IMPORTANT: no crossorigin attribute — w4nkr.com has no CORS headers
       and adding crossorigin would break playback. */
    container.innerHTML =
      '<div class="player-poster-cover" id="playerPosterCover">' +
        '<img class="player-poster-img" src="' + (currentVideoData.thumbnailUrl || '/cumb.png') + '" alt="' + safeTitle + '">' +
        '<div class="player-big-play-btn">' +
          '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '</div>' +
      '</div>' +

      '<div class="player-vast-overlay hidden" id="playerVastOverlay">' +
        '<video class="player-vast-video" id="playerVastVideo" playsinline webkit-playsinline muted preload="none"></video>' +
        '<div class="vast-player-hud">' +
          '<span class="vast-sponsor-badge">Sponsor Ad</span>' +
          '<button class="vast-skip-btn" id="vastSkipBtn" disabled>Ad: 5s</button>' +
        '</div>' +
        '<button class="vast-bottom-cta" id="vastVisitBtn">' +
          '<span>Visit Sponsor Site</span>' +
        '</button>' +
      '</div>' +

      '<video class="player-main-video" id="playerMainVideo" controls controlslist="nodownload noremoteplayback" playsinline webkit-playsinline preload="metadata"></video>';

    /* Meta */
    const likeCountEl = document.getElementById('playerLikeCount');
    if (likeCountEl) likeCountEl.textContent = formatCount(likeCount);
    const viewsEl = document.getElementById('playerViewsCount');
    if (viewsEl) viewsEl.textContent = views;

    const likeBtn = document.getElementById('playerLikeBtn');
    if (likeBtn && isLiked) likeBtn.classList.add('liked');

    bindPlayerEngine();
  }

  /* ==========================================================================
     BIND PLAYER
     ========================================================================== */
  function bindPlayerEngine() {
    const posterCover = document.getElementById('playerPosterCover');
    const adOverlay   = document.getElementById('playerVastOverlay');
    const adVideo     = document.getElementById('playerVastVideo');
    const adSkipBtn   = document.getElementById('vastSkipBtn');
    const adVisitBtn  = document.getElementById('vastVisitBtn');
    const mainVideo   = document.getElementById('mainPlayerVideo');
    const shareBtn    = document.getElementById('playerShareBtn');
    const likeBtn     = document.getElementById('playerLikeBtn');

    if (!posterCover || !mainVideo) return;

    /* Block right-click on all video elements */
    [posterCover, mainVideo].forEach(function (el) {
      if (!el) return;
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });

    /* ---------- poster tap → (popunder if first) → pre-roll → play ---------- */
    posterCover.addEventListener('click', function () {
      posterCover.classList.add('hidden');
      posterCover.style.display = 'none';

      /* FIRST-PLAY POPUNDER — only fires ONCE per 24h across ALL videos */
      try {
        if (
          consentAllows() &&
          window.CUMBEAR && window.CUMBEAR.helpers &&
          window.CUMBEAR.helpers.cooldownPassed(COOLDOWNS.playerFirstPlay) &&
          window.CumBearPopunder &&
          typeof window.CumBearPopunder.trigger === 'function'
        ) {
          window.CumBearPopunder.trigger('player-first-play');
          window.CUMBEAR.helpers.markCooldown(
            COOLDOWNS.playerFirstPlay,
            CONSENT.playerFirstPlayCooldownMs
          );
        }
      } catch (e) { /* never block playback */ }

      startPreRollAd();
    }, { once: true });

    /* ---------- pre-roll (plays EVERY video) ---------- */
    async function startPreRollAd() {
      if (!adOverlay || !adVideo) { finishAd(); return; }
      if (!consentAllows())      { finishAd(); return; }

      adOverlay.classList.remove('hidden');
      adOverlay.style.display = '';

      /* Reset ad-finished flag for this new play */
      adFinished = false;

      /* Block right-click on ad video */
      adVideo.addEventListener('contextmenu', function (e) { e.preventDefault(); }, { once: false });

      let adMediaSrc = null;
      let adError    = false;

      try {
        const controller = new AbortController();
        const timer = setTimeout(function () { controller.abort(); }, 2500);
        const res = await fetch(CFG.helpers.vastUrl(ZONES.playerVast), { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) throw new Error('VAST HTTP ' + res.status);
        const text = await res.text();
        const xml  = new DOMParser().parseFromString(text, 'text/xml');

        const mediaFiles = xml.querySelectorAll('MediaFile');
        for (let i = 0; i < mediaFiles.length; i++) {
          const s = (mediaFiles[i].textContent || '').trim();
          if (s.indexOf('http') === 0) { adMediaSrc = s; break; }
        }

        const clickThrough = xml.querySelector('ClickThrough');
        if (clickThrough) {
          const c = (clickThrough.textContent || '').trim();
          if (c.indexOf('http') === 0) exoclickClickUrl = c;
        }
      } catch (err) { adError = true; }

      /* CRITICAL: never assign VAST XML URL to <video src> */
      if (adError || !adMediaSrc) {
        adOverlay.classList.add('hidden');
        adOverlay.style.display = 'none';
        finishAd();
        return;
      }

      adVideo.muted = true;
      adVideo.src = adMediaSrc;
      adVideo.load();
      const p = adVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { finishAd(); });
      }

      let secondsLeft = 5;
      if (adSkipBtn) {
        adSkipBtn.disabled = true;
        adSkipBtn.classList.remove('unlocked');
        adSkipBtn.textContent = 'Ad: ' + secondsLeft + 's';
      }
      if (adTimer) clearInterval(adTimer);
      adTimer = setInterval(function () {
        secondsLeft--;
        if (secondsLeft > 0) {
          if (adSkipBtn) adSkipBtn.textContent = 'Ad: ' + secondsLeft + 's';
        } else {
          clearInterval(adTimer);
          adTimer = null;
          if (adSkipBtn) {
            adSkipBtn.disabled = false;
            adSkipBtn.classList.add('unlocked');
            adSkipBtn.textContent = 'Skip Ad ✕';
            adSkipBtn.onclick = function (e) { e.stopPropagation(); finishAd(); };
          }
        }
      }, 1000);

      adVideo.onended = finishAd;
      adVideo.onerror = finishAd;

      const openAdClick = function (e) {
        e.stopPropagation();
        e.preventDefault();
        window.open(exoclickClickUrl, '_blank', 'noopener,noreferrer');
      };
      adVideo.onclick = openAdClick;
      if (adVisitBtn) adVisitBtn.onclick = openAdClick;
    }

    /* ---------- finish ad, start main video ---------- */
    function finishAd() {
      if (adFinished) return;
      adFinished = true;

      if (adTimer) { clearInterval(adTimer); adTimer = null; }
      if (adVideo) {
        try {
          adVideo.pause();
          adVideo.removeAttribute('src');
          adVideo.load();
        } catch (e) { /* ignore */ }
      }
      if (adOverlay) {
        adOverlay.classList.add('hidden');
        adOverlay.style.display = 'none';
      }

      if (!mainVideo || !currentVideoData) return;

      /* Block right-click on main video */
      mainVideo.addEventListener('contextmenu', function (e) { e.preventDefault(); }, { once: false });

      mainVideo.src = currentVideoData.playableUrl;
      mainVideo.load();
      const p = mainVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          mainVideo.muted = true;
          mainVideo.play().catch(function () { /* ignore */ });
        });
      }
    }

    /* ---------- share ---------- */
    if (shareBtn && !shareBtn.dataset.wired) {
      shareBtn.dataset.wired = '1';
      shareBtn.addEventListener('click', function () {
        if (!currentVideoData) return;
        const url = window.location.origin + '/watch/' + encodeURIComponent(currentVideoData._id);
        const title = currentVideoData.title || 'CumBear Video';
        if (navigator.share) {
          navigator.share({ title: title, url: url }).catch(function () { /* ignore */ });
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { showToast('Link copied'); })
            .catch(function () { showToast(url); });
        } else {
          showToast(url);
        }
      });
    }

    /* ---------- like ---------- */
    if (likeBtn && !likeBtn.dataset.wired) {
      likeBtn.dataset.wired = '1';
      likeBtn.addEventListener('click', function () {
        if (!currentVideoData) return;
        const key = LIKED_KEY(currentVideoData._id);
        const isLiked = likeBtn.classList.toggle('liked');
        try {
          if (isLiked) localStorage.setItem(key, '1');
          else localStorage.removeItem(key);
        } catch (e) { /* ignore */ }
      });
    }
  }

  /* ==========================================================================
     RELATED VIDEOS (50 videos + 10 FapHouse, e2e grid)
     ========================================================================== */
  function loadRelatedVideos(category) {
    const grid = document.getElementById('relatedVideoGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="grid-status">Loading recommendations…</div>';

    const myId = currentLoadId;

    /* Fetch 50 videos instead of 12 for consistency with home */
    fetch(CFG.helpers.videoListUrl({
      limit: 50,
      category: category || 'all',
      _: Date.now()
    }), { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (myId !== currentLoadId) return;
        if (!json || !json.success || !Array.isArray(json.data)) {
          grid.innerHTML = '';
          return;
        }
        grid.innerHTML = '';

        const filtered = json.data.filter(function (v) {
          return !currentVideoData || v._id !== currentVideoData._id;
        });

        const mixed = (typeof window.mixAffiliateVideos === 'function')
          ? window.mixAffiliateVideos(filtered)
          : filtered;

        const frag = document.createDocumentFragment();
        const hasRenderer = typeof window.renderMixedVideoCard === 'function';

        mixed.forEach(function (v) {
          if (hasRenderer) {
            const card = window.renderMixedVideoCard(v, function () {
              window.loadPlayerVideoById(v._id);
            });
            card.classList.add('e2e');
            frag.appendChild(card);
            return;
          }

          const card = document.createElement('div');
          card.className = 'video-card e2e';
          const safe = escapeHtml(v.title || 'Untitled');
          card.innerHTML =
            '<div class="video-thumb">' +
              '<img src="' + (v.thumbnailUrl || '/cumb.png') + '" alt="' + safe + '" loading="lazy" onerror="this.src=\'/cumb.png\'">' +
              '<div class="preview-video-holder"></div>' +
              '<div class="preview-timeline"><div class="preview-timeline-fill"></div></div>' +
              '<div class="preview-loading"></div>' +
              '<span class="duration-badge">' + (v.duration || '00:00') + '</span>' +
            '</div>' +
            '<div class="video-info">' +
              '<div class="video-title">' + safe + '</div>' +
              '<div class="video-meta-row">' +
                '<span class="provider-tag">' + escapeHtml(v.category || 'CumBear') + '</span>' +
              '</div>' +
            '</div>';
          card.addEventListener('click', function () { window.loadPlayerVideoById(v._id); });
          frag.appendChild(card);
        });

        grid.appendChild(frag);

        if (window.CumBearAds && typeof window.CumBearAds.refreshBanners === 'function') {
          try { window.CumBearAds.refreshBanners(); } catch (e) { /* ignore */ }
        }
      })
      .catch(function (err) {
        if (myId !== currentLoadId) return;
        console.warn('[CumBearPlayer] related videos failed:', err.message);
        grid.innerHTML = '';
      });
  }
})();
