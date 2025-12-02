const CACHE_NAME = 'debt-tracker-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './login.html',
    './css/style.css',
    './css/theme.css',
    './js/app.js',
    './js/auth.js',
    './js/ui.js',
    './js/store.js',
    './js/firebase-config.js',
    './js/lib/firebase-app-compat.js',
    './js/lib/firebase-auth-compat.js',
    './js/lib/firebase-firestore-compat.js',
    './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - Network first, fallback to cache for data
// Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests (like Firebase)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if found
            if (cachedResponse) {
                // Update cache in background (stale-while-revalidate)
                fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }).catch(() => {
                    // Network failed, just use cache
                });
                return cachedResponse;
            }

            // If not in cache, fetch from network
            return fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
