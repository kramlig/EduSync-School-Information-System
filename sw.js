// Production-safe Service Worker
// - Only caches the built `index.html` for navigation fallback
// - Uses network-first for navigation and assets, with cache fallback
// - Does NOT cache source files or external API responses

const CACHE_NAME = 'edusync-static-v1';
const NAV_CACHE = 'edusync-nav-v1';
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(NAV_CACHE).then((cache) => cache.addAll([OFFLINE_URL])).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Claim clients so the SW starts controlling pages immediately
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (![NAV_CACHE, CACHE_NAME].includes(k)) return caches.delete(k);
          return Promise.resolve();
        })
      );
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Do not interfere with requests to third-party APIs (e.g., Gemini)
  if (url.hostname !== self.location.hostname) return;

  // For navigation requests, use a network-first strategy with a cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          // Optionally update the cached navigation response
          const copy = resp.clone();
          caches.open(NAV_CACHE).then((cache) => cache.put(OFFLINE_URL, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // For same-origin static assets (scripts/styles/images) try network then cache
  if (['script', 'style', 'image', 'font'].includes(event.request.destination)) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          // Cache a copy for future offline use
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default: try network, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Listen for a message to skip waiting (useful when deploying a new SW)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
