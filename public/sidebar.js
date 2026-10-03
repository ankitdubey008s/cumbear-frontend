// --- Languages List ---
const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', native: '中文 (简体)' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands' },
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'th', name: 'Thai', native: 'ไทย' }
];

// --- Sidebar & Gesture Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('siteSidebar');
    const themeBtn = document.getElementById('themeToggleBtn');
    const navLinks = document.querySelectorAll('.nav-link');

    // 1. History API for Android Back Button
    const openSidebar = () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        history.pushState({ sidebarOpen: true }, '');
    };

    const closeSidebar = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };

    window.addEventListener('popstate', (event) => {
        if (sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    // 2. Standard Click Events
    menuBtn.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // 3. Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                if (touchStartX < 30 && !sidebar.classList.contains('active')) {
                    openSidebar();
                }
            } else {
                if (sidebar.classList.contains('active')) {
                    closeSidebar();
                }
            }
        }
    }, { passive: true });

    // --- Theme Toggle ---
    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('cumbear_theme', newTheme);
        themeBtn.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    });

    // --- Grid Modal ---
    const gridRow = document.getElementById('gridViewRow');
    const gridModal = document.getElementById('gridModal');
    const closeGridModal = document.getElementById('closeGridModal');
    const gridOptions = document.querySelectorAll('.grid-option');
    const gridValueDisplay = document.getElementById('gridValueDisplay');

    gridRow.addEventListener('click', () => { gridModal.classList.add('active'); closeSidebar(); });
    closeGridModal.addEventListener('click', () => gridModal.classList.remove('active'));

    gridOptions.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.getAttribute('data-value');
            gridOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            document.documentElement.style.setProperty('--grid-cols', value);
            localStorage.setItem('cumbear_grid', value);
            const labels = { '1': '1 Column', '2': '2 Columns', '4': '4 Columns' };
            gridValueDisplay.textContent = labels[value];
            setTimeout(() => gridModal.classList.remove('active'), 300);
        });
    });

    // --- Google Translate Trigger Function ---
    function triggerGoogleTranslate(langCode) {
        if (langCode === 'en') {
            // Reset to English
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.cumbear.in";
            location.reload();
            return;
        }

        // Set translation cookie
        const langMap = {
            'es': '/en/es', 'fr': '/en/fr', 'de': '/en/de', 'hi': '/en/hi',
            'zh-CN': '/en/zh-CN', 'ru': '/en/ru', 'ar': '/en/ar', 'pt': '/en/pt',
            'ja': '/en/ja', 'ko': '/en/ko', 'it': '/en/it', 'tr': '/en/tr',
            'nl': '/en/nl', 'pl': '/en/pl', 'id': '/en/id', 'vi': '/en/vi', 'th': '/en/th'
        };

        const transPath = langMap[langCode];
        if (transPath) {
            document.cookie = `googtrans=${transPath}; path=/;`;
            document.cookie = `googtrans=${transPath}; path=/; domain=.cumbear.in;`;
            location.reload();
        }
    }

    // --- Language Modal ---
    const langRow = document.getElementById('languageRow');
    const langModal = document.getElementById('langModal');
    const closeLangModal = document.getElementById('closeLangModal');
    const langList = document.getElementById('langList');
    const langSearchInput = document.getElementById('langSearchInput');
    const langValueDisplay = document.getElementById('langValueDisplay');

    function renderLangList(filter = '') {
        const filtered = LANGUAGES.filter(lang =>
            lang.name.toLowerCase().includes(filter.toLowerCase()) ||
            lang.native.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            langList.innerHTML = '<div class="no-results">No languages found</div>';
            return;
        }

        langList.innerHTML = filtered.map(lang => `
            <div class="lang-option" data-code="${lang.code}">
                <div><div class="lang-name">${lang.name}</div><div class="lang-native">${lang.native}</div></div>
                <div class="lang-check">✓</div>
            </div>
        `).join('');

        langList.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const code = opt.getAttribute('data-code');
                const lang = LANGUAGES.find(l => l.code === code);
                langList.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                langValueDisplay.textContent = lang.name;
                localStorage.setItem('cumbear_lang', code);
                
                // Trigger Google Translate
                triggerGoogleTranslate(code);
                
                setTimeout(() => langModal.classList.remove('active'), 300);
            });
        });
    }

    langRow.addEventListener('click', () => {
        langModal.classList.add('active');
        closeSidebar();
        langSearchInput.value = '';
        renderLangList();
    });

    closeLangModal.addEventListener('click', () => langModal.classList.remove('active'));
    langSearchInput.addEventListener('input', (e) => renderLangList(e.target.value));

    // --- Navigation Links ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-target');
            if (window.switchView) {
                window.switchView(targetView, true);
            }
            closeSidebar();
        });
    });

    // --- Initialize State ---
    const savedTheme = localStorage.getItem('cumbear_theme') || 'dark';
    const savedGrid = localStorage.getItem('cumbear_grid') || '1';
    const savedLang = localStorage.getItem('cumbear_lang') || 'en';

    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.style.setProperty('--grid-cols', savedGrid);
    themeBtn.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';

    const gridLabels = { '1': '1 Column', '2': '2 Columns', '4': '4 Columns' };
    gridValueDisplay.textContent = gridLabels[savedGrid] || '1 Column';

    const savedLangObj = LANGUAGES.find(l => l.code === savedLang);
    if (savedLangObj) langValueDisplay.textContent = savedLangObj.name;

    if (window.innerWidth < 768) {
        const option4 = document.querySelector('.grid-option[data-value="4"]');
        if (option4) option4.style.display = 'none';
    }
});
