// public/sw.js - Simple Service Worker for Ace Your Role

const CACHE_NAME = 'ace-your-role-v1';
const STATIC_CACHE = [
  '/',
  '/dashboard',
  '/manifest.json',
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently - always go to network
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Network unavailable' }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Handle static assets - cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Only cache successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Return offline page or basic error response
        if (event.request.destination === 'document') {
          return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Offline - Ace Your Role</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: #f3f4f6; }
                .container { max-width: 400px; margin: 0 auto; background: white; padding: 2rem; border-radius: 1rem; }
                h1 { color: #667eea; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🌐 You're Offline</h1>
                <p>Please check your internet connection and try again.</p>
                <button onclick="window.location.reload()">Retry</button>
              </div>
            </body>
            </html>
            `,
            {
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
      })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for voice session data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-voice-data') {
    console.log('Background sync triggered for voice data');
    // Handle background sync logic here if needed
  }
});

console.log('Service Worker loaded successfully');
