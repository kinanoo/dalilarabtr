const CACHE_NAME = 'daleel-arab-cache-v1';

// Install Event - minimal, just activate immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate Event - clear any old caches and take control
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(cacheNames.map((name) => caches.delete(name)));
        })
    );
    self.clients.claim();
});

// No fetch handler - browser handles everything normally
// No offline caching, no stored pages, no data stored on device

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
