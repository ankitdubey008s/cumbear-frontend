// --- Age Gate & Global Router with Clean URL Support ---

// 1. Age Gate Logic
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (localStorage.getItem('cumbear_age_verified') === 'true') {
        document.getElementById('ageGate').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        initRouter();
        handleDirectLinks(urlParams);
    } else {
        // If not verified, we still need to check for direct links after they verify
        window.pendingUrlParams = urlParams;
    }
});

function verifyAge() {
    localStorage.setItem('cumbear_age_verified', 'true');
    const overlay = document.getElementById('ageGate');
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        overlay.classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        initRouter();
        if (window.pendingUrlParams) {
            handleDirectLinks(window.pendingUrlParams);
            window.pendingUrlParams = null;
        }
    }, 500);
}

function exitSite() {
    window.location.href = 'https://www.google.com';
}

// 2. Handle Direct Share Links (No backend fetch needed!)
function handleDirectLinks(urlParams) {
    if (urlParams.has('v')) {
        const video = {
            _id: urlParams.get('v'),
            title: urlParams.get('t') || 'CumBear Video',
            thumbnailUrl: urlParams.get('thumb') || '/cumb.png',
            duration: urlParams.get('dur') || '00:00',
            playableUrl: urlParams.get('src') || '',
            category: urlParams.get('cat') || 'all'
        };
        
        // Wait for player to be ready, then load
        const checkAndPlay = setInterval(() => {
            if (window.loadPlayerVideo) {
                clearInterval(checkAndPlay);
                window.switchView('playerView', false);
                window.loadPlayerVideo(video, 0);
            }
        }, 100);
    } else if (urlParams.has('category')) {
        if (window.performSearch) {
            window.performSearch(urlParams.get('category'), true);
        }
    }
}

// 3. Centralized Router & Back Button System
function initRouter() {
    if (!history.state) {
        history.replaceState({ view: 'homeView' }, '', '/');
    }
    
    window.addEventListener('popstate', (event) => {
        const viewId = event.state?.view || 'homeView';
        switchView(viewId, false);
    });
}

// Global function to switch views safely
window.switchView = function(viewId, pushHistory = true) {
    const currentActive = document.querySelector('.view-section.active');
    const currentViewId = currentActive ? currentActive.id : '';
    
    // 🛑 KILL PLAYER if leaving the player view
    if (currentViewId === 'playerView' && viewId !== 'playerView') {
        if (window.stopPlayer) window.stopPlayer();
    }
    
    // 🛑 KILL SHORTS if leaving the shorts view
    if (currentViewId === 'shortsView' && viewId !== 'shortsView') {
        document.querySelectorAll('.short-video').forEach(v => v.pause());
    }
    
    // RESET HOME STATE if leaving the home view
    if (currentViewId === 'homeView' && viewId !== 'homeView') {
        if (window.resetHomeState) window.resetHomeState();
    }
    
    // Hide all sections
    document.querySelectorAll('.view-section').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });
    
    // Show target section
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    
    // Update Sidebar Active State
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-target="${viewId}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    if (viewId === 'categoriesView' && window.showCategoriesView) {
        window.showCategoriesView();
    }
    
    if (pushHistory) {
        history.pushState({ view: viewId }, '', '/');
    }
    
    if (viewId === 'playerView') {
        window.scrollTo(0, 0);
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
