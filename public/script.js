// --- Age Gate & Global Router ---

// 1. Age Gate Logic
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cumbear_age_verified') === 'true') {
        document.getElementById('ageGate').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        initRouter();
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
    }, 500);
}

function exitSite() {
    window.location.href = 'https://www.google.com';
}

// 2. Centralized Router & Back Button System
function initRouter() {
    if (!history.state) {
        history.replaceState({ view: 'homeView' }, '');
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
        // Pause all shorts videos
        document.querySelectorAll('.short-video').forEach(v => {
            v.pause();
        });
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
    
    // Handle specific view resets
    if (viewId === 'categoriesView' && window.showCategoriesView) {
        window.showCategoriesView();
    }
    
    // Push to history stack if navigating forward
    if (pushHistory) {
        history.pushState({ view: viewId }, '', `#${viewId}`);
    }
    
    // FIX: Instant jump for player, smooth scroll for everything else
    if (viewId === 'playerView') {
        window.scrollTo(0, 0); // Instant, no animation
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
