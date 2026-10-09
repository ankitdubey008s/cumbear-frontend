document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('videoGrid');
  const pag = document.getElementById('paginationContainer');
  const cats = document.getElementById('horizontalCats');
  const fm = document.getElementById('filterMenu');
  const fb = document.getElementById('filterBtn');
  
  let page = 1, sort = '', cat = '', firstCatClick = {};
  const API_URL = 'https://cumbear-backend.vercel.app';

  if (fb) {
    fb.onclick = e => { e.stopPropagation(); fm.classList.toggle('show'); };
  }
  document.addEventListener('click', () => { if (fm) fm.classList.remove('show'); });
  
  if (fm) {
    fm.querySelectorAll('.filter-option').forEach(o => {
      o.onclick = e => {
        e.stopPropagation();
        fm.querySelectorAll('.filter-option').forEach(x => x.classList.remove('active'));
        o.classList.add('active');
        sort = o.dataset.sort;
        fb.querySelector('span').textContent = o.textContent;
        fm.classList.remove('show');
        page = 1;
        load();
      };
    });
  }

  async function loadCats() {
    if (!cats) return;
    cats.innerHTML = '<button class="h-cat-chip active" data-cat="all">All</button>';
    try {
      const r = await fetch(`${API_URL}/api/categories`);
      const d = await r.json();
      if (d.success && d.data && d.data.length > 0) {
        d.data.sort((a, b) => b.count - a.count).slice(0, 20).forEach(c => {
          const b = document.createElement('button');
          b.className = 'h-cat-chip';
          b.textContent = c._id.charAt(0).toUpperCase() + c._id.slice(1);
          b.onclick = () => {
            cats.querySelectorAll('.h-cat-chip').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            cat = c._id;
            page = 1;
            load();
          };
          cats.appendChild(b);
        });
      }
    } catch (e) { console.error('Failed to load categories:', e); }
  }

  async function load() {
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">Loading...</div>';
    try {
      const rp = page === 1 ? Math.floor(Math.random() * 20) + 1 : page;
      let u = `${API_URL}/api/videos?page=${rp}&limit=50`;
      if (cat && cat !== 'all') u += `&category=${encodeURIComponent(cat)}`;
      if (sort) u += `&sort=${sort}`;
      
      console.log('🔍 Fetching:', u);
      const r = await fetch(u);
      const d = await r.json();
      console.log('✅ API Response:', d);
      
      if (d.success && d.data && d.data.length > 0) {
        let v = d.data;
        if (page === 1 && !sort) v = v.sort(() => Math.random() - 0.5);
        render(v);
        renderPag(d.pagination ? d.pagination.totalPages : 1);
      } else {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">No videos found.<br><small>Check browser console (F12) for details.</small></div>`;
        console.warn('⚠️ No data or success=false:', d);
      }
    } catch (e) {
      console.error('❌ Fetch error:', e);
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:red">Error: ${e.message}</div>';
    }
  }

  function render(videos) {
    grid.innerHTML = '';
    videos.forEach((v, i) => {
      if (i > 0 && i % 5 === 0 && window.renderAd) {
        grid.insertAdjacentHTML('beforeend', window.renderAd('infeed'));
      }
      const card = document.createElement('div');
      card.className = 'video-card';
      const safeTitle = window.sanitize ? window.sanitize.html(v.title) : (v.title || 'Untitled');
      const duration = v.duration ? v.duration.replace('HD ', '') : '00:00';
      
      card.innerHTML = `
        <div class="video-thumb">
          <img src="${v.thumbnailUrl || '/cumb.png'}" loading="lazy" onerror="this.src='/cumb.png'">
          <video muted playsinline preload="metadata" data-src="${v.playableUrl}"></video>
          <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
          <div class="preview-loading"><div class="preview-spinner"></div></div>
          <span class="duration-badge">${duration}</span>
        </div>
        <div class="video-info">
          <div class="video-title">${safeTitle}</div>
          <div class="video-stats">
            <span>${Math.floor(Math.random() * 51 + 50)}%</span>
            <span>${fmt(v.views || Math.floor(Math.random() * 90000 + 10000))} views</span>
          </div>
        </div>
      `;
      gestures(card, v);
      grid.appendChild(card);
    });
  }

  function gestures(card, video) {
    const thumb = card.querySelector('.video-thumb');
    const vid = card.querySelector('video');
    const tl = thumb.querySelector('.preview-timeline');
    const ld = thumb.querySelector('.preview-loading');
    const ttl = card.querySelector('.video-title');
    let st = 0, sx = 0, sy = 0, lt = 0;

    function stop(c) {
      if (!c) return;
      const v = c.querySelector('video');
      const t = c.querySelector('.video-thumb');
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
      if (t) t.classList.remove('video-ready');
      const tl2 = t ? t.querySelector('.preview-timeline') : null;
      const ld2 = t ? t.querySelector('.preview-loading') : null;
      if (tl2) tl2.classList.remove('active');
      if (ld2) ld2.classList.remove('active');
      const tt = c.querySelector('.video-title');
      if (tt) tt.classList.remove('previewing-text');
      c.classList.remove('preview-active');
      delete c.dataset.previewing;
    }

    function stopAll() { document.querySelectorAll('.video-card[data-previewing="true"]').forEach(c => stop(c)); }

    function start() {
      stopAll();
      ttl.classList.add('previewing-text');
      card.classList.add('preview-active');
      card.dataset.previewing = 'true';
      tl.classList.add('active');
      ld.classList.add('active');
      const s = vid.dataset.src || video.playableUrl;
      if (!s) { stop(card); return; }
      vid.muted = true;
      vid.playbackRate = 1.5;
      vid.src = s;
      vid.load();
      vid.oncanplay = () => {
        thumb.classList.add('video-ready');
        ld.classList.remove('active');
        vid.play().catch(() => stop(card));
      };
      vid.onerror = () => { ld.classList.remove('active'); stop(card); };
      setTimeout(() => { if (card.dataset.previewing === 'true') stop(card); }, 59000);
    }

    function open() {
      stop(card);
      const shareUrl = location.origin + '/?v=' + video._id;
      history.pushState({ view: 'playerView' }, '', shareUrl);
      if (window.loadPlayerVideo) window.loadPlayerVideo(video);
      if (window.switchView) window.switchView('playerView', false);
    }

    thumb.addEventListener('pointerdown', e => { st = Date.now(); sx = e.clientX; sy = e.clientY; }, { passive: true });
    thumb.addEventListener('pointermove', e => { if (!st) return; if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) st = 0; }, { passive: true });
    thumb.addEventListener('pointerup', () => {
      if (!st) return;
      const d = Date.now() - st;
      const playing = card.dataset.previewing === 'true';
      if (d < 250) {
        const now = Date.now();
        if (now - lt < 300 && playing) stop(card); else open();
        lt = now;
      } else if (d >= 500) {
        if (playing) stop(card); else start();
      }
      st = 0;
    }, { passive: true });
    thumb.addEventListener('pointerleave', () => { st = 0; });
    thumb.addEventListener('pointercancel', () => { st = 0; });
  }

  function renderPag(tp) {
    if (!pag) return;
    pag.innerHTML = '';
    for (let i = 1; i <= Math.min(tp, 10); i++) {
      const b = document.createElement('button');
      b.className = 'page-btn' + (i === page ? ' active' : '');
      b.textContent = i;
      b.onclick = () => { page = i; load(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      pag.appendChild(b);
    }
  }

  window.resetHomeState = function() {
    sort = ''; cat = ''; page = 1;
    if (fb) fb.querySelector('span').textContent = 'Popular';
    if (fm) {
      fm.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
      fm.querySelector('[data-sort=""]').classList.add('active');
    }
    if (cats) {
      cats.querySelectorAll('.h-cat-chip').forEach(c => c.classList.remove('active'));
      cats.querySelector('[data-cat="all"]').classList.add('active');
    }
  };

  function fmt(n) {
    return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : n;
  }

  load();
  loadCats();
});
