'use client';

/**
 * NewsTicker — the dark auto-scrolling strip at the top.
 *
 * It now carries TWO kinds of entries, merged into one continuous marquee:
 *   1. Live exchange rates (USD/EUR/SAR + gram gold ₺ + ounce gold $) from
 *      /api/rates — ALWAYS present, so the strip never sits empty.
 *   2. Breaking-news headlines from news_ticker (is_active), when there are any.
 *
 * This replaces the standalone rates strip: rates ride the existing auto-scroll
 * (no horizontal swipe, no extra vertical space) and keep moving even when there
 * are zero news items. Renders nothing only if BOTH rates and news are empty.
 */

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Rate { value: number; change: number }
type RatesResp = { ok?: boolean; rates?: Record<string, Rate | null> };

type Entry =
    | { kind: 'news'; id: string; text: string; link?: string }
    | { kind: 'rate'; id: string; label: string; value: string; unit: string; change: number };

const RATE_ITEMS: { key: string; label: string; unit: string; dec: number }[] = [
    { key: 'usd', label: 'دولار', unit: '₺', dec: 2 },
    { key: 'eur', label: 'يورو', unit: '₺', dec: 2 },
    { key: 'sar', label: 'ريال سعودي', unit: '₺', dec: 2 },
    { key: 'gold', label: 'غرام ذهب', unit: '₺', dec: 0 },
    { key: 'goldOz', label: 'أونصة ذهب', unit: '$', dec: 0 },
];

const EASTERN_DIGITS = /[٠-٩۰-۹]/g;
function toLatinDigits(s: string): string {
    return s.replace(EASTERN_DIGITS, (ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
        if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
        return ch;
    });
}
function fmt(n: number, dec: number): string {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function repeatCount(n: number): number {
    if (n <= 1) return 8;
    if (n <= 3) return 4;
    if (n <= 6) return 3;
    return 2;
}

export default function NewsTicker() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const trackRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(30);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let alive = true;

        async function load() {
            const rateEntries: Entry[] = [];
            const newsEntries: Entry[] = [];

            // 1) Rates — always attempted.
            try {
                const r = await fetch('/api/rates');
                const d = (await r.json()) as RatesResp;
                if (d.ok && d.rates) {
                    for (const it of RATE_ITEMS) {
                        const rate = d.rates[it.key];
                        if (rate) {
                            rateEntries.push({
                                kind: 'rate', id: `rate-${it.key}`, label: it.label,
                                value: fmt(rate.value, it.dec), unit: it.unit, change: rate.change,
                            });
                        }
                    }
                }
            } catch { /* rates unavailable → ticker still shows news */ }

            // 2) News headlines.
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

            if (alive) setEntries([...rateEntries, ...newsEntries]);
        }

        load();
        // Refresh rates+news every 5 minutes.
        const id = setInterval(load, 5 * 60 * 1000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    useEffect(() => {
        if (!trackRef.current || entries.length === 0) return;
        const t = setTimeout(() => {
            if (!trackRef.current) return;
            const cycleWidth = trackRef.current.scrollWidth / 2;
            setDuration(Math.max(15, cycleWidth / 120));
        }, 100);
        return () => clearTimeout(t);
    }, [entries]);

    if (entries.length === 0) return null;

    const cycles = repeatCount(entries.length);
    const oneCycle: Entry[] = Array.from({ length: cycles }, () => entries).flat();
    const renderedTrack = [...oneCycle, ...oneCycle];

    return (
        <div
            className="relative overflow-hidden text-xs sm:text-sm font-bold select-none border-b border-emerald-500/20"
            dir="rtl"
            role="status"
            aria-live="off"
            aria-label="أسعار الصرف والأخبار العاجلة"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="absolute inset-0 bg-[#0b1830]" />

            <div className="relative flex items-center h-[32px] sm:h-[36px]">
                <div className="flex-1 overflow-hidden">
                    <div
                        ref={trackRef}
                        className="flex items-center whitespace-nowrap will-change-transform"
                        style={{ animation: `ticker-scroll ${duration}s linear infinite`, animationPlayState: isPaused ? 'paused' : 'running' }}
                    >
                        {renderedTrack.map((item, i) => (
                            <span key={`${item.id}-${i}`} className="inline-flex items-center shrink-0">
                                {item.kind === 'rate' ? (
                                    <span className="inline-flex items-center gap-1.5 px-4">
                                        <span className="text-slate-300">{item.label}</span>
                                        <span className="text-white tabular-nums" dir="ltr">{item.value} {item.unit}</span>
                                        {item.change !== 0 && (
                                            <span className={`inline-flex items-center gap-0.5 tabular-nums ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} dir="ltr">
                                                {item.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                {item.change >= 0 ? '+' : ''}{fmt(item.change, 2)}%
                                            </span>
                                        )}
                                    </span>
                                ) : item.link ? (
                                    <Link href={item.link} className="text-slate-100 hover:text-emerald-300 transition-colors px-4 tabular-nums">
                                        {item.text}
                                    </Link>
                                ) : (
                                    <span className="text-slate-100 px-4 tabular-nums">{item.text}</span>
                                )}
                                <span className="text-emerald-400/70 text-[10px] sm:text-xs leading-none" aria-hidden="true">●</span>
                            </span>
                        ))}
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
