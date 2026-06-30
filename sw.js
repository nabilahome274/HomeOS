/**
 * AUMATIQ Personal Productivity OS — Service Worker
 * Version 3.0
 * 
 * Enables offline support and PWA functionality.
 */

const CACHE_NAME = 'aumatiq-cache-v3';
const OFFLINE_URL = 'index.html';

// Files to cache
const FILES_TO_CACHE = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
  // Add any other assets here
];

// Install event — cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching files');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event — serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        // Otherwise fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            // Clone and cache the response
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return offline page
            // but only for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement data sync logic here
  // This will sync pending entries when back online
  console.log('[Service Worker] Syncing data...');
  // You can use IndexedDB to store pending operations
}

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});