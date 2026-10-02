/**
 * CUMBEAR SIDEBAR ENGINE v2.0
 * Hardware-accelerated drawer with gesture physics
 */

'use strict';

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
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'th', name: 'Thai', native: 'ไทย' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' }
];

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('siteSidebar');
    const themeBtn = document.getElementById('themeToggleBtn');
    const navLinks = document.querySelectorAll('.nav-link');

    let isOpen = false;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // ============================================
    // DRAWER PHYSICS
    // ============================================
    
    function openSidebar() {
        if (isOpen) return;
        isOpen = true;
        
        sidebar.classList.add('active');
        overlay.classList.add('active');
        sidebar.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');
        
        // Push history for back button support
        history.pushState({ sidebarOpen: true }, '');
        
        // Focus trap
        setTimeout(() => closeBtn.focus(), 100);
    }

    function closeSidebar() {
        if (!isOpen) return;
        isOpen = false;
        
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        sidebar.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        
        // Remove sidebar state from history if present
        if (history.state?.sidebarOpen) {
            history.back();
        }
    }

    // Back button support
    window.addEventListener('popstate', (e) => {
        if (isOpen && !e.state?.sidebarOpen) {
            closeSidebar();
        }
    });

    // Click handlers
    menuBtn?.addEventListener('click', openSidebar);
    closeBtn?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);

    // ============================================
    // TOUCH GESTURES WITH PHYSICS
    // ============================================
    
    document.addEventListener('touchstart', (e) => {
        startX = e.changedTouches[0].screenX;
        
        // Open gesture: left edge swipe right
        if (startX < 30 && !isOpen) {
            isDragging = true;
        }
        // Close gesture: swipe left on sidebar
        else if (isOpen && startX > window.innerWidth - 280) {
            isDragging = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        currentX = e.changedTouches[0].screenX;
        const diff = currentX - startX;
        
        if (!isOpen && diff > 0) {
            // Opening
            const progress = Math.min(diff / 280, 1);
            sidebar.style.transform = `translateX(${(progress - 1) * 100}%)`;
            overlay.style.opacity = progress * 0.6;
        } else if (isOpen && diff < 0) {
            // Closing
            const progress = Math.max(1 + diff / 280, 0);
            sidebar.style.transform = `translateX(${(progress - 1) * 100}%)`;
            overlay.style.opacity = progress * 0.6;
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const diff = currentX - startX;
        const threshold = 80;
        
        sidebar.style.transform = '';
        overlay.style.opacity = '';
        
        if (!isOpen && diff > threshold) {
            openSidebar();
        } else if (isOpen && diff < -threshold) {
            closeSidebar();
        } else {
            // Snap back
            if (isOpen) openSidebar();
            else closeSidebar();
        }
    });

    // ============================================
    // THEME TOGGLE
    // ============================================
    
    themeBtn?.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Smooth transition
        document.documentElement.style.transition = 'background-color 0.5s ease, color 0.5s ease';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('cumbear_theme', newTheme);
        themeBtn.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
        
        setTimeout(() => {
            document.documentElement.style.transition = '';
        }, 500);
    });

    // ============================================
    // GRID MODAL
    // ============================================
    
    const gridRow = document.getElementById('gridViewRow');
    let gridModal = null;

    function createGridModal() {
        gridModal = document.createElement('div');
        gridModal.className = 'fullscreen-modal';
        gridModal.id = 'gridModal';
        gridModal.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">Grid View</div>
                <button class="modal-close" id="closeGridModal" aria-label="Close">✕</button>
            </div>
            <div class="modal-content" style="padding:1.5rem">
                <div class="grid-option" data-value="1">
                    <div class="grid-preview one-col"><div class="grid-bar"></div></div>
                    <div class="grid-label">1 Column</div>
                </div>
                <div class="grid-option" data-value="2">
                    <div class="grid-preview two-col"><div class="grid-bar"></div><div class="grid-bar"></div></div>
                    <div class="grid-label">2 Columns</div>
                </div>
                <div class="grid-option" data-value="4">
                    <div class="grid-preview four-col"><div class="grid-bar"></div><div class="grid-bar"></div><div class="grid-bar"></div><div class="grid-bar"></div></div>
                    <div class="grid-label">4 Columns</div>
                </div>
            </div>
        `;
        document.body.appendChild(gridModal);

        gridModal.querySelector('#closeGridModal').addEventListener('click', () => {
            gridModal.classList.remove('active');
        });

        const savedGrid = localStorage.getItem('cumbear_grid') || '1';
        
        gridModal.querySelectorAll('.grid-option').forEach(opt => {
            const value = opt.getAttribute('data-value');
            if (value === savedGrid) opt.classList.add('active');
            
            opt.addEventListener('click', () => {
                gridModal.querySelectorAll('.grid-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                
                document.documentElement.style.setProperty('--grid-cols', value);
                localStorage.setItem('cumbear_grid', value);
                
                const labels = { '1': '1 Column', '2': '2 Columns', '4': '4 Columns' };
                document.getElementById('gridValueDisplay').textContent = labels[value];
                
                setTimeout(() => gridModal.classList.remove('active'), 200);
            });
        });
    }

    gridRow?.addEventListener('click', () => {
        if (!gridModal) createGridModal();
        gridModal.classList.add('active');
        closeSidebar();
    });

    // ============================================
    // LANGUAGE MODAL
    // ============================================
    
    const langRow = document.getElementById('languageRow');
    let langModal = null;

    function createLangModal() {
        langModal = document.createElement('div');
        langModal.className = 'fullscreen-modal';
        langModal.id = 'langModal';
        langModal.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">Language</div>
                <button class="modal-close" id="closeLangModal" aria-label="Close">✕</button>
            </div>
            <div class="modal-search-wrapper">
                <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="search" class="modal-search-input" id="langSearchInput" placeholder="Search language..." autocomplete="off">
            </div>
            <div class="modal-content">
                <div id="langList"></div>
            </div>
        `;
        document.body.appendChild(langModal);

        langModal.querySelector('#closeLangModal').addEventListener('click', () => {
            langModal.classList.remove('active');
        });

        const searchInput = langModal.querySelector('#langSearchInput');
        const langList = langModal.querySelector('#langList');

        function renderLangList(filter = '') {
            const filtered = LANGUAGES.filter(lang => 
                lang.name.toLowerCase().includes(filter.toLowerCase()) || 
                lang.native.toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
                langList.innerHTML = '<div class="no-results">No languages found</div>';
                return;
            }

            const savedLang = localStorage.getItem('cumbear_lang') || 'en';
            
            langList.innerHTML = filtered.map(lang => `
                <div class="lang-option ${lang.code === savedLang ? 'active' : ''}" data-code="${lang.code}">
                    <div>
                        <div class="lang-name">${lang.name}</div>
                        <div class="lang-native">${lang.native}</div>
                    </div>
                    <div class="lang-check">✓</div>
                </div>
            `).join('');

            langList.querySelectorAll('.lang-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const code = opt.getAttribute('data-code');
                    const lang = LANGUAGES.find(l => l.code === code);
                    
                    langList.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    
                    document.getElementById('langValueDisplay').textContent = lang.name;
                    localStorage.setItem('cumbear_lang', code);
                    
                    setTimeout(() => langModal.classList.remove('active'), 200);
                });
            });
        }

        searchInput.addEventListener('input', (e) => renderLangList(e.target.value));
        renderLangList();
    }

    langRow?.addEventListener('click', () => {
        if (!langModal) createLangModal();
        langModal.classList.add('active');
        closeSidebar();
        setTimeout(() => langModal.querySelector('#langSearchInput')?.focus(), 100);
    });

    // ============================================
    // NAVIGATION
    // ============================================
    
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

    // ============================================
    // INITIALIZE STATE
    // ============================================
    
    const savedTheme = localStorage.getItem('cumbear_theme') || 'dark';
    const savedGrid = localStorage.getItem('cumbear_grid') || '1';
    const savedLang = localStorage.getItem('cumbear_lang') || 'en';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.style.setProperty('--grid-cols', savedGrid);
    themeBtn && (themeBtn.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode');
    
    const gridLabels = { '1': '1 Column', '2': '2 Columns', '4': '4 Columns' };
    document.getElementById('gridValueDisplay') && (document.getElementById('gridValueDisplay').textContent = gridLabels[savedGrid] || '1 Column');
    
    const savedLangObj = LANGUAGES.find(l => l.code === savedLang);
    if (savedLangObj) {
        document.getElementById('langValueDisplay') && (document.getElementById('langValueDisplay').textContent = savedLangObj.name);
    }

    // Hide 4-col on mobile
    if (window.innerWidth < 768) {
        // Will be handled in modal creation
    }
});

