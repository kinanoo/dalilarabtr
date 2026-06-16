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
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ArrowLeft, Calendar, Tag } from 'lucide-react';

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
    bg: string;          // section gradient
    border: string;      // bottom border
    orb: string;         // pulsing orb tint
    badge: string;       // BREAKING pill bg
    subText: string;     // meta-row text color
    ctaText: string;     // "اقرأ التفاصيل" text on white pill
    ctaHoverBg: string;  // CTA hover state
    ctaShadow: string;   // CTA + badge shadow tint
    titleHover: string;  // headline hover color
    counter: string;     // "X / Y" counter color
}

const PALETTE: Theme[] = [
    // rose
    { bg: 'from-slate-950 via-rose-950 to-slate-950', border: 'border-rose-900/40', orb: 'bg-rose-500/15', badge: 'bg-rose-600', subText: 'text-rose-200/80', ctaText: 'text-rose-700', ctaHoverBg: 'hover:bg-rose-50', ctaShadow: 'shadow-rose-900/20', titleHover: 'group-hover:text-rose-100', counter: 'text-rose-300/60' },
    // emerald
    { bg: 'from-slate-950 via-emerald-950 to-slate-950', border: 'border-emerald-900/40', orb: 'bg-emerald-500/15', badge: 'bg-emerald-600', subText: 'text-emerald-200/80', ctaText: 'text-emerald-700', ctaHoverBg: 'hover:bg-emerald-50', ctaShadow: 'shadow-emerald-900/20', titleHover: 'group-hover:text-emerald-100', counter: 'text-emerald-300/60' },
    // blue
    { bg: 'from-slate-950 via-blue-950 to-slate-950', border: 'border-blue-900/40', orb: 'bg-blue-500/15', badge: 'bg-blue-600', subText: 'text-blue-200/80', ctaText: 'text-blue-700', ctaHoverBg: 'hover:bg-blue-50', ctaShadow: 'shadow-blue-900/20', titleHover: 'group-hover:text-blue-100', counter: 'text-blue-300/60' },
    // violet
    { bg: 'from-slate-950 via-violet-950 to-slate-950', border: 'border-violet-900/40', orb: 'bg-violet-500/15', badge: 'bg-violet-600', subText: 'text-violet-200/80', ctaText: 'text-violet-700', ctaHoverBg: 'hover:bg-violet-50', ctaShadow: 'shadow-violet-900/20', titleHover: 'group-hover:text-violet-100', counter: 'text-violet-300/60' },
    // amber
    { bg: 'from-slate-950 via-amber-950 to-slate-950', border: 'border-amber-900/40', orb: 'bg-amber-500/15', badge: 'bg-amber-600', subText: 'text-amber-200/80', ctaText: 'text-amber-700', ctaHoverBg: 'hover:bg-amber-50', ctaShadow: 'shadow-amber-900/20', titleHover: 'group-hover:text-amber-100', counter: 'text-amber-300/60' },
    // teal
    { bg: 'from-slate-950 via-teal-950 to-slate-950', border: 'border-teal-900/40', orb: 'bg-teal-500/15', badge: 'bg-teal-600', subText: 'text-teal-200/80', ctaText: 'text-teal-700', ctaHoverBg: 'hover:bg-teal-50', ctaShadow: 'shadow-teal-900/20', titleHover: 'group-hover:text-teal-100', counter: 'text-teal-300/60' },
    // fuchsia
    { bg: 'from-slate-950 via-fuchsia-950 to-slate-950', border: 'border-fuchsia-900/40', orb: 'bg-fuchsia-500/15', badge: 'bg-fuchsia-600', subText: 'text-fuchsia-200/80', ctaText: 'text-fuchsia-700', ctaHoverBg: 'hover:bg-fuchsia-50', ctaShadow: 'shadow-fuchsia-900/20', titleHover: 'group-hover:text-fuchsia-100', counter: 'text-fuchsia-300/60' },
    // indigo
    { bg: 'from-slate-950 via-indigo-950 to-slate-950', border: 'border-indigo-900/40', orb: 'bg-indigo-500/15', badge: 'bg-indigo-600', subText: 'text-indigo-200/80', ctaText: 'text-indigo-700', ctaHoverBg: 'hover:bg-indigo-50', ctaShadow: 'shadow-indigo-900/20', titleHover: 'group-hover:text-indigo-100', counter: 'text-indigo-300/60' },
    // sky
    { bg: 'from-slate-950 via-sky-950 to-slate-950', border: 'border-sky-900/40', orb: 'bg-sky-500/15', badge: 'bg-sky-600', subText: 'text-sky-200/80', ctaText: 'text-sky-700', ctaHoverBg: 'hover:bg-sky-50', ctaShadow: 'shadow-sky-900/20', titleHover: 'group-hover:text-sky-100', counter: 'text-sky-300/60' },
    // orange
    { bg: 'from-slate-950 via-orange-950 to-slate-950', border: 'border-orange-900/40', orb: 'bg-orange-500/15', badge: 'bg-orange-600', subText: 'text-orange-200/80', ctaText: 'text-orange-700', ctaHoverBg: 'hover:bg-orange-50', ctaShadow: 'shadow-orange-900/20', titleHover: 'group-hover:text-orange-100', counter: 'text-orange-300/60' },
];

