import { ImageResponse } from 'workers-og';
import cairoBold from '../fonts/Cairo-Bold.ttf';
import cairoRegular from '../fonts/Cairo-Regular.ttf';

/**
 * og.dalilarabtr.com — dynamic OpenGraph share-card generator.
 *
 * Standalone per-page branded share-card generator for Cloudflare Workers.
 * workers-og provides a Satori-compatible renderer for the Workers runtime,
 * and the fonts + Arabic word-order fix + layout below are kept here so the
 * main app does not need to render OG images itself.
 *
 * GET /?title=<text>&category=<text>  →  1200×630 PNG
 * Responses are immutable-cached (same title ⇒ same image) and served from
 * the Cloudflare cache on repeat shares.
 */

// ── Arabic shaping ─────────────────────────────────────────────────────────
//
// Why this exists: Satori lays out text by summing each character's advance
// width from the font's cmap, and for Arabic it looks up the BASE codepoint —
// whose glyph is the isolated, standalone form. It then draws the connected
// form, which is much narrower. The leftover width stays in the box, so every
// word carried a chunk of trailing slack and titles came out with ragged,
// oversized gaps. Setting the gap between words to zero barely moved them,
// which is what proved the space was inside the word boxes rather than between
// them.
//
// The fix is to hand Satori text that is already shaped, so the codepoint it
// measures is the glyph it draws. Unicode's Arabic Presentation Forms-B block
// exists for exactly this.
//
// Verified against both bundled Cairo weights' cmap before writing the table:
// they contain exactly the 89 non-isolated presentation forms (final, initial,
// medial, plus the four lam-alef ligature pairs) and NOT ONE isolated form.
// That is not a gap — it is how the font is built: the base codepoint already
// maps to the isolated glyph. So the table below stores only the three
// connected forms, and the isolated case deliberately falls through to the
// original character.
//
// Base letter -> [final, initial, medial]; null where the letter has no such
// form because it never joins to the following letter.
const AR_FORMS = {
    'آ': ['ﺂ', null, null],       'أ': ['ﺄ', null, null],
    'ؤ': ['ﺆ', null, null],       'إ': ['ﺈ', null, null],
    'ئ': ['ﺊ', 'ﺋ', 'ﺌ'], 'ا': ['ﺎ', null, null],
    'ب': ['ﺐ', 'ﺑ', 'ﺒ'], 'ة': ['ﺔ', null, null],
    'ت': ['ﺖ', 'ﺗ', 'ﺘ'], 'ث': ['ﺚ', 'ﺛ', 'ﺜ'],
    'ج': ['ﺞ', 'ﺟ', 'ﺠ'], 'ح': ['ﺢ', 'ﺣ', 'ﺤ'],
    'خ': ['ﺦ', 'ﺧ', 'ﺨ'], 'د': ['ﺪ', null, null],
    'ذ': ['ﺬ', null, null],       'ر': ['ﺮ', null, null],
    'ز': ['ﺰ', null, null],       'س': ['ﺲ', 'ﺳ', 'ﺴ'],
    'ش': ['ﺶ', 'ﺷ', 'ﺸ'], 'ص': ['ﺺ', 'ﺻ', 'ﺼ'],
    'ض': ['ﺾ', 'ﺿ', 'ﻀ'], 'ط': ['ﻂ', 'ﻃ', 'ﻄ'],
    'ظ': ['ﻆ', 'ﻇ', 'ﻈ'], 'ع': ['ﻊ', 'ﻋ', 'ﻌ'],
    'غ': ['ﻎ', 'ﻏ', 'ﻐ'], 'ف': ['ﻒ', 'ﻓ', 'ﻔ'],
    'ق': ['ﻖ', 'ﻗ', 'ﻘ'], 'ك': ['ﻚ', 'ﻛ', 'ﻜ'],
    'ل': ['ﻞ', 'ﻟ', 'ﻠ'], 'م': ['ﻢ', 'ﻣ', 'ﻤ'],
    'ن': ['ﻦ', 'ﻧ', 'ﻨ'], 'ه': ['ﻪ', 'ﻫ', 'ﻬ'],
    'و': ['ﻮ', null, null],       'ى': ['ﻰ', null, null],
    'ي': ['ﻲ', 'ﻳ', 'ﻴ'],
};

