/**
 * ==========================================================================
 * CUMBEAR — CENTRAL CONFIGURATION
 * Every external URL, ad zone, and affiliate ID in one place.
 * Change a value here → every consuming module picks it up on reload.
 *
 * Exposed as: window.CUMBEAR
 * ==========================================================================
 */
(function () {
  'use strict';

  /* Guard against double-load (e.g. deferred + inline include) */
  if (window.CUMBEAR) return;

  const CONFIG = {
    /* ---------- API ---------- */
    api: Object.freeze({
      base: 'https://cumbearbackend-snowy.vercel.app',
      videosPath: '/api/videos',
      singleVideoPath: '/api/videos',          // + '/:id'
      categoriesPath: '/api/categories',
      faphouseFeedPath: '/api/faphouse/feed'
    }),

    /* ---------- ExoClick zones ---------- */
    exo: Object.freeze({
      providerScript: 'https://a.magsrv.com/ad-provider.js',
      zones: Object.freeze({
        mobileBanner: '6057032',               // 300x250 rectangle (top + bottom + player)
        desktopLeaderboard: '6056586',         // 728x90 (top + bottom + player)
        videoSlider: '6056606',                // bottom-right floating popup
        mobilePopunder: '6056600',             // class-trigger popunder (mobile)
        webPopunder: '6056598',                // class-trigger popunder (desktop)
        playerVast: '6056604',                 // 16:9 pre-roll on player
        shortsVast: '6056608'                  // 9:16 vertical in-stream on shorts
      }),
      vastBaseUrl: 'https://s.magsrv.com/v1/vast.php',
      clickBaseUrl: 'https://s.magsrv.com/click.php',
      /* Class name that popunder.js binds — add to any button/link to trigger popunder */
      popunderTriggerClass: 'exo-pop-trigger'
    }),

    /* ---------- CrakRevenue SmartLinks ---------- */
    crak: Object.freeze({
      enabled: true,
      smartlinkDating: 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN',
      smartlinkNative: 'https://t.datsk3.com/425367/3788/0?target=nativeads&po=6456&aff_sub5=SF_006OG000004lmDN',
      /* Sticky banner: first-show delay + dismiss cooldown (ms) */
      stickyDelayMs: 12000,
      stickyDismissCooldownMs: 6 * 60 * 60 * 1000,   // 6 hours
      /* Timed header slot: interval between promotions */
      timedIntervalMs: 2 * 60 * 1000,                 // every 2 min
      timedFirstDelayMs: 45 * 1000,                   // first show after 45s
      timedVisibleMs: 20000,                          // stays visible for 20s per appearance
      timedDismissCooldownMs: 30 * 60 * 1000,         // 30 min after user closes
      /* Rotating copy so the ad doesn't look static */
      timedMessages: [
        '🔥 Limited offer — verified singles online now',
        '💋 New matches in your area — 18+ only',
        '✨ Free trial ends today — join in 30 seconds'
      ]
    }),

    /* ---------- FapHouse affiliate ---------- */
    faphouse: Object.freeze({
      affiliateId: 'vIZ',
      /* Live JSON feed (preferred; falls back to built-in pool if CORS/offline) */
      feedUrl: 'https://fap.cash/content/dump?ai=vIZ&forient=straight&fcats=!&fres=all&fperiod=day&furls=c1&fthumbs=mmsmall&ftcnt=1&ford=dt&fdelim=%7C&fformat=json&fowner=all&ftsize=small&url=on&title=on&cats=on&dur=on&trailer=on&thumbs=on',
      /* Affiliate lander (used when opening in new tab if direct item URL missing) */
      landerUrl: 'https://fhgte.com/?utm_campaign=ai.vIZ',
      /* Insert 1 FapHouse card after every N organic videos */
      injectEvery: 5,
      /* Cache live feed in-memory for this long before retry (ms) */
      feedCacheMs: 10 * 60 * 1000
    }),

    /* ---------- Consent / frequency ---------- */
    consent: Object.freeze({
      /* Popunder: one per user per 24h (per ExoClick best practice) */
      popunderCooldownMs: 24 * 60 * 60 * 1000,
      /* Player first-play popunder: once per user per 24h */
      playerFirstPlayCooldownMs: 24 * 60 * 60 * 1000,
      /* Shorts first-tap popunder: once per user per 24h */
      shortsFirstTapCooldownMs: 24 * 60 * 60 * 1000,
      /* Cookies for each of the above */
      cookies: Object.freeze({
        popunder: 'cumbear_pop_ts',
        playerFirstPlay: 'cumbear_player_pp_ts',
        shortsFirstTap: 'cumbear_shorts_pp_ts',
        consent: 'cumbear_consent'
      })
    }),

    /* ---------- UX ---------- */
    ux: Object.freeze({
      cardPressPreviewDelayMs: 800,     // hold before preview starts
      cardPreviewMaxSeconds: 60,        // preview auto-stops here
      shortsPreviewMaxSeconds: 180,     // shorts hard-stop
      adsVisibleViews: Object.freeze(['homeView', 'categoriesView', 'playerView']),
      sliderPopFirstDelayMs: 4000,
      sliderPopScrollTriggerPx: 120,
      sliderPopDismissCooldownMs: 45000
    })
  };

  window.CUMBEAR = CONFIG;

  /* Convenience helpers so consumers don't rebuild URLs every time */
  window.CUMBEAR.helpers = {
    videoListUrl: function (params) {
      const q = new URLSearchParams(params || {}).toString();
      return CONFIG.api.base + CONFIG.api.videosPath + (q ? '?' + q : '');
    },
    singleVideoUrl: function (id) {
      return CONFIG.api.base + CONFIG.api.singleVideoPath + '/' + encodeURIComponent(id);
    },
    categoriesUrl: function () {
      return CONFIG.api.base + CONFIG.api.categoriesPath;
    },
    faphouseFeedApiUrl: function () {
      return CONFIG.api.base + CONFIG.api.faphouseFeedPath;
    },
    vastUrl: function (zone) {
      return CONFIG.exo.vastBaseUrl + '?idzone=' + encodeURIComponent(zone);
    },
    clickUrl: function (zone) {
      return CONFIG.exo.clickBaseUrl + '?idzone=' + encodeURIComponent(zone);
    },
    /* Returns true if the cooldown cookie is NOT set (i.e. we may show ad again) */
    cooldownPassed: function (cookieName) {
      try {
        const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + cookieName + '=([^;]+)'));
        if (!m) return true;
        const ts = parseInt(decodeURIComponent(m[1]), 10);
        if (!ts || isNaN(ts)) return true;
        return (Date.now() - ts) > 0; /* cookie itself carries the expiry; if it exists → still in cooldown */
      } catch (e) { return true; }
    },
    /* Record a cooldown timestamp (cookie expires after `cooldownMs`) */
    markCooldown: function (cookieName, cooldownMs) {
      try {
        const exp = new Date(Date.now() + cooldownMs);
        document.cookie = cookieName + '=' + Date.now() +
          '; expires=' + exp.toUTCString() +
          '; path=/; SameSite=Lax';
      } catch (e) { /* ignore */ }
    }
  };
})();
