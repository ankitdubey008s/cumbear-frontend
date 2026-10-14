document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('age') === '1') {
    document.getElementById('ageGate').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initRouter();
    checkURL();
  }
});

function verifyAge() {
  localStorage.setItem('age', '1');
  const o = document.getElementById('ageGate');
  o.style.opacity = '0';
  o.style.transition = 'opacity 0.4s';
  setTimeout(() => {
    o.classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initRouter();
    checkURL();
  }, 400);
}

async function checkURL() {
  const p = new URLSearchParams(location.search);
  if (p.has('v')) {
    const vidId = p.get('v');
    try {
      const r = await fetch(`https://cumbear-backend.vercel.app/api/videos/${vidId}`);
      const d = await r.json();
      if (d.success && d.data) {
        const vid = d.data;
        const t = setInterval(() => {
          if (window.loadPlayerVideo) {
            clearInterval(t);
            switchView('playerView', false);
            window.loadPlayerVideo(vid);
          }
        }, 50);
      }
    } catch (e) { console.log('Video not found:', e); }
  } else if (p.has('category')) {
    if (window.resetHomeState) window.resetHomeState();
    // Trigger category load if home.js is ready
    setTimeout(() => {
      const catChip = document.querySelector(`.h-cat-chip[data-cat="${p.get('category')}"]`);
      if (catChip) catChip.click();
    }, 500);
  }
}

function initRouter() {
  if (!history.state) history.replaceState({ view: 'homeView' }, '', '/');
  window.addEventListener('popstate', e => { switchView(e.state?.view || 'homeView', false); });
}

window.switchView = function(id, push) {
  const cur = document.querySelector('.view-section.active');
  const cid = cur ? cur.id : '';
  if (cid === 'playerView' && id !== 'playerView' && window.stopPlayer) window.stopPlayer();
  if (cid === 'shortsView' && id !== 'shortsView') document.querySelectorAll('.short-video').forEach(v => v.pause());
  
  document.querySelectorAll('.view-section').forEach(s => { s.classList.add('hidden'); s.classList.remove('active'); });
  const t = document.getElementById(id);
  if (t) { t.classList.remove('hidden'); t.classList.add('active'); }
  
  document.querySelectorAll('.nav-link[data-target]').forEach(l => l.classList.remove('active'));
  const al = document.querySelector(`.nav-link[data-target="${id}"]`);
  if (al) al.classList.add('active');
  
  if (id === 'categoriesView' && window.showCategoriesView) window.showCategoriesView();
  if (push) history.pushState({ view: id }, '', '/');
  window.scrollTo(0, 0);
};

document.addEventListener('click', e => {
  if (e.target.classList.contains('view-tab')) {
    const view = e.target.dataset.view;
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    switchView(view, true);
    if (view === 'shortsView' && window.loadShorts) window.loadShorts();
  }
});

// === AD LOGIC: INSTANT MESSAGE (Show 1 min, Hide 5s) ===
setInterval(() => {
  const msgAd = document.getElementById('instant-msg-ad');
  if (msgAd) {
    msgAd.style.display = 'block';
    setTimeout(() => {
      msgAd.style.display = 'none';
    }, 5000); // Hide after 5 seconds
  }
}, 60000); // Every 1 minute

// === AD LOGIC: STICKY BANNER (Reappear after 30s of activity) ===
let stickyClosedAt = 0;
const stickyContainer = document.getElementById('sticky-ad-container');
const stickyCloseBtn = document.getElementById('sticky-close-btn');

function checkStickyAd() {
  if (stickyContainer && (Date.now() - stickyClosedAt > 30000)) {
    stickyContainer.style.display = 'block';
  }
}

if (stickyCloseBtn && stickyContainer) {
  stickyCloseBtn.addEventListener('click', () => {
    stickyContainer.style.display = 'none';
    stickyClosedAt = Date.now();
  });
  
  // Show initially after 2 seconds
  setTimeout(() => { stickyContainer.style.display = 'block'; }, 2000);

  // Reset timer on user activity
  ['click', 'scroll', 'touchstart', 'mousemove'].forEach(evt => {
    window.addEventListener(evt, checkStickyAd, { passive: true });
  });
}

// === INJECT PREMIUM ICONS INTO TABS ===
document.addEventListener('DOMContentLoaded', () => {
  const homeTab = document.querySelector('.view-tab[data-view="homeView"]');
  const shortsTab = document.querySelector('.view-tab[data-view="shortsView"]');

  if (homeTab && !homeTab.querySelector('svg')) {
    homeTab.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Home`;
  }

  if (shortsTab && !shortsTab.querySelector('svg')) {
    shortsTab.innerHTML = `<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Shorts`;
  }
});
