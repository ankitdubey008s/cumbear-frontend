document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('age') === '1') {
    document.getElementById('ageGate').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initRouter();
    checkURL();
  }

  // === PWA INSTALL LOGIC ===
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
      } else {
        alert('To install: Open your browser menu and select "Add to Home Screen" or "Install App".');
      }
    });
  }

  // === SIDEBAR TOGGLE LOGIC ===
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuBtn = document.querySelector('.menu-btn'); // Your hamburger icon
  const closeBtn = document.getElementById('closeSidebar');

  function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }

  if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
  if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);

  // === MENU NAVIGATION LOGIC ===
  document.querySelectorAll('.menu-link[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      toggleSidebar(); // Close menu
      window.switchView(view, true);
    });
  });

  // === SETTINGS TOGGLES ===
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      themeBtn.textContent = document.body.classList.contains('light-mode') ? '☀️ Theme: Light' : '🌙 Theme: Dark';
    });
  }

  const gridBtn = document.getElementById('gridToggle');
  if (gridBtn) {
    gridBtn.addEventListener('click', () => {
      const grid = document.getElementById('videoGrid');
      if (grid.style.gridTemplateColumns === '1fr') {
        grid.style.gridTemplateColumns = '';
        gridBtn.textContent = '🔲 Grid: 2 Columns';
      } else {
        grid.style.gridTemplateColumns = '1fr';
        gridBtn.textContent = '🔲 Grid: 1 Column';
      }
    });
  }
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

// === MASTER VIEW SWITCHER (Isolates Ads) ===
window.switchView = function(id, push) {
  if (id !== 'shortsView' && window.stopShorts) window.stopShorts();
  
  // AD ISOLATION: Only show ads on Home, Shorts, Player, and Search
  const adAllowedViews = ['homeView', 'shortsView', 'playerView', 'searchView'];
  if (adAllowedViews.includes(id)) {
    document.body.classList.remove('ads-hidden');
  } else {
    document.body.classList.add('ads-hidden'); // Hide ads on Support, Privacy, etc.
  }

  document.querySelectorAll('.view-section').forEach(s => { s.classList.add('hidden'); s.classList.remove('active'); });
  const t = document.getElementById(id);
  if (t) { t.classList.remove('hidden'); t.classList.add('active'); }
  
  document.querySelectorAll('.view-tab').forEach(l => l.classList.remove('active'));
  const al = document.querySelector(`.view-tab[data-view="${id}"]`);
  if (al) al.classList.add('active');
  
  if (push) history.pushState({ view: id }, '', '/');
  window.scrollTo(0, 0);
};

document.addEventListener('click', e => {
  const tab = e.target.closest('.view-tab');
  if (tab) window.switchView(tab.dataset.view, true);
});
