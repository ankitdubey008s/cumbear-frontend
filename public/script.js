/**
 * CUMBEAR CORE ENGINE v2.0
 * Production-grade SPA router with buttery-smooth transitions
 */

'use strict';

// ============================================
// PERFORMANCE UTILITIES
// ============================================

const Perf = {
    raf: (fn) => requestAnimationFrame(fn),
    ric: (fn) => requestIdleCallback?.(fn) || setTimeout(fn, 1),
    throttle: (fn, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    debounce: (fn, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), wait);
        };
    },
    // Smooth scroll with momentum
    smoothScrollTo: (target, duration = 500) => {
        const start = window.scrollY;
        const dist = (typeof target === 'number' ? target : target.getBoundingClientRect().top + start) - start;
        const startTime = performance.now();
        
        const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
        
        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutQuart(progress);
            
            window.scrollTo(0, start + dist * eased);
            
            if (progress < 1) requestAnimationFrame(step);
        }
        
        requestAnimationFrame(step);
    }
};

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

const Toast = {
    container: null,
    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },
    show(message, duration = 2500) {
        if (!this.container) this.init();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        this.container.appendChild(toast);
        setTimeout(() => toast.remove(), duration + 500);
    }
};

// ============================================
// AGE GATE WITH ANIMATIONS
// ============================================

function verifyAge() {
    localStorage.setItem('cumbear_age_verified', 'true');
    const overlay = document.getElementById('ageGate');
    
    // Smooth fade out
    overlay.style.transition = 'opacity 0.6s var(--ease-out-expo), transform 0.6s var(--ease-out-expo)';
    overlay.style.opacity = '0';
    overlay.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
        overlay.classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        // Staggered entrance animation for main app
        const mainApp = document.getElementById('mainApp');
        mainApp.style.opacity = '0';
        mainApp.style.transform = 'translateY(20px)';
        mainApp.style.transition = 'opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo)';
        
        Perf.raf(() => {
            mainApp.style.opacity = '1';
            mainApp.style.transform = 'translateY(0)';
        });
        
        initRouter();
        initGlobalGestures();
    }, 600);
}

function exitSite() {
    // Smooth exit animation
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = 'https://www.google.com';
    }, 300);
}

// ============================================
// PRODUCTION ROUTER WITH FLIP ANIMATIONS
// ============================================

let currentView = 'homeView';
let isTransitioning = false;

function initRouter() {
    if (!history.state) {
        history.replaceState({ view: 'homeView', scroll: 0 }, '', '#home');
    }

    window.addEventListener('popstate', (event) => {
        const viewId = event.state?.view || 'homeView';
        const scrollPos = event.state?.scroll || 0;
        
        // Don't push history on popstate (it's already in history)
        switchView(viewId, false, scrollPos);
    });

    // Save scroll position before leaving
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (history.state) {
                history.replaceState({ ...history.state, scroll: window.scrollY }, '');
            }
        }, 100);
    }, { passive: true });
}

