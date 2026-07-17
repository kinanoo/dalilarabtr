'use client';

/**
 * FeaturedNewsCarousel — breaking-news strip on the homepage.
 *
 * Rebuilt 2026-06-09 (second pass) after user review:
 *
 *   Pass 1 problems (now fixed):
 *     - Strip was ~500px tall — overshadowed the hero (~400px).
 *     - Gold-shimmer transition was too flashy and looked AI-generated.
 *     - No visual signal that there were multiple stories; both
 *       featured articles looked visually identical so the rotation
 *       felt like "same article kept reappearing" not "moving to the
 *       next one."
 *
 *   Pass 2 design choices (industry-standard, copied from real
 *   newsroom apps — NYT, Al Jazeera, BBC News mobile, Instagram
 *   Stories):
 *
 *     1. Instagram-Stories-style progress segments at the top.
 *        Each segment fills over 5 seconds while its article is
 *        visible, then locks to 100% and the next segment begins.
 *        Universal "stories" affordance — users immediately read it
 *        as "N items, I'm on item K, K/N done so far."
 *
 *     2. Vertical fade-up transition between stories (400 ms,
 *        easeOut). The OLD article fades out + translates -8 px
 *        (slight upward exit), the NEW article fades in + translates
 *        from +8 px (rises into view). This is how news apps animate
 *        ticker-style content swaps. No gold sweep, no shimmer.
 *        Quiet and editorial.
 *
 *     3. Compact dense layout. Meta row (flame + date + category)
 *        is one tight line; headline is line-clamped to 2; summary
 *        line-clamped to 2; CTA is a small inline pill. Total
 *        height ~200 px on desktop and ~240 px on mobile —
 *        deliberately shorter than the hero so it reads as
 *        secondary, not as the primary attraction.
 *
 *     4. Removed the right-side share callout — that was the
 *        biggest height contributor. Article pages already have
 *        share buttons; we don't need to ship them from the
 *        breaking strip.
 *
 *     5. The transition target is the ENTIRE Link block, keyed on
 *        article.slug, so AnimatePresence handles all the visual
 *        swapping logic. No manual class toggling.
 *
 *   Pass 2 invariants kept:
 *     - 5 s display + transition between articles (timing the user
 *       asked for)
 *     - pause on hover/focus (don't yank story away while reading)
 *     - prefers-reduced-motion: skip animations, content swaps
 *       instantly
 *     - SSR-friendly: only the FIRST article is in initial HTML,
 *       rest hydrate client-side
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, ArrowLeft, Calendar, Tag } from 'lucide-react';

// No framer-motion here ON PURPOSE (JS-diet round 4): this carousel sits in
// the HOMEPAGE critical graph, and it was the last always-loaded public
// consumer of the animation runtime. The fade+rise swap is now a 400ms CSS
// keyframe on the keyed article node — same look, zero library.

/**
 * Theme = the per-article color palette.
 *
 * Picked by HASH OF SLUG, not category. Two reasons:
 *
 *   1. The reader's eye registers "this story is different from the
 *      previous one" by color shift, regardless of category. Two
 *      consecutive residency articles in the same green felt like one
 *      story repeating; two consecutive articles in different vivid
 *      colors immediately read as separate stories.
 *
 *   2. Adding a new article picks a fresh color automatically —
 *      no admin work, no category-to-color lookup to maintain.
 *
 * Stable hash means the SAME slug always gets the SAME color, so a
 * reader who returns to the homepage sees consistent branding per
 * story (article X is "the purple one"), not random flicker.
 *
 * 10 vivid palettes chosen to be MAXIMALLY DISTINCT from each other
 * — adjacent colors on the wheel deliberately spaced so any two
 * featured articles look unmistakably different.
 */

