document.addEventListener('DOMContentLoaded', function () {
  // 1. Age Gate Check
  if (localStorage.getItem('age') === '1') {
    const ageGate = document.getElementById('ageGate');
    const mainApp = document.getElementById('mainApp');
    if (ageGate) ageGate.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    initRouter();
    checkURL();
  }
});

function verifyAge() {
  localStorage.setItem('age', '1');
  const ageGate = document.getElementById('ageGate');
  const mainApp = document.getElementById('mainApp');
  if (ageGate) {
    ageGate.style.opacity = '0';
    setTimeout(() => {
      ageGate.classList.add('hidden');
      if (mainApp) mainApp.classList.remove('hidden');
      initRouter();
      checkURL();
    }, 300);
  }
}

// 2. Deep Linking (e.g., cumbear.in/?v=12345)
async function checkURL() {
  const params = new URLSearchParams(location.search);
  if (params.has('v')) {
    const vidId = params.get('v');
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

// 3. Master Router Initialization
function initRouter() {
  if (!history.state) {
    history.replaceState({ view: 'homeView' }, '', '/');
  }
  window.addEventListener('popstate', function (e) {
    const targetView = (e.state && e.state.view) || 'homeView';
    window.switchView(targetView, false);
  });
}

// 4. Global View Switcher
window.switchView = function (id, pushHistory = true) {
  // Stop Shorts if leaving the shorts view
  if (id !== 'shortsView' && window.stopShorts) {
    window.stopShorts();
  }

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

  // Update Bottom Nav Active State
  document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-view="${id}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Update Sidebar Active State
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeSidebarLink = document.querySelector(`.nav-link[data-target="${id}"]`);
  if (activeSidebarLink) activeSidebarLink.classList.add('active');

  // Push to history if navigating forward
  if (pushHistory) {
    history.pushState({ view: id }, '', '/');
  }

  // Smooth scroll to top (instant for player)
  if (id === 'playerView') {
    window.scrollTo(0, 0);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Close sidebar if it's open
  if (window.closeSidebar) window.closeSidebar();
};

// 5. Global Click Delegation for Bottom Nav
document.addEventListener('click', function (e) {
  const navItem = e.target.closest('.nav-item');
  if (navItem) {
    const targetView = navItem.getAttribute('data-view');
    if (targetView) {
      window.switchView(targetView, true);
    }
  }
});
