const CACHE_NAME = 'lh-barber-pwa-v1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './site.webmanifest',
  './favicon.png',
  './favicon.ico',
  './apple-touch-icon.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  './logo.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache failed for some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore cross-origin non-cacheable or API/Firestore requests
  if (url.origin !== self.location.origin) {
    // Optionally cache Google Fonts
    if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
      event.respondWith(
        caches.open('lh-barber-fonts').then((cache) => {
          return cache.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          });
        })
      );
    }
    return;
  }

  // Same-origin static asset caching strategy: Cache First with Network Revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
    })
  );
});
