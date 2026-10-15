document.addEventListener('DOMContentLoaded', function () {
  // 1. Age Gate Check
  if (localStorage.getItem('cumbear_age_verified') === 'true') {
    document.getElementById('ageGate').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initRouter();
    checkURL();
  }
});

function verifyAge() {
  localStorage.setItem('cumbear_age_verified', 'true');
  const gate = document.getElementById('ageGate');
  gate.style.opacity = '0';
  gate.style.transition = 'opacity 0.5s ease';
  setTimeout(() => {
    gate.classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initRouter();
    checkURL();
  }, 500);
}

// 2. URL Router (Handles /shorts/123 or ?v=123)
async function checkURL() {
  const path = window.location.pathname;
  const params = new URLSearchParams(location.search);
  
  // Handle /shorts/:id
  if (path.startsWith('/shorts/')) {
    const videoId = path.split('/shorts/')[1];
    if (videoId && window.loadPlayerVideoById) {
      window.switchView('playerView', false);
      window.loadPlayerVideoById(videoId);
    }
  } 
  // Handle ?v=123
  else if (params.has('v')) {
    const vidId = params.get('v');
    const checkPlayer = setInterval(() => {
      if (window.loadPlayerVideoById) {
        clearInterval(checkPlayer);
        window.switchView('playerView', false);
        window.loadPlayerVideoById(vidId);
      }
    }, 100);
  }
}

// 3. Global Router Initialization
function initRouter() {
  if (!history.state) history.replaceState({ view: 'homeView' }, '', '/');
  window.addEventListener('popstate', function (e) { 
    window.switchView((e.state && e.state.view) || 'homeView', false); 
  });
}

// 4. Global View Switcher
window.switchView = function (id, pushHistory = true) {
  // Stop shorts if leaving shorts view
  if (id !== 'shortsView' && window.stopShorts) window.stopShorts();
  
  // Hide all views
  document.querySelectorAll('.view-section').forEach(s => { 
    s.classList.add('hidden'); 
    s.classList.remove('active'); 
  });
  
  // Show target view
  const target = document.getElementById(id);
  if (target) { 
    target.classList.remove('hidden'); 
    target.classList.add('active'); 
  }
  
  // Update bottom tabs
  document.querySelectorAll('.view-tab').forEach(l => l.classList.remove('active'));
  const activeTab = document.querySelector(`.view-tab[data-view="${id}"]`);
  if (activeTab) activeTab.classList.add('active');
  
  // Update sidebar links
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeSidebar = document.querySelector(`.nav-link[data-target="${id}"]`);
  if (activeSidebar) activeSidebar.classList.add('active');

  if (pushHistory) history.pushState({ view: id }, '', '/');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 5. Global Click Delegation for Tabs
document.addEventListener('click', function (e) {
  const tab = e.target.closest('.view-tab');
  if (tab) {
    window.switchView(tab.dataset.view, true);
  }
});
