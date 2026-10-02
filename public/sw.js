/**
 * CUMBEAR SERVICE WORKER
 * Offline support, caching, background sync
 */

const CACHE_NAME = 'cumbear-v2';
const STATIC_CACHE = 'cumbear-static-v2';
const IMAGE_CACHE = 'cumbear-images-v2';
const API_CACHE = 'cumbear-api-v2';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/header.css',
    '/sidebar.css',
    '/search.css',
    '/footer.css',
    '/ads.css',
    '/home.css',
    '/player.css',
    '/shorts.css',
    '/script.js',
    '/header.js',
    '/sidebar.js',
    '/search.js',
    '/footer.js',
    '/ads.js',
    '/home.js',
    '/player.js',
    '/shorts.js',
    '/cumb.png'
];

// Install: Cache static assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: Clean old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => 
            Promise.all(
                keys.filter(key => 
                    key.startsWith('cumbear-') && 
                    ![STATIC_CACHE, IMAGE_CACHE, API_CACHE].includes(key)
                ).map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: Smart caching strategy
self.addEventListener('fetch', (e) => {
    const { request } = e;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // API requests: Stale-while-revalidate
    if (url.pathname.startsWith('/api/') || url.hostname.includes('vercel.app')) {
        e.respondWith(staleWhileRevalidate(request, API_CACHE));
        return;
    }

    // Images: Cache first, network fallback
    if (request.destination === 'image') {
        e.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }

    // Static assets: Cache first
    if (STATIC_ASSETS.includes(url.pathname) || request.destination === 'script' || request.destination === 'style') {
        e.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // Default: Network with cache fallback
    e.respondWith(networkWithCacheFallback(request));
});

// Strategies
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
    }).catch(() => cached);
    
    return cached || fetchPromise;
}

async function networkWithCacheFallback(request) {
    try {
        return await fetch(request);
    } catch (err) {
        const cache = await caches.open(STATIC_CACHE);
        return cache.match(request) || new Response('Offline', { status: 503 });
    }
}