// LAM followed by one of these alefs is a single ligature glyph, never two
// letters. [isolated, final] — both present in the font.
const LAM_ALEF = {
    'آ': ['ﻵ', 'ﻶ'], 'أ': ['ﻷ', 'ﻸ'],
    'إ': ['ﻹ', 'ﻺ'], 'ا': ['ﻻ', 'ﻼ'],
};

const TATWEEL = 'ـ';

// Harakat and other marks sit above/below a letter and must not break a join —
// they are skipped when looking at neighbours but kept in the output.
const isTransparent = (c) =>
    (c >= 'ؐ' && c <= 'ؚ') || (c >= 'ً' && c <= 'ٟ') ||
    c === 'ٰ' || (c >= 'ۖ' && c <= 'ۜ') || (c >= '۟' && c <= 'ۨ');

// Can this character take a join from the letter BEFORE it? True for every
// letter that has a final form.
const joinsBack = (c) => c === TATWEEL || Object.prototype.hasOwnProperty.call(AR_FORMS, c);
// Does this character connect FORWARD to the next letter? Only dual-joining
// letters do, and those are exactly the ones with an initial form.
const joinsForward = (c) => c === TATWEEL || (AR_FORMS[c] ? AR_FORMS[c][1] !== null : false);

function shapeArabic(text) {
    if (!/[؀-ۿ]/.test(text)) return text;
    const chars = [...text];
    const out = [];

    const neighbour = (from, step) => {
        for (let i = from + step; i >= 0 && i < chars.length; i += step) {
            if (!isTransparent(chars[i])) return chars[i];
        }
        return null;
    };

    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (!AR_FORMS[ch] && ch !== TATWEEL) { out.push(ch); continue; }

        const prev = neighbour(i, -1);
        const joinPrev = prev !== null && joinsForward(prev);

        // LAM + ALEF collapses to one ligature. Consume both.
        const nxt = neighbour(i, 1);
        if (ch === 'ل' && nxt && LAM_ALEF[nxt]) {
            out.push(LAM_ALEF[nxt][joinPrev ? 1 : 0]);
            // Skip forward past the alef, carrying any marks between them.
            for (let j = i + 1; j < chars.length; j++) {
                if (chars[j] === nxt) { i = j; break; }
                out.push(chars[j]);
            }
            continue;
        }

        if (ch === TATWEEL) { out.push(ch); continue; }

        const joinNext = joinsForward(ch) && nxt !== null && joinsBack(nxt);
        const [fin, ini, med] = AR_FORMS[ch];
        // Isolated falls through to the base character on purpose — see above.
        if (joinPrev && joinNext) out.push(med || fin || ch);
        else if (joinPrev)        out.push(fin || ch);
        else if (joinNext)        out.push(ini || ch);
        else                      out.push(ch);
    }
    return out.join('');
}

// ── logical order -> visual order ──────────────────────────────────────────
//
// This replaces the old fixArabic(), which reversed WORD order only and left
// the letters inside each word alone. That worked because the renderer saw
// base Arabic codepoints, recognised them as right-to-left, and reversed the
// letters itself.
//
// Once the text is pre-shaped that stops happening: presentation forms are
// compatibility characters and the renderer leaves them in the order given, so
// shaping alone produced correctly-joined words spelled backwards. Since we are
// now taking over shaping, we have to take over ordering too — the two cannot
// be split between us and the renderer.
//
// So: emit the string back-to-front, mirroring brackets, but keep each Latin
// or numeric run in its own left-to-right order. That last part matters —
// titles here carry things like "2026" and "e-Devlet", and a blind reversal
// would render them backwards.
const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«' };
const isLtrChar = (c) => /[A-Za-z0-9À-ÖØ-öø-ÿĞğİıŞşÇçÖöÜü]/.test(c);

// Group each base letter with the marks that sit on it. A haraka is not an
// independent character: it must follow its base, and it must stay in the same
// box as its base. Reversing or splitting per character breaks both — which is
// how «مجانياً» lost its tanween, the mark landing before the alef instead of
// on it.
function toClusters(text) {
    const out = [];
    for (const ch of text) {
        if (isTransparent(ch) && out.length) out[out.length - 1] += ch;
        else out.push(ch);
    }
    return out;
}

