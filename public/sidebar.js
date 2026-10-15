document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closeSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const sidebar = document.getElementById('siteSidebar');
  const installBtn = document.getElementById('appInstallBtn');
  const themeBtn = document.getElementById('themeToggleBtn');

  // 1. Sidebar Toggle
  const openSidebar = () => {
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
  };
  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  };

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // 2. PWA Install
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
      else { alert('Open browser menu and select "Add to Home Screen".'); }
    });
  }

  // 3. Theme Toggle
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const newTheme = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('cumbear_theme', newTheme);
      themeBtn.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
  }

  // 4. Load saved theme
  const savedTheme = localStorage.getItem('cumbear_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeBtn) themeBtn.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';

  // 5. Navigation links
  document.querySelectorAll('.nav-link[data-target]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      if (window.switchView) window.switchView(target, true);
      closeSidebar();
    });
  });
});
