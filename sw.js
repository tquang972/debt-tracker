const CACHE_NAME = 'debt-tracker-v4';
const ASSETS = [
    './',
    './index.html',
    './css/theme.css',
    './css/style.css',
    './js/app.js',
    './js/store.js',
    './js/firebase-config.js',
    './js/initialData.js',
    './js/utils.js',
    './js/ui.js',
    './js/notifications.js',
    './js/lib/firebase-app-compat.js',
    './js/lib/firebase-firestore-compat.js',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Bypass cache for HTML pages to ensure latest index.html and inline scripts
    if (e.request.destination === 'document') {
        e.respondWith(fetch(e.request));
        return;
    }
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
