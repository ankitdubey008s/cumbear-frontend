const CACHE_NAME = 'cumbear-v1';
const urlsToCache = [
  '/',
  '/style.css',
  '/script.js',
  '/home.js',
  '/player.js',
  '/shorts.js',
  '/cumb.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
