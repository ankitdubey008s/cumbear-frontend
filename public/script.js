document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('age') === '1') {
    document.getElementById('ageGate').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initRouter();
    checkURL();
  }

  // Inject Tab Icons
  const homeTab = document.querySelector('.view-tab[data-view="homeView"]');
  const shortsTab = document.querySelector('.view-tab[data-view="shortsView"]');
  if (homeTab && !homeTab.querySelector('svg')) homeTab.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Home`;
  if (shortsTab && !shortsTab.querySelector('svg')) shortsTab.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Shorts`;
});

function verifyAge() {
  localStorage.setItem('age', '1');
  document.getElementById('ageGate').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  initRouter();
  checkURL();
}

async function checkURL() {
  const p = new URLSearchParams(location.search);
  if (p.has('v')) {
    const vidId = p.get('v');
    try {
      const r = await fetch(`https://cumbear-backend.vercel.app/api/videos/${vidId}`);
      const d = await r.json();
      if (d.success && d.data) {
        const t = setInterval(() => {
          if (window.loadPlayerVideoById) {
            clearInterval(t);
            window.switchView('playerView', false);
            window.loadPlayerVideoById(vidId);
          }
        }, 50);
      }
    } catch (e) { console.log('Video not found'); }
  }
}

function initRouter() {
  if (!history.state) history.replaceState({ view: 'homeView' }, '', '/');
  window.addEventListener('popstate', e => { window.switchView(e.state?.view || 'homeView', false); });
}

window.switchView = function(id, push) {
  // 1. Stop previous views
  if (id !== 'shortsView' && window.stopShorts) window.stopShorts();
  
  // 2. Toggle Ad Visibility
  if (id === 'shortsView') {
    document.body.classList.add('shorts-active');
    if (window.loadShorts) window.loadShorts();
  } else {
    document.body.classList.remove('shorts-active');
  }

  // 3. Switch DOM visibility
  document.querySelectorAll('.view-section').forEach(s => { s.classList.add('hidden'); s.classList.remove('active'); });
  const t = document.getElementById(id);
  if (t) { t.classList.remove('hidden'); t.classList.add('active'); }
  
  // 4. Update Tab UI
  document.querySelectorAll('.view-tab').forEach(l => l.classList.remove('active'));
  const al = document.querySelector(`.view-tab[data-view="${id}"]`);
  if (al) al.classList.add('active');
  
  if (push) history.pushState({ view: id }, '', '/');
  window.scrollTo(0, 0);
};

// Tab Click Listeners
document.addEventListener('click', e => {
  const tab = e.target.closest('.view-tab');
  if (tab) {
    window.switchView(tab.dataset.view, true);
  }
});
