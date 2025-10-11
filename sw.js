// Service Worker for Caching Application Assets

const CACHE_NAME = 'edusync-assets-v1';

// App Shell: The core files needed to display the initial UI.
// Other files are cached on-the-fly as they are requested.
const urlsToCache = [
  '/',
  '/index.html',
  '/src/index.tsx',
  '/App.tsx',
  '/components/Sidebar.tsx',
  '/components/Header.tsx',
  '/components/icons.tsx',
  '/components/FullScreenLoader.tsx',
  '/components/Spinner.tsx',
  '/components/LoginScreen.tsx',
  '/hooks/useSchoolData.ts',
  '/types.ts',
  'https://depedph.com/wp-content/uploads/2024/01/deped-logo-symbol-philippines-1024x1024.png',
  'https://cdn.tailwindcss.com'
];

/**
 * On install, open a cache and add the core app shell assets to it.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Service Worker: Failed to cache app shell:', err);
      })
  );
});

/**
 * On activation, clean up any old caches that are no longer needed.
 */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * On fetch, intercept network requests and serve from cache if available.
 * This is a "Cache falling back to Network" strategy.
 */
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // Do not cache requests to the Gemini API.
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // If the response is in the cache, return it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from the network.
        return fetch(event.request).then(
          (networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response because it's a stream and can only be consumed once.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Add the new response to the cache.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch((error) => {
          console.error('Service Worker: Fetch failed. User may be offline.', error);
          // In a more advanced implementation, you could return a fallback offline page here.
        });
      })
  );
});
