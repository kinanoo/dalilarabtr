self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    const data = event.data?.json() ?? {};
    const title = data.title || 'دليل العرب في تركيا';
    const message = data.message || 'تحديث جديد متوفر';
    const icon = '/android-chrome-192x192.png';
    const badge = '/android-chrome-192x192.png'; // Small icon for notification bar
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

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
