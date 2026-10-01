
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Search.js Loaded (Unified Gesture System)');

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

    if (searchBtn) searchBtn.addEventListener('click', (e) => { e.preventDefault(); showCategoriesView(); });
    if (searchForm) searchForm.addEventListener('submit', (e) => { e.preventDefault(); if (searchInput.value.trim()) performSearch(searchInput.value.trim()); });
    if (backToCategoriesBtn) backToCategoriesBtn.addEventListener('click', () => { searchInput.value = ''; showCategoriesView(); });

    function showCategoriesView() {
        if (searchResultsHeader) searchResultsHeader.classList.add('hidden');
        if (categoriesHub) categoriesHub.classList.remove('hidden');
        if (homeView) { homeView.classList.add('hidden'); homeView.classList.remove('active'); }
        if (categoriesView) { categoriesView.classList.remove('hidden'); categoriesView.classList.add('active'); }
        if (window.switchView) window.switchView('categoriesView', true);
        window.scrollTo(0, 0);
    }

    async function loadCategories() {
        if (!categoriesGrid) return;
        try {
            const res = await fetch('https://cumbear-backend.vercel.app/api/categories');
            const data = await res.json();
            if (data.success && data.data) renderCategories(data.data.sort((a, b) => b.count - a.count).slice(0, 20));
        } catch (err) { categoriesGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:2rem;">Failed to load.</p>'; }
    }

    function renderCategories(categories) {
        categoriesGrid.innerHTML = categories.map((cat, index) => `
            <div class="category-card" data-category="${cat._id}">
                <div class="category-thumb"><img src="/categories/${index + 1}.jpg" alt="${cat._id}" loading="lazy" onerror="this.style.opacity='0'"></div>
                <div class="category-info"><div class="category-name">${cat._id}</div><div class="category-count">${formatViews(cat.count)} videos</div></div>
            </div>
        `).join('');
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => performSearch(card.getAttribute('data-category'), true));
        });
    }

    async function performSearch(term, isCategory = false) {
        if (categoriesHub) categoriesHub.classList.add('hidden');
        if (searchResultsHeader) searchResultsHeader.classList.remove('hidden');
        if (currentSearchTerm) currentSearchTerm.textContent = isCategory ? `Category: ${term}` : `Results for: "${term}"`;
        if (window.switchView) window.switchView('homeView', true);
        if (videoGrid) videoGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem;">Loading...</div>';

        try {
            const queryParam = isCategory ? `category=${encodeURIComponent(term)}` : `search=${encodeURIComponent(term)}`;
            const res = await fetch(`https://cumbear-backend.vercel.app/api/videos?${queryParam}&limit=50`);
            const data = await res.json();
            if (data.success && data.data && videoGrid) renderSearchResults(data.data);
            else if (videoGrid) videoGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem;">No videos found.</div>';
        } catch (err) { if (videoGrid) videoGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem;">Error.</div>'; }
    }

    function renderSearchResults(videos) {
        videoGrid.innerHTML = '';
        videos.forEach((video, index) => {
            if (index > 0 && index % 5 === 0 && window.renderAd) videoGrid.insertAdjacentHTML('beforeend', window.renderAd('infeed'));
            const cleanDuration = video.duration.replace('HD ', '');
            const randomPercent = Math.floor(Math.random() * 51) + 50;
            const randomViews = Math.floor(Math.random() * 90000) + 10000;

            const card = document.createElement('div');
            card.className = 'video-card';
            card.addEventListener('contextmenu', e => e.preventDefault());
            card.innerHTML = `
                <div class="video-thumb">
                    <img src="${video.thumbnailUrl}" loading="lazy">
                    <video muted playsinline preload="metadata"></video>
                    <div class="preview-timeline"><div class="preview-timeline-fill"></div></div>
                    <div class="preview-loading"><div class="preview-spinner"></div></div>
                    <span class="duration-badge">${cleanDuration}</span>
                </div>
                <div class="video-info">
                    <div class="video-title">${video.title}</div>
                    <div class="video-provider"><svg class="meta-icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg><span>CumBear</span></div>
                    <div class="video-stats">
                        <div class="stat-item"><svg class="meta-icon" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg><span>${randomPercent}%</span></div>
                        <div class="stat-item"><svg class="meta-icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg><span>${formatViews(randomViews)} views</span></div>
                    </div>
                </div>
            `;
            card.querySelector('video').dataset.src = video.playableUrl;
            setupUnifiedGestures(card, video);
            videoGrid.appendChild(card);
        });
    }

    // --- UNIFIED GESTURE ENGINE ---
    function setupUnifiedGestures(card, video) {
        const thumb = card.querySelector('.video-thumb');
        const title = card.querySelector('.video-title');
        const vid = card.querySelector('video');
        const timeline = thumb.querySelector('.preview-timeline');
        const loading = thumb.querySelector('.preview-loading');

        let startTime = 0, startX = 0, startY = 0, lastTapTime = 0;

        const stopPreview = (c) => {
            if (!c) return;
            const v = c.querySelector('video'); const t = c.querySelector('.video-thumb');
            const ttl = c.querySelector('.video-title'); const tl = t ? t.querySelector('.preview-timeline') : null;
            const ld = t ? t.querySelector('.preview-loading') : null;
            if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
            if (t) t.classList.remove('video-ready', 'fade-out', 'slide-out');
            if (tl) tl.classList.remove('active'); if (ld) ld.classList.remove('active');
            if (ttl) ttl.classList.remove('previewing-text');
            c.classList.remove('preview-active'); delete c.dataset.previewing;
        };

        const stopAllSearchPreviews = () => { document.querySelectorAll('.video-card[data-previewing="true"]').forEach(c => stopPreview(c)); };

        const startPreview = () => {
            stopAllSearchPreviews();
            title.classList.add('previewing-text'); card.classList.add('preview-active'); card.dataset.previewing = 'true';
            timeline.classList.add('active'); loading.classList.add('active');
            const videoSrc = vid.dataset.src || video.playableUrl;
            if (!videoSrc) { stopPreview(card); return; }
            vid.muted = true; vid.playsInline = true; vid.playbackRate = 1.5; vid.src = videoSrc; vid.load();
            vid.oncanplay = () => { thumb.classList.add('video-ready'); loading.classList.remove('active'); vid.play().catch(err => { console.error('Play failed:', err); stopPreview(card); }); };
            vid.onerror = () => { loading.classList.remove('active'); stopPreview(card); };
            setTimeout(() => { if (card.dataset.previewing === 'true') stopPreview(card); }, 59000);
        };

        const openPlayer = () => {
            stopPreview(card);
            if (window.loadPlayerVideo) window.loadPlayerVideo(video);
            if (window.switchView) window.switchView('playerView', true);
        };

        const handleDown = (e) => { startTime = Date.now(); startX = e.clientX; startY = e.clientY; };
        const handleMove = (e) => { if (!startTime) return; if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) startTime = 0; };
        const handleUp = () => {
            if (!startTime) return;
            const duration = Date.now() - startTime;
            const isPlaying = card.dataset.previewing === 'true';
            if (duration < 250) {
                const now = Date.now();
                if (now - lastTapTime < 300 && isPlaying) stopPreview(card);
                else openPlayer();
                lastTapTime = now;
            } else if (duration >= 500) {
                if (isPlaying) stopPreview(card); else startPreview();
            }
            startTime = 0;
        };

        thumb.addEventListener('pointerdown', handleDown);
        thumb.addEventListener('pointermove', handleMove);
        thumb.addEventListener('pointerup', handleUp);
        thumb.addEventListener('pointerleave', () => { startTime = 0; });
        thumb.addEventListener('pointercancel', () => { startTime = 0; });
    }

    function openPlayerPage(video) { if (window.loadPlayerVideo) window.loadPlayerVideo(video); if (window.switchView) window.switchView('playerView', true); }
    function formatViews(num) { if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'; if (num >= 1000) return (num / 1000).toFixed(1) + 'k'; return num; }

    window.performSearch = performSearch; window.showCategoriesView = showCategoriesView;
    loadCategories();
});
