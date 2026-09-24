// Service Worker for Onebite Bakery Progressive Web App
// Version: 2.0.0

const CACHE_NAME = 'onebitebakery-pwa-v2';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const RUNTIME_CACHE = `${CACHE_NAME}-runtime`;
const OFFLINE_CACHE = `${CACHE_NAME}-offline`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.svg',
  '/icons.svg',
  '/logo.svg',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/pwa-maskable-192x192.png',
  '/icons/pwa-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.json',
  '/manifest.webmanifest'
];

// Sensitive endpoints that MUST NEVER be cached
const NEVER_CACHE_PATTERNS = [
  /\/api\/auth\//i,
  /\/api\/admin\//i,
  /\/api\/payment\//i,
  /\/api\/checkout\//i,
  /\/api\/orders\//i,
  /\/api\/customer\//i,
  /\/api\/notifications\//i,
  /\/socket\.io\//i,
  /\/api\/users\//i,
  /\/api\/coupons\/validate/i
];

/**
 * Check if request URL matches dynamic API or realtime endpoints that must not be cached
 */
function isNeverCacheUrl(url) {
  const pathname = url.pathname;
  if (pathname.startsWith('/api') || pathname.includes('/api/')) {
    return true;
  }
  if (pathname.startsWith('/socket.io') || pathname.includes('socket.io')) {
    return true;
  }
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(pathname));
}

// ==========================================
// 1. INSTALL LIFECYCLE
// ==========================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_ASSETS);
      } catch (err) {
        console.warn('[SW] Precache incomplete (some static assets will load on demand):', err);
      }
    })
  );
  // Allow immediate activation when requested
  self.skipWaiting();
});

// ==========================================
// 2. ACTIVATE LIFECYCLE
// ==========================================
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, OFFLINE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ==========================================
// 3. FETCH INTERCEPTOR & CACHING STRATEGY
// ==========================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only process GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Ignore non-HTTP/HTTPS schemes (e.g. chrome-extension, blob, data)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. Strict Network-Only for Sensitive API endpoints
  if (isNeverCacheUrl(url)) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'You are currently offline. Please reconnect to perform this action.',
            offline: true
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 4. HTML Navigation Requests (Network-First with offline fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response from network, cache a copy in runtime cache
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          // Attempt to retrieve cached route first
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Otherwise serve dedicated offline fallback page
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || new Response('Offline - Onebite Bakery', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // 5. Static Assets (JS, CSS, Images, Fonts, SVGs, Webmanifest)
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(js|css|woff|woff2|ttf|eot|png|jpg|jpeg|svg|webp|ico|webmanifest)$/i.test(url.pathname);

  if (isStaticAsset) {
    // Stale-While-Revalidate Strategy for Static Assets
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 6. Generic Network-First for other safe GET requests
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// ==========================================
// 4. CLIENT MESSAGING (SKIP WAITING / UPDATES)
// ==========================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ==========================================
// 5. WEB PUSH NOTIFICATIONS
// ==========================================
self.addEventListener('push', (event) => {
  let data = {
    title: '🎂 Onebite Bakery',
    body: 'You have a new update from Onebite Bakery.',
    url: '/',
    tag: 'bakery-notification'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/pwa-192x192.png',
    badge: '/favicon.svg',
    tag: data.tag || (data.orderNumber ? `order-${data.orderNumber}` : 'general-notification'),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || (data.orderId ? `/customer/orders/${data.orderId}` : '/customer/orders'),
      orderId: data.orderId,
      orderNumber: data.orderNumber
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ==========================================
// 6. NOTIFICATION CLICK HANDLER
// ==========================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If an existing window is open on this origin, focus and navigate it
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            client.focus();
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
