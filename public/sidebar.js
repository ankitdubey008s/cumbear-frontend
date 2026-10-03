// ============================================
// CUMBEAR ULTRA PREMIUM - Sidebar & Settings
// Version: 2.0 Enhanced
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

    // --- 1. Sidebar Open/Close (History API for Android Back Button) ---
    window.openSidebar = () => {
        if (!sidebar || !overlay) return;
        sidebar.classList.add('active');
        overlay.classList.add('active');
        sidebar.setAttribute('aria-hidden', 'false');
        // Push state so the physical back button closes the sidebar instead of leaving the app
        history.pushState({ sidebarOpen: true }, '');
    };

    window.closeSidebar = () => {
        if (!sidebar || !overlay) return;
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        sidebar.setAttribute('aria-hidden', 'true');
    };

    // Listen for physical back button
    window.addEventListener('popstate', (event) => {
        if (sidebar && sidebar.classList.contains('active')) {
            window.closeSidebar();
        }
    });

    // Standard Click Events
    if (menuBtn) menuBtn.addEventListener('click', window.openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', window.closeSidebar);
    if (overlay) overlay.addEventListener('click', window.closeSidebar);

    // --- 2. Premium Swipe Gestures ---
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

        // Ensure it's a horizontal swipe (not vertical scrolling)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swiped RIGHT -> Open (only if starting from the left edge)
                if (touchStartX < 40 && sidebar && !sidebar.classList.contains('active')) {
                    window.openSidebar();
                }
            } else {
                // Swiped LEFT -> Close
                if (sidebar && sidebar.classList.contains('active')) {
                    window.closeSidebar();
                }
            }
        }
    }, { passive: true });

    // --- 3. Theme Toggle ---
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            // Smooth transition effect
            document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('cumbear_theme', newTheme);
            
            themeBtn.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
            
            setTimeout(() => {
                document.documentElement.style.transition = '';
            }, 300);
        });
    }

    // --- Helper: Dynamic Modal Creator (Keeps HTML Clean) ---
    function createModal(id, title, contentHTML) {
        if (document.getElementById(id)) return document.getElementById(id);
        const modal = document.createElement('div');
        modal.className = 'fullscreen-modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">${title}</div>
                <button class="modal-close" id="close${id}">✕</button>
            </div>
            <div class="modal-content">${contentHTML}</div>
        `;
        document.body.appendChild(modal);
        document.getElementById(`close${id}`).addEventListener('click', () => modal.classList.remove('active'));
        return modal;
    }

    // --- 4. Grid View Modal Logic ---
    const gridRow = document.getElementById('gridViewRow');
    if (gridRow) {
        gridRow.addEventListener('click', () => {
            window.closeSidebar();
            const gridHTML = `
                <div class="grid-option" data-value="1"><div class="grid-label">1 Column (Cinema)</div><div class="grid-preview one-col"><div class="grid-bar"></div></div></div>
                <div class="grid-option" data-value="2"><div class="grid-label">2 Columns (Standard)</div><div class="grid-preview two-col"><div class="grid-bar"></div><div class="grid-bar"></div></div></div>
                <div class="grid-option" data-value="4"><div class="grid-label">4 Columns (Dense)</div><div class="grid-preview four-col"><div class="grid-bar"></div><div class="grid-bar"></div><div class="grid-bar"></div><div class="grid-bar"></div></div></div>
            `;
            const modal = createModal('gridModal', 'Grid View', gridHTML);
            modal.classList.add('active');
            
            modal.querySelectorAll('.grid-option').forEach(opt => {
                const val = opt.getAttribute('data-value');
                // Check current active state
                if (document.documentElement.style.getPropertyValue('--grid-cols').trim() === val) {
                    opt.classList.add('active');
                }
                opt.addEventListener('click', () => {
                    modal.querySelectorAll('.grid-option').forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    document.documentElement.style.setProperty('--grid-cols', val);
                    localStorage.setItem('cumbear_grid', val);
                    const labels = { '1': '1 Column', '2': '2 Columns', '4': '4 Columns' };
                    document.getElementById('gridValueDisplay').textContent = labels[val];
                    setTimeout(() => modal.classList.remove('active'), 300);
                });
            });
        });
    }

    // --- 5. Language Modal Logic ---
    const langRow = document.getElementById('languageRow');
    if (langRow) {
        langRow.addEventListener('click', () => {
            window.closeSidebar();
            const langHTML = `
                <div class="modal-search-wrapper">
                    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" class="modal-search-input" id="langSearchInput" placeholder="Search language...">
                </div>
                <div id="langListContainer"></div>
            `;
            const modal = createModal('langModal', 'Select Language', langHTML);
            modal.classList.add('active');
            
            const searchInput = modal.querySelector('#langSearchInput');
            const listContainer = modal.querySelector('#langListContainer');
            
            const renderLangs = (filter = '') => {
                const filtered = LANGUAGES.filter(l => l.name.toLowerCase().includes(filter.toLowerCase()) || l.native.toLowerCase().includes(filter.toLowerCase()));
                listContainer.innerHTML = filtered.map(l => `
                    <div class="lang-option" data-code="${l.code}">
                        <div><div class="lang-name">${l.name}</div><div class="lang-native">${l.native}</div></div>
                        <div class="lang-check">✓</div>
                    </div>
                `).join('');
                
                listContainer.querySelectorAll('.lang-option').forEach(opt => {
                    if (opt.getAttribute('data-code') === localStorage.getItem('cumbear_lang')) opt.classList.add('active');
                    opt.addEventListener('click', () => {
                        listContainer.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
                        opt.classList.add('active');
                        const code = opt.getAttribute('data-code');
                        const lang = LANGUAGES.find(l => l.code === code);
                        localStorage.setItem('cumbear_lang', code);
                        document.getElementById('langValueDisplay').textContent = lang.name;
                        setTimeout(() => modal.classList.remove('active'), 300);
                    });
                });
            };
            
            renderLangs();
            searchInput.addEventListener('input', (e) => renderLangs(e.target.value));
            setTimeout(() => searchInput.focus(), 400); // Auto-focus for native feel
        });
    }

    // --- 6. Navigation Links ---
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

    // --- 7. Initialize State on Load ---
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
