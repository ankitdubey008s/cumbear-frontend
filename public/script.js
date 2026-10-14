document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('age') === '1') {
    document.getElementById('ageGate').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initRouter();
    checkURL();
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
  const params = new URLSearchParams(location.search);
  if (params.has('v')) {
    const vidId = params.get('v');
    // Wait for player.js to load
    const checkPlayer = setInterval(() => {
      if (window.loadPlayerVideoById) {
        clearInterval(checkPlayer);
        window.switchView('playerView', false);
        window.loadPlayerVideoById(vidId);
      }
    }, 100);
  } else if (params.has('category')) {
    const cat = params.get('category');
    const checkHome = setInterval(() => {
      if (window.loadHomeVideos && window.setCategory) {
        clearInterval(checkHome);
        window.switchView('homeView', false);
        window.setCategory(cat);
      }
    }, 100);
  }
}

function initRouter() {
  if (!history.state) history.replaceState({ view: 'homeView' }, '', '/');
  window.addEventListener('popstate', function (e) { 
    window.switchView((e.state && e.state.view) || 'homeView', false); 
  });
}

window.switchView = function (id, push) {
  // Stop shorts if leaving shorts view
  if (id !== 'shortsView' && window.stopShorts) window.stopShorts();
  
  // Hide all views, show target
  document.querySelectorAll('.view-section').forEach(s => { 
    s.classList.add('hidden'); 
    s.classList.remove('active'); 
  });
  const target = document.getElementById(id);
  if (target) { 
    target.classList.remove('hidden'); 
    target.classList.add('active'); 
  }
  
  // Update bottom nav
  document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-view="${id}"]`);
  if (activeNav) activeNav.classList.add('active');
  
  // Update sidebar links
  document.querySelectorAll('.sidebar .nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('data-target') === id);
  });

  if (push) history.pushState({ view: id }, '', '/');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Global click delegation for view tabs
document.addEventListener('click', function (e) {
  const tab = e.target.closest('.nav-item, .nav-link');
  if (tab) {
    const targetView = tab.getAttribute('data-view') || tab.getAttribute('data-target');
    if (targetView) {
      window.switchView(targetView, true);
      // Close sidebar if open
      document.getElementById('siteSidebar').classList.remove('active');
      document.getElementById('sidebarOverlay').classList.remove('active');
    }
  }
});
