/**
 * ==========================================================================
 * CUMBEAR — VIDEO PLAYER CONTROLLER
 * --------------------------------------------------------------------------
 * - Fetches video by ID
 * - Mounts native HTML5 player
 * - 5s skippable ExoClick pre-roll (with proper failure fallback)
 * - First-play popunder (once per 24h, via CumBearPopunder)
 * - Related videos with FapHouse injection every 5
 * - Per-video share URL: /watch/:id
 * - Persistent like state
 *
 * Public API:
 *   window.loadPlayerVideoById(id)
 *   window.stopPlayer()  (called by script.js on view change)
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

  const ZONES       = CFG.exo.zones;
  const CONSENT     = CFG.consent;
  const COOLDOWNS   = CONSENT.cookies;
  const LIKED_KEY   = function (id) { return 'cumbear_liked_' + id; };

  /* ---------- state ---------- */
  let currentVideoData = null;
  let adTimer = null;
  let adFinished = false;
  let exoclickClickUrl = CFG.helpers.clickUrl(ZONES.playerVast);
  let currentLoadId = 0;
  let mounted = false;

  /* ---------- utils ---------- */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  /* ---------- toast helper ---------- */
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

  /* ---------- cleanup ---------- */
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

  /* ---------- entry point ---------- */
  window.loadPlayerVideoById = function (videoId) {
    if (!videoId) return;

    /* Stop whatever was playing */
    window.stopPlayer();

    /* Clear view state */
    currentVideoData = null;
    mounted = false;

    /* Race guard */
    currentLoadId++;
    const myId = currentLoadId;

    /* Reset UI immediately to avoid stale content flicker */
    const titleEl = document.getElementById('playerTitle');
    if (titleEl) titleEl.textContent = 'Loading video…';

    /* Update URL to /watch/:id */
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

  /* ---------- error state ---------- */
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

  /* ---------- mount player ---------- */
  function mountPlayer() {
    const container = document.getElementById('playerAspectBox');
    const titleEl = document.getElementById('playerTitle');
    if (!container || !currentVideoData) return;

    mounted = true;

    const safeTitle = escapeHtml(currentVideoData.title || 'CumBear Video');
    if (titleEl) titleEl.textContent = currentVideoData.title || 'CumBear Video';

    const isLiked = (function () {
      try { return localStorage.getItem(LIKED_KEY(currentVideoData._id)) === '1'; }
      catch (e) { return false; }
    })();
    const views = formatCount(stableViews(currentVideoData._id));
    const likeRate = stableLikeRate(currentVideoData._id);
    const likeCount = Math.max(1, Math.round(views * likeRate / 100));

    container.innerHTML =
      '<div class="player-poster-cover" id="playerPosterCover">' +
        '<img class="player-poster-img" src="' + (currentVideoData.thumbnailUrl || '/cumb.png') + '" alt="' + safeTitle + '">' +
        '<div class="player-big-play-btn">' +
          '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '</div>' +
      '</div>' +

      '<div class="player-vast-overlay hidden" id="playerVastOverlay">' +
        '<video class="player-vast-video" id="playerVastVideo" playsinline webkit-playsinline muted></video>' +
        '<div class="vast-player-hud">' +
          '<span class="vast-sponsor-badge">Sponsor Ad</span>' +
          '<button class="vast-skip-btn" id="vastSkipBtn" disabled>Ad: 5s</button>' +
        '</div>' +
        '<button class="vast-bottom-cta" id="vastVisitBtn">' +
          '<span>Visit Sponsor Site</span>' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
            '<line x1="5" y1="12" x2="19" y2="12"/>' +
            '<polyline points="12 5 19 12 12 19"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +

      '<video class="player-main-video" id="playerMainVideo" controls controlslist="nodownload" playsinline webkit-playsinline preload="metadata"></video>';

    /* Update meta count elements */
    const likeCountEl = document.getElementById('playerLikeCount');
    if (likeCountEl) likeCountEl.textContent = formatCount(likeCount);
    const viewsEl = document.getElementById('playerViewsCount');
    if (viewsEl) viewsEl.textContent = views;

    /* Restore like state */
    const likeBtn = document.getElementById('playerLikeBtn');
    if (likeBtn && isLiked) likeBtn.classList.add('liked');

    bindPlayerEngine();
  }

  /* ---------- bind player ---------- */
  function bindPlayerEngine() {
    const posterCover = document.getElementById('playerPosterCover');
    const adOverlay = document.getElementById('playerVastOverlay');
    const adVideo = document.getElementById('playerVastVideo');
    const adSkipBtn = document.getElementById('vastSkipBtn');
    const adVisitBtn = document.getElementById('vastVisitBtn');
    const mainVideo = document.getElementById('playerMainVideo');
    const shareBtn = document.getElementById('playerShareBtn');
    const likeBtn = document.getElementById('playerLikeBtn');

    if (!posterCover || !mainVideo) return;

    /* ---------- poster click → first-play popunder + ad + play ---------- */
    posterCover.addEventListener('click', function onPosterClick() {
      posterCover.classList.add('hidden');
      posterCover.style.display = 'none';

      /* First-play popunder (once per 24h, gated by consent) */
      try {
        if (
          consentAllows() &&
          window.CumBEAR &&
          window.CUMBEAR.helpers &&
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
      } catch (e) { /* popunder must never block playback */ }

      /* Then show pre-roll */
      startPreRollAd();
    }, { once: true });

    /* ---------- pre-roll ad ---------- */
    async function startPreRollAd() {
      if (!adOverlay || !adVideo) {
        finishAdAndStartMainVideo();
        return;
      }

      if (!consentAllows()) {
        /* No consent → skip ads entirely, play main video directly */
        finishAdAndStartMainVideo();
        return;
      }

      adOverlay.classList.remove('hidden');
      adOverlay.style.display = '';

      /* Fetch VAST with timeout */
      let adMediaSrc = null;
      let adError = false;

      try {
        const controller = new AbortController();
        const timer = setTimeout(function () { controller.abort(); }, 3500);
        const res = await fetch(CFG.helpers.vastUrl(ZONES.playerVast), {
          signal: controller.signal
        });
        clearTimeout(timer);

        if (!res.ok) throw new Error('VAST HTTP ' + res.status);
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, 'text/xml');

        /* MediaFiles */
        const mediaFiles = xml.querySelectorAll('MediaFile');
        for (let i = 0; i < mediaFiles.length; i++) {
          const s = (mediaFiles[i].textContent || '').trim();
          if (s.indexOf('http') === 0) { adMediaSrc = s; break; }
        }

        /* ClickThrough */
        const clickThrough = xml.querySelector('ClickThrough');
        if (clickThrough) {
          const c = (clickThrough.textContent || '').trim();
          if (c.indexOf('http') === 0) exoclickClickUrl = c;
        }
      } catch (err) {
        adError = true;
      }

      /* ---- CRITICAL FIX ----
         Never assign the VAST XML URL to <video src>.
         If we couldn't parse a real MediaFile, skip the ad completely
         and play the main video. */
      if (adError || !adMediaSrc) {
        adOverlay.classList.add('hidden');
        adOverlay.style.display = 'none';
        finishAdAndStartMainVideo();
        return;
      }

      /* Play the actual ad media */
      adVideo.muted = true;
      adVideo.src = adMediaSrc;
      adVideo.load();
      const p = adVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          /* Autoplay blocked → finish ad immediately */
          finishAdAndStartMainVideo();
        });
      }

      /* 5-second countdown */
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
            adSkipBtn.onclick = function (e) {
              e.stopPropagation();
              finishAdAndStartMainVideo();
            };
          }
        }
      }, 1000);

      adVideo.onended = finishAdAndStartMainVideo;
      adVideo.onerror = finishAdAndStartMainVideo;

      const openAdClick = function (e) {
        e.stopPropagation();
        e.preventDefault();
        window.open(exoclickClickUrl, '_blank', 'noopener,noreferrer');
      };
      adVideo.onclick = openAdClick;
      if (adVisitBtn) adVisitBtn.onclick = openAdClick;
    }

    /* ---------- finish ad, play main video ---------- */
    function finishAdAndStartMainVideo() {
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
      mainVideo.src = currentVideoData.playableUrl;
      mainVideo.load();
      const p = mainVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          /* Autoplay blocked → user can click native controls */
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
          navigator.share({ title: title, url: url }).catch(function () { /* user cancelled */ });
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            showToast('Link copied');
          }).catch(function () {
            showToast('Copy failed — ' + url);
          });
        } else {
          showToast(url);
        }
      });
    }

    /* ---------- like toggle (persisted) ---------- */
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

  /* ---------- related videos ---------- */
  function loadRelatedVideos(category) {
    const grid = document.getElementById('relatedVideoGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="grid-status">Loading recommendations…</div>';

    const params = {
      limit: 12,
      category: category || 'all',
      _: Date.now()
    };
    const url = CFG.helpers.videoListUrl(params);

    const myId = currentLoadId;

    fetch(url, { credentials: 'omit' })
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

        /* Filter out the current video */
        const filtered = json.data.filter(function (v) {
          return !currentVideoData || v._id !== currentVideoData._id;
        });

        /* Inject FapHouse every 5 */
        const mixed = (typeof window.mixAffiliateVideos === 'function')
          ? window.mixAffiliateVideos(filtered)
          : filtered;

        mixed.forEach(function (v) {
          if (typeof window.renderMixedVideoCard === 'function') {
            const card = window.renderMixedVideoCard(v, function () {
              window.loadPlayerVideoById(v._id);
            });
            grid.appendChild(card);
            return;
          }

          /* Fallback */
          const card = document.createElement('div');
          card.className = 'video-card';
          const duration = (v.duration || '00:00').replace(/^HD\s*/i, '');
          const views = formatCount(stableViews(v._id));
          const safeTitle = escapeHtml(v.title || 'Untitled');
          card.innerHTML =
            '<div class="video-thumb">' +
              '<img class="hd-thumb" src="' + (v.thumbnailUrl || '/cumb.png') + '" alt="' + safeTitle + '" loading="lazy" onerror="this.src=\'/cumb.png\'">' +
              '<div class="preview-video-holder"></div>' +
              '<div class="preview-timeline"><div class="preview-timeline-fill"></div></div>' +
              '<div class="preview-loading"><div class="preview-spinner"></div></div>' +
              '<span class="duration-badge">' + duration + '</span>' +
            '</div>' +
            '<div class="video-info">' +
              '<div class="video-title">' + safeTitle + '</div>' +
              '<div class="video-meta-row">' +
                '<span class="provider-tag">' + escapeHtml(v.category || 'CumBear') + '</span>' +
                '<span>•</span><span>' + views + ' views</span>' +
              '</div>' +
            '</div>';

          if (typeof window.attachHoldAndSlidePreview === 'function') {
            window.attachHoldAndSlidePreview(card, v, function () {
              window.loadPlayerVideoById(v._id);
            });
          } else {
            card.addEventListener('click', function () { window.loadPlayerVideoById(v._id); });
          }
          grid.appendChild(card);
        });

        /* Serve the player's banner zones */
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
