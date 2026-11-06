/**
 * ==========================================================================
 * CUMBEAR — PLAYER CONTROLLER (v3)
 * --------------------------------------------------------------------------
 * - Load single video from new backend
 * - Poster click → optional popunder (24h) → VAST pre-roll → main playableUrl
 * - Related grid uses mixAffiliateVideos
 * - CTA → CrakRevenue (via CumBearAds if present)
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearPlayerLoaded) return;
  window.__cumbearPlayerLoaded = true;

  const CFG = window.CUMBEAR;
  if (!CFG) {
    console.warn('[CumBearPlayer] config.js not loaded');
    return;
  }

  const COOLDOWNS = (CFG.consent && CFG.consent.cookies) || {};
  const LIKED_KEY = function (id) {
    return 'cumbear_liked_' + id;
  };

  let currentVideoData = null;
  let currentLoadId = 0;
  let adTimer = null;
  let adFinished = false;
  let playWiredForId = null;

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatCount(n) {
    n = Number(n) || 0;
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

  function stableViews(id) {
    return 10000 + (hashString(String(id) + 'v') % 9990000);
  }

  function consentAllows() {
    /* Prefer explicit allow; if consent module absent, allow (age gate removed) */
    try {
      if (window.CumBearConsent && typeof window.CumBearConsent.isAdAllowed === 'function') {
        return window.CumBearConsent.isAdAllowed() === true;
      }
    } catch (e) {}
    return true;
  }

  function showToast(text) {
    let t = document.getElementById('cumbearToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'cumbearToast';
      t.className = 'cumbear-toast';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('visible');
    setTimeout(function () {
      t.classList.remove('visible');
    }, 2200);
  }

  window.stopPlayer = function () {
    if (adTimer) {
      clearInterval(adTimer);
      adTimer = null;
    }
    adFinished = false;
    const mainVideo = document.getElementById('mainPlayerVideo');
    const adVideo = document.getElementById('playerVastVideo');
    if (mainVideo) {
      try {
        mainVideo.pause();
        mainVideo.removeAttribute('src');
        mainVideo.load();
      } catch (e) { /* ignore */ }
    }
    if (adVideo) {
      try {
        adVideo.pause();
        adVideo.removeAttribute('src');
        adVideo.load();
      } catch (e) { /* ignore */ }
    }
    const vastOverlay = document.getElementById('playerVastOverlay');
    if (vastOverlay) {
      vastOverlay.classList.add('hidden');
      vastOverlay.style.display = 'none';
    }
  };

  window.loadPlayerVideoById = function (videoId) {
    adFinished = false;
    playWiredForId = null;
    if (!videoId) return;
    currentLoadId++;
    const myId = currentLoadId;

    window.stopPlayer();
    currentVideoData = null;
    playWiredForId = null;

    try {
      if (window.history && window.history.pushState) {
        window.history.pushState({ view: 'playerView', id: videoId }, '', '/watch/' + encodeURIComponent(videoId));
      }
    } catch (e) { /* ignore */ }

    if (window.switchView) window.switchView('playerView', false);

    const titleEl = document.getElementById('playerTitle');
    if (titleEl) titleEl.textContent = 'Loading…';

    const posterImg = document.getElementById('playerPosterImg');
    const posterCover = document.getElementById('playerPosterCover');
    if (posterCover) posterCover.classList.remove('hidden');
    if (posterImg) posterImg.src = '/cumb.png';

    const vastOverlay = document.getElementById('playerVastOverlay');
    if (vastOverlay) {
      vastOverlay.classList.add('hidden');
      vastOverlay.style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetch(CFG.helpers.singleVideoUrl(videoId), { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (myId !== currentLoadId) return;

        const data = json && (json.data || json.video || json);
        if (!data || !data.playableUrl) {
          showPlayerError();
          return;
        }

        currentVideoData = {
          _id: data._id || videoId,
          title: data.title || 'Untitled',
          category: data.category || 'CumBear',
          duration: data.duration || '',
          thumbnailUrl: data.thumbnailUrl || '/cumb.png',
          playableUrl: data.playableUrl,
          views: data.views || formatCount(stableViews(data._id || videoId)),
          qualityScore: data.qualityScore
        };

        if (titleEl) titleEl.textContent = currentVideoData.title;
        if (posterImg) {
          posterImg.src = currentVideoData.thumbnailUrl;
          posterImg.onerror = function () {
            posterImg.src = '/cumb.png';
          };
        }

        updateMetaStats();
        wirePlayFlow(currentVideoData._id);
        loadRelated(currentVideoData._id, currentVideoData.category);

        if (window.CumBearAds && window.CumBearAds.refreshBanners) {
          setTimeout(function () {
            try {
              window.CumBearAds.refreshBanners();
            } catch (e) { /* ignore */ }
          }, 300);
        }
      })
      .catch(function (err) {
        if (myId !== currentLoadId) return;
        console.error('[CumBearPlayer] load failed:', err);
        showPlayerError();
      });
  };

  function updateMetaStats() {
    if (!currentVideoData) return;
    const likeEl = document.getElementById('playerLikeCount');
    const viewsEl = document.getElementById('playerViewsCount');
    if (viewsEl) viewsEl.textContent = String(currentVideoData.views || formatCount(stableViews(currentVideoData._id)));
    if (likeEl) {
      try {
        if (localStorage.getItem(LIKED_KEY(currentVideoData._id)) === '1') {
          likeEl.textContent = 'Liked';
        }
      } catch (e) { /* ignore */ }
    }
  }

  function wirePlayFlow(videoId) {
    if (playWiredForId === videoId) return;
    playWiredForId = videoId;

    const poster = document.getElementById('playerPosterCover') || document.getElementById('playerPlayOverlay');
    const posterBox = document.getElementById('playerAspectBox');
    const target = poster || posterBox;
    if (!target) return;

    target.style.cursor = 'pointer';

    const onPlayClick = function (e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!currentVideoData || currentVideoData._id !== videoId) return;

      try {
        triggerJuicyPopOnPlay();
      } catch (err) { /* ignore */ }

      startPreRollAd();
    };

    target.addEventListener('click', onPlayClick);
    target.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });
  }

  function parseVastMediaUrl(xmlText) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const medias = doc.querySelectorAll('MediaFile');
      let best = null;
      let bestW = -1;
      medias.forEach(function (mf) {
        const type = (mf.getAttribute('type') || '').toLowerCase();
        if (type && type.indexOf('mp4') === -1 && type.indexOf('video') === -1) return;
        const w = parseInt(mf.getAttribute('width') || '0', 10);
        const url = (mf.textContent || '').trim();
        if (!url) return;
        if (w >= bestW) {
          bestW = w;
          best = url;
        }
      });
      return best;
    } catch (e) {
      return null;
    }
  }

  function parseVastClickUrl(xmlText) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const click = doc.querySelector('ClickThrough');
      return click ? (click.textContent || '').trim() : null;
    } catch (e) {
      return null;
    }
  }


  /* Juicy → Exo → Monetag rotation (one network per first-play gesture) */
  
  function triggerJuicyPopOnPlay() {
    try {
      var last = parseInt(sessionStorage.getItem('cumbear_juicy_play_ms') || '0', 10);
      if (last && Date.now() - last < 8000) return;
      sessionStorage.setItem('cumbear_juicy_play_ms', String(Date.now()));
    } catch (e) {}
    var src = 'https://js.juicyads.com/jp.php?c=4474y213u284u4r2p2d453a424&u=https%3A%2F%2Fwww.juicyads.rocks';
    /* Always ensure Juicy is present; re-append forces re-eval on some browsers */
    var existing = document.querySelector('script[src*="js.juicyads.com/jp.php"]');
    if (existing) {
      try { existing.parentNode.removeChild(existing); } catch (e) {}
    }
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now();
    (document.body || document.documentElement).appendChild(s);
  }

  function triggerPlayPopRotation() {
    if (!consentAllows()) return;
    const helpers = CFG.helpers || {};
    const popCfg = CFG.popunder || {};
    const minMs = popCfg.minIntervalMs || 60000;
    try {
      const last = parseInt(sessionStorage.getItem('cumbear_pop_last_ms') || '0', 10);
      if (last && Date.now() - last < minMs) return;
      sessionStorage.setItem('cumbear_pop_last_ms', String(Date.now()));
    } catch (e) { /* ignore */ }

    const network = (helpers.nextPopNetwork && helpers.nextPopNetwork()) || 'juicy';

    if (network === 'juicy' && popCfg.juicyScript) {
      if (!document.getElementById('cumbear-juicy-pop')) {
        const s = document.createElement('script');
        s.id = 'cumbear-juicy-pop';
        s.async = true;
        s.src = popCfg.juicyScript;
        (document.body || document.documentElement).appendChild(s);
      }
      return;
    }

    if (network === 'exo') {
      const url = helpers.exoPopLinkUrl ? helpers.exoPopLinkUrl() : null;
      if (url) {
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) { /* ignore */ }
      } else if (window.CumBearPopunder && window.CumBearPopunder.trigger) {
        window.CumBearPopunder.trigger('player-first-play');
      }
      return;
    }

    /* monetag onclick fallback */
    if (network === 'monetag' && CFG.monetag && CFG.monetag.enabled) {
      try {
        if (!window.__cumbearMonetagLoaded && CFG.monetag.scriptSrc) {
          const s = document.createElement('script');
          s.src = CFG.monetag.scriptSrc;
          s.async = true;
          s.setAttribute('data-zone', CFG.monetag.zone || '304443');
          s.setAttribute('data-cfasync', 'false');
          document.head.appendChild(s);
          window.__cumbearMonetagLoaded = true;
        }
      } catch (e) { /* ignore */ }
      return;
    }
  }

  async function startPreRollAd() {
    const vastOverlay = document.getElementById('playerVastOverlay');
    const adVideo = document.getElementById('playerVastVideo');
    const mainVideo = document.getElementById('mainPlayerVideo');
    const posterCover = document.getElementById('playerPosterCover');

    if (!mainVideo || !currentVideoData) {
      finishAdAndPlayMain();
      return;
    }

    adFinished = false;

    if (posterCover) posterCover.classList.add('hidden');

    /* Skip pre-roll if no consent or no VAST helper */
    if (!consentAllows() || !CFG.helpers || !CFG.helpers.vastUrl || !CFG.exo || !CFG.exo.zones) {
      finishAdAndPlayMain();
      return;
    }

    if (!vastOverlay || !adVideo) {
      finishAdAndPlayMain();
      return;
    }

    vastOverlay.classList.remove('hidden');
    vastOverlay.style.display = '';

    let mediaUrl = null;
    let clickUrl = null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(function () {
        controller.abort();
      }, 6000);
      const zone = (CFG.exo.zones && CFG.exo.zones.playerVast) || '6072046';
      const vastEndpoint = (CFG.exo && CFG.exo.vastPlayerUrl) || CFG.helpers.vastUrl(zone || '6072046');
      const res = await fetch(vastEndpoint, { signal: controller.signal, credentials: 'omit' });
      clearTimeout(timer);
      if (!res.ok) throw new Error('VAST HTTP ' + res.status);
      const xml = await res.text();
      mediaUrl = parseVastMediaUrl(xml);
      clickUrl = parseVastClickUrl(xml);
    } catch (e) {
      finishAdAndPlayMain();
      return;
    }

    if (!mediaUrl) {
      finishAdAndPlayMain();
      return;
    }

    adVideo.muted = true;
    adVideo.playsInline = true;
    adVideo.src = mediaUrl;

    const skipBtn = document.getElementById('playerVastSkipBtn');
    let remaining = 5;

    if (skipBtn) {
      skipBtn.textContent = 'Skip in ' + remaining + 's';
      skipBtn.disabled = true;
      skipBtn.onclick = null;
    }

    const playPromise = adVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        finishAdAndPlayMain();
      });
    }

    if (adTimer) clearInterval(adTimer);
    adTimer = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(adTimer);
        adTimer = null;
        if (skipBtn) {
          skipBtn.disabled = false;
          skipBtn.textContent = 'Skip Ad';
          skipBtn.onclick = function (e) {
            e.preventDefault();
            finishAdAndPlayMain();
          };
        }
      } else if (skipBtn) {
        skipBtn.textContent = 'Skip in ' + remaining + 's';
      }
    }, 1000);

    adVideo.onended = function () {
      finishAdAndPlayMain();
    };

    if (clickUrl) {
      adVideo.onclick = function (e) {
        e.preventDefault();
        window.open(clickUrl, '_blank', 'noopener,noreferrer');
      };
    }
  }

  function finishAdAndPlayMain() {
    if (adFinished) return;
    adFinished = true;

    if (adTimer) {
      clearInterval(adTimer);
      adTimer = null;
    }

    const vastOverlay = document.getElementById('playerVastOverlay');
    const adVideo = document.getElementById('playerVastVideo');
    const mainVideo = document.getElementById('mainPlayerVideo');
    const posterCover = document.getElementById('playerPosterCover');

    if (adVideo) {
      try {
        adVideo.pause();
        adVideo.removeAttribute('src');
        adVideo.load();
      } catch (e) { /* ignore */ }
    }

    if (vastOverlay) {
      vastOverlay.classList.add('hidden');
      vastOverlay.style.display = 'none';
    }
    if (posterCover) posterCover.classList.add('hidden');

    if (!mainVideo || !currentVideoData || !currentVideoData.playableUrl) {
      showPlayerError();
      return;
    }

    mainVideo.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });

    mainVideo.src = currentVideoData.playableUrl;
    mainVideo.load();
    const p = mainVideo.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        mainVideo.muted = true;
        mainVideo.play().catch(function () {});
      });
    }
  }

  function showPlayerError() {
    const titleEl = document.getElementById('playerTitle');
    if (titleEl) titleEl.textContent = 'Video unavailable';
    showToast('Video could not be loaded');
  }

  function wireCTA() {
    const cta = document.getElementById('playerCtaBtn');
    if (!cta || cta.dataset.wired === '1') return;
    cta.dataset.wired = '1';
    cta.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (window.CumBearAds && typeof window.CumBearAds.openCrak === 'function') {
        window.CumBearAds.openCrak();
      } else if (CFG.crak && CFG.crak.smartlinkVideo) {
        window.open(CFG.crak.smartlinkVideo, '_blank', 'noopener,noreferrer');
      }
    });
  }

  function wireShare() {
    const btn = document.getElementById('playerShareBtn');
    if (!btn || btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', function () {
      const url =
        window.location.origin +
        '/watch/' +
        encodeURIComponent((currentVideoData && currentVideoData._id) || '');
      if (navigator.share) {
        navigator.share({ title: (currentVideoData && currentVideoData.title) || 'CumBear', url: url }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          showToast('Link copied');
        });
      } else {
        showToast(url);
      }
    });
  }

  function wireLike() {
    const btn = document.getElementById('playerLikeBtn');
    if (!btn || btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', function () {
      if (!currentVideoData) return;
      try {
        localStorage.setItem(LIKED_KEY(currentVideoData._id), '1');
        const likeEl = document.getElementById('playerLikeCount');
        if (likeEl) likeEl.textContent = 'Liked';
        showToast('Liked');
      } catch (e) { /* ignore */ }
    });
  }

  function loadRelated(videoId, category) {
    const grid = document.getElementById('relatedVideoGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="grid-status">Loading related…</div>';

    const myId = currentLoadId;
    const params = { page: 1, limit: 50, sort: 'gem', _: Date.now() };
    if (category) params.category = category;

    fetch(CFG.helpers.videoListUrl(params), { credentials: 'omit' })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (json) {
        if (myId !== currentLoadId) return;
        if (!json || !json.success || !Array.isArray(json.data)) {
          grid.innerHTML = '';
          return;
        }

        let list = json.data.filter(function (v) {
          return v && String(v._id) !== String(videoId);
        });

        const mixed =
          typeof window.mixAffiliateVideos === 'function'
            ? window.mixAffiliateVideos(list)
            : list;

        grid.innerHTML = '';
        const frag = document.createDocumentFragment();

        mixed.forEach(function (v) {
          if (!v) return;
          if (typeof window.renderMixedVideoCard === 'function') {
            const card = window.renderMixedVideoCard(v, function () {
              if (v.isAffiliate || v.slot === 'affiliate' || v.affiliateUrl) return;
              window.loadPlayerVideoById(v._id);
            });
            card.classList.add('e2e');
            frag.appendChild(card);
            return;
          }
        });

        grid.appendChild(frag);
        if (window.CumBearAds && window.CumBearAds.refreshBanners) {
          try {
            window.CumBearAds.refreshBanners();
          } catch (e) { /* ignore */ }
        }
      })
      .catch(function () {
        if (myId !== currentLoadId) return;
        grid.innerHTML = '';
      });
  }

  function boot() {
    wireCTA();
    wireShare();
    wireLike();

    const pathMatch = window.location.pathname.match(/^\/watch\/([A-Za-z0-9_-]+)\/?$/);
    if (pathMatch) {
      setTimeout(function () {
        window.loadPlayerVideoById(pathMatch[1]);
      }, 120);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
