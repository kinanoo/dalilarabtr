import { ImageResponse } from 'workers-og';
import cairoBold from '../fonts/Cairo-Bold.ttf';
import cairoRegular from '../fonts/Cairo-Regular.ttf';

/**
 * og.dalilarabtr.com — dynamic OpenGraph share-card generator.
 *
 * Restores the per-page branded share card the site had on Vercel (the old
 * /api/og route, dropped in the Cloudflare migration because @vercel/og is
 * Vercel-only). workers-og is the same Satori renderer compiled for the
 * Workers runtime, and the fonts + Arabic word-order fix + layout below are
 * carried over verbatim from the battle-tested old route.
 *
 * GET /?title=<text>&category=<text>  →  1200×630 PNG
 * Responses are immutable-cached (same title ⇒ same image) and served from
 * the Cloudflare cache on repeat shares.
 */

// ── verbatim helpers from the old /api/og route ────────────────────────────

// Satori renders Arabic words LTR — reverse word order + fix bracket/slash positions
function fixArabic(text) {
    return text
        .split(' ')
        .reverse()
        .map((word) => {
            if (word.includes('/')) word = word.split('/').reverse().join('/');
            if (word.startsWith('(') && word.endsWith(')')) return word;
            if (word.startsWith(')') && word.endsWith('(')) return word;
            if (word.startsWith('(')) return word.slice(1) + ')';
            if (word.startsWith(')')) return word.slice(1) + '(';
            if (word.endsWith(')')) return '(' + word.slice(0, -1);
            if (word.endsWith('(')) return ')' + word.slice(0, -1);
            return word;
        })
        .join(' ');
}

function splitLines(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        if (current && (current + ' ' + word).length > maxChars) {
            lines.push(current);
            current = word;
        } else {
            current = current ? current + ' ' + word : word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function truncateTitle(title, maxLen = 90) {
    if (title.length <= maxLen) return title;
    return title.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

function getTitleSize(len) {
    if (len > 80) return { fontSize: 40, charsPerLine: 38 };
    if (len > 60) return { fontSize: 44, charsPerLine: 34 };
    if (len > 40) return { fontSize: 48, charsPerLine: 30 };
    return { fontSize: 52, charsPerLine: 26 };
}

// Element helper (satori object notation — no JSX in a plain worker)
const h = (type, style, children) => ({ type, props: { style, children } });

function card(title, category) {
    const { fontSize, charsPerLine } = getTitleSize(title.length);
    const lines = splitLines(title, charsPerLine);

    return h('div', {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #065f46 0%, #0d9488 50%, #047857 100%)',
        fontFamily: 'Cairo', padding: '60px', position: 'relative',
    }, [
        // Dot pattern overlay
        h('div', {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '30px 30px', display: 'flex',
        }),
        // Top: category pill + title lines (right-aligned)
        h('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '20px' }, [
            ...(category ? [h('span', {
                background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 24px',
                borderRadius: '9999px', fontSize: '22px', fontWeight: 400,
                border: '1px solid rgba(255,255,255,0.3)',
            }, fixArabic(category))] : []),
            h('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' },
                lines.map((line) => h('div', {
                    color: 'white', fontSize: `${fontSize}px`, fontWeight: 700, lineHeight: 1.5,
                }, fixArabic(line)))),
        ]),
        // Bottom branding bar
        h('div', {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '16px 24px',
            border: '1px solid rgba(255,255,255,0.2)',
        }, [
            h('span', { color: 'rgba(255,255,255,0.7)', fontSize: '20px', fontWeight: 400 }, 'dalilarabtr.com'),
            h('span', { color: 'white', fontSize: '24px', fontWeight: 700 }, fixArabic('دليل العرب في تركيا')),
        ]),
    ]);
}

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            if (request.method !== 'GET') return new Response('method not allowed', { status: 405 });

            // Same title ⇒ same image: serve repeats straight from the CF cache.
            const cache = caches.default;
            const cached = await cache.match(request);
            if (cached) return cached;

            const rawTitle = (url.searchParams.get('title') || 'دليل العرب في تركيا').slice(0, 300);
            const category = (url.searchParams.get('category') || '').slice(0, 60);
            const title = truncateTitle(rawTitle.trim() || 'دليل العرب في تركيا');

            const img = new ImageResponse(card(title, category), {
                width: 1200,
                height: 630,
                fonts: [
                    { name: 'Cairo', data: cairoBold, weight: 700, style: 'normal' },
                    { name: 'Cairo', data: cairoRegular, weight: 400, style: 'normal' },
                ],
            });

            const res = new Response(img.body, {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*',
                },
            });
            ctx.waitUntil(cache.put(request, res.clone()));
            return res;
        } catch (e) {
            // Never break a crawler: redirect to the static site-wide OG image.
            return Response.redirect('https://dalilarabtr.com/og-image.jpg', 302);
        }
    },
};
