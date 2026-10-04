// ============================================
// CUMBEAR ULTRA PREMIUM - Sidebar & Settings
// ============================================

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

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('siteSidebar');
    const themeBtn = document.getElementById('themeToggleBtn');
    const navLinks = document.querySelectorAll('.nav-link[data-target]');

    // --- 1. Sidebar Open/Close ---
    window.openSidebar = () => {
        if (!sidebar || !overlay) return;
        sidebar.classList.add('active');
        overlay.classList.add('active');
        history.pushState({ sidebarOpen: true }, '');
    };

    window.closeSidebar = () => {
        if (!sidebar || !overlay) return;
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };

    window.addEventListener('popstate', () => {
        if (sidebar && sidebar.classList.contains('active')) {
            window.closeSidebar();
        }
    });

    if (menuBtn) menuBtn.addEventListener('click', window.openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', window.closeSidebar);
    if (overlay) overlay.addEventListener('click', window.closeSidebar);

    // --- 2. Swipe Gestures ---
    let touchStartX = 0, touchStartY = 0;
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        const diffX = e.changedTouches[0].screenX - touchStartX;
        const diffY = e.changedTouches[0].screenY - touchStartY;
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0 && touchStartX < 40 && sidebar && !sidebar.classList.contains('active')) {
                window.openSidebar();
            } else if (diffX < 0 && sidebar && sidebar.classList.contains('active')) {
                window.closeSidebar();
            }
        }
    }, { passive: true });

    // --- 3. Theme Toggle ---
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('cumbear_theme', newTheme);
            themeBtn.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
        });
    }

    // --- 4. Helper: Dynamic Modal Creator ---
    function createModal(id, title, contentHTML) {
        let modal = document.getElementById(id);
        if (modal) modal.remove();
        
        modal = document.createElement('div');
        modal.className = 'fullscreen-modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">${title}</div>
                <button class="modal-close" onclick="document.getElementById('${id}').classList.remove('active')">✕</button>
            </div>
            <div class="modal-content">${contentHTML}</div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        return modal;
    }

    // --- 5. Grid View Modal ---
    const gridRow = document.getElementById('gridViewRow');
    if (gridRow) {
        gridRow.addEventListener('click', () => {
            window.closeSidebar();
            const currentGrid = localStorage.getItem('cumbear_grid') || '1';
            const gridHTML = `
                <div class="grid-option ${currentGrid === '1' ? 'active' : ''}" data-value="1">
                    <div class="grid-label">1 Column (Cinema)</div>
                    <div class="grid-preview one-col"><div class="grid-bar"></div></div>
                </div>
                <div class="grid-option ${currentGrid === '2' ? 'active' : ''}" data-value="2">
                    <div class="grid-label">2 Columns (Standard)</div>
                    <div class="grid-preview two-col"><div class="grid-bar"></div><div class="grid-bar"></div></div>
                </div>
                <div class="grid-option ${currentGrid === '4' ? 'active' : ''}" data-value="4">
                    <div class="grid-label">4 Columns (Dense)</div>
                    <div class="grid-preview four-col"><div class="grid-bar"></div><div class="grid-bar"></div><div class="grid-bar"></div><div class="grid-bar"></div></div>
                </div>
            `;
            const modal = createModal('gridModal', 'Grid View', gridHTML);
            
            modal.querySelectorAll('.grid-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const value = opt.getAttribute('data-value');
                    modal.querySelectorAll('.grid-option').forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    document.documentElement.style.setProperty('--grid-cols', value);
                    localStorage.setItem('cumbear_grid', value);
                    const labels = { '1': '1 Column', '2': '2 Columns', '4': '4 Columns' };
                    const display = document.getElementById('gridValueDisplay');
                    if (display) display.textContent = labels[value];
                    setTimeout(() => modal.classList.remove('active'), 300);
                });
            });
        });
    }

    // --- 6. Language Modal with Google Translate ---
    const langRow = document.getElementById('languageRow');
    if (langRow) {
        langRow.addEventListener('click', () => {
            window.closeSidebar();
            const currentLang = localStorage.getItem('cumbear_lang') || 'en';
            const langHTML = `
                <div class="modal-search-wrapper">
                    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" class="modal-search-input" id="langSearchInput" placeholder="Search language...">
                </div>
                <div id="langListContainer"></div>
            `;
            const modal = createModal('langModal', 'Select Language', langHTML);
            
            const searchInput = modal.querySelector('#langSearchInput');
            const listContainer = modal.querySelector('#langListContainer');
            
            const renderLangs = (filter = '') => {
                const filtered = LANGUAGES.filter(l => 
                    l.name.toLowerCase().includes(filter.toLowerCase()) || 
                    l.native.toLowerCase().includes(filter.toLowerCase())
                );
                listContainer.innerHTML = filtered.map(l => `
                    <div class="lang-option ${l.code === currentLang ? 'active' : ''}" data-code="${l.code}">
                        <div><div class="lang-name">${l.name}</div><div class="lang-native">${l.native}</div></div>
                        <div class="lang-check">✓</div>
                    </div>
                `).join('');
                
                listContainer.querySelectorAll('.lang-option').forEach(opt => {
                    opt.addEventListener('click', () => {
                        const code = opt.getAttribute('data-code');
                        const lang = LANGUAGES.find(l => l.code === code);
                        listContainer.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
                        opt.classList.add('active');
                        const display = document.getElementById('langValueDisplay');
                        if (display) display.textContent = lang.name;
                        localStorage.setItem('cumbear_lang', code);
                        
                        // Trigger Google Translate
                        triggerGoogleTranslate(code);
                        
                        setTimeout(() => modal.classList.remove('active'), 300);
                    });
                });
            };
            
            renderLangs();
            setTimeout(() => searchInput.focus(), 400);
            searchInput.addEventListener('input', (e) => renderLangs(e.target.value));
        });
    }

    // --- 7. Google Translate Trigger ---
    function triggerGoogleTranslate(langCode) {
        if (langCode === 'en') {
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.cumbear.in";
            location.reload();
            return;
        }
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

    // --- 8. Navigation Links ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-target');
            if (window.switchView) {
                window.switchView(targetView, true);
            }
            window.closeSidebar();
        });
    });

    // --- 9. Initialize State ---
    const savedTheme = localStorage.getItem('cumbear_theme') || 'dark';
    const savedGrid = localStorage.getItem('cumbear_grid') || '1';
    const savedLang = localStorage.getItem('cumbear_lang') || 'en';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.style.setProperty('--grid-cols', savedGrid);
    if (themeBtn) themeBtn.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    
    const gridLabels = { '1': '1 Column', '2': '2 Columns', '4': '4 Columns' };
    const gridDisplay = document.getElementById('gridValueDisplay');
    if (gridDisplay) gridDisplay.textContent = gridLabels[savedGrid] || '1 Column';
    
    const langDisplay = document.getElementById('langValueDisplay');
    if (langDisplay) {
        const langObj = LANGUAGES.find(l => l.code === savedLang);
        if (langObj) langDisplay.textContent = langObj.name;
    }
});
