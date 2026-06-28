'use client';

/**
 * SitePulse — a compact, live "pulse of the site" KPI strip for the admin
 * home. The owner wanted to TRACK THE SITE (traffic, movement, growth), not a
 * feed of "new member joined". This leads the dashboard with the numbers that
 * matter: who's on the site right now, today's visits + views, the weekly
 * growth trend, and all-time reach — refreshing every 30s so it's truly live.
 *
 * Reads the same RPCs the full analytics block uses (get_dashboard_stats,
 * get_period_comparison) with graceful fallbacks. Read-only; no DB change.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Eye, TrendingUp, TrendingDown, Activity, Globe, RefreshCw } from 'lucide-react';

interface Stats {
    active_users_now?: number;
    today_unique_visitors?: number;
    today_page_views?: number;
    week_visitors?: number;
    total_visitors_all_time?: number;
}
interface Comparison {
    visitors_change_pct?: number;
}

function fmt(n: number | undefined): string {
    if (n == null) return '—';
    return Number(n).toLocaleString('en-US');
}

export default function SitePulse() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [cmp, setCmp] = useState<Comparison | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (silent = false) => {
        if (!supabase) { setLoading(false); return; }
        if (silent) setRefreshing(true); else setLoading(true);
        try {
            const [s, c] = await Promise.allSettled([
                supabase.rpc('get_dashboard_stats'),
                supabase.rpc('get_period_comparison'),
            ]);
            if (s.status === 'fulfilled' && s.value.data) setStats(s.value.data as Stats);
            if (c.status === 'fulfilled' && c.value.data) setCmp(c.value.data as Comparison);
        } catch { /* best-effort */ }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        void load();
        const id = setInterval(() => load(true), 30000); // live: 30s
        return () => clearInterval(id);
    }, [load]);

    const growth = cmp?.visitors_change_pct;
    const growthUp = (growth ?? 0) >= 0;

    const cards = [
        {
            key: 'now',
            label: 'الزوار الآن',
            value: fmt(stats?.active_users_now),
            sub: 'نشط آخر 5 دقائق',
            icon: Activity,
            cls: 'from-emerald-500 to-teal-600',
            live: true,
        },
        {
            key: 'today',
            label: 'زيارات اليوم',
            value: fmt(stats?.today_unique_visitors ?? stats?.today_page_views),
            sub: 'زائر فريد',
            icon: Users,
            cls: 'from-blue-500 to-cyan-600',
        },
        {
            key: 'views',
            label: 'مشاهدات اليوم',
            value: fmt(stats?.today_page_views),
            sub: 'صفحة',
            icon: Eye,
            cls: 'from-violet-500 to-purple-600',
        },
        {
            key: 'growth',
            label: 'نموّ الزيارات',
            value: growth == null ? '—' : `${growthUp ? '+' : ''}${Math.round(growth)}%`,
            sub: 'مقارنة بالأسبوع الماضي',
            icon: growthUp ? TrendingUp : TrendingDown,
            cls: growthUp ? 'from-emerald-500 to-green-600' : 'from-rose-500 to-red-600',
        },
        {
            key: 'all',
            label: 'إجمالي الزوار',
            value: fmt(stats?.total_visitors_all_time),
            sub: 'منذ الإطلاق',
            icon: Globe,
            cls: 'from-amber-500 to-orange-600',
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 tracking-[0.2em] uppercase">
                    <span className="relative inline-flex items-center justify-center w-2 h-2">
                        <span className="absolute inline-flex w-2 h-2 rounded-full bg-emerald-500 opacity-75 animate-ping" />
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                    </span>
                    نبض الموقع
                </h2>
                <button onClick={() => load(true)} disabled={refreshing} className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1 disabled:opacity-50 transition-colors">
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> تحديث
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {cards.map((c) => {
                        const Icon = c.icon;
                        return (
                            <div key={c.key} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm">
                                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${c.cls}`} />
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${c.cls} text-white shadow-sm`}>
                                        <Icon size={15} />
                                    </span>
                                    {c.live && (
                                        <span className="relative inline-flex items-center justify-center w-2 h-2">
                                            <span className="absolute inline-flex w-2 h-2 rounded-full bg-emerald-500 opacity-75 animate-ping" />
                                            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                                        </span>
                                    )}
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{c.value}</div>
                                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1">{c.label}</div>
                                <div className="text-[10px] text-slate-400">{c.sub}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
