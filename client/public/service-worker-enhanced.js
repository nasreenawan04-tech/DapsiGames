const CACHE_NAME = 'dapsigames-v2';
const STATIC_CACHE = 'dapsigames-static-v2';
const DYNAMIC_CACHE = 'dapsigames-dynamic-v2';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, falling back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests from being cached
  if (request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the fetched response
        caches.open(DYNAMIC_CACHE)
          .then((cache) => {
            cache.put(request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-study-sessions') {
    event.waitUntil(syncStudySessions());
  }
});

// Push notification support
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'DapsiGames';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: data.url || '/',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

// Helper function to sync study sessions
async function syncStudySessions() {
  try {
    // Get pending sync data from IndexedDB
    const db = await openDB();
    const pendingSessions = await db.getAll('pendingSessions');
    
    // Sync each session
    for (const session of pendingSessions) {
      await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });
      
      // Remove from pending after successful sync
      await db.delete('pendingSessions', session.id);
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DapsiGamesDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingSessions')) {
        db.createObjectStore('pendingSessions', { keyPath: 'id' });
      }
    };
  });
}
