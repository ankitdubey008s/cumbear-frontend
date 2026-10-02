/**
 * CUMBEAR PLAYER ENGINE v2.0
 * Adaptive streaming, gesture controls, memory management
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const videoEl = document.getElementById('mainVideo');
    const suggestionsGrid = document.getElementById('suggestionsGrid');
    const vastOverlay = document.getElementById('vastOverlay');
    const vastVideo = document.getElementById('vastVideo');
    const vastSkipBtn = document.getElementById('vastSkipBtn');
    const vastCountdown = document.getElementById('vastCountdown');
    const playerContainer = document.getElementById('playerContainer');

    let hls = null;
    let adTimer = null;
    let isDestroyed = false;

    // ============================================
    // VAST PRE-ROLL WITH PROPER CLEANUP
    // ============================================
    
    async function playVastPreRoll(vastUrl, onComplete) {
        // Cleanup any existing ad
        cleanupAd();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(vastUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            
            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) throw new Error('VAST parse error');

            const mediaFile = xmlDoc.querySelector("MediaFile");
            const skipOffset = xmlDoc.querySelector("Linear")?.getAttribute("skipoffset") || "00:00:07";
            
            if (mediaFile?.textContent) {
                const adVideoUrl = mediaFile.textContent.trim();
                const skipSeconds = parseInt(skipOffset.split(":").pop()) || 7;

                vastOverlay.classList.remove('hidden');
                vastOverlay.setAttribute('aria-hidden', 'false');
                
                vastVideo.src = adVideoUrl;
                vastVideo.muted = false;
                
                // Wait for ready
                await new Promise((resolve, reject) => {
                    vastVideo.oncanplay = resolve;
                    vastVideo.onerror = reject;
                    vastVideo.load();
                });
                
                await vastVideo.play();

                let timeLeft = skipSeconds;
                vastCountdown.textContent = timeLeft;
                vastSkipBtn.classList.add('hidden');

                adTimer = setInterval(() => {
                    timeLeft--;
                    vastCountdown.textContent = timeLeft;
                    if (timeLeft <= 0) {
                        clearInterval(adTimer);
                        vastSkipBtn.classList.remove('hidden');
                        vastSkipBtn.focus();
                    }
                }, 1000);

                const endAd = () => {
                    cleanupAd();
                    if (onComplete) onComplete();
                };

                vastSkipBtn.onclick = endAd;
                vastVideo.onended = endAd;
                
                // Auto-proceed on error
                vastVideo.onerror = () => {
                    console.warn('Ad failed to load');
                    endAd();
                };
                
            } else {
                if (onComplete) onComplete();
            }
        } catch (e) {
            console.warn("VAST Pre-roll failed:", e);
            cleanupAd();
            if (onComplete) onComplete();
        }
    }

    function cleanupAd() {
        if (adTimer) {
            clearInterval(adTimer);
            adTimer = null;
        }
        if (vastVideo) {
            vastVideo.pause();
            vastVideo.removeAttribute('src');
            vastVideo.load();
        }
        vastOverlay?.classList.add('hidden');
        vastOverlay?.setAttribute('aria-hidden', 'true');
        vastSkipBtn?.classList.add('hidden');
    }

    // ============================================
    // MAIN VIDEO LOADING (HLS Support)
    // ============================================
    
    window.loadPlayerVideo = async function(video, startTime = 0) {
        if (!video || isDestroyed) return;
        
        // Cleanup previous
        destroyPlayer();
        
        // Show loading state
        playerContainer.classList.add('loading');

        // 1. Play Pre-roll
        await playVastPreRoll('https://s.magsrv.com/v1/vast.php?idz=6045632', () => {
            // 2. Start Main Video
            loadMainVideo(video, startTime);
        });

        // 3. Load Suggestions
        loadSuggestions(video);
    };

    function loadMainVideo(video, startTime) {
        document.getElementById('playerTitleDisplay').textContent = video.title;
        
        // Check for HLS support
        const isHLS = video.playableUrl?.includes('.m3u8');
        
        if (isHLS && Hls?.isSupported()) {
            hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(video.playableUrl);
            hls.attachMedia(videoEl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                playerContainer.classList.remove('loading');
                videoEl.play().catch(() => {});
            });
        } else {
            videoEl.src = video.playableUrl;
            videoEl.poster = video.thumbnailUrl;
            videoEl.load();
            playerContainer.classList.remove('loading');
        }

        if (startTime > 0) {
            const seekOnReady = () => {
                videoEl.currentTime = startTime;
                videoEl.removeEventListener('loadedmetadata', seekOnReady);
            };
            videoEl.addEventListener('loadedmetadata', seekOnReady);
        }

        // Custom controls setup
        setupCustomControls();
    }

    function setupCustomControls() {
        // Double tap to seek
        let lastTap = 0;
        let tapSide = null;
        
        playerContainer.addEventListener('click', (e) => {
            const rect = playerContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            
            const now = Date.now();
            const isDoubleTap = now - lastTap < 300;
            
            if (isDoubleTap && tapSide === (x < width / 2 ? 'left' : 'right')) {
                // Double tap on same side
                const seekAmount = x < width / 2 ? -10 : 10;
                videoEl.currentTime = Math.max(0, Math.min(videoEl.duration, videoEl.currentTime + seekAmount));
                
                // Visual feedback
                showSeekFeedback(x < width / 2 ? 'left' : 'right', seekAmount);
            }
            
            tapSide = x < width / 2 ? 'left' : 'right';
            lastTap = now;
        });
    }

    function showSeekFeedback(side, amount) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            ${side}: 20%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            font-size: 1.5rem;
            font-weight: 700;
            z-index: 10;
            animation: seekFeedback 0.6s ease forwards;
            pointer-events: none;
        `;
        feedback.textContent = `${amount > 0 ? '+' : ''}${amount}s`;
        playerContainer.appendChild(feedback);
        setTimeout(() => feedback.remove(), 600);
    }

    // ============================================
    // SUGGESTIONS WITH LAZY LOADING
    // ============================================
    
    async function loadSuggestions(currentVideo) {
        if (!suggestionsGrid) return;
        
        suggestionsGrid.innerHTML = '<div class="skeleton" style="grid-column:1/-1;height:200px"></div>';
        
        try {
            const res = await fetchWithTimeout(
                `https://cumbear-backend.vercel.app/api/videos/related/${encodeURIComponent(currentVideo.category)}?limit=12`,
                {}, 5000
            );
            const data = await res.json();
            
            if (data.success && data.data) {
                renderSuggestions(data.data, currentVideo._id);
            }
        } catch (err) {
            suggestionsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted)">Failed to load suggestions</div>';
        }
    }

    function renderSuggestions(videos, excludeId) {
        suggestionsGrid.innerHTML = '';
        const filtered = videos.filter(v => v._id !== excludeId).slice(0, 12);
        
        if (filtered.length === 0) {
            suggestionsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted)">No suggestions found</div>';
            return;
        }

        const fragment = document.createDocumentFragment();

        filtered.forEach((video, index) => {
            if (index > 0 && index % 6 === 0 && window.renderAd) {
                const adDiv = document.createElement('div');
                adDiv.innerHTML = window.renderAd('infeed');
                fragment.appendChild(adDiv.firstElementChild);
            }

            const card = document.createElement('div');
            card.className = 'video-card hover-lift';
            card.innerHTML = `
                <div class="video-thumb">
                    <img src="${video.thumbnailUrl}" loading="lazy" alt="" decoding="async">
                    <span class="duration-badge">${escapeHtml(video.duration || '')}</span>
                </div>
                <div class="video-title" style="font-size:0.85rem;margin-top:0.5rem">${escapeHtml(video.title)}</div>
                <div class="video-meta" style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem">${formatViews(Math.floor(Math.random() * 90000) + 10000)} views</div>
            `;
            
            card.addEventListener('click', () => window.loadPlayerVideo(video, 0));
            fragment.appendChild(card);
        });

        suggestionsGrid.appendChild(fragment);
    }

    // ============================================
    // CLEANUP
    // ============================================
    
    function destroyPlayer() {
        if (hls) {
            hls.destroy();
            hls = null;
        }
        if (videoEl) {
            videoEl.pause();
            videoEl.removeAttribute('src');
            videoEl.load();
        }
        cleanupAd();
    }

    window.stopPlayer = destroyPlayer;
    
    // Cleanup on page hide
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && videoEl && !videoEl.paused) {
            videoEl.pause();
        }
    });
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

