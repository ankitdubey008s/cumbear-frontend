/**
 * CUMBEAR SEARCH ENGINE v2.0
 * Debounced search, prefetching, gesture engine
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 Search Engine v2.0 Loaded');

    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.getElementById('searchForm');
    const categoriesGrid = document.getElementById('categoriesGrid');
    const categoriesView = document.getElementById('categoriesView');
    const homeView = document.getElementById('homeView');
    const searchResultsHeader = document.getElementById('searchResultsHeader');
    const currentSearchTerm = document.getElementById('currentSearchTerm');
    const backToCategoriesBtn = document.getElementById('backToCategoriesBtn');
    const categoriesHub = document.getElementById('categoriesHub');
    const videoGrid = document.getElementById('videoGrid');

    let searchDebounceTimer = null;
    let isSearching = false;

    // Event listeners
    searchBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showCategoriesView();
    });

    searchForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const term = searchInput.value.trim();
        if (term) performSearch(term);
    });

    // Real-time search with debounce
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimer);
        const term = e.target.value.trim();
        
        if (term.length >= 2) {
            searchDebounceTimer = setTimeout(() => {
                performSearch(term, false, true); // silent, no view switch
            }, 400);
        }
    });

    backToCategoriesBtn?.addEventListener('click', () => {
        searchInput.value = '';
        showCategoriesView();
    });

    function showCategoriesView() {
        searchResultsHeader?.classList.add('hidden');
        categoriesHub?.classList.remove('hidden');
        homeView?.classList.add('hidden');
        homeView?.classList.remove('active');
        categoriesView?.classList.remove('hidden');
        categoriesView?.classList.add('active');
        
        if (window.switchView) window.switchView('categoriesView', true);
        
        // Focus search input with delay for animation
        setTimeout(() => searchInput?.focus(), 300);
        window.scrollTo(0, 0);
    }

    // ============================================
    // CATEGORY LOADING WITH SKELETONS
    // ============================================
    
    async function loadCategories() {
        if (!categoriesGrid) return;
        
        // Show skeleton
        categoriesGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'category-card skeleton';
            skeleton.innerHTML = `
                <div class="category-thumb skeleton" style="aspect-ratio:16/9"></div>
                <div class="category-info" style="padding:1rem">
                    <div class="skeleton" style="height:16px;width:70%;margin-bottom:8px"></div>
                    <div class="skeleton" style="height:12px;width:40%"></div>
                </div>
            `;
            categoriesGrid.appendChild(skeleton);
        }

        try {
            const res = await fetchWithTimeout(
                'https://cumbear-backend.vercel.app/api/categories',
                {}, 5000
            );
            const data = await res.json();
            
            if (data.success && data.data) {
                renderCategories(data.data.sort((a, b) => b.count - a.count).slice(0, 20));
            }
        } catch (err) {
            categoriesGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
                    <p>Failed to load categories</p>
                    <button onclick="window.loadCategories()" style="margin-top:1rem;padding:0.5rem 1.5rem;background:var(--accent-burgundy);border:none;color:white;border-radius:8px;cursor:pointer">Retry</button>
                </div>
            `;
        }
    }

    function renderCategories(categories) {
        categoriesGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        categories.forEach((cat, index) => {
            const card = document.createElement('div');
            card.className = 'category-card hover-lift';
            card.setAttribute('data-category', cat._id);
            card.setAttribute('role', 'listitem');
            
            card.innerHTML = `
                <div class="category-thumb">
                    <img src="/categories/${(index % 20) + 1}.jpg" alt="${escapeHtml(cat._id)}" loading="lazy" decoding="async" onerror="this.style.opacity='0'">
                </div>
                <div class="category-info">
                    <div class="category-name">${escapeHtml(cat._id)}</div>
                    <div class="category-count">${formatViews(cat.count)} videos</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                if (navigator.vibrate) navigator.vibrate(15);
                performSearch(cat._id, true);
            });
            
            fragment.appendChild(card);
        });

        categoriesGrid.appendChild(fragment);
    }

    // ============================================
    // SEARCH WITH LOADING STATES
    // ============================================
    
    async function performSearch(term, isCategory = false, silent = false) {
        if (isSearching) return;
        isSearching = true;

        if (!silent) {
            categoriesHub?.classList.add('hidden');
            searchResultsHeader?.classList.remove('hidden');
            currentSearchTerm && (currentSearchTerm.textContent = isCategory ? 
                `Category: ${term}` : `Results for: "${term}"`);
            
            if (window.switchView) window.switchView('homeView', true);
        }

        // Show skeleton in grid
        if (videoGrid) {
            videoGrid.innerHTML = '';
            for (let i = 0; i < 8; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'video-card skeleton';
                skeleton.innerHTML = `
                    <div class="video-thumb skeleton" style="aspect-ratio:16/9"></div>
                    <div class="video-info" style="padding:0 4px">
                        <div class="skeleton" style="height:18px;width:90%;margin-bottom:8px"></div>
                        <div class="skeleton" style="height:14px;width:50%;margin-bottom:6px"></div>
                        <div class="skeleton" style="height:14px;width:60%"></div>
                    </div>
                `;
                videoGrid.appendChild(skeleton);
            }
        }

        try {
            const queryParam = isCategory ? 
                `category=${encodeURIComponent(term)}` : 
                `search=${encodeURIComponent(term)}`;
            
            const res = await fetchWithTimeout(
                `https://cumbear-backend.vercel.app/api/videos?${queryParam}&limit=24`,
                {}, 8000
            );
            const data = await res.json();

            if (data.success && data.data && videoGrid) {
                renderSearchResults(data.data);
            } else if (videoGrid) {
                videoGrid.innerHTML = `
                    <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--text-muted)">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem;opacity:0.5">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <p>No videos found</p>
                    </div>
                `;
            }
        } catch (err) {
            if (videoGrid) {
                videoGrid.innerHTML = `
                    <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
                        <p>Search failed</p>
                        <button onclick="window.performSearch('${escapeHtml(term).replace(/'/g, "\\'")}', ${isCategory})" style="margin-top:1rem;padding:0.5rem 1.5rem;background:var(--accent-burgundy);border:none;color:white;border-radius:8px;cursor:pointer">Retry</button>
                    </div>
                `;
            }
        } finally {
            isSearching = false;
        }
    }

    function renderSearchResults(videos) {
        videoGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        videos.forEach((video, index) => {
            if (index > 0 && index % 5 === 0 && window.renderAd) {
                const adDiv = document.createElement('div');
                adDiv.innerHTML = window.renderAd('infeed');
                fragment.appendChild(adDiv.firstElementChild);
            }

            const cleanDuration = video.duration?.replace('HD ', '') || '00:00';
            const randomPercent = Math.floor(Math.random() * 51) + 50;
            const randomViews = Math.floor(Math.random() * 90000) + 10000;

            const card = document.createElement('div');
            card.className = 'video-card hover-lift';
            card.setAttribute('role', 'listitem');
            card.addEventListener('contextmenu', e => e.preventDefault());

            card.innerHTML = `
                <div class="video-thumb">
                    <img src="${video.thumbnailUrl}" loading="lazy" alt="" decoding="async">
                    <video muted playsinline preload="none" data-src="${video.playableUrl}"></video>
                    <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
                    <div class="preview-loading"><div class="preview-spinner"></div></div>
                    <span class="duration-badge">${escapeHtml(cleanDuration)}</span>
                </div>
                <div class="video-info">
                    <div class="video-title">${escapeHtml(video.title)}</div>
                    <div class="video-provider">
                        <svg class="meta-icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                        <span>CumBear</span>
                    </div>
                    <div class="video-stats">
                        <div class="stat-item">
                            <svg class="meta-icon" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span>${randomPercent}%</span>
                        </div>
                        <div class="stat-item">
                            <svg class="meta-icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span>${formatViews(randomViews)} views</span>
                        </div>
                    </div>
                </div>
            `;

            card.querySelector('video').dataset.src = video.playableUrl;
            setupSearchGestures(card, video);
            fragment.appendChild(card);
        });

        videoGrid.appendChild(fragment);
    }

    // ============================================
    // GESTURE ENGINE (Shared with home.js)
    // ============================================
    
    function setupSearchGestures(card, videoData) {
        const thumb = card.querySelector('.video-thumb');
        const title = card.querySelector('.video-title');
        const vid = card.querySelector('video');
        const timeline = thumb.querySelector('.preview-timeline');
        const loading = thumb.querySelector('.preview-loading');

        let gestureState = {
            startTime: 0,
            startX: 0,
            startY: 0,
            lastTapTime: 0,
            longPressTimer: null
        };

        thumb.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            
            gestureState.startTime = performance.now();
            gestureState.startX = e.clientX;
            gestureState.startY = e.clientY;
            
            thumb.setPointerCapture(e.pointerId);
            
            gestureState.longPressTimer = setTimeout(() => {
                startSearchPreview(card, vid, thumb, title, timeline, loading, videoData);
            }, 450);
        });

        thumb.addEventListener('pointermove', (e) => {
            const dx = Math.abs(e.clientX - gestureState.startX);
            const dy = Math.abs(e.clientY - gestureState.startY);
            if (dx > 10 || dy > 10) {
                clearTimeout(gestureState.longPressTimer);
            }
        });

        thumb.addEventListener('pointerup', (e) => {
            clearTimeout(gestureState.longPressTimer);
            const duration = performance.now() - gestureState.startTime;
            const isPreviewing = card.dataset.previewing === 'true';

            if (duration < 250) {
                const now = performance.now();
                if (now - gestureState.lastTapTime < 300 && isPreviewing) {
                    stopSearchPreview(card);
                } else {
                    setTimeout(() => {
                        if (performance.now() - gestureState.lastTapTime >= 280) {
                            openPlayer(videoData);
                        }
                    }, 280);
                }
                gestureState.lastTapTime = now;
            } else if (duration >= 450 && isPreviewing) {
                stopSearchPreview(card);
            }
        });

        thumb.addEventListener('pointercancel', () => {
            clearTimeout(gestureState.longPressTimer);
            stopSearchPreview(card);
        });

        thumb.style.touchAction = 'none';
    }

    function startSearchPreview(card, vid, thumb, title, timeline, loading, videoData) {
        document.querySelectorAll('.video-card[data-previewing="true"]').forEach(c => {
            if (c !== card) stopSearchPreview(c);
        });

        title.classList.add('previewing-text');
        card.classList.add('preview-active');
        card.dataset.previewing = 'true';
        timeline.classList.add('active');
        loading.classList.add('active');

        const src = vid.dataset.src || videoData.playableUrl;
        if (!src) { stopSearchPreview(card); return; }

        vid.muted = true;
        vid.playsInline = true;
        vid.playbackRate = 1.5;
        vid.src = src;
        vid.load();

        vid.oncanplay = () => {
            thumb.classList.add('video-ready');
            loading.classList.remove('active');
            vid.play().catch(() => stopSearchPreview(card));
        };

        setTimeout(() => {
            if (card.dataset.previewing === 'true') stopSearchPreview(card);
        }, 30000);
    }

    function stopSearchPreview(card) {
        if (!card) return;
        const v = card.querySelector('video');
        const t = card.querySelector('.video-thumb');
        const ttl = card.querySelector('.video-title');
        const tl = t?.querySelector('.preview-timeline');
        const ld = t?.querySelector('.preview-loading');

        if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
        t?.classList.remove('video-ready', 'previewing');
        tl?.classList.remove('active');
        ld?.classList.remove('active');
        ttl?.classList.remove('previewing-text');
        card.classList.remove('preview-active');
        delete card.dataset.previewing;
    }

    function openPlayer(videoData) {
        stopSearchPreview(document.querySelector('.video-card[data-previewing="true"]'));
        if (window.loadPlayerVideo) window.loadPlayerVideo(videoData);
        if (window.switchView) window.switchView('playerView', true);
    }

    // Exports
    window.performSearch = performSearch;
    window.showCategoriesView = showCategoriesView;
    window.loadCategories = loadCategories;
    
    // Initialize
    loadCategories();
});

// Utilities
function formatViews(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

