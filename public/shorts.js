/**
 * CUMBEAR SHORTS ENGINE v2.0
 * Snap scrolling, preloading, buttery gestures
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Shorts Engine v2.0 Loaded');

    const shortsContainer = document.getElementById('shortsContainer');
    let activeObserver = null;
    let isGlobalMuted = true;
    let preloadedVideos = new Set();
    let currentShortIndex = 0;

    // ============================================
    // AD PRE-ROLL
    // ============================================
    
    async function playShortsAd() {
        try {
            const response = await fetch("https://s.magsrv.com/v1/vast.php?idzone=6045638", { signal: AbortSignal.timeout(5000) });
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const mediaFile = xmlDoc.querySelector("MediaFile");
            
            if (mediaFile?.textContent) {
                const adUrl = mediaFile.textContent.trim();
                const overlay = document.createElement("div");
                overlay.className = "short-item ad-item";
                overlay.style.cssText = "z-index:100;background:#000;";
                overlay.innerHTML = `
                    <video class="short-video" src="${adUrl}" playsinline preload="auto" style="object-fit:contain"></video>
                    <div class="short-info" style="bottom:30px;text-align:center;width:100%;left:0;">
                        <div style="color:var(--accent-burgundy);font-weight:700;margin-bottom:0.5rem">Advertisement</div>
                        <button class="watch-full-btn" id="skipShortsAd">Skip Ad</button>
                    </div>
                `;
                
                shortsContainer.innerHTML = "";
                shortsContainer.appendChild(overlay);
                
                const adVid = overlay.querySelector("video");
                adVid.muted = false;
                await adVid.play();
                
                await new Promise(resolve => {
                    adVid.onended = resolve;
                    overlay.querySelector("#skipShortsAd").onclick = () => {
                        adVid.pause();
                        resolve();
                    };
                });
                
                overlay.remove();
            }
        } catch(e) {
            console.log("Shorts VAST skipped");
        }
    }

    // ============================================
    // MAIN LOADING
    // ============================================
    
    async function loadShorts() {
        if (!shortsContainer) return;
        
        // Show loading
        shortsContainer.innerHTML = `
            <div class="short-loading" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:50;background:#000">
                <div class="short-spinner"></div>
            </div>
        `;

        await playShortsAd();

        try {
            const res = await fetchWithTimeout(
                'https://cumbear-backend.vercel.app/api/videos?limit=30&source=archive',
                {}, 8000
            );
            const data = await res.json();
            
            if (data.success && data.data) {
                const videos = shuffleArray(data.data).slice(0, 20);
                renderShorts(videos);
            }
        } catch (err) {
            shortsContainer.innerHTML = `
                <div style="color:white;text-align:center;padding:3rem;display:flex;flex-direction:column;align-items:center;gap:1rem">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p>Failed to load shorts</p>
                    <button onclick="window.loadShorts()" style="padding:0.75rem 1.5rem;background:var(--accent-burgundy);border:none;color:white;border-radius:10px;cursor:pointer;font-weight:600">Retry</button>
                </div>
            `;
        }
    }

    // ============================================
    // RENDER SHORTS
    // ============================================
    
    function renderShorts(videos) {
        shortsContainer.innerHTML = '';
        preloadedVideos.clear();
        
        // Back button
        const backBtn = document.createElement('button');
        backBtn.className = 'shorts-back-btn';
        backBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';
        backBtn.setAttribute('aria-label', 'Back to home');
        backBtn.onclick = () => window.switchView('homeView', true);
        shortsContainer.appendChild(backBtn);

        videos.forEach((video, index) => {
            const randomLikes = Math.floor(Math.random() * 99000) + 1000;
            const randomViews = Math.floor(Math.random() * 490000) + 10000;

            const item = document.createElement('div');
            item.className = 'short-item';
            item.setAttribute('data-index', index);
            item.addEventListener('contextmenu', e => e.preventDefault());

            item.innerHTML = `
                <img class="short-thumbnail" src="${video.thumbnailUrl}" alt="" loading="${index < 3 ? 'eager' : 'lazy'}" decoding="async">
                <div class="short-loading"><div class="short-spinner"></div></div>
                <video class="short-video" src="${video.playableUrl}" loop playsinline preload="${index < 3 ? 'auto' : 'none'}" muted></video>
                
                <div class="top-2x-badge hidden" aria-hidden="true">2x Speed</div>
                
                <div class="center-play-icon" id="playIcon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="60" height="60" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div class="center-play-icon hidden" id="pauseIcon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="60" height="60" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </div>

                <div class="end-overlay hidden">
                    <h3>Preview Ended</h3>
                    <button class="watch-full-btn-end" type="button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Watch Full Video
                    </button>
                </div>

                <button class="mute-btn" aria-label="Toggle sound" type="button">
                    <svg class="icon-muted" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                    <svg class="icon-unmuted hidden" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                </button>

                <div class="short-info">
                    <div class="short-channel">CumBear <span style="opacity:0.7;font-size:0.8rem">• Verified</span></div>
                    <div class="short-title">${escapeHtml(video.title)}</div>
                    <button class="watch-full-btn" type="button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Watch full video
                    </button>
                </div>

                <div class="short-actions">
                    <div class="action-btn-wrapper like-wrapper" role="button" tabindex="0" aria-label="Like">
                        <div class="action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></div>
                        <span class="action-label like-label">${formatShortNum(randomLikes)}</span>
                    </div>
                    <div class="action-btn-wrapper" role="button" aria-label="Views">
                        <div class="action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div>
                        <span class="action-label">${formatShortNum(randomViews)}</span>
                    </div>
                    <div class="action-btn-wrapper" role="button" tabindex="0" aria-label="Share" onclick="shareShort('${escapeHtml(video.title).replace(/'/g, "\\'")}')">
                        <div class="action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></div>
                        <span class="action-label">Share</span>
                    </div>
                    <div class="action-btn-wrapper" role="button" aria-label="Report" onclick="window.location.href='/support'">
                        <div class="action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
                        <span class="action-label">Report</span>
                    </div>
                </div>
                <div class="short-timeline" aria-hidden="true"><div class="short-timeline-fill"></div></div>
            `;

            const vid = item.querySelector('.short-video');
            const thumb = item.querySelector('.short-thumbnail');
            const loader = item.querySelector('.short-loading');
            const timelineFill = item.querySelector('.short-timeline-fill');
            const endOverlay = item.querySelector('.end-overlay');
            const playIcon = item.querySelector('#playIcon');
            const pauseIcon = item.querySelector('#pauseIcon');
            const topBadge = item.querySelector('.top-2x-badge');

            // Loading & speed
            const onReady = () => {
                thumb.classList.add('loaded');
                loader.classList.add('hidden');
                vid.playbackRate = 1.25;
            };
            vid.addEventListener('loadeddata', onReady, { once: true });
            vid.addEventListener('canplay', onReady, { once: true });

            // 150s limit
            vid.addEventListener('timeupdate', () => {
                if (vid.currentTime >= 150) {
                    vid.pause();
                    endOverlay.classList.remove('hidden');
                }
                const progress = (vid.currentTime / 150) * 100;
                timelineFill.style.width = `${Math.min(100, progress)}%`;
            });

            // Open full video
            const openFull = (e) => {
                e?.stopPropagation();
                window.loadPlayerVideo?.(video, 0);
                window.switchView?.('playerView', true);
            };
            item.querySelector('.watch-full-btn').addEventListener('click', openFull);
            item.querySelector('.watch-full-btn-end').addEventListener('click', openFull);

            // Like system
            const likeWrapper = item.querySelector('.like-wrapper');
            const likeIcon = likeWrapper.querySelector('.action-icon');
            let isLiked = false;

            likeWrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                isLiked = !isLiked;
                likeIcon.classList.toggle('liked', isLiked);
                
                // Haptic feedback if available
                if (navigator.vibrate) navigator.vibrate(50);
            });

            // Tap gestures with proper timing
            let lastTapTime = 0;
            let tapTimeout = null;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.action-btn-wrapper') || 
                    e.target.closest('.mute-btn') || 
                    e.target.closest('.watch-full-btn') ||
                    e.target.closest('.watch-full-btn-end')) return;

                const now = Date.now();
                const gap = now - lastTapTime;

                if (gap < 300 && gap > 0) {
                    // Double tap
                    clearTimeout(tapTimeout);
                    triggerLikeAnimation(item);
                    if (!isLiked) {
                        isLiked = true;
                        likeIcon.classList.add('liked');
                    }
                    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
                } else {
                    // Single tap - delay to confirm not double
                    tapTimeout = setTimeout(() => {
                        if (vid.paused) {
                            vid.play();
                            playIcon.classList.add('show');
                            setTimeout(() => playIcon.classList.remove('show'), 600);
                        } else {
                            vid.pause();
                            pauseIcon.classList.add('show');
                            setTimeout(() => pauseIcon.classList.remove('show'), 600);
                        }
                    }, 300);
                }
                lastTapTime = now;
            });

            // 2x speed on right side hold
            let isHolding2x = false;
            
            const start2x = (e) => {
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                if (clientX > window.innerWidth * 0.65) {
                    isHolding2x = true;
                    vid.playbackRate = 2.0;
                    topBadge.classList.remove('hidden');
                }
            };
            
            const end2x = () => {
                if (!isHolding2x) return;
                isHolding2x = false;
                vid.playbackRate = 1.25;
                topBadge.classList.add('hidden');
            };

            item.addEventListener('touchstart', start2x, { passive: true });
            item.addEventListener('touchend', end2x);
            item.addEventListener('touchcancel', end2x);
            item.addEventListener('mousedown', start2x);
            item.addEventListener('mouseup', end2x);
            item.addEventListener('mouseleave', end2x);

            // Mute toggle
            const muteBtn = item.querySelector('.mute-btn');
            const iconMuted = muteBtn.querySelector('.icon-muted');
            const iconUnmuted = muteBtn.querySelector('.icon-unmuted');

            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                isGlobalMuted = !isGlobalMuted;
                document.querySelectorAll('.short-video').forEach(v => {
                    v.muted = isGlobalMuted;
                });
                updateMuteIcons(isGlobalMuted);
            });

            function updateMuteIcons(muted) {
                document.querySelectorAll('.mute-btn').forEach(btn => {
                    const on = btn.querySelector('.icon-muted');
                    const off = btn.querySelector('.icon-unmuted');
                    on.classList.toggle('hidden', !muted);
                    off.classList.toggle('hidden', muted);
                });
            }

            shortsContainer.appendChild(item);
        });

        setupIntersectionObserver();
        preloadAdjacent(0);
    }

    // ============================================
    // INTERSECTION OBSERVER (Snap Scrolling)
    // ============================================
    
    function setupIntersectionObserver() {
        if (activeObserver) activeObserver.disconnect();

        activeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const item = entry.target;
                const vid = item.querySelector('.short-video');
                const endOverlay = item.querySelector('.end-overlay');
                
                if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                    const index = parseInt(item.getAttribute('data-index'));
                    currentShortIndex = index;
                    
                    vid.currentTime = 0;
                    endOverlay?.classList.add('hidden');
                    vid.play().catch(() => {});
                    
                    // Preload adjacent
                    preloadAdjacent(index);
                } else {
                    vid.pause();
                    vid.currentTime = 0;
                }
            });
        }, {
            root: shortsContainer,
            threshold: 0.6
        });

        document.querySelectorAll('.short-item:not(.ad-item)').forEach(item => {
            activeObserver.observe(item);
        });
    }

    function preloadAdjacent(currentIndex) {
        const items = document.querySelectorAll('.short-item:not(.ad-item)');
        const preloadRange = 2; // Preload 2 before and after
        
        for (let i = currentIndex - preloadRange; i <= currentIndex + preloadRange; i++) {
            if (i >= 0 && i < items.length && i !== currentIndex) {
                const item = items[i];
                const vid = item.querySelector('.short-video');
                if (vid && vid.preload === 'none' && !preloadedVideos.has(i)) {
                    vid.preload = 'metadata';
                    preloadedVideos.add(i);
                }
            }
        }
    }

    // ============================================
    // ANIMATIONS
    // ============================================
    
    function triggerLikeAnimation(item) {
        const heart = document.createElement('div');
        heart.className = 'like-heart';
        heart.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        item.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
    }

    // ============================================
    // EXPORTS
    // ============================================
    
    window.shareShort = function(title) {
        if (navigator.share) {
            navigator.share({ title: 'CumBear Short', text: title, url: window.location.href });
        } else {
            navigator.clipboard?.writeText(window.location.href);
            Toast.show('Link copied to clipboard!');
        }
    };
    
    window.loadShorts = loadShorts;
});

// Utilities
function formatShortNum(num) {
    return num >= 1000000 ? (num / 1000000).toFixed(1) + 'M' : 
           num >= 1000 ? (num / 1000).toFixed(1) + 'k' : 
           num.toString();
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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

