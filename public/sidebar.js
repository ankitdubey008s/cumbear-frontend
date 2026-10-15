document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const sidebar = document.getElementById('siteSidebar');
  const installBtn = document.getElementById('appInstallBtn');
  const themeBtn = document.getElementById('themeToggleBtn');
  const navLinks = document.querySelectorAll('.nav-link[data-target]');

  // 1. Close Sidebar
  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  };
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // 2. PWA Install Logic
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') deferredPrompt = null;
      } else {
        alert('To install: Tap your browser menu (⋮ or Share) and select "Add to Home Screen" or "Install App".');
      }
    });
  }

  // 3. Theme Switcher (Dark/Light)
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('cumbear_theme', newTheme);
      themeBtn.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
  }

  // 4. Sidebar Navigation Links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-target');
      if (window.switchView) window.switchView(targetView, true);
      closeSidebar();
    });
  });

  // 5. Initialize Saved Theme
  const savedTheme = localStorage.getItem('cumbear_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeBtn) themeBtn.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
});
