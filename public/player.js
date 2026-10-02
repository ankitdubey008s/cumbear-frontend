
document.addEventListener('DOMContentLoaded', () => {
    const videoEl = document.getElementById('mainVideo');
    const suggestionsGrid = document.getElementById('suggestionsGrid');
    const vastOverlay = document.getElementById('vastOverlay');
    const vastVideo = document.getElementById('vastVideo');
    const vastSkipBtn = document.getElementById('vastSkipBtn');
    const vastCountdown = document.getElementById('vastCountdown');

    let vastSkipTimeout;

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
                vastVideo.play();

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
                    vastVideo.src = "";
                    vastOverlay.classList.add('hidden');
                    if (onComplete) onComplete();
                };

                vastSkipBtn.onclick = endAd;
                vastVideo.onended = endAd;
            } else {
                if (onComplete) onComplete(); // No ad found, proceed
            }
        } catch (e) {
            console.error("VAST Pre-roll failed:", e);
            if (onComplete) onComplete();
        }
    }

    window.loadPlayerVideo = async function(video, startTime = 0) {
        if (!video) return;
        
        // 1. Play Pre-roll First
        await playVastPreRoll('https://s.magsrv.com/v1/vast.php?idz=6045632', () => {
            // 2. Start Main Video
            videoEl.src = video.playableUrl;
            videoEl.poster = video.thumbnailUrl;
            document.getElementById('playerTitleDisplay').textContent = video.title;
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
        try {
            const res = await fetch(`https://cumbear-backend.vercel.app/api/videos/related/${encodeURIComponent(video.category)}?limit=50`);
            const data = await res.json();
            if (data.success && data.data) renderSuggestions(data.data, video._id);
        } catch (err) { console.error('Failed to load suggestions:', err); }
    };

    function renderSuggestions(videos, excludeId) {
        suggestionsGrid.innerHTML = '';
        const filtered = videos.filter(v => v._id !== excludeId);
        if (filtered.length === 0) {
            suggestionsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No suggestions found.</div>';
            return;
        }
        filtered.forEach((video, index) => {
            if (index > 0 && index % 6 === 0 && window.renderAd) suggestionsGrid.insertAdjacentHTML('beforeend', window.renderAd('infeed'));
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <div class="video-thumb"><img src="${video.thumbnailUrl}" loading="lazy"><span class="duration-badge">${video.duration}</span></div>
                <div class="video-title">${video.title}</div>
                <div class="video-meta">${formatViews(Math.floor(Math.random() * 90000) + 10000)} views</div>
            `;
            card.addEventListener('click', () => window.loadPlayerVideo(video, 0));
            suggestionsGrid.appendChild(card);
        });
    }

    function formatViews(num) { return num >= 1000000 ? (num / 1000000).toFixed(1) + 'M' : num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num; }
});
