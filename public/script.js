// ============================================
// CUMBEAR ULTRA PREMIUM - Core Logic & Router
// Version: 2.0 Enhanced
// ============================================

// --- 1. Age Gate Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if user has already verified age
    if (localStorage.getItem('cumbear_age_verified') === 'true') {
        document.getElementById('ageGate').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        initRouter();
    }
});

function verifyAge() {
    localStorage.setItem('cumbear_age_verified', 'true');
    const overlay = document.getElementById('ageGate');
    
    // Smooth fade out animation
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
        overlay.classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        initRouter();
    }, 500);
}

function exitSite() {
    // Redirect to a safe site
    window.location.href = 'https://www.google.com';
}

// --- 2. Centralized Router & Android Back Button System ---
function initRouter() {
    // Initialize history state if it doesn't exist
    if (!history.state) {
        history.replaceState({ view: 'homeView' }, '');
    }
    
    // Listen for the physical Android back button
    window.addEventListener('popstate', (event) => {
        const viewId = event.state?.view || 'homeView';
        switchView(viewId, false);
    });
}

// Global function to switch views safely and smoothly
window.switchView = function(viewId, pushHistory = true) {
    const currentActive = document.querySelector('.view-section.active');
    const currentViewId = currentActive ? currentActive.id : '';

    // 🛑 KILL PLAYER: Stop video if leaving the player view (Prevents background audio)
    if (currentViewId === 'playerView' && viewId !== 'playerView') {
        if (window.stopPlayer) window.stopPlayer();
    }

    //  RESET HOME: Clear filters/pagination if leaving the home view
    if (currentViewId === 'homeView' && viewId !== 'homeView') {
        if (window.resetHomeState) window.resetHomeState();
    }

    // Hide all sections
    document.querySelectorAll('.view-section').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });

    // Show target section with a subtle fade-in
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    // Update Sidebar Active State
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-target="${viewId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Handle specific view resets (e.g., Categories view)
    if (viewId === 'categoriesView' && window.showCategoriesView) {
        window.showCategoriesView();
    }

    // Push to history stack if navigating forward (Enables back button)
    if (pushHistory) {
        history.pushState({ view: viewId }, '', `#${viewId}`);
    }

    // 📜 SCROLL LOGIC: Instant jump for player, smooth scroll for everything else
    if (viewId === 'playerView') {
        window.scrollTo(0, 0); // Instant, no animation for immediate playback
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Buttery smooth scroll
    }
};
