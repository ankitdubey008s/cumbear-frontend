// ============================================
// CUMBEAR ULTRA PREMIUM - Player & VAST Engine
// Version: 2.0 Enhanced
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Player.js Loaded (Ultra Premium Engine)');

    const videoEl = document.getElementById('mainVideo');
    const suggestionsGrid = document.getElementById('suggestionsGrid');
    const vastOverlay = document.getElementById('vastOverlay');
    const vastVideo = document.getElementById('vastVideo');
    const vastSkipBtn = document.getElementById('vastSkipBtn');
    const vastCountdown = document.getElementById('vastCountdown');
    const playerTitleDisplay = document.getElementById('playerTitleDisplay');
    const playerLikeBtn = document.getElementById('playerLikeBtn');
    const playerShareBtn = document.getElementById('playerShareBtn');

    // --- 1. Global Kill Switch (Prevents Background Audio) ---
    // This is called by script.js when navigating away from the player
    window.stopPlayer = function() {
        if (videoEl) {
            videoEl.pause();
            videoEl.removeAttribute('src');
            videoEl.load();
        }
        if (vastVideo) {
            vastVideo.pause();
            vastVideo.removeAttribute('src');
            vastVideo.load();
        }
        if (vastOverlay) {
            vastOverlay.classList.add('hidden');
        }
    };

    // --- 2. Robust VAST Pre-roll Engine ---
    async function playVastPreRoll(vastUrl, onComplete) {
        try {
            const response = await fetch(vastUrl);
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const mediaFile = xmlDoc.querySelector("MediaFile");
            
            if (mediaFile && mediaFile.textContent) {
                const adVideoUrl = mediaFile.textContent.trim();
                const skipOffset = mediaFile.getAttribute("skipoffset") || "00:00:07";
                const skipSeconds = parseInt(skipOffset.split(":").pop()) || 7;

                vastOverlay.classList.remove('hidden');
                vastVideo.src = adVideoUrl;
                vastVideo.muted = false; // Pre-rolls should have sound
                vastVideo.playbackRate = 1.0;
                
                const playPromise = vastVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn("Autoplay blocked, muting ad:", error);
                        vastVideo.muted = true;
                        vastVideo.play();
                    });
                }

                let timeLeft = skipSeconds;
                vastCountdown.textContent = timeLeft;
                vastSkipBtn.classList.add('hidden');

                const timer = setInterval(() => {
                    timeLeft--;
                    vastCountdown.textContent = timeLeft;
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        vastSkipBtn.classList.remove('hidden');
                    }
                }, 1000);

                const endAd = () => {
                    clearInterval(timer);
                    vastVideo.pause();
                    vastVideo.removeAttribute('src');
                    vastVideo.load();
                    vastOverlay.classList.add('hidden');
                    if (onComplete) onComplete();
                };

                vastSkipBtn.onclick = endAd;
                vastVideo.onended = endAd;
                vastVideo.onerror = endAd; // Fallback if ad fails
            } else {
                if (onComplete) onComplete(); // No ad found, proceed
            }
        } catch (e) {
            console.error("VAST Pre-roll failed:", e);
            if (onComplete) onComplete(); // Graceful fallback
        }
    }

    // --- 3. Main Video Loader ---
    window.loadPlayerVideo = async function(video, startTime = 0) {
        if (!video) return;
        
        // Update UI immediately
        playerTitleDisplay.textContent = video.title;
        if (playerLikeBtn) playerLikeBtn.textContent = '❤️ Like';
        
        // 1. Play Pre-roll First
        await playVastPreRoll('https://s.magsrv.com/v1/vast.php?idz=6045632', () => {
            // 2. Start Main Video
            videoEl.src = video.playableUrl;
            videoEl.poster = video.thumbnailUrl;
            videoEl.load();
            
            if (startTime > 0) {
                videoEl.addEventListener('loadedmetadata', function onMeta() {
                    videoEl.currentTime = startTime;
                    videoEl.removeEventListener('loadedmetadata', onMeta);
                });
            }
            
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        });
        
        // 3. Load Suggestions
        loadSuggestions(video);
    };

    // --- 4. Suggestions Engine ---
    async function loadSuggestions(currentVideo) {
        suggestionsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Loading suggestions...</div>';
        
        try {
            const res = await fetch(`https://cumbear-backend.vercel.app/api/videos/related/${encodeURIComponent(currentVideo.category || 'all')}?limit=50`);
            const data = await res.json();
            
            if (data.success && data.data) {
                renderSuggestions(data.data, currentVideo._id);
            } else {
                suggestionsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No suggestions found.</div>';
            }
        } catch (err) { 
            console.error('Failed to load suggestions:', err); 
            suggestionsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Error loading suggestions.</div>'; 
        }
    }

    function renderSuggestions(videos, excludeId) {
        suggestionsGrid.innerHTML = '';
        const filtered = videos.filter(v => v._id !== excludeId);
        
        if (filtered.length === 0) {
            suggestionsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No suggestions found.</div>';
            return;
        }
        
        filtered.forEach((video, index) => {
            // Inject In-Feed Ad every 6 suggestions
            if (index > 0 && index % 6 === 0 && window.renderAd) {
                suggestionsGrid.insertAdjacentHTML('beforeend', window.renderAd('infeed'));
            }
            
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <div class="video-thumb">
                    <img src="${video.thumbnailUrl}" loading="lazy" alt="${video.title}">
                    <span class="duration-badge">${video.duration}</span>
                </div>
                <div class="video-info">
                    <div class="video-title" style="font-size: 0.9rem;">${video.title}</div>
                    <div class="video-meta" style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${formatViews(Math.floor(Math.random() * 90000) + 10000)} views</div>
                </div>
            `;
            card.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'instant' }); // Instant jump to top
                window.loadPlayerVideo(video, 0);
            });
            suggestionsGrid.appendChild(card);
        });
    }

    // --- 5. Player Action Buttons (Like & Share) ---
    if (playerLikeBtn) {
        playerLikeBtn.addEventListener('click', () => {
            const isLiked = playerLikeBtn.classList.toggle('liked');
            playerLikeBtn.textContent = isLiked ? '❤️ Liked' : '❤️ Like';
            playerLikeBtn.style.color = isLiked ? 'var(--accent-burgundy)' : 'var(--text-primary)';
            playerLikeBtn.style.borderColor = isLiked ? 'var(--accent-burgundy)' : 'var(--border-color)';
        });
    }

    if (playerShareBtn) {
        playerShareBtn.addEventListener('click', async () => {
            const shareData = {
                title: playerTitleDisplay.textContent,
                text: 'Check out this video on CumBear!',
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    const originalText = playerShareBtn.textContent;
                    playerShareBtn.textContent = '🔗 Copied!';
                    setTimeout(() => { playerShareBtn.textContent = originalText; }, 2000);
                }
            } catch (err) {
                console.log('Share canceled or failed');
            }
        });
    }

    // --- 6. Helper Functions ---
    function formatViews(num) { 
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'; 
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k'; 
        return num; 
    }
});
