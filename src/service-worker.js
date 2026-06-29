// service-worker.js
// MediShop PWA Service Worker

const CACHE_NAME = 'medishop-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/polyfills.js',
  '/manifest.json',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('MediShop PWA: Caching assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore cache errors during install
      });
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls — always go to network (don't cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline - No network' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Push Notifications (for future use)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'MediShop', {
      body: data.body || 'New notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
    })
  );
});
