'use client';

/**
 * NewsTicker — the dark slate strip that scrolls breaking-news headlines
 * across the top of every page.
 *
 * Rebuilt 2026-06-09 after user reported four issues at once:
 *   1. Half the strip was empty whitespace (the database had only ONE
 *      ticker entry; duplicating it x2 didn't fill a wide screen).
 *   2. Wrong number in the headline (DB said "١٦٠ حياً" but the real
 *      closed-neighborhood count is 823 and reopened is 94).
 *   3. Eastern-Arabic digits in DB content (LatinDigits global hook
 *      fixes the rendered DOM, but defense-in-depth at source is safer).
 *   4. Thin, hard-to-read font in the strip.
 *
 * Fixes applied:
 *   - Adaptive repetition: items rendered enough times to fill any
 *     viewport width (min 4 cycles, more when items.length is small).
 *   - Latin-digit normalization at component level — independent of
 *     the global MutationObserver, so even SSR'd ticker text is clean.
 *   - Larger, bolder text (text-xs sm:text-sm font-bold).
 *   - Fixed invalid `role="marquee"` → `role="status" aria-live="off"`.
 *   - Unified edge fade colors to the same shade as the background.
 *   - Visible green bullet separator between items (not 8px invisible).
 */

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface TickerItem {
    id: string;
    text: string;
    link?: string;
}

// Convert Eastern-Arabic digits (٠-٩) and Persian digits (۰-۹) to Latin
// at the source. Safer than relying on the global MutationObserver alone:
// links live in raw <a href> and meta tags that the observer doesn't touch.
const EASTERN_DIGITS = /[٠-٩۰-۹]/g;
function toLatinDigits(s: string): string {
    return s.replace(EASTERN_DIGITS, (ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
        if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
        return ch;
    });
}

// How many times to repeat the items array before rendering. The CSS
// translateX(50%) animation expects the rendered track to be exactly
// 2x the visible content (so the second half scrolls into the first
// half's old position seamlessly). When the source array is short, we
// duplicate it more times BEFORE doubling, so the final rendered track
// is always wide enough to overflow any viewport.
//
// Math: at desktop 1920px width with avg item width ~250px, we need
// at minimum 8 items visible. With 1 source item, that's 8 repeats
// before the *2 doubling = 16 total — still leaves a ~30s loop.
function repeatCount(n: number): number {
    if (n <= 1) return 8;
    if (n <= 3) return 4;
    if (n <= 5) return 3;
    return 2;
}

export default function NewsTicker() {
    const [items, setItems] = useState<TickerItem[]>([]);
    const trackRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(30);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        async function fetchTicker() {
            if (!supabase) return;
            const { data } = await supabase
                .from('news_ticker')
                .select('id, text, link')
                .eq('is_active', true)
                .order('priority', { ascending: true });

            if (data && data.length > 0) {
                // Normalize Eastern-Arabic digits at fetch time so the
                // strip is clean even before the global hook fires.
                const normalized = data.map((d) => ({
                    ...d,
                    text: toLatinDigits(d.text),
                }));
                setItems(normalized);
            }
        }
        fetchTicker();
    }, []);

    // Compute scroll duration from rendered track width — slow enough
    // to read each headline (~120px/s, ~8s per ~1000px of content).
    useEffect(() => {
        if (!trackRef.current || items.length === 0) return;
        const t = setTimeout(() => {
            if (!trackRef.current) return;
            // Total rendered track is 2x the visible content (the CSS
            // `translateX(50%)` loop relies on this). Divide by 2 to get
            // the actual visible cycle length.
            const cycleWidth = trackRef.current.scrollWidth / 2;
            // Slower for readability — 120px/s instead of the old 220.
            setDuration(Math.max(15, cycleWidth / 120));
        }, 100);
        return () => clearTimeout(t);
    }, [items]);

    if (items.length === 0) return null;

    // Build the rendered track: source items repeated N times, then
    // duplicated once more (the *2 the animation relies on).
    const cycles = repeatCount(items.length);
    const oneCycle: TickerItem[] = Array.from(
        { length: cycles },
        () => items,
    ).flat();
    const renderedTrack = [...oneCycle, ...oneCycle];

    return (
        <div
            className="relative overflow-hidden text-xs sm:text-sm font-bold select-none border-b border-emerald-500/20"
            dir="rtl"
            role="status"
            aria-live="off"
            aria-label="شريط الأخبار العاجلة"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Solid background — single shade so the edge fades match */}
            <div className="absolute inset-0 bg-[#0b1830]" />

            <div className="relative flex items-center h-[32px] sm:h-[36px]">
                {/* Scrolling track */}
                <div className="flex-1 overflow-hidden">
                    <div
                        ref={trackRef}
                        className="flex items-center whitespace-nowrap will-change-transform"
                        style={{
                            animation: `ticker-scroll ${duration}s linear infinite`,
                            animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                    >
                        {renderedTrack.map((item, i) => (
                            <span key={`${item.id}-${i}`} className="inline-flex items-center shrink-0">
                                {item.link ? (
                                    <Link
                                        href={item.link}
                                        className="text-slate-100 hover:text-emerald-300 transition-colors px-4 tabular-nums"
                                    >
                                        {item.text}
                                    </Link>
                                ) : (
                                    <span className="text-slate-100 px-4 tabular-nums">{item.text}</span>
                                )}
                                {/* Bullet separator — visible green dot, sized
                                    to read at ticker height (was 8px = invisible) */}
                                <span
                                    className="text-emerald-400/70 text-[10px] sm:text-xs leading-none"
                                    aria-hidden="true"
                                >
                                    ●
                                </span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Edge fades — same color on both sides, matching background */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0b1830] to-transparent z-[5] pointer-events-none" />
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0b1830] to-transparent z-[5] pointer-events-none" />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes ticker-scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(50%); }
                }
            `}} />
        </div>
    );
}
