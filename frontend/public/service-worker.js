/**
 * Automagik Forge Service Worker
 *
 * Provides offline support and asset caching for PWA functionality.
 * Uses a cache-first strategy for static assets.
 * API calls are NEVER cached to prevent auth/session data leakage.
 */

const CACHE_NAME = 'forge-v1';
const STALE_WHILE_REVALIDATE_TIMEOUT = 3000; // 3s timeout for stale-while-revalidate

// Assets to cache on install (critical assets for offline support)
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/site.webmanifest',
];

// Cache file patterns (what to cache on first request)
const CACHE_PATTERNS = {
  // Static assets - cache aggressively
  static: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i,
  // HTML files - cache but validate
  html: /\.html$/i,
  // Don't cache these
  nocache: /\.(map|json)$/i,
};

/**
 * Install event - cache critical assets for offline support
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching critical assets');
      return cache.addAll(CRITICAL_ASSETS).catch((error) => {
        // Some assets might not exist yet - that's ok
        console.warn('[Service Worker] Failed to cache some critical assets:', error);
        return Promise.resolve();
      });
    }).then(() => {
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all caches except current CACHE_NAME
          // This includes old 'forge-api-v1' cache (no longer used for security)
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // API calls: NEVER cache (authenticated, user-specific data)
  // Caching API responses ignores auth headers and can leak data between users
  if (url.pathname.startsWith('/api/')) {
    // Let network handle API calls directly, no caching
    return;
  }

  // Static assets: cache-first with network fallback
  if (CACHE_PATTERNS.static.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(event.request, CACHE_NAME));
    return;
  }

  // HTML files: stale-while-revalidate
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(staleWhileRevalidateStrategy(event.request, CACHE_NAME));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirstStrategy(event.request, CACHE_NAME));
});

/**
 * Cache-first strategy: return from cache if available, fallback to network
 * Best for static assets that rarely change
 */
function cacheFirstStrategy(request, cacheName) {
  return caches.match(request).then((response) => {
    if (response) {
      return response;
    }

    return fetch(request).then((response) => {
      // Don't cache non-successful responses
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      // Clone response and cache it
      const responseClone = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });

      return response;
    }).catch((error) => {
      console.warn('[Service Worker] Fetch failed for', request.url, error);
      // Return offline page or empty response
      return new Response('Offline - Resource not available', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    });
  });
}

/**
 * Network-first strategy: try network first, fall back to cache
 * Best for API calls and dynamic content
 */
function networkFirstStrategy(request, cacheName) {
  return fetch(request)
    .then((response) => {
      // Don't cache non-successful responses
      if (!response || response.status !== 200) {
        return response;
      }

      // Clone and cache successful response
      const responseClone = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });

      return response;
    })
    .catch((error) => {
      console.warn('[Service Worker] Network request failed, checking cache:', request.url);

      // Fall back to cache
      return caches.match(request).then((response) => {
        if (response) {
          console.log('[Service Worker] Serving from cache:', request.url);
          return response;
        }

        // Cache miss - return error response
        return new Response('Offline - Resource not cached', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    });
}

/**
 * Stale-while-revalidate strategy: return cached version immediately,
 * then fetch fresh version in background
 * Best for HTML pages that can be slightly stale
 */
function staleWhileRevalidateStrategy(request, cacheName) {
  return caches.match(request).then((response) => {
    const fetchPromise = fetch(request).then((networkResponse) => {
      // Don't cache non-successful responses
      if (!networkResponse || networkResponse.status !== 200) {
        return networkResponse;
      }

      // Update cache in background
      const responseClone = networkResponse.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });

      return networkResponse;
    }).catch((error) => {
      console.warn('[Service Worker] Background fetch failed:', request.url, error);
      // Ignore errors on background fetch
    });

    // Return cached version immediately if available
    return response || fetchPromise;
  });
}

/**
 * Message handler for client communication
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded successfully');
