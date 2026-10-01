
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Shorts.js Loaded (Fast Playback & Like Logic)');

    const shortsContainer = document.getElementById('shortsContainer');
    let activeObserver = null;
    let isGlobalMuted = true;

    async function loadShorts() {
        shortsContainer.innerHTML = '<div class="short-loading" style="z-index:50"><div class="short-spinner"></div></div>';
        try {
            // Fetch from playable collection
            const res = await fetch('https://cumbear-backend.vercel.app/api/videos?limit=30&source=archive');
            const data = await res.json();
            if (data.success && data.data) {
                const videos = data.data.sort(() => Math.random() - 0.5).slice(0, 20);
                renderShorts(videos);
            }
        } catch (err) {
            shortsContainer.innerHTML = '<div style="color:white; text-align:center; padding:2rem;">Failed to load shorts.</div>';
        }
    }

    function renderShorts(videos) {
        shortsContainer.innerHTML = '';
        
        const backBtn = document.createElement('button');
        backBtn.className = 'shorts-back-btn';
        backBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';
        backBtn.onclick = () => { if (window.switchView) window.switchView('homeView', true); };
        shortsContainer.appendChild(backBtn);

        videos.forEach((video) => {
            const randomLikes = Math.floor(Math.random() * 99000) + 1000;
            const randomViews = Math.floor(Math.random() * 490000) + 10000;

            const item = document.createElement('div');
            item.className = 'short-item';
            item.addEventListener('contextmenu', e => e.preventDefault()); // Block Chrome Menu
            
            item.innerHTML = `
                <img class="short-thumbnail" src="${video.thumbnailUrl}" alt="thumb">
                <div class="short-loading"><div class="short-spinner"></div></div>
                <!-- Changed preload to auto for faster loading -->
                <video class="short-video" src="${video.playableUrl}" loop playsinline preload="auto" muted></video>
                
                <div class="top-2x-badge hidden">2x Speed</div>
                
                <div class="center-play-icon" id="playIcon">
                    <svg viewBox="0 0 24 24" width="60" height="60" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div class="center-play-icon hidden" id="pauseIcon">
                    <svg viewBox="0 0 24 24" width="60" height="60" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </div>

                <div class="end-overlay hidden">
                    <h3>Preview Ended</h3>
                    <button class="watch-full-btn-end">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Watch Full Video
                    </button>
                </div>

                <button class="mute-btn" aria-label="Toggle Sound">
                    <svg class="icon-muted" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                    <svg class="icon-unmuted hidden" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                </button>

                <div class="short-info">
                    <div class="short-channel">CumBear</div>
                    <div class="short-title">${video.title}</div>
                    <button class="watch-full-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Watch full video
                    </button>
                </div>

                <div class="short-actions">
                    <div class="action-btn-wrapper like-wrapper">
                        <div class="action-icon"><svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></div>
                        <span class="action-label like-label">${formatShortNum(randomLikes)}</span>
                    </div>
                    <div class="action-btn-wrapper"><div class="action-icon"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div><span class="action-label">${formatShortNum(randomViews)}</span></div>
                    <div class="action-btn-wrapper" onclick="shareShort('${video.title.replace(/'/g, "\\'")}')"><div class="action-icon"><svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></div><span class="action-label">Share</span></div>
                    <div class="action-btn-wrapper" onclick="window.location.href='/support'"><div class="action-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div><span class="action-label">Report</span></div>
                </div>
                <div class="short-timeline"><div class="short-timeline-fill"></div></div>
            `;

            const vid = item.querySelector('.short-video');
            const thumb = item.querySelector('.short-thumbnail');
            const loader = item.querySelector('.short-loading');
            const timelineFill = item.querySelector('.short-timeline-fill');
            const endOverlay = item.querySelector('.end-overlay');
            const playIcon = item.querySelector('#playIcon');
            const pauseIcon = item.querySelector('#pauseIcon');
            const topBadge = item.querySelector('.top-2x-badge');

            // 1. Loading Logic & Speed Up Playback
            const speedUpVideo = () => {
                thumb.classList.add('loaded');
                loader.classList.add('hidden');
                vid.playbackRate = 1.25; // 25% faster to fix "slow" feeling
            };
            vid.addEventListener('loadeddata', speedUpVideo);
            vid.addEventListener('canplay', speedUpVideo);

            // 2. 150s Limit & Timeline
            vid.addEventListener('timeupdate', () => {
                if (vid.currentTime >= 150) { vid.pause(); endOverlay.classList.remove('hidden'); }
                const progress = (vid.currentTime / 150) * 100;
                timelineFill.style.width = `${Math.min(100, progress)}%`;
            });

            // 3. Watch Full Video Buttons (Start at 0 seconds)
            const openFullVideo = (e) => { 
                if(e) e.stopPropagation(); 
                if (window.loadPlayerVideo) window.loadPlayerVideo(video, 0); // CHANGED: 0 instead of 150
                if (window.switchView) window.switchView('playerView', true); 
            };
            item.querySelector('.watch-full-btn').addEventListener('click', openFullVideo);
            item.querySelector('.watch-full-btn-end').addEventListener('click', openFullVideo);

            // 4. Like Button Logic
            const likeWrapper = item.querySelector('.like-wrapper');
            const likeIcon = likeWrapper.querySelector('.action-icon');
            let isLiked = false;

            const toggleLike = () => {
                isLiked = !isLiked;
                if (isLiked) {
                    likeIcon.classList.add('liked');
                } else {
                    likeIcon.classList.remove('liked');
                }
            };

            // Click like button directly
            likeWrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleLike();
            });

            // 5. Single Tap (Play/Pause) & Double Tap (Like Animation + Auto Like)
            let lastTapTime = 0;
            item.addEventListener('click', (e) => {
                if (e.target.closest('.action-btn-wrapper') || e.target.closest('.mute-btn') || e.target.closest('.watch-full-btn') || e.target.closest('.watch-full-btn-end')) return;
                
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;

                if (tapLength < 300 && tapLength > 0) {
                    // DOUBLE TAP -> Like Animation & Auto Like
                    triggerLikeAnimation(item);
                    if (!isLiked) toggleLike();
                } else {
                    // SINGLE TAP -> Play/Pause
                    if (vid.paused) {
                        vid.play();
                        playIcon.classList.add('show');
                        pauseIcon.classList.remove('show');
                        setTimeout(() => playIcon.classList.remove('show'), 600);
                    } else {
                        vid.pause();
                        pauseIcon.classList.add('show');
                        playIcon.classList.remove('show');
                        setTimeout(() => pauseIcon.classList.remove('show'), 600);
                    }
                }
                lastTapTime = currentTime;
            });

            // 6. Hold RIGHT CORNER for 2x Speed
            const start2x = (e) => {
                if (e.target.closest('.action-btn-wrapper') || e.target.closest('.mute-btn') || e.target.closest('.watch-full-btn') || e.target.closest('.watch-full-btn-end')) return;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                if (clientX > window.innerWidth * 0.7) {
                    vid.playbackRate = 2.0;
                    topBadge.classList.remove('hidden');
                }
            };
            const end2x = () => { vid.playbackRate = 1.25; topBadge.classList.add('hidden'); }; // Returns to 1.25x
            item.addEventListener('touchstart', start2x, { passive: true });
            item.addEventListener('touchend', end2x);
            item.addEventListener('touchcancel', end2x);
            item.addEventListener('mousedown', start2x);
            item.addEventListener('mouseup', end2x);
            item.addEventListener('mouseleave', end2x);

            // 7. Mute Button
            const muteBtn = item.querySelector('.mute-btn');
            const iconMuted = muteBtn.querySelector('.icon-muted');
            const iconUnmuted = muteBtn.querySelector('.icon-unmuted');
            const updateMuteUI = (muted) => {
                if (muted) { iconMuted.classList.remove('hidden'); iconUnmuted.classList.add('hidden'); } 
                else { iconMuted.classList.add('hidden'); iconUnmuted.classList.remove('hidden'); }
            };
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                isGlobalMuted = !isGlobalMuted;
                document.querySelectorAll('.short-video').forEach(v => { v.muted = isGlobalMuted; updateMuteUI(isGlobalMuted); });
            });

            shortsContainer.appendChild(item);
        });

        setupIntersectionObserver();
    }

    // Helper: Trigger Like Animation
    function triggerLikeAnimation(item) {
        const heart = document.createElement('div');
        heart.className = 'like-heart';
        heart.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        item.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
    }

    function setupIntersectionObserver() {
        if (activeObserver) activeObserver.disconnect();
        activeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const vid = entry.target.querySelector('.short-video');
                const endOverlay = entry.target.querySelector('.end-overlay');
                if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                    vid.currentTime = 0;
                    endOverlay.classList.add('hidden');
                    vid.play().catch(() => {});
                } else { vid.pause(); }
            });
        }, { threshold: 0.6 });
        document.querySelectorAll('.short-item').forEach(item => activeObserver.observe(item));
    }

    function formatShortNum(num) { return num >= 1000000 ? (num / 1000000).toFixed(1) + 'M' : num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num; }
    window.shareShort = function(title) { if (navigator.share) navigator.share({ title: 'CumBear Short', text: title, url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); } };
    window.loadShorts = loadShorts;
});
