// Service worker — push notifications ONLY. No page/RSC/asset caching.
//
// WHY NO FETCH/CACHE HANDLER:
// A previous version cached navigations/assets. On a frequently-redeployed
// Cloudflare Worker that made the SW serve a STALE page or RSC payload during a
// soft (client-side) navigation — which is invisible to curl (curl bypasses the
// SW) and produced the "click a link → stuck on the loading skeleton, refresh
// fixes it" bug, with NO JavaScript error (so a ChunkLoadError guard never
// fired). Removing the caching layer means the browser always goes to the
// network (Cloudflare's own edge cache still serves fast), so the SW can never
// hand back stale content. Push notifications are unaffected.
//
// The version below force-activates and DELETES every old cache so any browser
// still running the old caching SW is healed on its next load.

const CACHE_NAME = 'daleel-arab-v4-push-only';

// Install: take over as soon as possible, no pre-caching.
self.addEventListener('install', () => {
    self.skipWaiting();
});

// Activate: wipe EVERY cache the old SW created (no exceptions), then claim all
// open tabs so the stale-serving SW stops controlling them immediately.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(names.map((n) => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

// NOTE: intentionally NO 'fetch' listener. The browser handles every request
// directly against the network/edge — nothing is intercepted or cached here.

// ─── Push Notifications ───────────────────────────────────────────────────
self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) return;

    const data = event.data?.json() ?? {};
    const title = data.title || 'دليل العرب في تركيا';
    const message = data.message || 'تحديث جديد متوفر';
    // Validate URL is same-origin relative path (prevent phishing via push notifications)
    var rawUrl = data.url || '/updates';
    var url = '/updates';
    if (typeof rawUrl === 'string' && rawUrl.startsWith('/') && !rawUrl.startsWith('//')) {
        url = rawUrl;
    }

    event.waitUntil(
        self.registration.showNotification(title, {
            body: message,
            icon: '/android-chrome-192x192.png',
            badge: '/android-chrome-192x192.png',
            data: { url: url },
            actions: [{ action: 'open', title: 'عرض التفاصيل' }],
            dir: 'rtl',
            lang: 'ar',
            vibrate: [100, 50, 100],
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    var targetUrl = event.notification.data.url || '/updates';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // If the site is already open, focus it and navigate
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url.indexOf(self.registration.scope) !== -1 && 'focus' in client) {
                    return client.focus().then(function (c) {
                        if ('navigate' in c) return c.navigate(targetUrl);
                    });
                }
            }
            // Otherwise open a new window
            return clients.openWindow(targetUrl);
        })
    );
});
