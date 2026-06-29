// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {

  // Skip unsupported requests
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith('http')
  ) {
    return;
  }

  const url = new URL(event.request.url);

  // API calls - always network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Offline - No network' }),
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      )
    );
    return;
  }

  // Cache First Strategy
  event.respondWith(
    caches.match(event.request).then(async (cached) => {

      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(event.request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }

        return response;

      } catch (err) {
        return caches.match('/index.html');
      }

    })
  );

});