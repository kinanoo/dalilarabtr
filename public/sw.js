// Service worker — push notifications + SAFE static-asset caching.
//
// CACHING POLICY (why it's safe this time):
// A previous version cached NAVIGATIONS/RSC and served a STALE page on soft
// client-side navigation → the "click a link → stuck on the loading skeleton,
// refresh fixes it" bug (invisible to curl, no JS error). We do NOT do that.
//
// This SW caches ONLY immutable, content-hashed build assets under
// `/_next/static/…` (JS chunks, CSS, fonts). Their filenames contain a content
// hash, so a new deploy emits NEW filenames → a cache-first hit can NEVER be
// stale (the old name is simply never requested again). Navigations, RSC
// (`?_rsc=` / Accept: text/x-component), API calls, Supabase, and anything else
// go straight to the network — never intercepted, never cached. That keeps the
// page/RSC always fresh (Cloudflare's edge already serves those fast) while
// letting a repeat visit / PWA cold-launch load all the heavy JS from disk
// cache instantly instead of re-downloading ~257KB over a weak mobile network
// (the cause of the multi-second logo splash when opening the installed app).

const PUSH_VERSION = 'daleel-arab-v5-push';
// STABLE across deploys on purpose: content-hashed assets stay valid forever,
// so persisting this cache between deploys is what makes repeat launches fast.
const STATIC_CACHE = 'daleel-static-v1';
// Bound the cache so orphaned assets from prior builds can't grow it forever.
// ~96 entries comfortably holds one build's chunks/css/fonts; older entries
// (oldest insertion first) are evicted and harmlessly re-fetched if needed.
const MAX_ENTRIES = 96;

// Fire-and-forget LRU trim: delete the oldest entries beyond MAX_ENTRIES.
// cache.keys() returns requests in insertion order, so the front is oldest.
function trimStaticCache(cache) {
    cache.keys().then((keys) => {
        const overflow = keys.length - MAX_ENTRIES;
        for (let i = 0; i < overflow; i++) cache.delete(keys[i]);
    }).catch(() => {});
}

// Install: activate immediately, no pre-caching (assets are cached on first use).
self.addEventListener('install', () => {
    self.skipWaiting();
});

// Activate: delete any legacy caches EXCEPT our static-asset cache, then claim
// open tabs. Keeping STATIC_CACHE across deploys preserves the speed win;
// everything else (old push-only caches, the old navigation cache) is wiped.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter((n) => n !== STATIC_CACHE).map((n) => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

// ─── Fetch: cache-first for immutable build assets ONLY ─────────────────────
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Only ever touch GET. Everything else (POST /api/track, etc.) passes through.
    if (req.method !== 'GET') return;

    let url;
    try { url = new URL(req.url); } catch { return; }

    // Same-origin only.
    if (url.origin !== self.location.origin) return;

    // HARD EXCLUDES — must always hit the network, never cached:
    //  • RSC payloads for soft navigations (this was the stale-page bug).
    //  • Any navigation request (the HTML document itself).
    if (url.searchParams.has('_rsc')) return;
    if (req.mode === 'navigate') return;
    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/x-component')) return;

    // ONLY cache immutable, content-hashed build output. These filenames change
    // on every deploy, so a cache hit is guaranteed fresh.
    if (!url.pathname.startsWith('/_next/static/')) return;

    event.respondWith(
        caches.open(STATIC_CACHE).then((cache) =>
            cache.match(req).then((hit) => {
                if (hit) return hit;
                return fetch(req).then((res) => {
                    // Only cache a clean, complete response.
                    if (res && res.status === 200 && res.type === 'basic') {
                        cache.put(req, res.clone()).then(() => trimStaticCache(cache));
                    }
                    return res;
                }).catch(() => hit); // offline + not cached → let it fail naturally
            })
        )
    );
});

// ─── Push Notifications ─────────────────────────────────────────────────────
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

// Referenced so bundlers/linters keep the constant; documents the push cache id.
void PUSH_VERSION;
