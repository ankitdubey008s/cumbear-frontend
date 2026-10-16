/**
 * Shared Hold-and-Slide Video Preview Engine
 */
window.attachHoldAndSlidePreview = function (card, video, onOpen) {
  const thumb = card.querySelector('.video-thumb');
  const title = card.querySelector('.video-title');
  const holder = card.querySelector('.preview-video-holder');
  const timeline = card.querySelector('.preview-timeline');
  const timelineFill = card.querySelector('.preview-timeline-fill');
  const loading = card.querySelector('.preview-loading');

  let pressTimer = null;
  let isPreviewPlaying = false;
  let startX = 0;
  let startY = 0;
  let heldDown = false;
  let videoEl = null;

  if (!thumb) return;

  thumb.addEventListener('contextmenu', (e) => e.preventDefault());
  thumb.querySelectorAll('img').forEach(img => img.addEventListener('dragstart', (e) => e.preventDefault()));

  function stopPreview() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    if (isPreviewPlaying) {
      isPreviewPlaying = false;
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
        videoEl.remove();
        videoEl = null;
      }
      thumb.classList.remove('previewing');
      if (title) title.classList.remove('previewing-text');
      if (timeline) timeline.classList.remove('active');
      if (loading) loading.classList.remove('active');
      if (timelineFill) timelineFill.style.width = '0%';
    }
  }

  function startPreview() {
    document.querySelectorAll('.video-thumb.previewing').forEach(el => {
      const v = el.querySelector('video');
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
      el.classList.remove('previewing');
    });

    isPreviewPlaying = true;
    thumb.classList.add('previewing');
    if (title) title.classList.add('previewing-text');
    if (timeline) timeline.classList.add('active');
    if (loading) loading.classList.add('active');

    videoEl = document.createElement('video');
    videoEl.setAttribute('muted', '');
    videoEl.muted = true;
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('webkit-playsinline', '');
    videoEl.preload = 'auto';
    videoEl.src = video.playableUrl;
    videoEl.playbackRate = 1.0;

    videoEl.oncanplay = () => {
      if (loading) loading.classList.remove('active');
      videoEl.play().catch(() => stopPreview());
    };

    videoEl.ontimeupdate = () => {
      if (videoEl.currentTime > 60) {
        stopPreview();
        return;
      }
      if (timelineFill) {
        timelineFill.style.width = `${(videoEl.currentTime / 60) * 100}%`;
      }
    };

    videoEl.onerror = () => stopPreview();
    if (holder) holder.appendChild(videoEl);
  }

  thumb.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    heldDown = true;

    if (isPreviewPlaying) {
      stopPreview();
      heldDown = false;
      return;
    }

    pressTimer = setTimeout(() => {
      if (heldDown) {
        startPreview();
      }
    }, 800);
  });

  thumb.addEventListener('pointermove', (e) => {
    if (!heldDown && !isPreviewPlaying) return;
    const diffX = Math.abs(e.clientX - startX);
    const diffY = Math.abs(e.clientY - startY);

    if (!isPreviewPlaying && (diffX > 10 || diffY > 10)) {
      clearTimeout(pressTimer);
      pressTimer = null;
    } else if (isPreviewPlaying && videoEl && videoEl.duration) {
      const rect = thumb.getBoundingClientRect();
      const scrubRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      videoEl.currentTime = scrubRatio * Math.min(videoEl.duration, 60);
    }
  });

  thumb.addEventListener('pointerup', () => {
    heldDown = false;
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
      if (!isPreviewPlaying && typeof onOpen === 'function') {
        onOpen();
      }
    }
  });

  thumb.addEventListener('pointercancel', () => {
    heldDown = false;
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });

  const infoEl = card.querySelector('.video-info');
  if (infoEl) {
    infoEl.addEventListener('click', () => {
      stopPreview();
      if (typeof onOpen === 'function') onOpen();
    });
  }
};
