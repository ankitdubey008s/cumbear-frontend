/**
 * CUMBEAR HOME ENGINE v2.0
 * Virtual scrolling, intersection observer, gesture engine
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 Home Engine v2.0 Loaded');

    const videoGrid = document.getElementById('videoGrid');
    const paginationContainer = document.getElementById('paginationContainer');
    const bottomCatsContainer = document.getElementById('bottomCatsContainer');
    const horizontalCatsContainer = document.getElementById('horizontalCats');
    const filterMenu = document.getElementById('filterMenu');
    const filterBtn = document.getElementById('filterBtn');
    
    let currentPage = 1;
    let currentSort = '';
    let currentCategory = '';
    let isLoading = false;
    let videoObserver = null;
    let previewTimeouts = new Map();

    // ============================================
    // VIRTUAL LIST WITH INTERSECTION OBSERVER
    // ============================================
    
    function createVideoObserver() {
        if (videoObserver) videoObserver.disconnect();
        
        videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const card = entry.target;
                const video = card.querySelector('video');
                if (!video) return;
                
                if (entry.isIntersecting) {
                    // Preload video metadata when near viewport
                    const src = video.dataset.src;
                    if (src && !video.src) {
                        video.preload = 'metadata';
                        video.src = src;
                    }
                } else {
                    // Stop any playing previews when out of view
                    if (card.dataset.previewing === 'true') {
                        stopPreview(card);
                    }
                }
            });
        }, {
            root: null,
            rootMargin: '100px 0px', // Load 100px before visible
            threshold: 0
        });
    }

    // ============================================
    // FILTER SYSTEM
    // ============================================
    
    if (filterBtn) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = filterMenu.classList.toggle('show');
            filterBtn.setAttribute('aria-expanded', isExpanded);
        });
    }
    
    document.addEventListener('click', (e) => {
        if (filterMenu && !filterMenu.contains(e.target) && !filterBtn?.contains(e.target)) {
            filterMenu.classList.remove('show');
            filterBtn?.setAttribute('aria-expanded', 'false');
        }
    });
    
    if (filterMenu) {
        filterMenu.querySelectorAll('.filter-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                filterMenu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                currentSort = opt.getAttribute('data-sort');
                if (filterBtn) filterBtn.querySelector('span').textContent = opt.textContent;
                filterMenu.classList.remove('show');
                filterBtn?.setAttribute('aria-expanded', 'false');
                currentPage = 1;
                loadHomeVideos();
            });
        });
    }

    // ============================================
    // CATEGORY LOADING
    // ============================================
    
    async function loadHorizontalCategories() {
        if (!horizontalCatsContainer) return;
        
        // Show skeleton
        horizontalCatsContainer.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'h-cat-chip skeleton';
            skeleton.style.width = `${60 + Math.random() * 60}px`;
            horizontalCatsContainer.appendChild(skeleton);
        }

        try {
            const res = await fetchWithTimeout('https://cumbear-backend.vercel.app/api/categories', {}, 5000);
            const data = await res.json();
            
            horizontalCatsContainer.innerHTML = '';
            
            const allBtn = document.createElement('button');
            allBtn.className = 'h-cat-chip active';
            allBtn.textContent = 'All';
            allBtn.setAttribute('data-cat', 'all');
            allBtn.setAttribute('role', 'tab');
            allBtn.setAttribute('aria-selected', 'true');
            allBtn.addEventListener('click', () => selectCategory(''));
            horizontalCatsContainer.appendChild(allBtn);

            if (data.success && data.data) {
                data.data.sort((a, b) => b.count - a.count).slice(0, 20).forEach(cat => {
                    const btn = document.createElement('button');
                    btn.className = 'h-cat-chip';
                    btn.textContent = cat._id;
                    btn.setAttribute('data-cat', cat._id);
                    btn.setAttribute('role', 'tab');
                    btn.setAttribute('aria-selected', 'false');
                    btn.addEventListener('click', () => selectCategory(cat._id));
                    horizontalCatsContainer.appendChild(btn);
                });
            }
        } catch (err) {
            console.error('Categories error:', err);
            Toast.show('Failed to load categories');
        }
    }

    function selectCategory(catId) {
        document.querySelectorAll('.h-cat-chip').forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-selected', 'false');
        });
        
        const target = document.querySelector(`[data-cat="${catId || 'all'}"]`);
        if (target) {
            target.classList.add('active');
            target.setAttribute('aria-selected', 'true');
        }
        
        currentCategory = catId;
        currentPage = 1;
        loadHomeVideos();
    }

    // ============================================
    // VIDEO LOADING WITH SKELETONS
    // ============================================
    
    async function loadHomeVideos() {
        if (isLoading || !videoGrid) return;
        isLoading = true;

        // Show skeleton grid
        renderSkeletonGrid();
        
        try {
            const randomPage = currentPage === 1 ? Math.floor(Math.random() * 20) + 1 : currentPage;
            const shouldTryHamster = (currentPage === 1 && !currentCategory && currentSort !== 'views' && currentSort !== 'duration');
            
            let url = `https://cumbear-backend.vercel.app/api/videos?page=${randomPage}&limit=24`; // Reduced for performance
            
            if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;
            if (currentSort === 'views') url += `&sort=views`;
            if (shouldTryHamster) url += `&source=fresh`;

            const data = await fetchWithRetry(url, {
                fallback: () => fetchWithTimeout(
                    `https://cumbear-backend.vercel.app/api/videos?page=${randomPage}&limit=24&source=archive${currentCategory ? `&category=${encodeURIComponent(currentCategory)}` : ''}${currentSort === 'views' ? '&sort=views' : ''}`,
                    {}, 8000
                )
            });

            if (data.success && data.data) {
                let videos = data.data;
                
                // Shuffle for variety
                videos = shuffleArray(videos);
                
                if (currentSort === 'duration') {
                    videos = videos.sort((a, b) => parseDuration(b.duration) - parseDuration(a.duration));
                }
                
                renderVideoGrid(videos);
                renderPagination(data.pagination?.totalPages || 1);
                renderBottomCategories();
                renderSiteFooter();
                
                // Re-initialize observer for new elements
                createVideoObserver();
            }
        } catch (err) {
            console.error('Video load error:', err);
            videoGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--text-muted)">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem;opacity:0.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>Failed to load videos</p>
                    <button onclick="window.loadHomeVideos()" style="margin-top:1rem;padding:0.5rem 1.5rem;background:var(--accent-burgundy);border:none;color:white;border-radius:8px;cursor:pointer;font-weight:600">Retry</button>
                </div>
            `;
        } finally {
            isLoading = false;
        }
    }

    function renderSkeletonGrid() {
        videoGrid.innerHTML = '';
        for (let i = 0; i < 12; i++) {
            const card = document.createElement('div');
            card.className = 'video-card skeleton';
            card.innerHTML = `
                <div class="video-thumb skeleton"></div>
                <div class="video-info">
                    <div class="video-title skeleton"></div>
                    <div class="video-provider skeleton" style="width:40%"></div>
                    <div class="video-stats skeleton" style="width:60%"></div>
                </div>
            `;
            videoGrid.appendChild(card);
        }
    }

    // ============================================
    // VIDEO GRID RENDERING
    // ============================================
    
    function renderVideoGrid(videos) {
        videoGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        videos.forEach((video, index) => {
            // Insert ad every 5 videos
            if (index > 0 && index % 5 === 0 && window.renderAd) {
                const adWrapper = document.createElement('div');
                adWrapper.innerHTML = window.renderAd('infeed');
                fragment.appendChild(adWrapper.firstElementChild);
            }

            const cleanDuration = video.duration?.replace('HD ', '') || '00:00';
            const randomPercent = Math.floor(Math.random() * 51) + 50;
            const randomViews = Math.floor(Math.random() * 90000) + 10000;

            const card = document.createElement('div');
            card.className = 'video-card hover-lift';
            card.setAttribute('role', 'listitem');
            card.setAttribute('data-video-id', video._id);
            
            // Prevent context menu
            card.addEventListener('contextmenu', e => e.preventDefault());

            card.innerHTML = `
                <div class="video-thumb">
                    <img src="${video.thumbnailUrl}" loading="lazy" alt="${escapeHtml(video.title)}" decoding="async">
                    <video muted playsinline preload="none" data-src="${video.playableUrl}"></video>
                    <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
                    <div class="preview-loading"><div class="preview-spinner"></div></div>
                    <span class="duration-badge">${escapeHtml(cleanDuration)}</span>
                </div>
                <div class="video-info">
                    <div class="video-title">${escapeHtml(video.title)}</div>
                    <div class="video-provider">
                        <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                        <span>CumBear</span>
                    </div>
                    <div class="video-stats">
                        <div class="stat-item">
                            <svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span>${randomPercent}%</span>
                        </div>
                        <div class="stat-item">
                            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span>${formatViews(randomViews)} views</span>
                        </div>
                    </div>
                </div>
            `;

            const vid = card.querySelector('video');
            setupPremiumGestures(card, video, vid);
            
            // Observe for lazy loading
            if (videoObserver) videoObserver.observe(card);
            
            fragment.appendChild(card);
        });

        videoGrid.appendChild(fragment);
    }

    // ============================================
    // PREMIUM GESTURE ENGINE (xHamster-level)
    // ============================================
    
    function setupPremiumGestures(card, videoData, vidElement) {
        const thumb = card.querySelector('.video-thumb');
        const title = card.querySelector('.video-title');
        const timeline = thumb.querySelector('.preview-timeline');
        const loading = thumb.querySelector('.preview-loading');

        let gestureState = {
            startTime: 0,
            startX: 0,
            startY: 0,
            lastTapTime: 0,
            isPreviewing: false,
            pointerId: null,
            longPressTimer: null
        };

        // Unified pointer handler
        const handlePointerDown = (e) => {
            // Only handle primary pointer
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            
            gestureState.pointerId = e.pointerId;
            gestureState.startTime = performance.now();
            gestureState.startX = e.clientX;
            gestureState.startY = e.clientY;
            
            thumb.setPointerCapture(e.pointerId);
            
            // Start long press detection
            gestureState.longPressTimer = setTimeout(() => {
                if (!gestureState.isPreviewing) {
                    startPreview(card, vidElement, thumb, title, timeline, loading, videoData);
                }
            }, 450);
        };

        const handlePointerMove = (e) => {
            if (gestureState.pointerId !== e.pointerId) return;
            
            const dx = Math.abs(e.clientX - gestureState.startX);
            const dy = Math.abs(e.clientY - gestureState.startY);
            
            // Cancel if scrolling
            if (dx > 10 || dy > 10) {
                clearTimeout(gestureState.longPressTimer);
                gestureState.longPressTimer = null;
            }
        };

        const handlePointerUp = (e) => {
            if (gestureState.pointerId !== e.pointerId) return;
            
            clearTimeout(gestureState.longPressTimer);
            const duration = performance.now() - gestureState.startTime;
            const isPreviewing = card.dataset.previewing === 'true';
            
            if (duration < 250) {
                // Quick tap - handle single/double tap
                const now = performance.now();
                const tapGap = now - gestureState.lastTapTime;
                
                if (tapGap < 300 && tapGap > 0 && isPreviewing) {
                    // Double tap while previewing: stop preview
                    e.preventDefault();
                    stopPreview(card);
                } else {
                    // Single tap: open player (with delay to catch double tap)
                    setTimeout(() => {
                        if (performance.now() - gestureState.lastTapTime >= 300) {
                            openPlayer(videoData);
                        }
                    }, 280);
                }
                gestureState.lastTapTime = now;
            } else if (duration >= 450 && isPreviewing) {
                // Long press release: stop preview
                stopPreview(card);
            }
            
            gestureState.pointerId = null;
        };

        const handlePointerCancel = () => {
            clearTimeout(gestureState.longPressTimer);
            if (card.dataset.previewing === 'true') {
                stopPreview(card);
            }
            gestureState.pointerId = null;
        };

        // Use pointer events for unified touch/mouse
        thumb.addEventListener('pointerdown', handlePointerDown);
        thumb.addEventListener('pointermove', handlePointerMove);
        thumb.addEventListener('pointerup', handlePointerUp);
        thumb.addEventListener('pointercancel', handlePointerCancel);
        thumb.addEventListener('pointerleave', handlePointerCancel);

        // Prevent default touch behaviors
        thumb.style.touchAction = 'none';
    }

    function startPreview(card, vid, thumb, title, timeline, loading, videoData) {
        // Stop all other previews
        document.querySelectorAll('.video-card[data-previewing="true"]').forEach(c => {
            if (c !== card) stopPreview(c);
        });

        title.classList.add('previewing-text');
        card.classList.add('preview-active');
        card.dataset.previewing = 'true';
        timeline.classList.add('active');
        loading.classList.add('active');

        const videoSrc = vid.dataset.src || videoData.playableUrl;
        if (!videoSrc) {
            stopPreview(card);
            return;
        }

        vid.muted = true;
        vid.playsInline = true;
        vid.playbackRate = 1.5;
        vid.src = videoSrc;
        vid.load();

        vid.oncanplay = () => {
            thumb.classList.add('video-ready');
            loading.classList.remove('active');
            vid.play().catch(err => {
                console.warn('Preview play failed:', err);
                stopPreview(card);
            });
        };

        vid.onerror = () => {
            loading.classList.remove('active');
            stopPreview(card);
        };

        // Auto-stop after 30 seconds
        const timeoutId = setTimeout(() => {
            if (card.dataset.previewing === 'true') stopPreview(card);
        }, 30000);
        
        previewTimeouts.set(card, timeoutId);
    }

    function stopPreview(card) {
        if (!card) return;
        
        const timeoutId = previewTimeouts.get(card);
        if (timeoutId) {
            clearTimeout(timeoutId);
            previewTimeouts.delete(card);
        }

        const v = card.querySelector('video');
        const t = card.querySelector('.video-thumb');
        const ttl = card.querySelector('.video-title');
        const tl = t?.querySelector('.preview-timeline');
        const ld = t?.querySelector('.preview-loading');

        if (v) {
            v.pause();
            v.removeAttribute('src');
            v.load(); // Clear buffer
        }
        
        t?.classList.remove('video-ready', 'fade-out', 'slide-out', 'previewing');
        tl?.classList.remove('active');
        ld?.classList.remove('active');
        ttl?.classList.remove('previewing-text');
        card.classList.remove('preview-active');
        delete card.dataset.previewing;
    }

    function openPlayer(videoData) {
        if (window.loadPlayerVideo) {
            window.loadPlayerVideo(videoData);
        }
        if (window.switchView) {
            window.switchView('playerView', true);
        }
    }

    // ============================================
    // PAGINATION
    // ============================================
    
    function renderPagination(totalPages) {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';
        
        const maxPages = Math.min(totalPages, 10);
        const fragment = document.createDocumentFragment();

        for (let i = 1; i <= maxPages; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.setAttribute('aria-label', `Page ${i}`);
            btn.setAttribute('aria-current', i === currentPage ? 'page' : 'false');
            
            btn.addEventListener('click', () => {
                if (i === currentPage) return;
                currentPage = i;
                loadHomeVideos();
                Perf.smoothScrollTo(0, 400);
            });
            
            fragment.appendChild(btn);
        }
        
        paginationContainer.appendChild(fragment);
    }

    // ============================================
    // BOTTOM CATEGORIES
    // ============================================
    
    async function renderBottomCategories() {
        if (!bottomCatsContainer) return;
        
        try {
            const res = await fetchWithTimeout('https://cumbear-backend.vercel.app/api/categories', {}, 5000);
            const data = await res.json();
            
            if (data.success && data.data) {
                const top20 = data.data.sort((a, b) => b.count - a.count).slice(0, 20);
                
                const fragment = document.createDocumentFragment();
                top20.forEach((cat, index) => {
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
                        if (window.performSearch) window.performSearch(cat._id, true);
                    });
                    
                    fragment.appendChild(card);
                });
                
                bottomCatsContainer.innerHTML = '';
                bottomCatsContainer.appendChild(fragment);
            }
        } catch (err) {
            console.error('Bottom cats error:', err);
        }
    }

    function renderSiteFooter() {
        const footer = document.getElementById('siteFooter');
        if (!footer) return;
        
        footer.innerHTML = `
            <div class="footer-links">
                <a href="/support">Support</a>
                <a href="/report">Report</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/advertise">Advertise</a>
                <a href="/webmasters">Webmasters</a>
                <a href="/help">Help</a>
            </div>
            <div class="copyright">
                <a href="https://cumbear.in">cumbear.in</a> - All rights reserved 2026®
            </div>
        `;
    }

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    
    window.resetHomeState = function() {
        currentSort = '';
        currentCategory = '';
        currentPage = 1;
        
        if (filterBtn) filterBtn.querySelector('span').textContent = 'Popular';
        document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
        document.querySelector('.filter-option[data-sort=""]')?.classList.add('active');
        document.querySelectorAll('.h-cat-chip').forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-selected', 'false');
        });
        document.querySelector('.h-cat-chip[data-cat="all"]')?.classList.add('active');
        document.querySelector('.h-cat-chip[data-cat="all"]')?.setAttribute('aria-selected', 'true');
    };

    window.loadHomeVideos = loadHomeVideos;

    // ============================================
    // INITIALIZE
    // ============================================
    
    createVideoObserver();
    loadHomeVideos();
    loadHorizontalCategories();
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatViews(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

function parseDuration(dur) {
    const clean = dur?.replace('HD ', '') || '0:00';
    const parts = clean.split(':').map(Number);
    return parts.reduce((acc, val, i) => acc + val * Math.pow(60, parts.length - 1 - i), 0);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Network utilities with retry and timeout
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

async function fetchWithRetry(url, { retries = 2, fallback } = {}) {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetchWithTimeout(url, {}, i === 0 ? 5000 : 8000);
            if (res.ok) return await res.json();
            throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            if (i === retries) {
                if (fallback) {
                    const fallbackRes = await fallback();
                    return await fallbackRes.json();
                }
                throw err;
            }
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // Exponential backoff
        }
    }
}

