/**
 * CUMBEAR AD ENGINE v2.0
 * Lazy-loaded, viewport-aware, performance-optimized
 */

'use strict';

// Ad configuration
const AD_CONFIG = {
    zones: {
        infeed: 6045616,
        stickyMobile: 6045626,
        stickyDesktop: 6045628,
        topBanner: 6045618,
        vastPreroll: 6045632,
        shortsVast: 6045638
    },
    hosts: {
        ads: 'a.magsrv.com',
        syndication: 's.magsrv.com'
    }
};

// Lazy ad renderer - only loads when near viewport
window.renderAd = function(type) {
    if (type !== 'infeed') return '';
    
    return `
        <div class="ad-infeed" data-ad-type="infeed" data-ad-loaded="false">
            <div class="ad-placeholder">
                <span class="ad-label">Sponsored</span>
                <div class="ad-loading-spinner"></div>
            </div>
        </div>
    `;
};

// Intersection Observer for lazy ad loading
let adObserver = null;

function initAdObserver() {
    if (adObserver) return;
    
    adObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                loadAdElement(entry.target);
                adObserver.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '200px 0px', // Load 200px before visible
        threshold: 0.1
    });
}

function loadAdElement(container) {
    if (container.dataset.adLoaded === 'true') return;
    container.dataset.adLoaded = 'true';
    
    const zoneId = AD_CONFIG.zones.infeed;
    
    container.innerHTML = `
        <script async type="application/javascript" src="https://${AD_CONFIG.hosts.ads}/ad-provider.js"><\/script>
        <ins class="eas6a97888e2" data-zoneid="${zoneId}"></ins>
        <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
    `;
}

// Sticky Ad with viewport awareness
document.addEventListener('DOMContentLoaded', () => {
    const stickyContainer = document.getElementById('stickyAdContent');
    const stickyWrapper = document.getElementById('stickyAdContainer');
    const closeBtn = document.getElementById('stickyCloseBtn');
    
    if (!stickyContainer) return;

    // Close button
    closeBtn?.addEventListener('click', () => {
        stickyWrapper.style.transform = 'translateY(100%)';
        stickyWrapper.style.opacity = '0';
        setTimeout(() => {
            stickyWrapper.style.display = 'none';
        }, 300);
        
        // Remember closure
        sessionStorage.setItem('sticky_ad_closed', Date.now().toString());
    });

    // Check if recently closed
    const closedTime = sessionStorage.getItem('sticky_ad_closed');
    if (closedTime && (Date.now() - parseInt(closedTime)) < 300000) { // 5 min cooldown
        stickyWrapper.style.display = 'none';
        return;
    }

    // Load based on device
    const isMobile = window.innerWidth < 768;
    const zoneId = isMobile ? AD_CONFIG.zones.stickyMobile : AD_CONFIG.zones.stickyDesktop;
    
    // Defer loading until page is stable
    requestIdleCallback(() => {
        stickyContainer.innerHTML = `
            <div style="display:flex;justify-content:center;padding:${isMobile ? '0' : '0.5rem 0'}">
                <script async type="application/javascript" src="https://${AD_CONFIG.hosts.ads}/ad-provider.js"><\/script>
                <ins class="eas6a97888e17" data-zoneid="${zoneId}"></ins>
                <script>(AdProvider = window.AdProvider || []).push({"serve": {}});<\/script>
            </div>
        `;
    });

    // Hide sticky when keyboard is open (mobile)
    if ('visualViewport' in window) {
        window.visualViewport.addEventListener('resize', () => {
            const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.75;
            stickyWrapper.style.display = isKeyboardOpen ? 'none' : 'flex';
        });
    }

    // Initialize infeed ad observer
    initAdObserver();
    
    // Observe existing ads
    document.querySelectorAll('.ad-infeed[data-ad-loaded="false"]').forEach(ad => {
        adObserver.observe(ad);
    });
});

// MutationObserver for dynamically added ads
const adMutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element
                const ads = node.matches?.('.ad-infeed') ? [node] : 
                    node.querySelectorAll?.('.ad-infeed') || [];
                ads.forEach(ad => {
                    if (ad.dataset.adLoaded === 'false' && adObserver) {
                        adObserver.observe(ad);
                    }
                });
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    adMutationObserver.observe(document.body, { childList: true, subtree: true });
});

