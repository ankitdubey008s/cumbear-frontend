(function () {
  function init() {
    // 1. Delete ALL old / duplicate sidebars and overlays
    document.querySelectorAll('.sidebar, .app-sidebar, #appSidebar, .sidebar-overlay, #sidebarOverlay, #sidebar, .cb-sidebar, .cb-overlay')
      .forEach(function (el) { el.remove(); });

    // 2. Overlay
    var overlay = document.createElement('div');
    overlay.className = 'cb-overlay';
    overlay.id = 'cbOverlay';

    // 3. Simple Sidebar: Install + Socials + Support ONLY
    var sb = document.createElement('aside');
    sb.className = 'cb-sidebar';
    sb.id = 'cbSidebar';
    sb.innerHTML =
      '<div class="cb-head"><span class="cb-logo">CumBear</span>' +
      '<button class="cb-close" id="cbClose" aria-label="Close">✕</button></div>' +
      '<div class="cb-body">' +
        '<button class="cb-install" id="cbInstall">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
          '<span>Download CumBear App</span>' +
        '</button>' +
        '<div class="cb-section"><h4>Follow Us</h4>' +
          '<a class="cb-link" href="https://x.com/cumbear" target="_blank" rel="noopener">𝕏 Twitter / X</a>' +
          '<a class="cb-link" href="https://instagram.com/cumbear" target="_blank" rel="noopener">📸 Instagram</a>' +
          '<a class="cb-link" href="https://t.me/cumbear" target="_blank" rel="noopener">✈️ Telegram</a>' +
        '</div>' +
        '<div class="cb-section"><h4>Help</h4>' +
          '<a class="cb-link cb-support" href="mailto:support@cumbear.in">💬 Support</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(sb);

    // 4. Open / Close
    function openSb() { sb.classList.add('open'); overlay.classList.add('open'); }
    function closeSb() { sb.classList.remove('open'); overlay.classList.remove('open'); }
    document.getElementById('cbClose').addEventListener('click', closeSb);
    overlay.addEventListener('click', closeSb);

    // 5. CAPTURE hamburger click BEFORE old code or ads can touch it
    document.addEventListener('click', function (e) {
      var t = e.target.closest('.menu-btn, #menuBtn, .hamburger, .header-menu');
      if (t) { e.preventDefault(); e.stopPropagation(); openSb(); }
    }, true);

    // 6. PWA Install
    var deferred = null;
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });
    document.getElementById('cbInstall').addEventListener('click', function () {
      if (deferred) { deferred.prompt(); deferred = null; }
      else { alert('Open your browser menu and tap "Add to Home Screen" or "Install App".'); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
