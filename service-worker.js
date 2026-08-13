const CACHE_NAME = 'phr-cache-v2';

// List of all the files we want to save to the phone for offline use
const urlsToCache = [
    './',
    './index.html',
    './css/tokens.css',
    './css/global.css',
    './css/layout.css',
    './css/components.css',
    './js/app.js',
    './js/router.js',
    './js/database.js',
    './js/features/home.js',
    './js/features/profile.js',
    './js/features/currentHealth.js',
    './js/features/records.js',
    './js/features/summary.js',
    './js/features/search.js',
    './assets/logo.png'
];

// 1. Install Event: Cache all the files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. Fetch Event: Serve files from cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// 3. Activate Event: Clean up old caches if we update the version number
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});