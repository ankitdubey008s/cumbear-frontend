/**
 * ==========================================================================
 * CUMBEAR — HOLD-TO-PREVIEW ENGINE v2
 * --------------------------------------------------------------------------
 * Behavior:
 *   - HOLD 1 second → preview starts (plays 60s of the video)
 *   - RELEASE → preview KEEPS PLAYING (no need to keep holding)
 *   - TAP the previewing card → stops preview + opens player
 *   - TAP a different card → stops current preview, starts new (if held 1s)
 *   - 60s max duration → auto-stop
 *   - Backgrounding the tab → auto-stop
 *
 * Only ONE preview plays at a time (module-scoped activePreview).
 *
 * Usage:
 *   window.attachHoldAndSlidePreview(card, video, onOpen)
 *
 * Exposed:
 *   window.CumBearPreview.stop()  → force-stop any active preview
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.attachHoldAndSlidePreview) return;
  const CFG = window.CUMBEAR;
  if (!CFG) {
    console.warn('[CumBearPreview] config.js not loaded — aborting');
    return;
  }

  /* ---------- module-level: only one preview at a time ---------- */
  let activePreview = null; /* { card, stopFn } */

  function stopActive() {
    if (activePreview && typeof activePreview.stopFn === 'function') {
      try { activePreview.stopFn(); } catch (e) { /* ignore */ }
    }
    activePreview = null;
  }

  /* ---------- attach to one card ---------- */
  function attachHoldAndSlidePreview(card, video, onOpen) {
    if (!card || !video) return;

    const thumb        = card.querySelector('.video-thumb');
    const infoEl       = card.querySelector('.video-info');
    const title        = card.querySelector('.video-title');
    const holder       = card.querySelector('.preview-video-holder');
    const timeline     = card.querySelector('.preview-timeline');
    const timelineFill = card.querySelector('.preview-timeline-fill');
    const loading      = card.querySelector('.preview-loading');

    if (!thumb || !holder) return;

    /* Attach only once per card */
    if (thumb.dataset.previewAttached === '1') return;
    thumb.dataset.previewAttached = '1';

    /* If no playable URL — normal click to open only */
    if (!video.playableUrl) {
      const openClick = function () {
        stopActive();
        if (typeof onOpen === 'function') onOpen();
      };
      thumb.addEventListener('click', openClick);
      if (infoEl) infoEl.addEventListener('click', openClick);
      return;
    }

    const HOLD_DELAY_MS      = 1000;   /* user must hold this long */
    const MAX_PREVIEW_SEC    = 60;     /* preview plays for up to 60s */

    let holdTimer         = null;
    let isPreviewPlaying  = false;
    let heldDown          = false;
    let startX            = 0;
    let startY            = 0;
    let previewVideoEl    = null;
    let previewTimeoutId  = null;
    let suppressClickOnce = false;

    /* Prevent long-press context menu / image drag */
    thumb.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    thumb.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });

    /* ---------- stop preview ---------- */
    function stopPreview() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (previewTimeoutId) {
        clearTimeout(previewTimeoutId);
        previewTimeoutId = null;
      }
      if (!isPreviewPlaying) return;

      isPreviewPlaying = false;

      if (previewVideoEl) {
        try {
          previewVideoEl.pause();
          previewVideoEl.removeAttribute('src');
          previewVideoEl.load();
          previewVideoEl.remove();
        } catch (e) { /* ignore */ }
        previewVideoEl = null;
      }

      thumb.classList.remove('previewing');
      if (title) title.classList.remove('previewing-text');
      if (timeline) timeline.classList.remove('active');
      if (loading) loading.classList.remove('active');
      if (timelineFill) timelineFill.style.width = '0%';

      if (activePreview && activePreview.card === card) {
        activePreview = null;
      }
    }

    /* ---------- start preview ---------- */
    function startPreview() {
      /* Cancel any existing preview */
      stopActive();

      isPreviewPlaying = true;

      thumb.classList.add('previewing');
      if (title) title.classList.add('previewing-text');
      if (timeline) timeline.classList.add('active');
      if (loading) loading.classList.add('active');

      previewVideoEl = document.createElement('video');
      previewVideoEl.muted = true;
      previewVideoEl.setAttribute('muted', '');
      previewVideoEl.setAttribute('playsinline', '');
      previewVideoEl.setAttribute('webkit-playsinline', '');
      previewVideoEl.setAttribute('disablepictureinpicture', '');
      previewVideoEl.preload = 'auto';
      previewVideoEl.src = video.playableUrl;
      previewVideoEl.playbackRate = 1.0;

      previewVideoEl.addEventListener('canplay', function () {
        if (!isPreviewPlaying) return;
        if (loading) loading.classList.remove('active');
        const p = previewVideoEl.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function () { stopPreview(); });
        }
      }, { once: true });

      previewVideoEl.addEventListener('timeupdate', function () {
        if (!previewVideoEl || !isPreviewPlaying) return;
        const t = previewVideoEl.currentTime;
        if (t >= MAX_PREVIEW_SEC) {
          stopPreview();
          return;
        }
        if (timelineFill) {
          timelineFill.style.width = Math.min(100, (t / MAX_PREVIEW_SEC) * 100) + '%';
        }
      });

      previewVideoEl.addEventListener('error', stopPreview, { once: true });

      holder.appendChild(previewVideoEl);

      /* Hard 60s timeout as backup */
      previewTimeoutId = setTimeout(function () {
        if (isPreviewPlaying) stopPreview();
      }, (MAX_PREVIEW_SEC + 1) * 1000);

      activePreview = { card: card, stopFn: stopPreview };
    }

    /* ---------- helper: open player ---------- */
    function openPlayer() {
      stopPreview();
      stopActive();
      if (typeof onOpen === 'function') onOpen();
    }

    /* ---------- pointerdown: start hold timer ---------- */
    thumb.addEventListener('pointerdown', function (e) {
      /* Only left button / touch */
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      /* If THIS card is currently previewing → tapping it opens the player */
      if (isPreviewPlaying) {
        suppressClickOnce = true;
        openPlayer();
        return;
      }

      heldDown = true;
      startX = e.clientX;
      startY = e.clientY;

      holdTimer = setTimeout(function () {
        if (!heldDown) return;
        heldDown = false;
        startPreview();
      }, HOLD_DELAY_MS);
    });

    /* ---------- pointermove: cancel if drag ---------- */
    thumb.addEventListener('pointermove', function (e) {
      if (!heldDown) return;

      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      const thumbWidth = thumb.clientWidth || 100;
      const tolerance = Math.max(12, thumbWidth * 0.08);

      if (dx > tolerance || dy > tolerance) {
        /* User is dragging → cancel hold */
        heldDown = false;
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
      }
    });

    /* ---------- pointerup ---------- */
    thumb.addEventListener('pointerup', function () {
      /* Cancel hold timer */
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }

      /* If preview is playing → DON'T stop it. It keeps playing per spec. */
      if (isPreviewPlaying) {
        /* Nothing — preview continues */
        return;
      }

      /* If we just handled a tap-to-open above */
      if (suppressClickOnce) {
        suppressClickOnce = false;
        return;
      }

      /* Regular tap (short press, not yet previewing) → open player */
      if (heldDown) {
        heldDown = false;
        openPlayer();
      }
    });

    /* ---------- pointercancel / pointerleave ---------- */
    thumb.addEventListener('pointercancel', function () {
      heldDown = false;
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      /* Don't stop a running preview — only cancel an in-flight hold */
    });

    thumb.addEventListener('pointerleave', function () {
      /* Mouse left the card while holding → cancel the hold
         but don't stop a running preview */
      if (heldDown) {
        heldDown = false;
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
      }
    });

    /* ---------- info area tap (title / meta) → open player ---------- */
    if (infoEl) {
      infoEl.addEventListener('click', function (e) {
        /* Prevent double-open if thumb pointerup already handled it */
        if (suppressClickOnce) {
          suppressClickOnce = false;
          e.stopPropagation();
          return;
        }
        openPlayer();
      });
    }
  }

  /* ---------- global teardown ---------- */
  window.addEventListener('pagehide', stopActive);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopActive();
  });

  /* ---------- export ---------- */
  window.attachHoldAndSlidePreview = attachHoldAndSlidePreview;
  window.CumBearPreview = { stop: stopActive };
})();
