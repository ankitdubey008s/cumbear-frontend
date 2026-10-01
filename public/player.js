
document.addEventListener('DOMContentLoaded', () => {
    const videoEl = document.getElementById('mainVideo');
    const suggestionsGrid = document.getElementById('suggestionsGrid');

    window.loadPlayerVideo = async function(video, startTime = 0) {
        if (!video) return;
        
        videoEl.src = video.playableUrl;
        videoEl.poster = video.thumbnailUrl;
        document.getElementById('playerTitleDisplay').textContent = video.title;
        videoEl.load();
        
        // If coming from Shorts end screen, start at 150 seconds
        if (startTime > 0) {
            videoEl.addEventListener('loadedmetadata', function onMeta() {
                videoEl.currentTime = startTime;
                videoEl.removeEventListener('loadedmetadata', onMeta);
            });
        }
        
        videoEl.play().catch(() => {});
        
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
