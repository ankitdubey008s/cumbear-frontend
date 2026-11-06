/**
 * CUMBEAR config — production
 * API + ExoClick zones (panel) + Juicy + Crak
 */
(function () {
  'use strict';
  if (window.CUMBEAR) return;

  var CONFIG = {
    api: {
      base: 'https://cumbear-backend.vercel.app',
      videosPath: '/api/videos',
      singleVideoPath: '/api/videos',
      categoriesPath: '/api/categories'
    },
    social: {
      facebook: 'https://www.facebook.com/share/1Cj5K1UMPX/',
      telegram: 'https://t.me/cumbear_offical',
      twitter: 'https://x.com/cumbear_offical',
      youtube: 'https://www.youtube.com/@cumbear',
      tiktok: 'https://www.tiktok.com/@cumbear_offical',
      instagram: 'https://www.instagram.com/cumbear_offical'
    },
    supportUrl: 'https://support.cumbear.in',
    exo: {
      providerScript: 'https://a.magsrv.com/ad-provider.js',
      pemsrvProvider: 'https://a.pemsrv.com/ad-provider.js',
      zones: {
        webBanner: '6072024',
        mobileBanner: '6072026',
        webIm: '6072030',
        mobileIm: '6072034',
        webSticky: '6072040',
        playerVast: '6072046',
        shortsVast: '6072050',
        videoSlider: '6072056',
        interstitialMobile: '6072358',
        interstitialWeb: '6072362',
        popMobile: '6071798',
        popWeb: '6071818',
        /* aliases used by older modules */
        desktopLeaderboard: '6072024',
        playerVast: '6072046',
        shortsVast: '6072050',
        mobilePopunder: '6071798',
        webPopunder: '6071818'
      },
      vastPlayerUrl: 'https://s.magsrv.com/v1/vast.php?idz=6072046',
      vastShortsUrl: 'https://s.magsrv.com/v1/vast.php?idzone=6072050',
      popLinkBase: 'https://s.pemsrv.com/v1/link.php'
    },
    juicy: {
      script: 'https://js.juicyads.com/jp.php?c=4474y213u284u4r2p2d453a424&u=https%3A%2F%2Fwww.juicyads.rocks'
    },
    crak: {
      dating: 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN',
      native: 'https://t.datsk3.com/425367/3788/0?target=nativeads&po=6456&aff_sub5=SF_006OG000004lmDN',
      pps: 'https://t.datsk3.com/425367/5165?aff_sub5=SF_006OG000004lmDN',
      smartlinkDating: 'https://t.datsk3.com/425367/9986/0?target=pops&po=6456&aff_sub5=SF_006OG000004lmDN',
      smartlinkVideo: 'https://t.datsk3.com/425367/5165?aff_sub5=SF_006OG000004lmDN'
    },
    consent: { cookies: {} },
    ux: {
      cardPressPreviewDelayMs: 450,
      shortsPreviewMaxSeconds: 180
    }
  };

  window.CUMBEAR = CONFIG;
  window.CUMBEAR.helpers = {
    videoListUrl: function (params) {
      var q = new URLSearchParams(params || {}).toString();
      return CONFIG.api.base + CONFIG.api.videosPath + (q ? '?' + q : '');
    },
    singleVideoUrl: function (id) {
      return CONFIG.api.base + CONFIG.api.singleVideoPath + '/' + encodeURIComponent(id);
    },
    categoriesUrl: function () {
      return CONFIG.api.base + CONFIG.api.categoriesPath;
    },
    vastUrl: function (zone) {
      if (String(zone) === '6072046' || zone === CONFIG.exo.zones.playerVast) {
        return CONFIG.exo.vastPlayerUrl;
      }
      if (String(zone) === '6072050' || zone === CONFIG.exo.zones.shortsVast) {
        return CONFIG.exo.vastShortsUrl;
      }
      return 'https://s.magsrv.com/v1/vast.php?idzone=' + encodeURIComponent(zone);
    },
    clickUrl: function (zone) {
      return 'https://s.magsrv.com/click.php?idzone=' + encodeURIComponent(zone);
    },
    exoPopLinkUrl: function () {
      var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      var zone = mobile ? CONFIG.exo.zones.popMobile : CONFIG.exo.zones.popWeb;
      return CONFIG.exo.popLinkBase + '?cat=&idzone=' + encodeURIComponent(zone) + '&type=8';
    },
    isMobileDevice: function () {
      return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    },
    videoPath: function (id) {
      return '/video/' + encodeURIComponent(id);
    },
    cooldownPassed: function () { return true; },
    markCooldown: function () {}
  };
})();
