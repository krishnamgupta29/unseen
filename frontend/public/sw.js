const CACHE_NAME = 'unseen-cache-v2';

// Only cache truly static assets (icons, manifest) — NOT HTML pages
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
];

// Install: cache only static assets, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: delete ALL old caches, claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET, API calls, and socket connections entirely
  if (
    request.method !== 'GET' ||
    request.url.includes('/api/') ||
    request.url.includes('socket.io') ||
    request.url.includes('onrender.com') ||
    request.url.includes('mongodb')
  ) {
    return;
  }

  // For HTML navigation requests (page loads/routes): ALWAYS network-first
  // This ensures login → /feed, and all Next.js route transitions work correctly
  // and never serve a stale cached HTML page
  const isNavigationRequest =
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html');

  if (isNavigationRequest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          // Only fall back to cache if truly offline
          return caches.match(request).then((cached) => {
            return cached || Response.error();
          });
        })
    );
    return;
  }

  // For static assets (JS, CSS, images, fonts): cache-first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Background refresh
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse?.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const toCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, toCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
