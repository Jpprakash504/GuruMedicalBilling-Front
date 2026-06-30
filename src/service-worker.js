// service-worker.js
// MediShop PWA Service Worker - AUTO UPDATE VERSION

// IMPORTANT: Change this version number every time you deploy new code!
const CACHE_VERSION = 'medishop-v2'; // ← increment this on every deploy
const CACHE_NAME = CACHE_VERSION;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install - cache static assets, activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('MediShop PWA: Caching assets', CACHE_VERSION);
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting(); // Force new SW to activate immediately
});

// Activate - delete ALL old caches, take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('MediShop PWA: Deleting old cache', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Fetch - NETWORK FIRST strategy (always try fresh data, fallback to cache)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls — always network, never cache
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

  // Navigation requests (page loads / refreshes) — NETWORK FIRST
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline - try cache, fallback to index.html for SPA routing
          return caches.match(event.request).then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // Other assets (JS, CSS, images) — Network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Listen for skip waiting message from app (manual update trigger)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
