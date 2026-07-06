'use client';

/**
 * LiveRatesStrip — USD / EUR / SAR / gram-gold vs the Turkish lira.
 *
 * The single most habitual daily check for this audience (expats, remittance
 * senders). Reads the edge-cached /api/rates, refreshes every 5 min, and shows
 * each rate with a green/red change arrow. Renders nothing until data arrives
 * (no layout jank, no error box to users).
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface Rate { value: number; change: number }
type Rates = { usd: Rate | null; eur: Rate | null; sar: Rate | null; gold: Rate | null };

const ITEMS: { key: keyof Rates; label: string; sym: string; decimals: number }[] = [
    { key: 'usd', label: 'دولار', sym: '$', decimals: 2 },
    { key: 'eur', label: 'يورو', sym: '€', decimals: 2 },
    { key: 'sar', label: 'ريال سعودي', sym: 'ر.س', decimals: 2 },
    { key: 'gold', label: 'غرام ذهب', sym: 'g', decimals: 0 },
];

function fmt(n: number, d: number): string {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function LiveRatesStrip() {
    const [rates, setRates] = useState<Rates | null>(null);

    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const r = await fetch('/api/rates');
                const d = await r.json();
                if (alive && d.ok && d.rates) setRates(d.rates as Rates);
            } catch { /* keep last-known; strip just stays as-is */ }
        };
        load();
        const id = setInterval(load, 5 * 60 * 1000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    if (!rates) return null;
    const shown = ITEMS.filter((it) => rates[it.key]);
    if (shown.length === 0) return null;

    return (
        <section
            aria-label="أسعار الصرف مقابل الليرة التركية"
            className="w-full border-y border-amber-200/60 dark:border-amber-900/30 bg-gradient-to-l from-amber-50/70 via-white to-emerald-50/60 dark:from-amber-950/20 dark:via-slate-950 dark:to-emerald-950/20"
        >
            <div className="max-w-6xl mx-auto px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-400 tracking-wider uppercase pe-1">
                    <RefreshCw size={11} /> مقابل الليرة 🇹🇷
                </span>
                {shown.map((it) => {
                    const r = rates[it.key]!;
                    const up = r.change >= 0;
                    return (
                        <div key={it.key} className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 shadow-sm">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{it.label}</span>
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 tabular-nums" dir="ltr">
                                {fmt(r.value, it.decimals)} ₺
                            </span>
                            {r.change !== 0 && (
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-black tabular-nums ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                                    {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                    {up ? '+' : ''}{fmt(r.change, 2)}%
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