// FLIP-based view transition
window.switchView = function(viewId, pushHistory = true, restoreScroll = null) {
    if (isTransitioning || viewId === currentView) return;
    isTransitioning = true;
    
    const outgoing = document.querySelector('.view-section.active');
    const incoming = document.getElementById(viewId);
    
    if (!incoming) {
        isTransitioning = false;
        return;
    }

    // Kill player if leaving
    if (currentView === 'playerView' && viewId !== 'playerView') {
        if (window.stopPlayer) window.stopPlayer();
    }

    // Reset home state if leaving
    if (currentView === 'homeView' && viewId !== 'homeView') {
        if (window.resetHomeState) window.resetHomeState();
    }

    // Prepare incoming view (off-screen)
    incoming.classList.remove('hidden');
    incoming.style.position = 'absolute';
    incoming.style.width = '100%';
    incoming.style.top = '0';
    incoming.style.left = '0';
    
    // Determine direction
    const views = ['homeView', 'categoriesView', 'shortsView', 'playerView'];
    const currentIdx = views.indexOf(currentView);
    const nextIdx = views.indexOf(viewId);
    const direction = nextIdx > currentIdx ? 1 : -1;

    // Animate outgoing
    if (outgoing) {
        outgoing.style.transition = 'opacity 0.35s var(--ease-smooth), transform 0.35s var(--ease-smooth)';
        outgoing.style.opacity = '0';
        outgoing.style.transform = `translateX(${-direction * 30}px) scale(0.98)`;
    }

    // Animate incoming
    incoming.style.opacity = '0';
    incoming.style.transform = `translateX(${direction * 40}px) scale(0.98)`;
    
    Perf.raf(() => {
        incoming.style.transition = 'opacity 0.4s var(--ease-out-expo), transform 0.4s var(--ease-out-expo)';
        incoming.style.opacity = '1';
        incoming.style.transform = 'translateX(0) scale(1)';
        
        // Cleanup after animation
        setTimeout(() => {
            if (outgoing) {
                outgoing.classList.add('hidden');
                outgoing.classList.remove('active');
                outgoing.style.position = '';
                outgoing.style.width = '';
                outgoing.style.top = '';
                outgoing.style.left = '';
                outgoing.style.opacity = '';
                outgoing.style.transform = '';
                outgoing.style.transition = '';
            }
            
            incoming.classList.add('active');
            incoming.style.position = '';
            incoming.style.width = '';
            incoming.style.top = '';
            incoming.style.left = '';
            incoming.style.opacity = '';
            incoming.style.transform = '';
            incoming.style.transition = '';
            
            // Scroll handling
            if (viewId === 'playerView') {
                window.scrollTo(0, 0);
            } else if (restoreScroll !== null) {
                Perf.smoothScrollTo(restoreScroll, 0);
            } else {
                Perf.smoothScrollTo(0, 300);
            }
            
            currentView = viewId;
            isTransitioning = false;
            
            // Update nav states
            updateNavStates(viewId);
            
        }, 400);
    });

    // Push history
    if (pushHistory) {
        history.pushState({ view: viewId, scroll: 0 }, '', `#${viewId.replace('View', '')}`);
    }
};

function updateNavStates(viewId) {
    // Bottom nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        const isActive = btn.getAttribute('data-view') === viewId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    
    // Sidebar nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-target') === viewId);
    });
}

// ============================================
// GLOBAL GESTURE ENGINE (Butter-smooth)
// ============================================

function initGlobalGestures() {
    // Pull-to-refresh on home
    let pullStartY = 0;
    let isPulling = false;
    const homeView = document.getElementById('homeView');
    
    if (homeView) {
        homeView.addEventListener('touchstart', (e) => {
            if (window.scrollY <= 0) {
                pullStartY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        homeView.addEventListener('touchmove', Perf.throttle((e) => {
            if (!isPulling) return;
            const diff = e.touches[0].clientY - pullStartY;
            if (diff > 80 && diff < 200) {
                // Visual feedback for pull
                homeView.style.transform = `translateY(${diff * 0.3}px)`;
                homeView.style.transition = 'none';
            }
        }, 16), { passive: true });
        
        homeView.addEventListener('touchend', () => {
            if (!isPulling) return;
            isPulling = false;
            homeView.style.transition = 'transform 0.3s var(--ease-out-back)';
            homeView.style.transform = '';
            
            // Check if pulled enough to refresh
            const diff = pullStartY; // simplified
            if (diff > 120) {
                if (window.loadHomeVideos) window.loadHomeVideos();
                Toast.show('Refreshing...');
            }
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check age verification
    if (localStorage.getItem('cumbear_age_verified') === 'true') {
        const overlay = document.getElementById('ageGate');
        overlay.classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        initRouter();
        initGlobalGestures();
    }
    
    // Initialize toast system
    Toast.init();
});

// Expose globals
window.Toast = Toast;
window.Perf = Perf;

