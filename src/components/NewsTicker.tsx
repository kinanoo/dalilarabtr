'use client';

/**
 * NewsTicker — the dark auto-scrolling strip at the top.
 *
 * Carries two kinds of entries in one continuous marquee:
 *   1. Live exchange rates (USD/EUR/SAR + gram gold ₺ + ounce gold $ + Syrian
 *      pound) from /api/rates — ALWAYS present, so the strip never sits empty.
 *   2. Breaking-news headlines from news_ticker (is_active), when there are any.
 *
 * Seamless loop: the animated row is TWO identical copies of the content side by
 * side; it translates by exactly -50% (one copy width) and repeats, so copy B
 * slides into copy A's place with no visible jump and EVERY item is shown each
 * loop. (The old translateX(50%) approach reset early and hid the last items.)
 * The marquee row is forced dir="ltr" so RTL flex-ordering can't scramble the
 * two copies; the Arabic text inside each item still renders right-to-left.
 */

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
// Lazy supabase — the ticker renders on the homepage first load; a static
// supabaseClient import here kept supabase-js in the home first-load JS.
import { getSupabase } from '@/lib/supabaseLazy';
import { fmt, repeatCount, ratesToEntries, toLatinDigits, type Entry } from '@/lib/tickerShared';
import type { Rates } from '@/lib/rates';

type RatesResp = { ok?: boolean; rates?: Rates };

export default function NewsTicker({ initialEntries = [], initialHidden = false }: {
    initialEntries?: Entry[];
    initialHidden?: boolean;
}) {
    // Seed from the SERVER-computed entries so the strip paints FULL on the very
    // first frame — no empty dark bar, no client round-trip, no pop-in flicker.
    const [entries, setEntries] = useState<Entry[]>(initialEntries);
    const copyRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(30);
    const [isPaused, setIsPaused] = useState(false);
    // `hidden` = admin turned the strip OFF (ticker_enabled=false): only then do
    // we collapse it entirely. `ready` gates the scroll animation start. Seeding
    // both from the server keeps SSR and first client render identical.
    const [hidden, setHidden] = useState(initialHidden);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let alive = true;

        async function load() {
            let rateEntries: Entry[] = [];
            const newsEntries: Entry[] = [];

            const supabase = await getSupabase();

            // Admin on/off switch (site_settings.ticker_enabled). Defaults to
            // shown when the column is missing (pre-migration) or the read fails.
            try {
                if (supabase) {
                    const { data, error } = await supabase.from('site_settings').select('ticker_enabled').limit(1).maybeSingle();
                    if (!error && data && (data as { ticker_enabled?: boolean }).ticker_enabled === false) {
                        if (alive) setHidden(true); // admin OFF → collapse entirely
                        return;
                    }
                    if (alive) setHidden(false); // enabled (or column missing) → keep the reserved bar
                }
            } catch { /* default shown */ }

            try {
                const r = await fetch('/api/rates');
                const d = (await r.json()) as RatesResp;
                if (d.ok && d.rates) rateEntries = ratesToEntries(d.rates);
            } catch { /* rates unavailable → ticker still shows news */ }

            try {
                if (supabase) {
                    const { data } = await supabase
                        .from('news_ticker')
                        .select('id, text, link')
                        .eq('is_active', true)
                        .order('priority', { ascending: true });
                    if (data) {
                        for (const n of data) {
                            newsEntries.push({ kind: 'news', id: String(n.id), text: toLatinDigits(n.text), link: n.link || undefined });
                        }
                    }
                }
            } catch { /* news unavailable → ticker still shows rates */ }

            // Only replace the server-seeded content when the refresh actually
            // produced something — a transient fetch failure must not blank the
            // strip that already rendered with SSR data.
            const next = [...rateEntries, ...newsEntries];
            if (alive && next.length > 0) setEntries(next);
        }

        load();
        const id = setInterval(load, 5 * 60 * 1000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    // Measure ONE copy's width to set the scroll duration, then start the
    // animation (ready=true). Done in the mount effect body (no timer) so it
    // fires reliably right after the first paint: the content is already
    // visible (server-seeded), the duration is correct BEFORE the scroll
    // begins, so the marquee starts once cleanly with no restart flash.
    useEffect(() => {
        if (!copyRef.current || entries.length === 0) return;
        const w = copyRef.current.scrollWidth;
        if (w > 0) setDuration(Math.max(15, w / 70));
        setReady(true);
    }, [entries]);

    // Admin explicitly disabled the strip → render nothing at all.
    if (hidden) return null;

    const cycles = repeatCount(entries.length);
    const perCopy: Entry[] = Array.from({ length: cycles }, () => entries).flat();

    const renderItem = (item: Entry, i: number) => (
        <span key={`${item.id}-${i}`} className="inline-flex items-center shrink-0">
            {item.kind === 'rate' ? (
                // Rates are the audience's #1 daily check — make the strip a
                // doorway into the full board + converter instead of a dead span.
                <Link href="/tools/currency" title="أسعار الصرف ومحوّل العملات" className="group inline-flex items-center gap-1.5 px-4 transition-colors">
                    <span className="text-slate-300 group-hover:text-emerald-300 transition-colors">{item.label}</span>
                    <span className="text-white tabular-nums group-hover:text-emerald-200 transition-colors" dir="ltr">{item.value} {item.unit}</span>
                    {item.change !== 0 && (
                        <span className={`inline-flex items-center gap-0.5 tabular-nums ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} dir="ltr">
                            {item.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {item.change >= 0 ? '+' : ''}{fmt(item.change, 2)}%
                        </span>
                    )}
                </Link>
            ) : item.link ? (
                <Link href={item.link} className="text-slate-100 hover:text-emerald-300 transition-colors px-4 tabular-nums">{item.text}</Link>
            ) : (
                <span className="text-slate-100 px-4 tabular-nums">{item.text}</span>
            )}
            <span className="text-emerald-400/70 text-[10px] sm:text-xs leading-none" aria-hidden="true">●</span>
        </span>
    );

    return (
        <div
            className="relative overflow-hidden text-[11px] sm:text-xs font-bold select-none border-b border-emerald-500/20"
            dir="rtl"
            role="status"
            aria-live="off"
            aria-label="أسعار الصرف والأخبار العاجلة"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="absolute inset-0 bg-[#0b1830]" />

            <div className="relative flex items-center h-[24px] sm:h-[28px]">
                <div className="flex-1 overflow-hidden">
                    <div
                        className="flex items-center w-max will-change-transform"
                        style={{
                            animationName: 'ticker-scroll',
                            animationDuration: `${duration}s`,
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                            // Content is visible the instant it exists (server-seeded on
                            // first paint, or faded in if it arrives client-side later).
                            // The SCROLL only starts once the width is measured (`ready`),
                            // so it begins once at the correct duration — no restart flash.
                            animationPlayState: ready && !isPaused ? 'running' : 'paused',
                            opacity: entries.length > 0 ? 1 : 0,
                            transition: 'opacity 300ms ease',
                        }}
                    >
                        <div ref={copyRef} className="flex items-center whitespace-nowrap shrink-0">
                            {perCopy.map(renderItem)}
                        </div>
                        <div className="flex items-center whitespace-nowrap shrink-0" aria-hidden="true">
                            {perCopy.map(renderItem)}
                        </div>
                    </div>
                </div>

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
