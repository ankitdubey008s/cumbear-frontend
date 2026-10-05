document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Player.js Loaded');
    
    const videoEl = document.getElementById('mainVideo');
    const suggestionsGrid = document.getElementById('suggestionsGrid');
    const vastOverlay = document.getElementById('vastOverlay');
    const vastVideo = document.getElementById('vastVideo');
    const vastSkipBtn = document.getElementById('vastSkipBtn');
    const vastCountdown = document.getElementById('vastCountdown');
    const playerTitleDisplay = document.getElementById('playerTitleDisplay');
    const playerLikeBtn = document.getElementById('playerLikeBtn');
    const playerShareBtn = document.getElementById('playerShareBtn');

    // Global Kill Switch
    window.stopPlayer = function() {
        console.log('🛑 Killing player audio');
        if (videoEl) { videoEl.pause(); videoEl.removeAttribute('src'); videoEl.load(); }
        if (vastVideo) { vastVideo.pause(); vastVideo.removeAttribute('src'); vastVideo.load(); }
        if (vastOverlay) vastOverlay.classList.add('hidden');
    };

    // VAST Pre-roll Engine with DIAGNOSTIC LOGGING
    async function playVastPreRoll(vastUrl, onComplete) {
        console.log('🎬 Starting VAST Pre-roll request to:', vastUrl);
        try {
            const response = await fetch(vastUrl);
            console.log('📡 VAST Response status:', response.status);
            
            if (!response.ok) {
                console.error('❌ VAST Fetch failed with status:', response.status);
                if (onComplete) onComplete();
                return;
            }

            const text = await response.text();
            console.log('📜 VAST XML received, length:', text.length);
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            
            const parseError = xmlDoc.querySelector("parsererror");
            if (parseError) {
                console.error("❌ VAST XML Parse Error:", parseError);
                if (onComplete) onComplete();
                return;
            }

            const mediaFile = xmlDoc.querySelector("MediaFile");
            if (mediaFile && mediaFile.textContent) {
                const adVideoUrl = mediaFile.textContent.trim();
                console.log('✅ Ad Video URL found:', adVideoUrl);
                
                const skipOffset = mediaFile.getAttribute("skipoffset") || "00:00:07";
                const skipSeconds = parseInt(skipOffset.split(":").pop()) || 7;
                console.log('⏱️ Skip seconds enforced:', skipSeconds);

                vastOverlay.classList.remove('hidden');
                vastVideo.src = adVideoUrl;
                vastVideo.muted = false; // Ads pay more with sound
                
                const playPromise = vastVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                        console.warn("⚠️ Browser blocked unmuted autoplay, muting ad:", err);
                        vastVideo.muted = true;
                        vastVideo.play();
                    });
                }

                let timeLeft = skipSeconds;
                vastCountdown.textContent = timeLeft;
                vastSkipBtn.classList.add('hidden');
                vastSkipBtn.textContent = `Skip Ad in ${timeLeft}s`;

                const timer = setInterval(() => {
                    timeLeft--;
                    vastCountdown.textContent = timeLeft;
                    vastSkipBtn.textContent = `Skip Ad in ${timeLeft}s`;
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        vastSkipBtn.classList.remove('hidden');
                        vastSkipBtn.textContent = 'Skip Ad';
                    }
                }, 1000);

                const endAd = () => {
                    console.log('🏁 Ad ended or skipped');
                    clearInterval(timer);
                    vastVideo.pause();
                    vastVideo.removeAttribute('src');
                    vastVideo.load();
                    vastOverlay.classList.add('hidden');
                    if (onComplete) onComplete();
                };

                vastSkipBtn.onclick = endAd;
                vastVideo.onended = endAd;
                vastVideo.onerror = (e) => {
                    console.error("❌ VAST Video playback error:", e);
                    endAd(); // Fallback if ad fails to load
                };
            } else {
                console.log('⚠️ No MediaFile found in VAST response (Empty Ad). Proceeding to video.');
                if (onComplete) onComplete();
            }
        } catch (e) {
            console.error("❌ CRITICAL: VAST Pre-roll fetch failed. Is an Ad-Blocker or CORS blocking it?", e);
            if (onComplete) onComplete();
        }
    }

    // Load Video
    window.loadPlayerVideo = async function(video, startTime = 0) {
        if (!video) return;
        
        playerTitleDisplay.textContent = video.title;
        if (playerLikeBtn) {
            playerLikeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg><span>Like</span>';
            playerLikeBtn.style.color = 'var(--text-primary)';
            playerLikeBtn.style.borderColor = 'var(--border-color)';
        }
        if (playerShareBtn) {
            playerShareBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg><span>Share</span>';
        }
        
        // 1. Play Pre-roll First (Using EXACT URL you provided)
        await playVastPreRoll('https://s.magsrv.com/v1/vast.php?idzone=6045632', () => {
            // 2. Start Main Video
            console.log('▶️ Starting main video');
            videoEl.src = video.playableUrl;
            videoEl.poster = video.thumbnailUrl;
            videoEl.preload = 'metadata';
            videoEl.load();
            
            if (startTime > 0) {
                videoEl.addEventListener('loadedmetadata', function onMeta() {
                    videoEl.currentTime = startTime;
                    videoEl.removeEventListener('loadedmetadata', onMeta);
                });
            }
            videoEl.play().catch(() => {});
        });
        
        // 3. Load Suggestions
        loadSuggestions(video);
    };

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
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.loadPlayerVideo(video, 0);
            });
            suggestionsGrid.appendChild(card);
        });
    }

    if (playerLikeBtn) {
        playerLikeBtn.addEventListener('click', () => {
            const isLiked = playerLikeBtn.classList.toggle('liked');
            if (isLiked) {
                playerLikeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg><span>Liked</span>';
                playerLikeBtn.style.color = 'var(--accent-burgundy)';
                playerLikeBtn.style.borderColor = 'var(--accent-burgundy)';
            } else {
                playerLikeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg><span>Like</span>';
                playerLikeBtn.style.color = 'var(--text-primary)';
                playerLikeBtn.style.borderColor = 'var(--border-color)';
            }
        });
    }

    if (playerShareBtn) {
        playerShareBtn.addEventListener('click', async () => {
            const shareData = { title: playerTitleDisplay.textContent, text: 'Check out this video on CumBear!', url: window.location.href };
            try {
                if (navigator.share) await navigator.share(shareData);
                else {
                    await navigator.clipboard.writeText(window.location.href);
                    const originalHTML = playerShareBtn.innerHTML;
                    playerShareBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
                    setTimeout(() => { playerShareBtn.innerHTML = originalHTML; }, 2000);
                }
            } catch (err) {}
        });
    }

    function formatViews(num) { 
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'; 
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k'; 
        return num; 
    }
});
