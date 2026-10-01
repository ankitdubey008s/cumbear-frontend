
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const bottomNav = document.getElementById('bottomNav');
    let lastScrollY = window.scrollY;

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');
            navItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            
            if (window.switchView) window.switchView(targetView, true);
            
            // Trigger Shorts loading if switching to shorts
            if (targetView === 'shortsView' && window.loadShorts) {
                window.loadShorts();
            }
        });
    });

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            bottomNav.classList.add('footer-hidden');
        } else {
            bottomNav.classList.remove('footer-hidden');
        }
        lastScrollY = currentScrollY;
    }, { passive: true });

    const originalSwitchView = window.switchView;
    if (originalSwitchView) {
        window.switchView = function(viewId, pushHistory = true) {
            originalSwitchView(viewId, pushHistory);
            navItems.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
            });
            bottomNav.classList.remove('footer-hidden');
        };
    }
});
