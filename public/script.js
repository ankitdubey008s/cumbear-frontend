// --- Age Gate & Global Router with Clean URL Support ---

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (localStorage.getItem('cumbear_age_verified') === 'true') {
        document.getElementById('ageGate').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        initRouter();
        handleDirectLinks(urlParams);
    } else {
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

function handleDirectLinks(urlParams) {
    if (urlParams.has('v')) {
        const video = {
            _id: urlParams.get('v'),
            title: decodeURIComponent(urlParams.get('t') || 'CumBear Video'),
            thumbnailUrl: decodeURIComponent(urlParams.get('thumb') || '/cumb.png'),
            duration: urlParams.get('dur') || '00:00',
            playableUrl: decodeURIComponent(urlParams.get('src') || ''),
            category: urlParams.get('cat') || 'all'
        };
        
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

function initRouter() {
    if (!history.state) {
        history.replaceState({ view: 'homeView' }, '', '/');
    }
    
    window.addEventListener('popstate', (event) => {
        const viewId = event.state?.view || 'homeView';
        switchView(viewId, false);
    });
}

window.switchView = function(viewId, pushHistory = true) {
    const currentActive = document.querySelector('.view-section.active');
    const currentViewId = currentActive ? currentActive.id : '';
    
    if (currentViewId === 'playerView' && viewId !== 'playerView') {
        if (window.stopPlayer) window.stopPlayer();
    }
    
    if (currentViewId === 'shortsView' && viewId !== 'shortsView') {
        document.querySelectorAll('.short-video').forEach(v => v.pause());
    }
    
    if (currentViewId === 'homeView' && viewId !== 'homeView') {
        if (window.resetHomeState) window.resetHomeState();
    }
    
    document.querySelectorAll('.view-section').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });
    
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    
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
