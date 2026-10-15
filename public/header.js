document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const searchBtn = document.getElementById('searchBtn');
  const homeLogoBtn = document.getElementById('homeLogoBtn');

  // 1. Hamburger (Right) -> Opens Sidebar
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

  // 2. Search (Left) -> Opens Categories/Search View & Focuses Input
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      if (window.switchView) window.switchView('categoriesView', true);
      setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 300);
    });
  }

  // 3. Logo (Center) -> Goes Home
  if (homeLogoBtn) {
    homeLogoBtn.addEventListener('click', () => {
      if (window.switchView) window.switchView('homeView', true);
      if (window.resetHomeState) window.resetHomeState();
    });
  }
});
