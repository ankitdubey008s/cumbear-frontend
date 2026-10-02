
// ExoClick Ad Renderer
window.renderAd = function(type) {
    if (type === 'infeed') {
        // Returns a clean, centered container for the 320x250 banner
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