/**
 * djb2 string hash — fast, no-deps, well-distributed for short keys
 * like article slugs. Returns a 32-bit unsigned integer; we mod by
 * PALETTE.length to pick the theme.
 */
function hashSlug(slug: string): number {
    let h = 5381;
    for (let i = 0; i < slug.length; i++) {
        h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function themeForSlug(slug: string): Theme {
    return PALETTE[hashSlug(slug) % PALETTE.length];
}

export interface CarouselArticle {
    slug: string;
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

const DISPLAY_MS = 5000;  // article visible duration

export default function FeaturedNewsCarousel({ articles }: Props) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);

    // Detect reduced-motion preference
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // Rotation engine — advance every DISPLAY_MS unless paused.
    useEffect(() => {
        if (articles.length <= 1) return;
        if (paused) return;

        const timer = setTimeout(() => {
            setIndex((i) => (i + 1) % articles.length);
        }, DISPLAY_MS);

        return () => clearTimeout(timer);
    }, [index, paused, articles.length]);

    if (articles.length === 0) return null;

    const article = articles[index];
    const date = formatDate(article.published_at);
    const summary = stripHtml(article.intro, 160);
    const href = `/article/${article.slug}`;
    const showSegments = articles.length > 1;
    // Per-article color theme. Picked by hashing the article slug
    // so each story gets a stable, distinct color from a 10-palette
    // set. Adjacent articles in the carousel are practically
    // guaranteed to look different — the reader's eye registers
    // "this is a NEW story" the instant the gradient swaps, before
    // they even read the headline.
    const theme = themeForSlug(article.slug);

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
            {/* Themed orb top-right — color shifts with the article so
                even peripheral vision sees the change between stories */}
            <div
                aria-hidden="true"
                className={`absolute -top-24 -right-24 w-64 h-64 ${theme.orb} rounded-full blur-3xl pointer-events-none animate-pulse transition-colors duration-500`}
                style={{ animationDuration: '5s' }}
            />

            {/* Newsroom texture — kept at very low opacity */}
            <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.5) 35px, rgba(255,255,255,0.5) 36px)',
                }}
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
                                            isActive
                                                ? {
                                                      animation: `seg-fill ${DISPLAY_MS}ms linear forwards`,
                                                      animationPlayState: paused ? 'paused' : 'running',
                                                  }
                                                : {
                                                      width: isPast ? '100%' : '0%',
                                                  }
                                        }
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ──────── Article content — AnimatePresence handles
                    fade+slight-rise transition keyed on slug ───────── */}
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={article.slug}
                        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
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
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Local keyframes — segment progress fill (right-to-left in
                RTL because we used transform-origin: right and width
                animation grows from the right edge). */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes seg-fill {
                    from { width: 0%; }
                    to   { width: 100%; }
                }
            `}} />
        </section>
    );
}
