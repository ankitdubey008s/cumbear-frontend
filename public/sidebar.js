document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closeSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const sidebar = document.getElementById('siteSidebar');
  const installBtn = document.getElementById('appInstallBtn');

  let deferredPrompt;

  // 1. PWA Install Logic
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'flex';
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') console.log('User accepted install');
        deferredPrompt = null;
      } else {
        alert('To install: Open your browser menu (⋮) and select "Add to Home Screen" or "Install App".');
      }
    });
  }

  // 2. Sidebar Toggle Logic
  const openSidebar = () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
  };

  const closeSidebar = () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  };

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  window.openSidebar = openSidebar;
  window.closeSidebar = closeSidebar;
});