interface Theme {
    /** Bold tri-stop gradient — dominant color across the whole strip,
     * NOT slate-base. Each theme has a unmistakable hue identity. */
    bg: string;
    /** CSS background-image string for the decorative pattern overlay.
     * Inline style instead of a class because patterns are unique per
     * theme and Tailwind has no built-in support for them. */
    pattern: string;
    /** Pattern tiling size, applied via inline backgroundSize. Pairs
     * with `pattern` to make a repeatable surface. */
    patternSize: string;
    /** Pattern opacity tailwind class — kept low so the pattern reads
     * as texture, not noise. */
    patternOpacity: string;
    border: string;
    orb: string;
    orb2: string;        // second corner orb in a different tint
    badge: string;
    subText: string;
    ctaText: string;
    ctaHoverBg: string;
    ctaShadow: string;
    titleHover: string;
    counter: string;
}

// White overlay alpha used inside CSS pattern strings — kept identical
// across themes so the perceived pattern density stays consistent.
const W = 'rgba(255,255,255,0.45)';

const PALETTE: Theme[] = [
    // 1. ROSE — diagonal newspaper stripes
    {
        bg: 'from-rose-900 via-rose-700 to-rose-950',
        pattern: `repeating-linear-gradient(45deg, transparent 0 22px, ${W} 22px 23px)`,
        patternSize: 'auto',
        patternOpacity: 'opacity-[0.10]',
        border: 'border-rose-900/40',
        orb: 'bg-rose-300/25',
        orb2: 'bg-amber-400/15',
        badge: 'bg-rose-600',
        subText: 'text-rose-100/85',
        ctaText: 'text-rose-700',
        ctaHoverBg: 'hover:bg-rose-50',
        ctaShadow: 'shadow-rose-950/40',
        titleHover: 'group-hover:text-rose-100',
        counter: 'text-rose-200/70',
    },
    // 2. EMERALD — hexagonal mesh (offset radial dots)
    {
        bg: 'from-emerald-900 via-emerald-700 to-emerald-950',
        pattern: `radial-gradient(${W} 1.2px, transparent 1.6px), radial-gradient(${W} 1.2px, transparent 1.6px)`,
        patternSize: '32px 32px, 32px 32px',
        patternOpacity: 'opacity-[0.18]',
        border: 'border-emerald-900/40',
        orb: 'bg-emerald-300/25',
        orb2: 'bg-lime-400/15',
        badge: 'bg-emerald-600',
        subText: 'text-emerald-100/85',
        ctaText: 'text-emerald-700',
        ctaHoverBg: 'hover:bg-emerald-50',
        ctaShadow: 'shadow-emerald-950/40',
        titleHover: 'group-hover:text-emerald-100',
        counter: 'text-emerald-200/70',
    },
    // 3. BLUE — wave/ripple lines
    {
        bg: 'from-blue-900 via-blue-700 to-blue-950',
        pattern: `repeating-radial-gradient(circle at 50% 0%, transparent 0 38px, ${W} 38px 39px)`,
        patternSize: 'auto',
        patternOpacity: 'opacity-[0.12]',
        border: 'border-blue-900/40',
        orb: 'bg-cyan-300/25',
        orb2: 'bg-blue-400/15',
        badge: 'bg-blue-600',
        subText: 'text-blue-100/85',
        ctaText: 'text-blue-700',
        ctaHoverBg: 'hover:bg-blue-50',
        ctaShadow: 'shadow-blue-950/40',
        titleHover: 'group-hover:text-blue-100',
        counter: 'text-blue-200/70',
    },
    // 4. VIOLET — dotted halftone
    {
        bg: 'from-violet-900 via-violet-700 to-violet-950',
        pattern: `radial-gradient(circle, ${W} 1.8px, transparent 2.4px)`,
        patternSize: '20px 20px',
        patternOpacity: 'opacity-[0.18]',
        border: 'border-violet-900/40',
        orb: 'bg-violet-300/25',
        orb2: 'bg-fuchsia-400/15',
        badge: 'bg-violet-600',
        subText: 'text-violet-100/85',
        ctaText: 'text-violet-700',
        ctaHoverBg: 'hover:bg-violet-50',
        ctaShadow: 'shadow-violet-950/40',
        titleHover: 'group-hover:text-violet-100',
        counter: 'text-violet-200/70',
    },
    // 5. AMBER — sunburst rays from corner
    {
        bg: 'from-amber-700 via-amber-600 to-orange-900',
        pattern: `repeating-conic-gradient(from 0deg at 100% 0%, transparent 0deg 6deg, ${W} 6deg 7deg)`,
        patternSize: 'auto',
        patternOpacity: 'opacity-[0.12]',
        border: 'border-amber-900/40',
        orb: 'bg-yellow-300/25',
        orb2: 'bg-orange-400/15',
        badge: 'bg-amber-700',
        subText: 'text-amber-50/85',
        ctaText: 'text-amber-800',
        ctaHoverBg: 'hover:bg-amber-50',
        ctaShadow: 'shadow-amber-950/40',
        titleHover: 'group-hover:text-amber-50',
        counter: 'text-amber-100/70',
    },
    // 6. TEAL — square grid
    {
        bg: 'from-teal-900 via-teal-700 to-teal-950',
        pattern: `linear-gradient(${W} 1px, transparent 1px), linear-gradient(90deg, ${W} 1px, transparent 1px)`,
        patternSize: '28px 28px, 28px 28px',
        patternOpacity: 'opacity-[0.12]',
        border: 'border-teal-900/40',
        orb: 'bg-cyan-300/25',
        orb2: 'bg-emerald-400/15',
        badge: 'bg-teal-600',
        subText: 'text-teal-100/85',
        ctaText: 'text-teal-700',
        ctaHoverBg: 'hover:bg-teal-50',
        ctaShadow: 'shadow-teal-950/40',
        titleHover: 'group-hover:text-teal-100',
        counter: 'text-teal-200/70',
    },
    // 7. FUCHSIA — crosshatch
    {
        bg: 'from-fuchsia-900 via-fuchsia-700 to-fuchsia-950',
        pattern: `repeating-linear-gradient(45deg, ${W} 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, ${W} 0 1px, transparent 1px 14px)`,
        patternSize: 'auto',
        patternOpacity: 'opacity-[0.12]',
        border: 'border-fuchsia-900/40',
        orb: 'bg-pink-300/25',
        orb2: 'bg-fuchsia-400/15',
        badge: 'bg-fuchsia-600',
        subText: 'text-fuchsia-100/85',
        ctaText: 'text-fuchsia-700',
        ctaHoverBg: 'hover:bg-fuchsia-50',
        ctaShadow: 'shadow-fuchsia-950/40',
        titleHover: 'group-hover:text-fuchsia-100',
        counter: 'text-fuchsia-200/70',
    },
    // 8. INDIGO — stars / scattered dots
    {
        bg: 'from-indigo-900 via-indigo-700 to-slate-950',
        pattern: `radial-gradient(circle at 20% 30%, ${W} 1.5px, transparent 2px), radial-gradient(circle at 70% 40%, ${W} 1px, transparent 1.5px), radial-gradient(circle at 40% 80%, ${W} 1.5px, transparent 2px), radial-gradient(circle at 85% 75%, ${W} 1px, transparent 1.5px)`,
        patternSize: '180px 180px, 180px 180px, 180px 180px, 180px 180px',
        patternOpacity: 'opacity-[0.35]',
        border: 'border-indigo-900/40',
        orb: 'bg-violet-300/25',
        orb2: 'bg-indigo-400/15',
        badge: 'bg-indigo-600',
        subText: 'text-indigo-100/85',
        ctaText: 'text-indigo-700',
        ctaHoverBg: 'hover:bg-indigo-50',
        ctaShadow: 'shadow-indigo-950/40',
        titleHover: 'group-hover:text-indigo-100',
        counter: 'text-indigo-200/70',
    },
    // 9. SKY — concentric circles (ripple)
    {
        bg: 'from-sky-700 via-sky-500 to-cyan-900',
        pattern: `repeating-radial-gradient(circle, transparent 0 26px, ${W} 26px 27px)`,
        patternSize: 'auto',
        patternOpacity: 'opacity-[0.10]',
        border: 'border-sky-900/40',
        orb: 'bg-sky-300/25',
        orb2: 'bg-cyan-400/15',
        badge: 'bg-sky-600',
        subText: 'text-sky-50/85',
        ctaText: 'text-sky-700',
        ctaHoverBg: 'hover:bg-sky-50',
        ctaShadow: 'shadow-sky-950/40',
        titleHover: 'group-hover:text-sky-50',
        counter: 'text-sky-100/70',
    },
    // 10. ORANGE — diamond/checker
    {
        bg: 'from-orange-700 via-red-600 to-orange-950',
        pattern: `linear-gradient(45deg, ${W} 25%, transparent 25% 75%, ${W} 75%)`,
        patternSize: '24px 24px',
        patternOpacity: 'opacity-[0.10]',
        border: 'border-orange-900/40',
        orb: 'bg-yellow-300/25',
        orb2: 'bg-red-400/15',
        badge: 'bg-orange-600',
        subText: 'text-orange-50/85',
        ctaText: 'text-orange-700',
        ctaHoverBg: 'hover:bg-orange-50',
        ctaShadow: 'shadow-orange-950/40',
        titleHover: 'group-hover:text-orange-50',
        counter: 'text-orange-100/70',
    },
];

