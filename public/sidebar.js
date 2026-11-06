/**
 * ==========================================================================
 * CUMBEAR — SIDEBAR & LANGUAGE CONTROLLER
 * --------------------------------------------------------------------------
 * Handles:
 *   - Open/close sidebar (drawer)
 *   - PWA install prompt
 *   - Theme toggle (light / dark)
 *   - Grid view picker (Auto / Compact / Large)
 *   - Language modal (100+ languages via Google Translate)
 *   - Navigation (Home / Shorts / Categories)
 *
 * Public API:
 *   window.openSidebar()
 *   window.closeSidebar()
 * ==========================================================================
 */
(function () {
  'use strict';

  if (window.__cumbearSidebarLoaded) return;
  window.__cumbearSidebarLoaded = true;

  /* ============================================================
     PWA INSTALL PROMPT — attach immediately (before DOMContentLoaded)
     ============================================================ */
  let deferredPrompt = null;
  let installPromptAvailable = false;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    installPromptAvailable = true;
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    installPromptAvailable = false;
    const btn = document.getElementById('appInstallBtn');
    if (btn) btn.style.display = 'none';
  });

  /* ============================================================
     LANGUAGES — full list
     ============================================================ */
  const LANGUAGES = [
    { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish (Español)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' }, { code: 'ar', name: 'Arabic (العربية)' },
    { code: 'fr', name: 'French (Français)' }, { code: 'de', name: 'German (Deutsch)' },
    { code: 'ru', name: 'Russian (Русский)' }, { code: 'pt', name: 'Portuguese (Português)' },
    { code: 'ja', name: 'Japanese (日本語)' }, { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' }, { code: 'ko', name: 'Korean (한국어)' },
    { code: 'it', name: 'Italian (Italiano)' }, { code: 'tr', name: 'Turkish (Türkçe)' },
    { code: 'vi', name: 'Vietnamese (Tiếng Việt)' }, { code: 'pl', name: 'Polish (Polski)' },
    { code: 'uk', name: 'Ukrainian (Українська)' }, { code: 'nl', name: 'Dutch (Nederlands)' },
    { code: 'th', name: 'Thai (ไทย)' }, { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
    { code: 'el', name: 'Greek (Ελληνικά)' }, { code: 'cs', name: 'Czech (Čeština)' },
    { code: 'sv', name: 'Swedish (Svenska)' }, { code: 'ro', name: 'Romanian (Română)' },
    { code: 'hu', name: 'Hungarian (Magyar)' }, { code: 'da', name: 'Danish (Dansk)' },
    { code: 'fi', name: 'Finnish (Suomi)' }, { code: 'no', name: 'Norwegian (Norsk)' },
    { code: 'sk', name: 'Slovak (Slovenčina)' }, { code: 'bg', name: 'Bulgarian (Български)' },
    { code: 'hr', name: 'Croatian (Hrvatski)' }, { code: 'sr', name: 'Serbian (Српски)' },
    { code: 'bn', name: 'Bengali (বাংলা)' }, { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' }, { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'mr', name: 'Marathi (मराठी)' }, { code: 'ur', name: 'Urdu (اردو)' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)' }, { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' }, { code: 'fa', name: 'Persian (فارسی)' },
    { code: 'he', name: 'Hebrew (עברית)' }, { code: 'fil', name: 'Filipino (Tagalog)' },
    { code: 'ms', name: 'Malay (Bahasa Melayu)' }, { code: 'af', name: 'Afrikaans' },
    { code: 'sq', name: 'Albanian (Shqip)' }, { code: 'am', name: 'Amharic (አማርኛ)' },
    { code: 'hy', name: 'Armenian (Հայերեն)' }, { code: 'az', name: 'Azerbaijani (Azərbaycan)' },
    { code: 'eu', name: 'Basque (Euskara)' }, { code: 'be', name: 'Belarusian (Беларуская)' },
    { code: 'bs', name: 'Bosnian (Bosanski)' }, { code: 'ca', name: 'Catalan (Català)' },
    { code: 'ceb', name: 'Cebuano' }, { code: 'ny', name: 'Chichewa' },
    { code: 'co', name: 'Corsican' }, { code: 'cy', name: 'Welsh (Cymraeg)' },
    { code: 'eo', name: 'Esperanto' }, { code: 'et', name: 'Estonian (Eesti)' },
    { code: 'fy', name: 'Frisian' }, { code: 'gl', name: 'Galician (Galego)' },
    { code: 'ka', name: 'Georgian (ქართული)' }, { code: 'ht', name: 'Haitian Creole' },
    { code: 'ha', name: 'Hausa' }, { code: 'haw', name: 'Hawaiian' },
    { code: 'hmn', name: 'Hmong' }, { code: 'is', name: 'Icelandic (Íslenska)' },
    { code: 'ig', name: 'Igbo' }, { code: 'ga', name: 'Irish (Gaeilge)' },
    { code: 'jw', name: 'Javanese' }, { code: 'kk', name: 'Kazakh (Қазақ)' },
    { code: 'km', name: 'Khmer (ខ្មែរ)' }, { code: 'ku', name: 'Kurdish' },
    { code: 'ky', name: 'Kyrgyz (Кыргызча)' }, { code: 'lo', name: 'Lao (ລາວ)' },
    { code: 'la', name: 'Latin' }, { code: 'lv', name: 'Latvian (Latviešu)' },
    { code: 'lt', name: 'Lithuanian (Lietuvių)' }, { code: 'lb', name: 'Luxembourgish' },
    { code: 'mk', name: 'Macedonian (Македонски)' }, { code: 'mg', name: 'Malagasy' },
    { code: 'mt', name: 'Maltese (Malti)' }, { code: 'mi', name: 'Maori' },
    { code: 'mn', name: 'Mongolian (Монгол)' }, { code: 'my', name: 'Burmese (မြန်မာ)' },
    { code: 'ne', name: 'Nepali (नेपाली)' }, { code: 'ps', name: 'Pashto (پښتو)' },
    { code: 'sm', name: 'Samoan' }, { code: 'gd', name: 'Scots Gaelic' },
    { code: 'st', name: 'Sesotho' }, { code: 'sn', name: 'Shona' },
    { code: 'sd', name: 'Sindhi' }, { code: 'si', name: 'Sinhala (සිංහල)' },
    { code: 'sl', name: 'Slovenian (Slovenščina)' }, { code: 'so', name: 'Somali' },
    { code: 'su', name: 'Sundanese' }, { code: 'sw', name: 'Swahili (Kiswahili)' },
    { code: 'tg', name: 'Tajik (Тоҷикӣ)' }, { code: 'tt', name: 'Tatar' },
    { code: 'uz', name: 'Uzbek (Oʻzbek)' }, { code: 'xh', name: 'Xhosa' },
    { code: 'yi', name: 'Yiddish (ייִדיש)' }, { code: 'yo', name: 'Yoruba' },
    { code: 'zu', name: 'Zulu' }
  ];

  /* ============================================================
     HELPERS
     ============================================================ */
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
  }

  function showToast(msg) {
    let t = document.getElementById('cumbear-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'cumbear-toast';
      t.className = 'cumbear-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(function () { t.classList.remove('visible'); }, 2400);
  }

  /* ============================================================
     SIDEBAR OPEN/CLOSE
     ============================================================ */
  let savedBodyOverflow = '';

  function openSidebar() {
    const sidebar = document.getElementById('siteSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;
    sidebar.classList.add('active');
    sidebar.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('active');
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    const sidebar = document.getElementById('siteSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) {
      sidebar.classList.remove('active');
      sidebar.setAttribute('aria-hidden', 'true');
    }
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = savedBodyOverflow || '';
    savedBodyOverflow = '';
  }

  window.openSidebar = openSidebar;
  window.closeSidebar = closeSidebar;

  /* ============================================================
     THEME
     ============================================================ */
  function applyTheme(theme) {
    theme = (theme === 'light') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    safeSet('cumbear_theme', theme);

    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = (theme === 'dark') ? 'Light Mode' : 'Dark Mode';

    /* Update meta theme-color */
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#7c1d40');

    try {
      window.dispatchEvent(new CustomEvent('cumbear:themeChanged', {
        detail: { theme: theme }
      }));
    } catch (e) { /* ignore */ }
  }

  /* One-time migration: force dark for existing users (v3) */
  try {
    if (!localStorage.getItem('cumbear_theme_v3_migrated')) {
      localStorage.removeItem('cumbear_theme');
      localStorage.setItem('cumbear_theme_v3_migrated', '1');
    }
  } catch (e) { /* ignore */ }

  function wireThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';

    btn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    /* Init */
    const saved = safeGet('cumbear_theme') || 'dark';
    applyTheme(saved);
  }

  /* ============================================================
     INSTALL BUTTON
     ============================================================ */
  function wireInstall() {
    const btn = document.getElementById('appInstallBtn');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';

    if (!installPromptAvailable) {
      /* Hidden until browser fires beforeinstallprompt */
      btn.style.opacity = '0.6';
    }

    btn.addEventListener('click', function () {
      if (!deferredPrompt) {
        showToast('Install not available — try adding to home screen from your browser menu');
        return;
      }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        if (choice && choice.outcome === 'accepted') {
          showToast('Installing CumBear…');
        }
        deferredPrompt = null;
        installPromptAvailable = false;
      }).catch(function () { /* ignore */ });
    });
  }

  /* ============================================================
     GRID VIEW
     ============================================================ */
  function wireGridPicker() {
    const row = document.getElementById('gridViewRow');
    const label = document.getElementById('gridValueDisplay');
    if (!row || row.dataset.wired) return;
    row.dataset.wired = '1';

    const modes = [
      { key: 'auto',    label: 'Responsive', cols: '' },
      { key: 'compact', label: 'Compact',    cols: '2' },
      { key: 'large',   label: 'Large',      cols: '1' }
    ];

    let modeIndex = 0;
    const savedMode = safeGet('cumbear_grid_mode');
    const foundIdx = modes.findIndex(function (m) { return m.key === savedMode; });
    if (foundIdx >= 0) modeIndex = foundIdx;

    function applyMode() {
      const m = modes[modeIndex];
      if (label) label.textContent = m.label;
      safeSet('cumbear_grid_mode', m.key);

      if (m.cols) {
        document.documentElement.style.setProperty('--grid-cols-override', m.cols);
        document.body.classList.add('grid-override');
      } else {
        document.documentElement.style.removeProperty('--grid-cols-override');
        document.body.classList.remove('grid-override');
      }
      try {
        window.dispatchEvent(new CustomEvent('cumbear:gridChanged', {
          detail: { mode: m.key, cols: m.cols }
        }));
      } catch (e) { /* ignore */ }
    }

    /* Apply saved mode on init */
    applyMode();

    row.addEventListener('click', function () {
      modeIndex = (modeIndex + 1) % modes.length;
      applyMode();
    });
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  function wireNav() {
    document.querySelectorAll('.site-sidebar .nav-links button.nav-link').forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const targetView = btn.getAttribute('data-view');
        if (!targetView) return;
        closeSidebar();
        if (typeof window.switchView === 'function') {
          window.switchView(targetView, true);
        }
      });
    });
  }

  /* ============================================================
     LANGUAGE MODAL — chunked render
     ============================================================ */
  let langRenderToken = 0;

  function renderLanguages(filter) {
    const grid = document.getElementById('langListGrid');
    if (!grid) return;

    const query = (filter || '').toLowerCase().trim();
    const filtered = LANGUAGES.filter(function (l) {
      return l.name.toLowerCase().indexOf(query) !== -1 ||
             l.code.toLowerCase().indexOf(query) !== -1;
    });

    const myToken = ++langRenderToken;
    grid.innerHTML = '';

    /* Chunked render: 25 per frame → no jank */
    let cursor = 0;
    function renderChunk() {
      if (myToken !== langRenderToken) return; /* another render superseded */
      if (cursor >= filtered.length) return;

      const end = Math.min(cursor + 25, filtered.length);
      const frag = document.createDocumentFragment();

      for (let i = cursor; i < end; i++) {
        const lang = filtered[i];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lang-item-btn';
        btn.innerHTML =
          '<span>' + lang.name + '</span>' +
          '<span style="opacity:0.5;font-size:0.72rem;">' + lang.code + '</span>';

        btn.addEventListener('click', function () {
          translateSite(lang.code, lang.name);
          const modal = document.getElementById('languageModal');
          if (modal) modal.classList.add('hidden');
        });

        frag.appendChild(btn);
      }

      grid.appendChild(frag);
      cursor = end;
      if (cursor < filtered.length) {
        requestAnimationFrame(renderChunk);
      }
    }
    renderChunk();
  }

  /* ============================================================
     GOOGLE TRANSLATE INTEGRATION
     ============================================================ */
  function translateSite(langCode, langName) {
    const label = document.getElementById('langValueDisplay');
    if (label) label.textContent = langName.split(' ')[0];
    safeSet('cumbear_lang', langCode);
    safeSet('cumbear_lang_name', langName);

    /* Set cookie — try domain-scoped first, fall back to path-only */
    const domain = window.location.hostname;
    try {
      document.cookie = 'googtrans=/en/' + langCode +
        '; path=/; domain=' + domain + '; SameSite=Lax';
    } catch (e) { /* ignore */ }
    try {
      document.cookie = 'googtrans=/en/' + langCode +
        '; path=/; SameSite=Lax';
    } catch (e) { /* ignore */ }

    /* Try to invoke the widget */
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
      return;
    }

    /* If widget not ready yet, wait up to 800ms for it */
    let waited = 0;
    const interval = setInterval(function () {
      const sel = document.querySelector('.goog-te-combo');
      if (sel) {
        clearInterval(interval);
        sel.value = langCode;
        sel.dispatchEvent(new Event('change'));
        return;
      }
      waited += 100;
      if (waited >= 800) {
        clearInterval(interval);
        /* Google Translate probably blocked (ad-blocker) — show message,
           clear the cookie so next load isn't stuck in a broken state. */
        showToast('Translation unavailable — try disabling ad-blockers or refreshing');
        try {
          document.cookie = 'googtrans=; max-age=0; path=/; SameSite=Lax';
          document.cookie = 'googtrans=; max-age=0; path=/; domain=' + domain + '; SameSite=Lax';
        } catch (e) { /* ignore */ }
      }
    }, 100);
  }

  /* ============================================================
     LANGUAGE MODAL WIRING
     ============================================================ */
  function wireLanguageModal() {
    const row = document.getElementById('languageRow');
    const modal = document.getElementById('languageModal');
    const closeBtn = document.getElementById('closeLangModal');
    const searchInput = document.getElementById('langSearchInput');
    if (!row || !modal) return;

    if (!row.dataset.wired) {
      row.dataset.wired = '1';
      row.addEventListener('click', function () {
        closeSidebar();
        renderLanguages();
        modal.classList.remove('hidden');
        if (searchInput) {
          searchInput.value = '';
          setTimeout(function () {
            try { searchInput.focus({ preventScroll: true }); } catch (e) { searchInput.focus(); }
          }, 150);
        }
      });
    }

    if (closeBtn && !closeBtn.dataset.wired) {
      closeBtn.dataset.wired = '1';
      closeBtn.addEventListener('click', function () {
        modal.classList.add('hidden');
      });
    }

    if (searchInput && !searchInput.dataset.wired) {
      searchInput.dataset.wired = '1';
      let debounceTimer = null;
      searchInput.addEventListener('input', function (e) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          renderLanguages(e.target.value);
        }, 120);
      });
    }

    /* Restore saved language label */
    const savedName = safeGet('cumbear_lang_name');
    const labelEl = document.getElementById('langValueDisplay');
    if (savedName && labelEl) {
      labelEl.textContent = savedName.split(' ')[0];
    }
  }

  /* ============================================================
     KEYBOARD / OUTSIDE CLICKS
     ============================================================ */
  function wireKeyboard() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      const sidebar = document.getElementById('siteSidebar');
      const langModal = document.getElementById('languageModal');
      if (sidebar && sidebar.classList.contains('active')) {
        closeSidebar();
      }
      if (langModal && !langModal.classList.contains('hidden')) {
        langModal.classList.add('hidden');
      }
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    /* Close wiring */
    const closeBtn = document.getElementById('closeSidebar');
    if (closeBtn && !closeBtn.dataset.wired) {
      closeBtn.dataset.wired = '1';
      closeBtn.addEventListener('click', closeSidebar);
    }

    const overlay = document.getElementById('sidebarOverlay');
    if (overlay && !overlay.dataset.wired) {
      overlay.dataset.wired = '1';
      overlay.addEventListener('click', closeSidebar);
    }

    wireThemeToggle();
    wireInstall();
    wireGridPicker();
    wireNav();
    wireLanguageModal();
    wireKeyboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
