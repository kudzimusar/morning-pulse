// Morning Pulse Service Worker
// Version 1.0.0

const CACHE_NAME = 'morning-pulse-v1.0.0';
const RUNTIME_CACHE = 'morning-pulse-runtime-v1.0.0';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/morning-pulse/',
  '/morning-pulse/index.html',
  '/morning-pulse/manifest.json',
  '/morning-pulse/icon-192x192.png',
  '/morning-pulse/icon-512x512.png',
  '/morning-pulse/apple-touch-icon.png'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching essential assets');
        return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[Service Worker] Cache install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strategy: Cache First for static assets, Network First for API/data
  if (request.url.includes('/assets/') || 
      request.url.includes('/icon') || 
      request.url.includes('/screenshots') ||
      request.url.endsWith('.png') ||
      request.url.endsWith('.jpg') ||
      request.url.endsWith('.svg') ||
      request.url.endsWith('.css') ||
      request.url.endsWith('.js')) {
    // Cache First for static assets
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(RUNTIME_CACHE)
                  .then((cache) => {
                    cache.put(request, responseToCache);
                  });
              }
              return response;
            })
            .catch(() => {
              // Return offline fallback if available
              if (request.url.endsWith('.html')) {
                return caches.match('/morning-pulse/index.html');
              }
            });
        })
    );
  } else {
    // Network First for dynamic content
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback to index.html for navigation requests
              if (request.mode === 'navigate') {
                return caches.match('/morning-pulse/index.html');
              }
            });
        })
    );
  }
});

// Background Sync - for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-news') {
    event.waitUntil(syncNews());
  }
});

async function syncNews() {
  try {
    // This would sync news data when connection is restored
    console.log('[Service Worker] Syncing news data...');
    // Add your sync logic here
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/morning-pulse/icon-192x192.png',
    badge: '/morning-pulse/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'morning-pulse-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Morning Pulse', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/morning-pulse/')
  );
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-news') {
    event.waitUntil(updateNews());
  }
});

async function updateNews() {
  try {
    console.log('[Service Worker] Periodic sync: updating news...');
    // Add your periodic update logic here
  } catch (error) {
    console.error('[Service Worker] Periodic sync failed:', error);
  }
}
