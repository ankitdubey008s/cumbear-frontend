/**
 * ==========================================================================
 * CUMBEAR — SERVICE WORKER
 * --------------------------------------------------------------------------
 * Cache strategy:
 *   - HTML shell (/, /shorts, /categories → all serve index.html)
 *       → Network-first, fallback to cache
 *   - Static assets (/style.css, /cumb.png, /manifest.json, fonts)
 *       → Cache-first, refresh in background
 *   - API (/api/*)
 *       → Network-first with 4s timeout, no caching on failure
 *   - Everything else
 *       → Network-first
 *
 * Bump CACHE_VERSION to force-refresh every cached asset.
 * ==========================================================================
 */
const CACHE_VERSION = 'cumbear-v2';
const STATIC_CACHE  = CACHE_VERSION + '-static';
const SHELL_CACHE   = CACHE_VERSION + '-shell';

const SHELL_ROUTES = ['/', '/shorts', '/categories'];

const STATIC_ASSETS = [
  '/style.css',
  '/cumb.png',
  '/manifest.json',
  '/robots.txt'
];

/* ---------- install ---------- */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function () {
      return caches.open(SHELL_CACHE);
    }).then(function (cache) {
      /* Pre-cache shell — failures are non-fatal (e.g. offline install) */
      return Promise.all(
        SHELL_ROUTES.map(function (route) {
          return fetch(route).then(function (res) {
            if (res.ok) return cache.put(route, res.clone());
          }).catch(function () { /* ignore */ });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ---------- activate ---------- */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) {
          return name.indexOf('cumbear-') === 0 &&
                 name.indexOf(CACHE_VERSION) === -1;
        }).map(function (name) {
          return caches.delete(name);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ---------- helpers ---------- */
function isApiRequest(url) {
  return url.pathname.indexOf('/api/') === 0;
}

function isStaticAsset(url) {
  return STATIC_ASSETS.indexOf(url.pathname) !== -1 ||
         /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$/i.test(url.pathname);
}

function isShellRoute(url) {
  return SHELL_ROUTES.indexOf(url.pathname) !== -1;
}

/* ---------- network with timeout ---------- */
function fetchWithTimeout(request, timeoutMs) {
  return new Promise(function (resolve, reject) {
    const timer = setTimeout(function () {
      reject(new Error('network timeout'));
    }, timeoutMs);

    fetch(request).then(function (res) {
      clearTimeout(timer);
      resolve(res);
    }).catch(function (err) {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/* ---------- fetch handler ---------- */
self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return; /* never cache mutations */

  const url = new URL(req.url);

  /* Only handle same-origin requests; let cross-origin ads/analytics pass through */
  if (url.origin !== self.location.origin) return;

  /* -------- API: network-first, no fallback cache -------- */
  if (isApiRequest(url)) {
    event.respondWith(
      fetchWithTimeout(req, 4000).catch(function () {
        return new Response(JSON.stringify({
          success: false,
          error: 'offline',
          data: []
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  /* -------- Static assets: cache-first -------- */
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) {
          /* Refresh in background (stale-while-revalidate) */
          fetch(req).then(function (res) {
            if (res.ok) {
              caches.open(STATIC_CACHE).then(function (cache) {
                cache.put(req, res.clone());
              });
            }
          }).catch(function () { /* ignore */ });
          return cached;
        }
        return fetch(req).then(function (res) {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(function (cache) {
              cache.put(req, clone);
            });
          }
          return res;
        }).catch(function () {
          return new Response('', { status: 504 });
        });
      })
    );
    return;
  }

  /* -------- Shell routes: network-first, cache fallback -------- */
  if (isShellRoute(url)) {
    event.respondWith(
      fetchWithTimeout(req, 4000).then(function (res) {
        const clone = res.clone();
        caches.open(SHELL_CACHE).then(function (cache) {
          cache.put(url.pathname, clone);
        });
        return res;
      }).catch(function () {
        return caches.match(url.pathname).then(function (cached) {
          return cached || caches.match('/');
        });
      })
    );
    return;
  }

  /* -------- Other same-origin: network-first, cached fallback -------- */
  event.respondWith(
    fetchWithTimeout(req, 4000).catch(function () {
      return caches.match(req).then(function (cached) {
        return cached || new Response('', { status: 504 });
      });
    })
  );
});
