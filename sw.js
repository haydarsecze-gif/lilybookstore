const CACHE_NAME = 'lily-bookstore-v9';
const ASSETS = [
  './',
  './index.html',
  './styles/variables.css',
  './styles/main.css',
  './styles/components.css',
  './styles/responsive.css',
  './js/app.js',
  './js/store.js',
  './js/goodreads.js',
  './assets/logo_light.png',
  './assets/logo_dark.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Skip caching non-GET requests (e.g. Chat APIs, sync POST/PUT requests)
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  // Only cache assets from our own origin
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache asynchronously (Stale-While-Revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {/* Ignore background network update errors */});
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
