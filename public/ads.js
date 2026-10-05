// ExoClick Ad Renderer with EXACT Zone IDs
window.renderAd = function(type) {
    if (type === 'infeed') {
        return `
            <div style="grid-column: 1 / -1; margin: 1.5rem 0; display: flex; justify-content: center; align-items: center; background: linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 100%); border-radius: 16px; padding: 1.25rem; border: 1px solid rgba(124, 29, 64, 0.2); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); min-height: 250px; position: relative; overflow: hidden;">
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

// Initialize Sticky Ads on Load
document.addEventListener('DOMContentLoaded', () => {
    const stickyContainer = document.getElementById('stickyAdContent');
    if (!stickyContainer) return;
    
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        // Load 320x250 Sticky for Mobile (Zone ID: 6045626)
        stickyContainer.innerHTML = `
            <div style="width: 100%; max-width: 320px; min-height: 250px; display: flex; align-items: center; justify-content: center; position: relative;">
                <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
                <ins class="eas6a97888e17" data-zoneid="6045626"><\/ins>
                <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
            </div>
        `;
    } else {
        // Load 900x250 Sticky for Desktop (Zone ID: 6045628)
        stickyContainer.innerHTML = `
            <div style="width: 100%; max-width: 900px; min-height: 250px; display: flex; align-items: center; justify-content: center; position: relative;">
                <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
                <ins class="eas6a97888e17" data-zoneid="6045628"><\/ins>
                <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
            </div>
        `;
    }
});

// Inject Top Banner (900x250) on Home Load (Zone ID: 6045618)
const topBannerContainer = document.getElementById('topBannerContainer');
if (topBannerContainer && window.innerWidth >= 768) {
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
}
