// ============================================
// CUMBEAR ULTRA PREMIUM - Ad Integration
// Version: 2.0 Enhanced
// ============================================

// --- 1. In-Feed Ad Renderer (Called by home.js and search.js) ---
window.renderAd = function(type) {
    if (type === 'infeed') {
        // Premium container with burgundy accent border
        return `
            <div class="ad-infeed-container" style="grid-column: 1 / -1; margin: 1.5rem 0; display: flex; justify-content: center; align-items: center; background: linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 100%); border-radius: 16px; padding: 1.25rem; border: 1px solid rgba(124, 29, 64, 0.2); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); min-height: 250px; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(124, 29, 64, 0.5), transparent);"></div>
                <div style="position: absolute; top: 8px; left: 50%; transform: translateX(-50%); font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; opacity: 0.7;">Sponsored</div>
                <div class="ad-slot" style="width: 100%; max-width: 320px; min-height: 250px; display: flex; align-items: center; justify-content: center;">
                    <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
                    <ins class="eas6a97888e2" data-zoneid="6045616"><\/ins>
                    <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
                </div>
            </div>
        `;
    }
    return '';
};

// --- 2. Top Banner Renderer (900x250 Desktop Only) ---
window.renderTopBanner = function() {
    const topBannerContainer = document.getElementById('topBannerContainer');
    if (!topBannerContainer) return;
    
    // Only show on desktop (768px+)
    if (window.innerWidth < 768) {
        topBannerContainer.style.display = 'none';
        return;
    }
    
    topBannerContainer.innerHTML = `
        <div style="width: 100%; max-width: 900px; min-height: 250px; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 100%); border-radius: 16px; padding: 1rem; border: 1px solid rgba(124, 29, 64, 0.2); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(124, 29, 64, 0.5), transparent);"></div>
            <div style="position: absolute; top: 8px; left: 50%; transform: translateX(-50%); font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; opacity: 0.7;">Advertisement</div>
            <div class="ad-slot" style="width: 100%; display: flex; align-items: center; justify-content: center;">
                <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
                <ins class="eas6a97888e2" data-zoneid="6045618"><\/ins>
                <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
            </div>
        </div>
    `;
};

// --- 3. Sticky Ad Initialization (Mobile 320x250 / Desktop 900x250) ---
document.addEventListener('DOMContentLoaded', () => {
    const stickyContainer = document.getElementById('stickyAdContent');
    if (!stickyContainer) return;
    
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        // Mobile: 320x250 Sticky Banner
        stickyContainer.innerHTML = `
            <div style="width: 100%; max-width: 320px; min-height: 250px; display: flex; align-items: center; justify-content: center; position: relative;">
                <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
                <ins class="eas6a97888e17" data-zoneid="6045626"><\/ins>
                <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
            </div>
        `;
    } else {
        // Desktop: 900x250 Sticky Banner
        stickyContainer.innerHTML = `
            <div style="width: 100%; max-width: 900px; min-height: 250px; display: flex; align-items: center; justify-content: center; position: relative;">
                <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
                <ins class="eas6a97888e17" data-zoneid="6045628"><\/ins>
                <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
            </div>
        `;
    }
    
    // Premium entrance animation for sticky ad
    setTimeout(() => {
        const stickyWrapper = document.getElementById('stickyAdContainer');
        if (stickyWrapper) {
            stickyWrapper.style.opacity = '0';
            stickyWrapper.style.transform = 'translateY(20px)';
            stickyWrapper.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            
            requestAnimationFrame(() => {
                stickyWrapper.style.opacity = '1';
                stickyWrapper.style.transform = 'translateY(0)';
            });
        }
    }, 1000);
});

// --- 4. Global Ad Error Handler ---
// Prevents broken layouts if an ad fails to load
window.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'SCRIPT') {
        const adSlot = e.target.closest('.ad-slot');
        if (adSlot) {
            adSlot.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 2rem;">Ad temporarily unavailable</div>';
        }
    }
}, true);

// --- 5. Responsive Ad Resize Handler ---
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Re-render top banner if screen size changes
        if (window.renderTopBanner) {
            window.renderTopBanner();
        }
    }, 250);
});

// --- 6. Initialize Top Banner on Load ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.renderTopBanner) window.renderTopBanner();
    });
} else {
    if (window.renderTopBanner) window.renderTopBanner();
}
