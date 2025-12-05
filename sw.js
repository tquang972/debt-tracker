const CACHE_NAME = 'debt-tracker-v12';
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
    // Force immediate activation
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    // Take control of all clients immediately
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Fetch event - Network first, fallback to cache for data
// Stale-while-revalidate for static assets
// Fetch event - Network first for local assets, stale-while-revalidate for others
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests (like Firebase)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    const requestUrl = new URL(event.request.url);

    // Network First strategy for HTML, CSS, JS to ensure updates are seen immediately
    if (requestUrl.pathname.endsWith('.html') ||
        requestUrl.pathname.endsWith('.css') ||
        requestUrl.pathname.endsWith('.js')) {

        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Stale-while-revalidate for other assets (images, fonts)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }).catch(() => { });
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