/**
 * Theme picker by carousel POSITION, not slug hash.
 *
 * Why position instead of hash:
 *   The first attempt hashed each slug to a palette index, but real
 *   slugs (gaziantep-…, turkey-…, istanbul-…) hashed close together
 *   and landed on visually adjacent palette entries (blue / sky /
 *   indigo) — the user saw "blue with shades" instead of variety.
 *
 * Position-based fixes that:
 *   - Article #0 (newest) → PALETTE[0] = rose (always RED — the
 *     user explicitly asked for red to be in the rotation)
 *   - Subsequent indices step by 3 mod 10 → jumps across the colour
 *     wheel, never two adjacent palette entries in a row
 *
 * Stride 3 is coprime to 10 so 10 articles cycle through all 10
 * themes before repeating: rose → violet → fuchsia → orange → blue
 * → teal → sky → emerald → amber → indigo → rose…
 *
 * When the admin tags a new article as breaking, it becomes index 0
 * and inherits rose; the others shift up one slot (each gets a new
 * theme). The carousel feels fresh on every news cycle without any
 * config work.
 */
function themeAt(index: number): Theme {
    return PALETTE[(index * 3) % PALETTE.length];
}

export interface CarouselArticle {
    // `slug` is the canonical URL key, but rows authored before the slug
    // field was populated can ship null here. Fall back to `id` (the
    // Arabic-kebab primary key) so the carousel link is never /article/null.
    slug: string | null;
    id?: string | null;
    title: string;
    intro: string | null;
    category: string | null;
    published_at: string | null;
    image: string | null;
}

