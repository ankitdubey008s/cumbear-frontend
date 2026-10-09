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
