const CACHE_NAME = 'daleel-arab-v2';
const OFFLINE_URL = '/offline.html';

// ─── Install: pre-cache offline page & app icon only ──────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll([OFFLINE_URL, '/android-chrome-192x192.png']))
            .then(() => self.skipWaiting())
    );
});

// ─── Activate: delete OLD cache versions, take control ────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) =>
                Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
            )
            .then(() => self.clients.claim())
    );
});

// ─── Fetch: smart caching strategy ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle GET requests
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Skip cross-origin requests (Supabase, Google Analytics, etc.)
    if (url.origin !== self.location.origin) return;

    // Skip API calls — always fresh
    if (url.pathname.startsWith('/api/')) return;

    // ── Cache-first for Next.js static assets (hashed filenames never go stale)
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const cloned = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // ── Cache-first for images & fonts ────────────────────────────────────
    if (request.destination === 'image' || request.destination === 'font') {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const cloned = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
                    }
                    return response;
                }).catch(() => cached);
            })
        );
        return;
    }

    // ── Network-first for page navigation (offline page as fallback) ───────
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() =>
                caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
            )
        );
    }
});

// ─── Push Notifications ───────────────────────────────────────────────────
self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) return;

    const data = event.data?.json() ?? {};
    const title = data.title || 'دليل العرب في تركيا';
    const message = data.message || 'تحديث جديد متوفر';
    // Default to /updates if no specific URL — never just "/"
    const url = (data.url && data.url !== '/') ? data.url : '/updates';

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