interface Props {
    articles: CarouselArticle[];
}

const AR_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function stripHtml(html: string | null, max = 160): string {
    if (!html) return '';
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trim() + '…';
}

const DISPLAY_MS = 5000;      // article visible duration once the cycle runs
// Owner request (2026-07-17): the strip must sit COMPLETELY STILL right after
// a page load/refresh — no progress-bar fill, no swap — because instant motion
// on arrival reads as "too much movement". The first visible motion (the
// active segment starting to fill) begins only after this hold; the first
// article swap follows DISPLAY_MS later.
const INITIAL_HOLD_MS = 4500;

export default function FeaturedNewsCarousel({ articles }: Props) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    // false during the post-load hold: segments static, rotation off.
    const [started, setStarted] = useState(false);
    // Becomes true on the first swap — the CSS entrance animation is applied
    // only to ROTATED-IN articles, never to the initial SSR'd one (animating
    // the first paint is exactly the impression the owner asked to remove).
    const [hasRotated, setHasRotated] = useState(false);

    // Detect reduced-motion preference
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // Post-load hold — everything stays still until it elapses.
    useEffect(() => {
        if (articles.length <= 1) return;
        const t = setTimeout(() => setStarted(true), INITIAL_HOLD_MS);
        return () => clearTimeout(t);
    }, [articles.length]);

    // Rotation engine — advance every DISPLAY_MS once started, unless paused.
    useEffect(() => {
        if (articles.length <= 1) return;
        if (!started || paused) return;

        const timer = setTimeout(() => {
            setHasRotated(true);
            setIndex((i) => (i + 1) % articles.length);
        }, DISPLAY_MS);

        return () => clearTimeout(timer);
    }, [index, started, paused, articles.length]);

    if (articles.length === 0) return null;

    const article = articles[index];
    const date = formatDate(article.published_at);
    const summary = stripHtml(article.intro, 160);
    // Fallback chain — newer rows populate `slug`, older rows only have
    // `id`. Without this guard the link ended up as /article/null and
    // 404'd (user-reported when they clicked "اقرأ التفاصيل" on a
    // freshly-published article whose slug column was empty).
    const articleKey = article.slug || article.id;
    const href = articleKey ? `/article/${articleKey}` : '/';
    const showSegments = articles.length > 1;
    // Per-article color theme. Picked by carousel POSITION (with a
    // stride of 3 so adjacent indices land on far-apart palette
    // entries — see themeAt for the rationale). The previous hash-
    // based approach happened to map all current slugs to neighbouring
    // blues; the user saw "blue with shades" and asked specifically
    // for red to be in the rotation. Index-based assignment
    // guarantees index 0 = rose (red), index 1 = violet, index 2 =
    // fuchsia, etc. — every article gets a visually distinct theme.
    const theme = themeAt(index);

    return (
        <section
            className={`relative overflow-hidden bg-gradient-to-br ${theme.bg} py-4 sm:py-6 border-b ${theme.border} transition-colors duration-500`}
            dir="rtl"
            aria-label="خبر عاجل"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            {/* Themed orb #1 top-right — primary highlight */}
            <div
                aria-hidden="true"
                className={`absolute -top-24 -right-24 w-72 h-72 ${theme.orb} rounded-full blur-3xl pointer-events-none animate-pulse transition-colors duration-500`}
                style={{ animationDuration: '5s' }}
            />

            {/* Themed orb #2 bottom-left — secondary accent in a related
                hue gives the gradient a richer two-tone glow without
                additional DOM work. */}
            <div
                aria-hidden="true"
                className={`absolute -bottom-32 -left-32 w-80 h-80 ${theme.orb2} rounded-full blur-3xl pointer-events-none transition-colors duration-500`}
            />

            {/* Pattern overlay — unique surface texture per theme.
                Each theme owns its own pattern (stripes / dots / grid /
                hex / sunburst / stars / diamonds / waves / crosshatch /
                concentric circles) defined via CSS inline. Tiled at
                theme.patternSize, dimmed via theme.patternOpacity. */}
            <div
                aria-hidden="true"
                className={`absolute inset-0 pointer-events-none ${theme.patternOpacity} transition-opacity duration-500`}
                style={{
                    backgroundImage: theme.pattern,
                    backgroundSize: theme.patternSize,
                }}
            />

            {/* Top sheen — a subtle highlight bleeds from the top edge
                so the dark gradient doesn't feel flat. Helps the
                background read as "lit from above" instead of "painted
                wall." */}
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"
            />

            <div className="relative max-w-5xl mx-auto px-4">
                {/* ──────── Progress segments — Instagram Stories style ─────
                    Universal "rotating stories" affordance. Each segment
                    represents one article; the active one fills over
                    DISPLAY_MS, finished ones stay at 100%, future ones
                    sit empty. Pauses when the user hovers (the engine
                    above pauses; the CSS animation respects play state).
                */}
                {showSegments && (
                    <div
                        className="flex items-center gap-1.5 mb-3"
                        role="tablist"
                        aria-label="التنقّل بين الأخبار العاجلة"
                    >
                        {articles.map((a, i) => {
                            const isActive = i === index;
                            const isPast = i < index;
                            return (
                                <button
                                    key={a.slug}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-label={`الانتقال إلى الخبر ${i + 1}`}
                                    onClick={() => setIndex(i)}
                                    className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden cursor-pointer hover:bg-white/25 transition-colors"
                                >
                                    <div
                                        className="h-full bg-white origin-right"
                                        style={
                                            isActive && started
                                                ? {
                                                      animationName: 'seg-fill',
                                                      animationDuration: `${DISPLAY_MS}ms`,
                                                      animationTimingFunction: 'linear',
                                                      animationFillMode: 'forwards',
                                                      animationPlayState: paused ? 'paused' : 'running',
                                                  }
                                                : {
                                                      // During the post-load hold the active segment sits
                                                      // EMPTY and motionless — the fill starting is the
                                                      // first motion the visitor sees, ~4.5s after load.
                                                      width: isPast ? '100%' : '0%',
                                                  }
                                        }
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ──────── Article content — keyed remount + CSS fade/rise.
                    The key change swaps the node; the fnc-item-in keyframe
                    (400ms, ease-out) fades the new story in from +8px —
                    the same quiet editorial swap AnimatePresence used to do,
                    without shipping framer-motion. Applied only after the
                    first rotation so the initial SSR'd story NEVER animates
                    on page load (owner request). ─────────────────────── */}
                    <div
                        key={articleKey || index}
                        className={hasRotated && !reducedMotion ? 'fnc-item-in' : undefined}
                    >
                        <Link href={href} className="block group">
                            {/* Meta row — compact one-liner: badge + date +
                                category. Single line on desktop, wraps to two
                                only on very narrow phones. */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2">
                                <span className={`inline-flex items-center gap-1.5 ${theme.badge} text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.15em] uppercase shadow-md ${theme.ctaShadow}`}>
                                    <span className="relative inline-flex items-center justify-center w-1.5 h-1.5">
                                        <span className="absolute inline-flex w-1.5 h-1.5 rounded-full bg-white opacity-75 animate-ping" />
                                        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-white" />
                                    </span>
                                    <Flame size={10} />
                                    <span>خبر عاجل</span>
                                </span>
                                {date && (
                                    <span className={`inline-flex items-center gap-1 text-[11px] sm:text-xs ${theme.subText} font-bold`}>
                                        <Calendar size={11} />
                                        {date}
                                    </span>
                                )}
                                {article.category && (
                                    <span className={`inline-flex items-center gap-1 text-[11px] sm:text-xs ${theme.subText} font-bold`}>
                                        <Tag size={11} />
                                        {article.category}
                                    </span>
                                )}
                                {articles.length > 1 && (
                                    // dir="ltr" forces "1 / 2" to render
                                    // left-to-right even inside the parent
                                    // RTL flow. Without this, the counter
                                    // rendered as "2 / 1" (browser ran the
                                    // slash + numbers through the bidi
                                    // algorithm in RTL context).
                                    <span
                                        dir="ltr"
                                        className={`text-[10px] ${theme.counter} tabular-nums font-bold ms-auto`}
                                    >
                                        {index + 1} / {articles.length}
                                    </span>
                                )}
                            </div>

                            {/* Headline — clamped to 2 lines so the height
                                stays predictable across all articles. */}
                            <h2 className={`text-lg sm:text-xl md:text-2xl font-black leading-[1.5] text-white drop-shadow-md ${theme.titleHover} transition-colors line-clamp-2`}>
                                {article.title}
                            </h2>

                            {/* Summary — clamped to 2 lines on phones to keep
                                strip compact; allowed up to 3 on desktop. */}
                            {summary && (
                                <p className="mt-2 text-xs sm:text-sm text-white/75 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                    {summary}
                                </p>
                            )}

                            {/* CTA — small inline pill, themed text color so
                                the reader's eye links it back to the badge. */}
                            <div className={`mt-3 inline-flex items-center gap-1.5 bg-white ${theme.ctaText} ${theme.ctaHoverBg} font-bold px-3.5 py-1.5 rounded-lg text-xs sm:text-sm shadow-md ${theme.ctaShadow} group-hover:scale-[1.02] transition-all`}>
                                <span>اقرأ التفاصيل</span>
                                <ArrowLeft size={14} />
                            </div>
                        </Link>
                    </div>
            </div>

            {/* Local keyframes — segment progress fill (right-to-left in
                RTL because we used transform-origin: right and width
                animation grows from the right edge). */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes seg-fill {
                    from { width: 0%; }
                    to   { width: 100%; }
                }
                @keyframes fnc-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: none; }
                }
                .fnc-item-in { animation: fnc-in 400ms ease-out both; }
            `}} />
        </section>
    );
}
