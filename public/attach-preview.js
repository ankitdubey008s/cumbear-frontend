/**
 * ==========================================================================
 * CUMBEAR — SHARED HOLD-TO-PREVIEW ENGINE
 * --------------------------------------------------------------------------
 * Single implementation used by every video card on every view
 * (home, search, related). Replaces the four duplicated copies in
 * home.js / search.js / shorts.js / player.js.
 *
 * Usage:
 *   window.attachHoldAndSlidePreview(card, video, onOpen)
 *     card   → the .video-card element
 *     video  → the video data object ({ playableUrl, _id, ... })
 *     onOpen → function called when user taps (not holds) the card
 *
 * Public API:
 *   window.CumBearPreview.stop()  → force-stop current preview
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.attachHoldAndSlidePreview) return; /* double-load guard */
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
    const title        = card.querySelector('.video-title');
    const holder       = card.querySelector('.preview-video-holder');
    const timeline     = card.querySelector('.preview-timeline');
    const timelineFill = card.querySelector('.preview-timeline-fill');
    const loading      = card.querySelector('.preview-loading');

    if (!thumb || !holder) return;

    /* Don't attach twice to the same card */
    if (thumb.dataset.previewAttached === '1') return;
    thumb.dataset.previewAttached = '1';

    /* Bail if this card has no playable URL */
    if (!video.playableUrl) {
      /* Fallback: plain click → onOpen */
      card.addEventListener('click', function () {
        if (typeof onOpen === 'function') onOpen();
      });
      return;
    }

    const PRESS_DELAY    = CFG.ux.cardPressPreviewDelayMs;   /* 800ms */
    const MAX_PREVIEW    = CFG.ux.cardPreviewMaxSeconds;      /* 60s */
    const DRAG_TOLERANCE = 12;

    let pressTimer       = null;
    let isPreviewPlaying = false;
    let heldDown         = false;
    let startX           = 0;
    let startY           = 0;
    let previewVideoEl   = null;
    let previewSuppressClick = false;

    /* Prevent long-press context menu / image drag */
    thumb.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    thumb.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });

    /* ---------- stop ---------- */
    function stopPreview() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
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

    /* ---------- start ---------- */
    function startPreview() {
      /* Stop any other preview on the page */
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
      previewVideoEl.preload = 'metadata';
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
        const dur = Math.min(previewVideoEl.duration || MAX_PREVIEW, MAX_PREVIEW);
        if (previewVideoEl.currentTime >= dur) {
          stopPreview();
          return;
        }
        if (timelineFill && dur > 0) {
          timelineFill.style.width = Math.min(100, (previewVideoEl.currentTime / dur) * 100) + '%';
        }
      });

      previewVideoEl.addEventListener('error', stopPreview, { once: true });

      holder.appendChild(previewVideoEl);

      activePreview = { card: card, stopFn: stopPreview };
    }

    /* ---------- pointer events ---------- */
    thumb.addEventListener('pointerdown', function (e) {
      /* Only left button / touch */
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      startX = e.clientX;
      startY = e.clientY;
      heldDown = true;
      previewSuppressClick = false;

      if (isPreviewPlaying) {
        stopPreview();
        heldDown = false;
        return;
      }

      pressTimer = setTimeout(function () {
        if (!heldDown) return;
        previewSuppressClick = true;
        startPreview();
      }, PRESS_DELAY);
    });

    thumb.addEventListener('pointermove', function (e) {
      if (!heldDown && !isPreviewPlaying) return;

      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      const thumbWidth = thumb.clientWidth || 100;
      const tolerance = Math.max(DRAG_TOLERANCE, thumbWidth * 0.08);

      if (!isPreviewPlaying && (dx > tolerance || dy > tolerance)) {
        /* User is dragging → cancel hold timer */
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        heldDown = false;
      } else if (isPreviewPlaying && previewVideoEl && previewVideoEl.duration) {
        /* Scrub within the 60s preview window */
        const rect = thumb.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const target = ratio * Math.min(previewVideoEl.duration, MAX_PREVIEW);
        try { previewVideoEl.currentTime = target; } catch (err) { /* ignore */ }
      }
    });

    thumb.addEventListener('pointerup', function () {
      const wasHeld = heldDown;
      heldDown = false;

      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }

      if (isPreviewPlaying) {
        /* Ending a preview ends the interaction — do not open player */
        stopPreview();
        return;
      }

      /* Tap (not hold): open player */
      if (wasHeld && !previewSuppressClick) {
        if (typeof onOpen === 'function') onOpen();
      }
      previewSuppressClick = false;
    });

    thumb.addEventListener('pointercancel', function () {
      heldDown = false;
      previewSuppressClick = false;
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      stopPreview();
    });

    thumb.addEventListener('pointerleave', function () {
      /* Mouse left the card while holding → cancel, don't open */
      if (heldDown && !isPreviewPlaying) {
        heldDown = false;
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      }
    });

    /* ---------- info tap (title/meta area) → open player ---------- */
    const infoEl = card.querySelector('.video-info');
    if (infoEl && !infoEl.dataset.previewAttached) {
      infoEl.dataset.previewAttached = '1';
      infoEl.addEventListener('click', function (e) {
        /* Don't fire if user just released a preview */
        if (previewSuppressClick) {
          previewSuppressClick = false;
          e.stopPropagation();
          return;
        }
        stopPreview();
        if (typeof onOpen === 'function') onOpen();
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
