// ============================================
// CUMBEAR ULTRA PREMIUM - Home Feed & Gestures
// Version: 2.0 Enhanced
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Home.js Loaded (Ultra Premium Engine)');

    const videoGrid = document.getElementById('videoGrid');
    const paginationContainer = document.getElementById('paginationContainer');
    const bottomCatsContainer = document.getElementById('bottomCatsContainer');
    const horizontalCatsContainer = document.getElementById('horizontalCats');
    const filterMenu = document.getElementById('filterMenu');
    const filterBtn = document.getElementById('filterBtn');
    
    let currentPage = 1;
    let currentSort = '';
    let currentCategory = '';

    // --- 1. Filter Menu Logic ---
    if (filterBtn) {
        filterBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            filterMenu.classList.toggle('show'); 
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', () => { 
        if (filterMenu) filterMenu.classList.remove('show'); 
    });
    
    if (filterMenu) {
        document.querySelectorAll('.filter-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                currentSort = opt.getAttribute('data-sort');
                if (filterBtn) filterBtn.querySelector('span').textContent = opt.textContent;
                filterMenu.classList.remove('show');
                currentPage = 1;
                loadHomeVideos();
            });
        });
    }

    // --- 2. Horizontal Category Chips ---
    async function loadHorizontalCategories() {
        if (!horizontalCatsContainer) return;
        horizontalCatsContainer.innerHTML = '';
        
        const allBtn = document.createElement('button');
        allBtn.className = 'h-cat-chip active';
        allBtn.textContent = 'All';
        allBtn.setAttribute('data-cat', 'all');
        allBtn.addEventListener('click', () => {
            document.querySelectorAll('.h-cat-chip').forEach(c => c.classList.remove('active'));
            allBtn.classList.add('active');
            currentCategory = ''; 
            currentPage = 1; 
            loadHomeVideos();
        });
        horizontalCatsContainer.appendChild(allBtn);
        
        try {
            const res = await fetch('https://cumbear-backend.vercel.app/api/categories');
            const data = await res.json();
            if (data.success && data.data) {
                data.data.sort((a, b) => b.count - a.count).slice(0, 20).forEach(cat => {
                    const btn = document.createElement('button');
                    btn.className = 'h-cat-chip';
                    btn.textContent = cat._id;
                    btn.setAttribute('data-cat', cat._id);
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.h-cat-chip').forEach(c => c.classList.remove('active'));
                        btn.classList.add('active');
                        currentCategory = cat._id; 
                        currentPage = 1; 
                        loadHomeVideos();
                    });
                    horizontalCatsContainer.appendChild(btn);
                });
            }
        } catch (err) { console.error('Cat error:', err); }
    }

    // --- 3. Main Video Fetching Engine ---
    async function loadHomeVideos() {
        if (!videoGrid) return;
        videoGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">Loading premium content...</div>';
        
        try {
            const randomPage = currentPage === 1 ? Math.floor(Math.random() * 20) + 1 : currentPage;
            const shouldTryHamster = (currentPage === 1 && !currentCategory && currentSort !== 'views' && currentSort !== 'duration');
            
            let url = `https://cumbear-backend.vercel.app/api/videos?page=${randomPage}&limit=50`;
            if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;
            if (currentSort === 'views') url += `&sort=views`;
            if (shouldTryHamster) url += `&source=fresh`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            let data;
            
            try {
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
                data = await res.json();
            } catch (fetchError) {
                clearTimeout(timeoutId);
                // Fallback to archive if fresh fails
                let fallbackUrl = `https://cumbear-backend.vercel.app/api/videos?page=${randomPage}&limit=50&source=archive`;
                if (currentCategory) fallbackUrl += `&category=${encodeURIComponent(currentCategory)}`;
                if (currentSort === 'views') fallbackUrl += `&sort=views`;
                const res = await fetch(fallbackUrl);
                data = await res.json();
            }
            
            if (data.success && data.data) {
                let videos = data.data.sort(() => Math.random() - 0.5);
                if (currentSort === 'duration') {
                    videos = videos.sort((a, b) => {
                        const parseDur = (d) => { const p = d.replace('HD ','').split(':'); return (parseInt(p[0])||0)*60 + (parseInt(p[1])||0); };
                        return parseDur(b.duration) - parseDur(a.duration);
                    });
                }
                renderVideoGrid(videos);
                renderPagination(data.pagination ? data.pagination.totalPages : 1);
                renderBottomCategories();
                renderSiteFooter();
            }
        } catch (err) { 
            videoGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:red;">Error loading videos. Please check your connection.</div>'; 
        }
    }

    // --- 4. Premium Video Grid Rendering ---
    function renderVideoGrid(videos) {
        videoGrid.innerHTML = '';
        videos.forEach((video, index) => {
            // Inject In-Feed Ad every 5 videos
            if (index > 0 && index % 5 === 0 && window.renderAd) {
                videoGrid.insertAdjacentHTML('beforeend', window.renderAd('infeed'));
            }
            
            const cleanDuration = video.duration.replace('HD ', '');
            const randomPercent = Math.floor(Math.random() * 51) + 50;
            const randomViews = Math.floor(Math.random() * 90000) + 10000;

            const card = document.createElement('div');
            card.className = 'video-card';
            card.addEventListener('contextmenu', e => e.preventDefault()); // Block Chrome Menu
            
            card.innerHTML = `
                <div class="video-thumb">
                    <img src="${video.thumbnailUrl}" loading="lazy" alt="${video.title}">
                    <video muted playsinline preload="metadata"></video>
                    <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
                    <div class="preview-loading"><div class="preview-spinner"></div></div>
                    <span class="duration-badge">${cleanDuration}</span>
                </div>
                <div class="video-info">
                    <div class="video-title">${video.title}</div>
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
            setupUnifiedGestures(card, video);
            videoGrid.appendChild(card);
        });
    }

    // --- 5. Unified Gesture Engine (The Core Interaction) ---
    function setupUnifiedGestures(card, video) {
        const thumb = card.querySelector('.video-thumb');
        const title = card.querySelector('.video-title');
        const vid = card.querySelector('video');
        const timeline = thumb.querySelector('.preview-timeline');
        const loading = thumb.querySelector('.preview-loading');

        let startTime = 0;
        let startX = 0, startY = 0;
        let lastTapTime = 0;

        const stopPreview = (c) => {
            if (!c) return;
            const v = c.querySelector('video');
            const t = c.querySelector('.video-thumb');
            const ttl = c.querySelector('.video-title');
            const tl = t ? t.querySelector('.preview-timeline') : null;
            const ld = t ? t.querySelector('.preview-loading') : null;
            
            if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
            if (t) t.classList.remove('video-ready', 'fade-out', 'slide-out');
            if (tl) tl.classList.remove('active');
            if (ld) ld.classList.remove('active');
            if (ttl) ttl.classList.remove('previewing-text');
            c.classList.remove('preview-active');
            delete c.dataset.previewing;
        };

        const stopAllPreviews = () => {
            document.querySelectorAll('.video-card[data-previewing="true"]').forEach(c => stopPreview(c));
        };

        const startPreview = () => {
            stopAllPreviews();
            title.classList.add('previewing-text');
            card.classList.add('preview-active');
            card.dataset.previewing = 'true';
            timeline.classList.add('active');
            loading.classList.add('active');
            
            const videoSrc = vid.dataset.src || video.playableUrl;
            if (!videoSrc) { stopPreview(card); return; }

            vid.muted = true;
            vid.playsInline = true;
            vid.playbackRate = 1.5; // 1.5x Speed for snappy preview
            vid.src = videoSrc;
            vid.load();
            
            vid.oncanplay = () => {
                thumb.classList.add('video-ready');
                loading.classList.remove('active');
                vid.play().catch(err => { console.error('Play failed:', err); stopPreview(card); });
            };
            vid.onerror = () => { loading.classList.remove('active'); stopPreview(card); };
            setTimeout(() => { if (card.dataset.previewing === 'true') stopPreview(card); }, 59000); // Auto-stop after 59s
        };

        const openPlayer = () => {
            stopPreview(card); // Always stop preview if playing
            if (window.loadPlayerVideo) window.loadPlayerVideo(video);
            const params = new URLSearchParams({ v: video._id, t: encodeURIComponent(video.title), thumb: encodeURIComponent(video.thumbnailUrl), dur: video.duration, src: encodeURIComponent(video.playableUrl), cat: video.category || 'all' });
            window.history.pushState({ view: 'playerView' }, '', `/?${params.toString()}`);
            if (window.switchView) window.switchView('playerView', false);
        };

        // 1. Pointer Down (Start tracking)
        const handleDown = (e) => {
            startTime = Date.now();
            startX = e.clientX;
            startY = e.clientY;
        };

        // 2. Pointer Move (Cancel if scrolling)
        const handleMove = (e) => {
            if (!startTime) return;
            if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
                startTime = 0; // It's a scroll, cancel interaction
            }
        };

        // 3. Pointer Up (Determine action)
        const handleUp = () => {
            if (!startTime) return;
            const duration = Date.now() - startTime;
            const isPlaying = card.dataset.previewing === 'true';

            if (duration < 250) {
                // --- QUICK TAP ---
                const now = Date.now();
                if (now - lastTapTime < 300 && isPlaying) {
                    // Double Tap while playing -> Stop preview only
                    stopPreview(card);
                } else {
                    // Single Tap -> ALWAYS Open Player
                    openPlayer();
                }
                lastTapTime = now;
            } else if (duration >= 500) {
                // --- LONG PRESS ---
                if (isPlaying) {
                    stopPreview(card); // Stop if already playing
                } else {
                    startPreview(); // Start if not playing
                }
            }
            startTime = 0;
        };

        // Attach Unified Pointer Events
        thumb.addEventListener('pointerdown', handleDown);
        thumb.addEventListener('pointermove', handleMove);
        thumb.addEventListener('pointerup', handleUp);
        thumb.addEventListener('pointerleave', () => { startTime = 0; });
        thumb.addEventListener('pointercancel', () => { startTime = 0; });
    }

    // --- 6. Pagination & Footer ---
    function renderPagination(totalPages) {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';
        const maxPages = Math.min(totalPages, 10);
        for (let i = 1; i <= maxPages; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => { 
                currentPage = i; 
                loadHomeVideos(); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
            });
            paginationContainer.appendChild(btn);
        }
    }

    async function renderBottomCategories() {
        if (!bottomCatsContainer) return;
        try {
            const res = await fetch('https://cumbear-backend.vercel.app/api/categories');
            const data = await res.json();
            if (data.success && data.data) {
                const top20 = data.data.sort((a, b) => b.count - a.count).slice(0, 20);
                bottomCatsContainer.innerHTML = top20.map((cat, index) => `
                    <div class="category-card" data-category="${cat._id}">
                        <div class="category-thumb"><img src="/categories/${(index % 20) + 1}.jpg" alt="${cat._id}" loading="lazy" onerror="this.style.opacity='0'"></div>
                        <div class="category-info"><div class="category-name">${cat._id}</div><div class="category-count">${formatViews(cat.count)} videos</div></div>
                    </div>
                `).join('');
                bottomCatsContainer.querySelectorAll('.category-card').forEach(card => {
                    card.addEventListener('click', () => { if (window.performSearch) window.performSearch(card.getAttribute('data-category'), true); });
                });
            }
        } catch (err) { console.error('Bottom cats error:', err); }
    }

    function renderSiteFooter() {
        const footer = document.getElementById('siteFooter');
        if (!footer) return;
        footer.innerHTML = `<div class="footer-links"><a href="https://support.cumbear.in" target="_blank">Support</a><a href="https://support.cumbear.in" target="_blank">Report</a><a href="https://support.cumbear.in" target="_blank">Privacy Policy</a><a href="https://support.cumbear.in" target="_blank">Advertise</a><a href="https://support.cumbear.in" target="_blank">Webmasters</a><a href="https://support.cumbear.in" target="_blank">Help</a></div><div class="copyright"><a href="https://cumbear.in">cumbear.in</a> - All rights reserved 2026®</div>`;
    }

    // --- 7. Global Reset Function (Called by Router) ---
    window.resetHomeState = function() {
        currentSort = ''; 
        currentCategory = ''; 
        currentPage = 1;
        if (filterBtn) filterBtn.querySelector('span').textContent = 'Popular';
        document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
        const defaultFilter = document.querySelector('.filter-option[data-sort=""]');
        if (defaultFilter) defaultFilter.classList.add('active');
        document.querySelectorAll('.h-cat-chip').forEach(c => c.classList.remove('active'));
        const defaultCat = document.querySelector('.h-cat-chip[data-cat="all"]');
        if (defaultCat) defaultCat.classList.add('active');
    };

    function formatViews(num) { 
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'; 
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k'; 
        return num; 
    }

    // Initialize
    loadHomeVideos();
    loadHorizontalCategories();
});
