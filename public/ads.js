// --- Centralized Ad Rendering ---
window.renderAd = function(type) {
    // In the future, you can inject real ad codes (AdSense, ExoClick, etc.) here.
    // For now, it renders a styled placeholder.
    if (type === 'banner') {
        return `<div class="ad-banner"><span style="color: var(--text-muted); font-size: 0.9rem;">728x90 Banner Ad Slot</span></div>`;
    } else if (type === 'infeed') {
        return `<div class="ad-infeed"><span style="color: var(--text-muted); font-size: 0.9rem;">In-Feed Ad Slot</span></div>`;
    }
    return '';
};
