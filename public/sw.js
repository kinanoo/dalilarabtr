const CACHE_NAME = 'daleel-arab-cache-v1';
const OFFLINE_URL = '/offline';

const URLS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/logo.png',
    '/android-chrome-192x192.png',
    '/globals.css', // This might be hashed in build, but good to try
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(URLS_TO_CACHE).catch(err => {
                console.warn('Cache addAll error', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate Event
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
    self.clients.claim();
});

// Fetch Event (Network First, then Cache)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    // Don't cache API calls or large files unnecessarily
                    if (!event.request.url.includes('/api/') && !event.request.url.includes('supabase')) {
                        cache.put(event.request, responseToCache);
                    }
                });

                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    // Fallback for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                });
            })
    );
});

// Keep existing Push Logic
self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    const data = event.data?.json() ?? {};
    const title = data.title || 'دليل العرب في تركيا';
    const message = data.message || 'تحديث جديد متوفر';
    const icon = '/android-chrome-192x192.png';
    const badge = '/android-chrome-192x192.png';
    const url = data.url || '/';

    const options = {
        body: message,
        icon: icon,
        badge: badge,
        data: {
            url: url
        },
        actions: [
            {
                action: 'open',
                title: 'عرض التفاصيل'
            }
        ],
        dir: 'rtl',
        lang: 'ar',
        vibrate: [100, 50, 100]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
