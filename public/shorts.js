document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Shorts.js Loaded (More Menu + Download + Captions)');
    
    const shortsContainer = document.getElementById('shortsContainer');
    let activeObserver = null;
    let isGlobalMuted = true;
    let currentMoreMenuVideo = null;

    async function loadShorts() {
        // Play Vertical VAST Pre-roll before Shorts feed
        try {
            const response = await fetch("https://s.magsrv.com/v1/vast.php?idzone=6045638");
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const mediaFile = xmlDoc.querySelector("MediaFile");
            
            if (mediaFile && mediaFile.textContent) {
                const adUrl = mediaFile.textContent.trim();
                const overlay = document.createElement("div");
                overlay.className = "short-item";
                overlay.style.zIndex = "100";
                overlay.innerHTML = `<video class="short-video" src="${adUrl}" playsinline></video><div class="short-info" style="bottom:20px;"><button class="watch-full-btn" id="skipShortsAd">Skip Ad</button></div>`;
                shortsContainer.innerHTML = "";
                shortsContainer.appendChild(overlay);
                
                const adVid = overlay.querySelector("video");
                adVid.muted = false;
                adVid.play();
                
                await new Promise(resolve => {
                    adVid.onended = resolve;
                    overlay.querySelector("#skipShortsAd").onclick = () => { adVid.pause(); resolve(); };
                });
                
                overlay.remove();
            }
        } catch(e) { console.log("Shorts VAST skipped"); }

        shortsContainer.innerHTML = '<div class="short-loading" style="z-index:50"><div class="short-spinner"></div></div>';
        
        try {
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
            item.addEventListener('contextmenu', e => e.preventDefault());
            
            item.innerHTML = `
                <img class="short-thumbnail" src="${video.thumbnailUrl}" alt="thumb">
                <div class="short-loading"><div class="short-spinner"></div></div>
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
                    <div class="short-channel">cumbear</div>
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
                    <div class="action-btn-wrapper more-btn-wrapper" data-video='${JSON.stringify(video).replace(/'/g, "&#39;")}'>
                        <div class="action-icon">
                            <svg viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                        </div>
                        <span class="action-label">More</span>
                    </div>
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
                vid.playbackRate = 1.25;
            };
            vid.addEventListener('loadeddata', speedUpVideo);
            vid.addEventListener('canplay', speedUpVideo);

            // 2. 150s Limit & Timeline
            vid.addEventListener('timeupdate', () => {
                if (vid.currentTime >= 150) { vid.pause(); endOverlay.classList.remove('hidden'); }
                const progress = (vid.currentTime / 150) * 100;
                timelineFill.style.width = `${Math.min(100, progress)}%`;
            });

            // 3. Watch Full Video Buttons
            const openFullVideo = (e) => {
                if(e) e.stopPropagation();
                if (window.loadPlayerVideo) window.loadPlayerVideo(video, 0);
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
                if (isLiked) likeIcon.classList.add('liked');
                else likeIcon.classList.remove('liked');
            };

            likeWrapper.addEventListener('click', (e) => { e.stopPropagation(); toggleLike(); });

            // 5. Single Tap (Play/Pause) & Double Tap (Like Animation)
            let lastTapTime = 0;
            item.addEventListener('click', (e) => {
                if (e.target.closest('.action-btn-wrapper') || e.target.closest('.mute-btn') || e.target.closest('.watch-full-btn') || e.target.closest('.watch-full-btn-end')) return;
                
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;

                if (tapLength < 300 && tapLength > 0) {
                    triggerLikeAnimation(item);
                    if (!isLiked) toggleLike();
                } else {
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
            const end2x = () => { vid.playbackRate = 1.25; topBadge.classList.add('hidden'); };
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

            // 8. MORE BUTTON - Open Menu
            const moreBtn = item.querySelector('.more-btn-wrapper');
            moreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const videoData = JSON.parse(moreBtn.getAttribute('data-video').replace(/&#39;/g, "'"));
                currentMoreMenuVideo = videoData;
                showMoreMenu(videoData);
            });

            shortsContainer.appendChild(item);
        });

        setupIntersectionObserver();
    }

    // --- MORE MENU FUNCTIONS ---
    function showMoreMenu(video) {
        const existingMenu = document.querySelector('.more-menu-overlay');
        if (existingMenu) existingMenu.remove();

        const menuHTML = `
            <div class="more-menu-overlay active">
                <div class="more-menu">
                    <div class="more-menu-header">
                        <div class="more-menu-title">More Options</div>
                        <button class="more-menu-close">✕</button>
                    </div>
                    
                    <div class="more-menu-item" id="downloadBtn">
                        <div class="more-menu-item-icon">
                            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </div>
                        <div class="more-menu-item-content">
                            <div class="more-menu-item-title">Download Video</div>
                            <div class="more-menu-item-desc">First 2.5 minutes with CumBear watermark</div>
                        </div>
                    </div>

                    <div class="more-menu-item" id="captionsBtn">
                        <div class="more-menu-item-icon">
                            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <div class="more-menu-item-content">
                            <div class="more-menu-item-title">Captions</div>
                            <div class="more-menu-item-desc">Real-time captions in any language</div>
                        </div>
                    </div>

                    <div class="captions-lang-menu" id="captionsLangMenu">
                        <div class="captions-lang-title">Select Language</div>
                        <div class="captions-lang-grid">
                            <button class="captions-lang-btn" data-lang="en">English</button>
                            <button class="captions-lang-btn" data-lang="es">Spanish</button>
                            <button class="captions-lang-btn" data-lang="fr">French</button>
                            <button class="captions-lang-btn" data-lang="de">German</button>
                            <button class="captions-lang-btn" data-lang="hi">Hindi</button>
                            <button class="captions-lang-btn" data-lang="zh">Chinese</button>
                            <button class="captions-lang-btn" data-lang="ja">Japanese</button>
                            <button class="captions-lang-btn" data-lang="ko">Korean</button>
                        </div>
                    </div>

                    <div class="more-menu-item" id="reportBtn">
                        <div class="more-menu-item-icon">
                            <svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="12" y1="20" x2="12" y2="15"></line></svg>
                        </div>
                        <div class="more-menu-item-content">
                            <div class="more-menu-item-title">Report</div>
                            <div class="more-menu-item-desc">Report inappropriate content</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', menuHTML);

        document.querySelector('.more-menu-close').addEventListener('click', closeMoreMenu);
        document.querySelector('.more-menu-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('more-menu-overlay')) closeMoreMenu();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            closeMoreMenu();
            downloadVideoWithWatermark(video);
        });

        document.getElementById('captionsBtn').addEventListener('click', () => {
            document.getElementById('captionsLangMenu').classList.toggle('active');
        });

        document.querySelectorAll('.captions-lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                closeMoreMenu();
                enableCaptions(lang);
            });
        });

        document.getElementById('reportBtn').addEventListener('click', () => {
            closeMoreMenu();
            window.location.href = '/support';
        });
    }

    function closeMoreMenu() {
        const menu = document.querySelector('.more-menu-overlay');
        if (menu) menu.remove();
    }

    // --- DOWNLOAD WITH WATERMARK ---
    async function downloadVideoWithWatermark(video) {
        const progressHTML = `
            <div class="download-progress" id="downloadProgress">
                <div class="download-progress-title">Preparing Download...</div>
                <div class="download-progress-bar">
                    <div class="download-progress-fill" id="downloadFill"></div>
                </div>
                <div class="download-progress-text" id="downloadText">0%</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', progressHTML);

        const progressFill = document.getElementById('downloadFill');
        const progressText = document.getElementById('downloadText');

        try {
            const tempVideo = document.createElement('video');
            tempVideo.src = video.playableUrl;
            tempVideo.crossOrigin = 'anonymous';
            tempVideo.muted = false;
            
            await new Promise((resolve, reject) => {
                tempVideo.onloadedmetadata = resolve;
                tempVideo.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = tempVideo.videoWidth || 640;
            canvas.height = tempVideo.videoHeight || 360;
            const ctx = canvas.getContext('2d');

            const watermark = new Image();
            watermark.crossOrigin = 'anonymous';
            watermark.src = '/cumb.png';
            await new Promise((resolve) => {
                watermark.onload = resolve;
                watermark.onerror = resolve;
            });

            const stream = canvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CumBear_${video.title.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                document.getElementById('downloadProgress').remove();
            };

            mediaRecorder.start();
            tempVideo.currentTime = 0;
            await tempVideo.play();

            const maxDuration = 150; // 2.5 minutes
            const startTime = Date.now();

            const drawFrame = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min((elapsed / maxDuration) * 100, 100);
                
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;

                if (elapsed >= maxDuration || tempVideo.ended) {
                    mediaRecorder.stop();
                    tempVideo.pause();
                    return;
                }

                ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);

                const watermarkSize = canvas.width * 0.15;
                const watermarkX = canvas.width - watermarkSize - 20;
                const watermarkY = canvas.height - watermarkSize - 20;
                
                ctx.globalAlpha = 0.7;
                ctx.drawImage(watermark, watermarkX, watermarkY, watermarkSize, watermarkSize);
                ctx.globalAlpha = 1.0;

                requestAnimationFrame(drawFrame);
            };

            drawFrame();

        } catch (error) {
            console.error('Download failed:', error);
            document.getElementById('downloadProgress').remove();
            alert('Download failed. This video may not support downloading due to browser restrictions.');
        }
    }

    // --- CAPTIONS ---
    function enableCaptions(lang) {
        const activeShort = document.querySelector('.short-item:not(.hidden)');
        if (!activeShort) return;

        const video = activeShort.querySelector('.short-video');
        if (!video) return;

        const existingCaptions = activeShort.querySelector('.captions-overlay');
        if (existingCaptions) existingCaptions.remove();

        const captionsOverlay = document.createElement('div');
        captionsOverlay.className = 'captions-overlay';
        captionsOverlay.innerHTML = '<div class="captions-text">Captions loading...</div>';
        activeShort.appendChild(captionsOverlay);

        const captionsText = captionsOverlay.querySelector('.captions-text');

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = lang;
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                captionsText.textContent = transcript;
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                captionsText.textContent = 'Captions unavailable';
                setTimeout(() => captionsOverlay.remove(), 2000);
            };

            recognition.onend = () => {
                if (video && !video.paused) {
                    try { recognition.start(); } catch(e) {}
                }
            };

            video.addEventListener('play', () => {
                try { recognition.start(); } catch(e) {}
            });

            video.addEventListener('pause', () => {
                recognition.stop();
            });

            video.addEventListener('ended', () => {
                recognition.stop();
                captionsOverlay.remove();
            });

        } else {
            captionsText.textContent = 'Captions not supported in this browser';
            setTimeout(() => captionsOverlay.remove(), 2000);
        }
    }

    // --- Helper: Trigger Like Animation ---
    function triggerLikeAnimation(item) {
        const heart = document.createElement('div');
        heart.className = 'like-heart';
        heart.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        item.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
    }

    // --- Intersection Observer (Auto Play/Pause on Scroll) ---
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
                } else { 
                    vid.pause(); 
                }
            });
        }, { threshold: 0.6 });
        
        document.querySelectorAll('.short-item').forEach(item => activeObserver.observe(item));
    }

    // --- Helper: Format Numbers ---
    function formatShortNum(num) { 
        return num >= 1000000 ? (num / 1000000).toFixed(1) + 'M' : num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num; 
    }

    // --- Helper: Share Short ---
    window.shareShort = function(title) { 
        if (navigator.share) {
            navigator.share({ title: 'CumBear Short', text: title, url: window.location.href }); 
        } else { 
            navigator.clipboard.writeText(window.location.href); 
            alert('Link copied!'); 
        } 
    };

    // --- Expose loadShorts globally ---
    window.loadShorts = loadShorts;

    // --- Initialize: Play VAST first, then load feed ---
    loadShorts();
});
