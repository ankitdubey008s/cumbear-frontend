/**
 * ==========================================================================
 * CUMBEAR SIDEBAR & 100+ LANGUAGE GOOGLE TRANSLATE CONTROLLER
 * ==========================================================================
 */

(function () {
  'use strict';

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

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

  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('siteSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('closeSidebar');
    const installBtn = document.getElementById('appInstallBtn');
    const themeBtn = document.getElementById('themeToggleBtn');
    const languageRow = document.getElementById('languageRow');
    const langModal = document.getElementById('languageModal');
    const closeLangModal = document.getElementById('closeLangModal');
    const langSearchInput = document.getElementById('langSearchInput');
    const langListGrid = document.getElementById('langListGrid');
    const langValueDisplay = document.getElementById('langValueDisplay');
    const navButtons = document.querySelectorAll('.site-sidebar .nav-links button.nav-link');

    // Sidebar open/close handlers
    window.openSidebar = function () {
      if (sidebar) sidebar.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    window.closeSidebar = function () {
      if (sidebar) sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', window.closeSidebar);
    if (overlay) overlay.addEventListener('click', window.closeSidebar);

    // 1. Direct Chrome Install CTA
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          deferredPrompt = null;
        } else {
          console.log('Install prompt already completed or not supported');
        }
      });
    }

    // 2. Navigation Actions (Home, Shorts, Categories)
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = btn.getAttribute('data-view');
        if (targetView && window.switchView) {
          window.closeSidebar();
          window.switchView(targetView, true);

          if (targetView === 'shortsView' && typeof window.loadShorts === 'function') {
            window.loadShorts();
          }
        }
      });
    });

    // 3. Dark/Light Mode Switcher
    const savedTheme = localStorage.getItem('cumbear_theme') || 'dark';
    applyTheme(savedTheme);

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
      });
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('cumbear_theme', theme); } catch (e) {}
      if (themeBtn) themeBtn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    // 4. 100+ Language Modal & Live Search Filter
    function renderLanguages(filter = '') {
      if (!langListGrid) return;
      langListGrid.innerHTML = '';

      const query = filter.toLowerCase().trim();
      const filtered = LANGUAGES.filter(l => l.name.toLowerCase().includes(query) || l.code.toLowerCase().includes(query));

      filtered.forEach(lang => {
        const btn = document.createElement('button');
        btn.className = 'lang-item-btn';
        btn.innerHTML = `<span>${lang.name}</span><span style="opacity:0.5;font-size:0.72rem;">${lang.code}</span>`;
        btn.addEventListener('click', () => {
          translateSite(lang.code, lang.name);
          if (langModal) langModal.classList.add('hidden');
        });
        langListGrid.appendChild(btn);
      });
    }

    if (languageRow && langModal) {
      languageRow.addEventListener('click', () => {
        window.closeSidebar();
        renderLanguages();
        langModal.classList.remove('hidden');
        if (langSearchInput) {
          langSearchInput.value = '';
          setTimeout(() => langSearchInput.focus(), 150);
        }
      });
    }

    if (closeLangModal && langModal) {
      closeLangModal.addEventListener('click', () => langModal.classList.add('hidden'));
    }

    if (langSearchInput) {
      langSearchInput.addEventListener('input', (e) => {
        renderLanguages(e.target.value);
      });
    }

    function translateSite(langCode, langName) {
      if (langValueDisplay) langValueDisplay.textContent = langName.split(' ')[0];
      try {
        localStorage.setItem('cumbear_lang', langCode);
        localStorage.setItem('cumbear_lang_name', langName);
      } catch (e) {}

      const domain = window.location.hostname;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
      document.cookie = `googtrans=/en/${langCode}; path=/;`;

      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
      } else {
        window.location.reload();
      }
    }

    const savedLangName = localStorage.getItem('cumbear_lang_name');
    if (savedLangName && langValueDisplay) {
      langValueDisplay.textContent = savedLangName.split(' ')[0];
    }
  });
})();
