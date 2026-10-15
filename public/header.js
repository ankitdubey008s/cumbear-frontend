document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const searchBtn = document.getElementById('searchBtn');
  const homeLogoBtn = document.getElementById('homeLogoBtn');

  // Hamburger -> Opens sidebar
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('siteSidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar && overlay) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      }
    });
  }

  // Search -> Opens categories view
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      if (window.switchView) window.switchView('categoriesView', true);
      setTimeout(() => {
        const input = document.getElementById('searchInput');
        if (input) { input.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      }, 300);
    });
  }

  // Logo -> Go home
  if (homeLogoBtn) {
    homeLogoBtn.addEventListener('click', () => {
      if (window.switchView) window.switchView('homeView', true);
      if (window.resetHomeState) window.resetHomeState();
    });
  }
});
