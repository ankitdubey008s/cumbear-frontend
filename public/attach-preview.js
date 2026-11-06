/**
 * CUMBEAR — Hold-to-preview (ultimate)
 * Hold 500ms → preview up to 60s
 * Blocks Chrome long-press menu / callout / text select / image drag
 */
(function () {
  'use strict';
  if (window.attachHoldAndSlidePreview) return;

  var activePreview = null;

  function stopActive() {
    if (activePreview && typeof activePreview.stopFn === 'function') {
      try {
        activePreview.stopFn();
      } catch (e) {}
    }
    activePreview = null;
  }

  window.CumBearPreview = {
    stop: stopActive
  };

  /**
   * @param {HTMLElement} card
   * @param {object} video  needs playableUrl
   * @param {function} onOpen  called when user should open player
   */
  function attachHoldAndSlidePreview(card, video, onOpen) {
    if (!card || !video) return;

    var thumb = card.querySelector('.video-thumb') || card.querySelector('.thumb') || card;
    var holder =
      card.querySelector('.preview-video-holder') ||
      thumb.querySelector('.preview-video-holder');
    var timeline = card.querySelector('.preview-timeline');
    var timelineFill = card.querySelector('.preview-timeline-fill');
    var loading = card.querySelector('.preview-loading');
    var infoEl = card.querySelector('.video-info');

    if (thumb.dataset.previewAttached === '1') return;
    thumb.dataset.previewAttached = '1';

    /* Non-playable (affiliate) — click opens only */
    if (!video.playableUrl) {
      function openOnly(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        stopActive();
        if (typeof onOpen === 'function') onOpen();
      }
      thumb.addEventListener('click', openOnly);
      if (infoEl) infoEl.addEventListener('click', openOnly);
      return;
    }

    var HOLD_MS = 500;
    var MAX_SEC = 60;

    var holdTimer = null;
    var previewVideoEl = null;
    var previewTimeoutId = null;
    var suppressClickOnce = false;
    var holding = false;
    var pointerId = null;

    /* ---- Block browser chrome long-press UI ---- */
    function blockBrowserMenu(el) {
      if (!el) return;
      el.style.webkitTouchCallout = 'none';
      el.style.webkitUserSelect = 'none';
      el.style.userSelect = 'none';
      el.style.touchAction = 'manipulation';
      el.setAttribute('draggable', 'false');
      el.addEventListener(
        'contextmenu',
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        },
        true
      );
      el.addEventListener(
        'dragstart',
        function (e) {
          e.preventDefault();
        },
        true
      );
      el.addEventListener(
        'selectstart',
        function (e) {
          e.preventDefault();
        },
        true
      );
    }

    blockBrowserMenu(thumb);
    blockBrowserMenu(card);
    thumb.querySelectorAll('img').forEach(function (img) {
      blockBrowserMenu(img);
      img.setAttribute('draggable', 'false');
    });

    function stopPreview() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (previewTimeoutId) {
        clearTimeout(previewTimeoutId);
        previewTimeoutId = null;
      }
      holding = false;
      if (previewVideoEl) {
        try {
          previewVideoEl.pause();
          previewVideoEl.removeAttribute('src');
          previewVideoEl.load();
          if (previewVideoEl.parentNode) previewVideoEl.parentNode.removeChild(previewVideoEl);
        } catch (e) {}
        previewVideoEl = null;
      }
      thumb.classList.remove('previewing');
      if (holder) holder.innerHTML = '';
      if (timeline) timeline.classList.add('hidden');
      if (timelineFill) timelineFill.style.width = '0%';
      if (loading) loading.classList.add('hidden');
      if (activePreview && activePreview.card === card) activePreview = null;
    }

    function startPreview() {
      stopActive();
      stopPreview();

      if (!holder) {
        /* Create holder if missing */
        holder = document.createElement('div');
        holder.className = 'preview-video-holder';
        holder.style.cssText =
          'position:absolute;inset:0;overflow:hidden;background:#000;z-index:2;';
        if (getComputedStyle(thumb).position === 'static') thumb.style.position = 'relative';
        thumb.appendChild(holder);
      }

      if (loading) loading.classList.remove('hidden');

      var v = document.createElement('video');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.src = video.playableUrl;
      v.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      blockBrowserMenu(v);
      holder.innerHTML = '';
      holder.appendChild(v);
      previewVideoEl = v;
      thumb.classList.add('previewing');

      activePreview = { card: card, stopFn: stopPreview };

      var p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          if (loading) loading.classList.add('hidden');
        });
      }

      v.addEventListener(
        'playing',
        function () {
          if (loading) loading.classList.add('hidden');
        },
        { once: true }
      );

      if (timeline) timeline.classList.remove('hidden');
      if (timelineFill) timelineFill.style.width = '0%';

      var started = Date.now();
      function tick() {
        if (!previewVideoEl) return;
        var t = (Date.now() - started) / 1000;
        if (timelineFill) {
          timelineFill.style.width = Math.min(100, (t / MAX_SEC) * 100) + '%';
        }
        if (t >= MAX_SEC) {
          stopPreview();
          return;
        }
        previewTimeoutId = setTimeout(tick, 200);
      }
      tick();
    }

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      holding = true;
      pointerId = e.pointerId;
      try {
        thumb.setPointerCapture(e.pointerId);
      } catch (err) {}

      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(function () {
        holdTimer = null;
        if (!holding) return;
        suppressClickOnce = true;
        startPreview();
      }, HOLD_MS);
    }

    function onPointerUp(e) {
      holding = false;
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      try {
        if (pointerId != null) thumb.releasePointerCapture(pointerId);
      } catch (err) {}
      pointerId = null;
    }

    function onPointerCancel() {
      holding = false;
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    }

    thumb.addEventListener('pointerdown', onPointerDown, { passive: true });
    thumb.addEventListener('pointerup', onPointerUp, { passive: true });
    thumb.addEventListener('pointercancel', onPointerCancel, { passive: true });
    thumb.addEventListener('pointerleave', function () {
      /* Don't cancel hold on leave if already previewing */
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
        holding = false;
      }
    });

    /* Click: open player (or stop preview then open) */
    function onClick(e) {
      e.preventDefault();
      e.stopPropagation();
      if (suppressClickOnce) {
        suppressClickOnce = false;
        /* After hold started preview, first click opens player */
        stopPreview();
        if (typeof onOpen === 'function') onOpen();
        return;
      }
      if (previewVideoEl) {
        stopPreview();
        if (typeof onOpen === 'function') onOpen();
        return;
      }
      stopActive();
      if (typeof onOpen === 'function') onOpen();
    }

    thumb.addEventListener('click', onClick);
    if (infoEl) {
      infoEl.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        stopActive();
        stopPreview();
        if (typeof onOpen === 'function') onOpen();
      });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopPreview();
    });
  }

  window.attachHoldAndSlidePreview = attachHoldAndSlidePreview;
})();

