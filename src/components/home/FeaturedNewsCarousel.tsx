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

    return (
        <section
            className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 py-4 sm:py-6 border-b border-rose-900/40"
            dir="rtl"
            aria-label="خبر عاجل"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            {/* Subtle red orb top-right — kept smaller than the previous
                version so it doesn't dominate the now-compact layout */}
            <div
                aria-hidden="true"
                className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"
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
                                <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.15em] uppercase shadow-md shadow-rose-900/40">
                                    <span className="relative inline-flex items-center justify-center w-1.5 h-1.5">
                                        <span className="absolute inline-flex w-1.5 h-1.5 rounded-full bg-white opacity-75 animate-ping" />
                                        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-white" />
                                    </span>
                                    <Flame size={10} />
                                    <span>خبر عاجل</span>
                                </span>
                                {date && (
                                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-rose-200/80 font-bold">
                                        <Calendar size={11} />
                                        {date}
                                    </span>
                                )}
                                {article.category && (
                                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-rose-200/80 font-bold">
                                        <Tag size={11} />
                                        {article.category}
                                    </span>
                                )}
                                {articles.length > 1 && (
                                    // dir="ltr" forces "1 / 2" to render
                                    // left-to-right even inside the parent
                                    // RTL flow. Without this, the rose-coloured
                                    // counter rendered as "2 / 1" (browser
                                    // ran the slash + numbers through the
                                    // bidi algorithm in RTL context).
                                    <span
                                        dir="ltr"
                                        className="text-[10px] text-rose-300/60 tabular-nums font-bold ms-auto"
                                    >
                                        {index + 1} / {articles.length}
                                    </span>
                                )}
                            </div>

                            {/* Headline — much smaller than before. Clamped
                                to 2 lines so the height stays predictable. */}
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black leading-[1.5] text-white drop-shadow-md group-hover:text-rose-100 transition-colors line-clamp-2">
                                {article.title}
                            </h2>

                            {/* Summary — clamped to 2 lines on phones to keep
                                strip compact; allowed up to 3 on desktop. */}
                            {summary && (
                                <p className="mt-2 text-xs sm:text-sm text-rose-100/75 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                    {summary}
                                </p>
                            )}

                            {/* CTA — small inline pill (was a giant white
                                button before). The "اقرأ التفاصيل" text +
                                arrow communicate the action without taking
                                another 80 px of vertical space. */}
                            <div className="mt-3 inline-flex items-center gap-1.5 bg-white text-rose-700 hover:bg-rose-50 font-bold px-3.5 py-1.5 rounded-lg text-xs sm:text-sm shadow-md shadow-rose-900/20 group-hover:scale-[1.02] transition-all">
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
