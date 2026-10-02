
// ExoClick Ad Renderer
window.renderAd = function(type) {
    if (type === 'infeed') {
        return `
            <div style="grid-column: 1 / -1; margin: 1.5rem 0; display: flex; justify-content: center; align-items: center; background: #111; border-radius: 12px; padding: 1rem; border: 1px solid #222;">
                <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
                <ins class="eas6a97888e2" data-zoneid="6045616"><\/ins>
                <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
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
        // Load 320x250 Sticky for Mobile
        stickyContainer.innerHTML = `
            <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
            <ins class="eas6a97888e17" data-zoneid="6045626"><\/ins>
            <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
        `;
    } else {
        // Load 900x250 Sticky for Desktop
        stickyContainer.innerHTML = `
            <div style="display:flex; justify-content:center; padding: 0.5rem 0;">
                <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
                <ins class="eas6a97888e17" data-zoneid="6045628"><\/ins>
                <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
            </div>
        `;
    }
});