function visualOrder(text) {
    if (!/[؀-ۿ]/.test(text)) return text;
    const chars = toClusters(text);
    const out = [];
    let i = chars.length - 1;
    while (i >= 0) {
        if (isLtrChar(chars[i])) {
            // Walk back over the whole Latin/number run — including the
            // separators inside it (2026-07-18, e-Devlet, turkiye.gov.tr) —
            // then emit it unreversed.
            let j = i;
            while (j >= 0 && (isLtrChar(chars[j]) ||
                   (/[.\-_/:]/.test(chars[j]) && j > 0 && isLtrChar(chars[j - 1])))) j--;
            out.push(chars.slice(j + 1, i + 1).join(''));
            i = j;
        } else {
            out.push(MIRROR[chars[i]] || chars[i]);
            i--;
        }
    }
    return out.join('');
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

// Emit already-ordered text as one span per character.
//
// Needed because shaping leaves the string MIXED: connected letters become
// presentation forms, which the renderer treats as neutral and leaves alone,
// while isolated letters stay as base Arabic codepoints, which it still sees
// as right-to-left and reverses. Handing it a whole line meant our ordering
// and its ordering both applied to different parts of the same string — which
// is exactly why «فقدان» came out «فقدنا» and «أو» came out «وأ»: those are the
// words that end in two isolated letters.
//
// A single character cannot be reordered, so putting each in its own span
// leaves the order entirely ours and removes the renderer's bidi from the
// picture. Joining is unaffected: in Arabic the connecting strokes belong to
// the glyph outlines themselves, so adjacent glyphs with correct advances still
// meet — verified in a render, not assumed.
// A span holding only a plain space collapses to zero width, which ran every
// word together. U+00A0 is the same advance and does not collapse.
const arabicText = (text, style) =>
    toClusters(visualOrder(shapeArabic(text))).map((cl) => h('span', style || {}, cl === ' ' ? ' ' : cl));

// Palette — deep olive-green (lightened from the very-dark ministry olive) with
// muted gold accents. White title for maximum legibility on long Arabic titles;
// gold reserved for the frame, category pill, accent rule, and brand name so the
// card reads "official / premium" without hurting readability.
const GOLD = '#d8b96a';

function card(title, category) {
    const { fontSize, charsPerLine } = getTitleSize(title.length);
    const lines = splitLines(title, charsPerLine);

    return h('div', {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #16382c 0%, #22493a 52%, #163a2d 100%)',
        fontFamily: 'Cairo', padding: '64px', position: 'relative',
    }, [
        // Faint gold dot texture
        h('div', {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(216,185,106,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px', display: 'flex',
        }),
        // Elegant inset gold frame (official-document feel)
        h('div', {
            position: 'absolute', top: '26px', left: '26px', right: '26px', bottom: '26px',
            border: '1.5px solid rgba(216,185,106,0.35)', borderRadius: '10px', display: 'flex',
        }),
        // Top: category pill + gold accent rule + title lines (right-aligned)
        h('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '22px', position: 'relative' }, [
            ...(category ? [h('span', {
                background: 'rgba(216,185,106,0.12)', color: GOLD, padding: '8px 26px',
                borderRadius: '9999px', fontSize: '23px', fontWeight: 700,
                border: '1px solid rgba(216,185,106,0.5)',
            }, arabicText(category))] : []),
            h('div', { width: '92px', height: '5px', background: GOLD, borderRadius: '4px', display: 'flex' }),
            h('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' },
                lines.map((line) => h('div', {
                    display: 'flex', flexDirection: 'row',
                    color: '#ffffff', fontSize: `${fontSize}px`, fontWeight: 700, lineHeight: 1.4,
                }, arabicText(line)))),
        ]),
        // Bottom branding bar
        h('div', {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.20)', borderRadius: '16px', padding: '18px 28px',
            border: '1px solid rgba(216,185,106,0.30)', position: 'relative',
        }, [
            h('span', { color: 'rgba(255,255,255,0.62)', fontSize: '21px', fontWeight: 400 }, 'dalilarabtr.com'),
            // Must stay identical to SITE_CONFIG.name in src/lib/config.ts and
            // to the Telegram channel title. This worker deploys separately and
            // cannot import from the app, so the string is duplicated — and it
            // had already drifted: the site said «دليل العرب والسوريين في
            // تركيا» while the card said «دليل العرب في تركيا», which under a
            // channel post read as a different publication from the one posting
            // it. If you rename the site, change it here too.
            h('div', { display: 'flex', flexDirection: 'row', color: GOLD, fontSize: '25px', fontWeight: 700 }, arabicText('دليل العرب والسوريين في تركيا')),
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
