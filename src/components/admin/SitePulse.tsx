'use client';

/**
 * SitePulse — the single, merged "what's happening on my site" panel.
 *
 * This replaces the old split (a KPI strip here + a long AnalyticsDashboard
 * below that repeated the same visitors/views/pages numbers). Everything the
 * owner needs to read the site at a glance now lives in ONE place at the top:
 *   • KPI strip: visitors now, today, last seven days and weekly growth.
 *   • A daily growth curve.
 *   • Lazy details: traffic sources, countries and devices.
 * Only the live count refreshes automatically; the slower breakdowns load on
 * demand so the first dashboard screen stays quick and quiet.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Users, TrendingUp, TrendingDown, RefreshCw,
    Share2, MapPin, Smartphone, ChevronDown,
} from 'lucide-react';

interface Stats {
    active_users_now?: number;
    today_unique_visitors?: number;
}
interface Comparison { visitors_change_pct?: number }
interface Row { label: string; value: number }
interface PeriodInsight {
    active_visitors?: number;
}
interface DailyPoint {
    day: string;
    page_views: number | string | null;
    unique_visitors: number | string | null;
    new_visitors: number | string;
}
interface Insights {
    week?: PeriodInsight;
}

function fmt(n: number | undefined): string {
    if (n == null) return '—';
    return Number(n).toLocaleString('en-US');
}
// Small readable maps — fall back to the raw value when unknown.
const SOURCE_LABELS: Record<string, string> = {
    direct: 'مباشر', google: 'جوجل', facebook: 'فيسبوك', instagram: 'إنستغرام', whatsapp: 'واتساب',
    telegram: 'تليجرام', twitter: 'تويتر/X', youtube: 'يوتيوب', bing: 'بينج', yandex: 'يانديكس',
    tiktok: 'تيك توك', reddit: 'ريديت', other: 'أخرى',
};
const DEVICE_LABELS: Record<string, string> = {
    mobile: 'جوال', tablet: 'تابلت', desktop: 'حاسب', unknown: 'غير محدد',
};
const FLAGS: Record<string, string> = {
    Turkey: '🇹🇷', Syria: '🇸🇾', Germany: '🇩🇪', 'Saudi Arabia': '🇸🇦', Egypt: '🇪🇬', Iraq: '🇮🇶',
    Jordan: '🇯🇴', Lebanon: '🇱🇧', UAE: '🇦🇪', USA: '🇺🇸', France: '🇫🇷', UK: '🇬🇧', Netherlands: '🇳🇱',
};
const sourceLabel = (s: string) => SOURCE_LABELS[s] || s;
const deviceLabel = (d: string) => DEVICE_LABELS[d] || d;
const flag = (c: string) => FLAGS[c] || '🌐';

// Daily traffic since we started keeping a permanent summary.
//
// This is the one tile that answers the owner's actual question — "is the site
// growing?" — which no single number can. It reads analytics_daily, the rollup
// that survives the 90-day pruning of analytics_events, so the curve keeps
// getting longer instead of resetting.
//
// Bars, not a line: daily counts are discrete magnitudes, and a line between
// them implies values at 3am that we never measured. One series, so no legend —
// the heading names it. Only the peak and the latest day are labelled; a number
// on all 90 bars would be noise.
//
// Time runs oldest-left to today-right, the usual direction for a time axis.
// Note the array is sorted newest-first and the container is dir="rtl", so flex
// lays child 0 at the RIGHT — the two cancel out. Measured in a browser rather
// than assumed, and the caption underneath is laid out by the same rule, so the
// date under the right end really is the latest day. If you ever change the
// sort, check the caption still lines up.
//
// #059669 in both themes — validated against the light and dark chart surfaces
// (lightness band + >=3:1 contrast), not a bright-on-dark flip of a light-mode
// colour.
const BAR_COLOR = '#059669';

function GrowthChart({ data }: { data: DailyPoint[] }) {
    const points = [...data]
        .sort((a, b) => (a.day < b.day ? 1 : -1))   // newest first; RTL puts it rightmost
        .slice(0, 90);
    const known = points.filter((p) => p.unique_visitors != null);
    if (known.length < 2) return null;

    const values = known.map((p) => Number(p.unique_visitors));
    const max = Math.max(...values);
    const peakDay = known[values.indexOf(max)]?.day;
    const latest = points.find((p) => p.unique_visitors != null);
    const oldest = points[points.length - 1];

    const dayLabel = (d?: string) => (d ? new Date(d + 'T00:00:00Z').toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '');

    return (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={14} />
                </span>
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-200">الزوّار يومياً</h3>
                <span className="ms-auto text-[10px] font-bold text-slate-400 tabular-nums">
                    الذروة {fmt(max)} · {dayLabel(peakDay)}
                </span>
            </div>

            <div
                className="flex items-end gap-[2px] h-16 border-b border-slate-200 dark:border-slate-800"
                role="img"
                aria-label={`الزوّار الفريدون يومياً على مدى ${known.length} يوماً. الذروة ${max} زائراً. آخر يوم ${Number(latest?.unique_visitors ?? 0)} زائراً.`}
            >
                {points.map((p) => {
                    const v = p.unique_visitors == null ? null : Number(p.unique_visitors);
                    // A pruned day is NOT a zero day — it renders as a hairline
                    // stub in muted ink so a gap in memory never reads as a
                    // collapse in traffic.
                    if (v == null) {
                        return (
                            <div key={p.day} className="flex-1 h-[2px] rounded-t-[2px] bg-slate-200 dark:bg-slate-700" title={`${p.day} — لا تفاصيل محفوظة`} />
                        );
                    }
                    return (
                        <div
                            key={p.day}
                            className="flex-1 rounded-t-[3px] transition-opacity hover:opacity-70"
                            style={{ height: `${Math.max((v / max) * 100, 2)}%`, backgroundColor: BAR_COLOR }}
                            title={`${p.day} — ${v.toLocaleString('en-US')} زائر`}
                        />
                    );
                })}
            </div>

            <div className="flex items-center justify-between mt-1.5 text-[10px] font-bold text-slate-400">
                <span className="tabular-nums">{dayLabel(latest?.day)} · {fmt(Number(latest?.unique_visitors ?? 0))}</span>
                <span className="tabular-nums">{dayLabel(oldest?.day)}</span>
            </div>
        </div>
    );
}

function MiniPanel({ title, icon: Icon, accent, rows, prefix }: {
    title: string;
    icon: React.ElementType;
    accent: string;
    rows: Row[];
    prefix?: (label: string) => string;
}) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    return (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${accent}`}>
                    <Icon size={14} />
                </span>
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-200">{title}</h3>
            </div>
            {rows.length === 0 ? (
                <p className="text-[11px] text-slate-400 py-2">لا بيانات بعد</p>
            ) : (
                <ul className="space-y-2">
                    {rows.slice(0, 5).map((r, i) => (
                        <li key={i} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="font-bold text-slate-600 dark:text-slate-300 truncate">
                                    {prefix ? `${prefix(r.label)} ` : ''}{r.label}
                                </span>
                                <span className="font-black text-slate-900 dark:text-white tabular-nums shrink-0">{fmt(r.value)}</span>
                            </div>
                            <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500" style={{ width: `${Math.round((r.value / max) * 100)}%` }} />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function SitePulse() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [cmp, setCmp] = useState<Comparison | null>(null);
    const [insights, setInsights] = useState<Insights | null>(null);
    const [daily, setDaily] = useState<DailyPoint[]>([]);
    const [sources, setSources] = useState<Row[]>([]);
    const [countries, setCountries] = useState<Row[]>([]);
    const [devices, setDevices] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [detailsLoaded, setDetailsLoaded] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    useEffect(() => {
        try { setShowDetails(localStorage.getItem('sitepulse_details') === '1'); } catch { /* ignore */ }
    }, []);

    // Sources/countries/devices are secondary. Fetch them only when the owner
    // opens the section instead of charging every dashboard visit three RPCs.
    const loadDetails = useCallback(async () => {
        if (!supabase) return;
        setDetailsLoading(true);
        const rpc = (name: string) => supabase!.rpc(name);
        const [r, co, dv] = await Promise.allSettled([
            rpc('get_referrer_stats'), rpc('get_country_stats'), rpc('get_device_stats'),
        ]);
        if (r.status === 'fulfilled' && Array.isArray(r.value.data))
            setSources(r.value.data.map((x: { source: string; count: number | string }) => ({ label: sourceLabel(x.source), value: Number(x.count) })));
        if (co.status === 'fulfilled' && Array.isArray(co.value.data))
            setCountries(co.value.data.map((x: { country: string; count: number | string }) => ({ label: x.country, value: Number(x.count) })));
        if (dv.status === 'fulfilled' && Array.isArray(dv.value.data))
            setDevices(dv.value.data.map((x: { device: string; count: number | string }) => ({ label: deviceLabel(x.device), value: Number(x.count) })));
        setDetailsLoaded(true);
        setDetailsLoading(false);
    }, []);

    const toggleDetails = () => {
        setShowDetails((v) => {
            const next = !v;
            try { localStorage.setItem('sitepulse_details', next ? '1' : '0'); } catch { /* ignore */ }
            return next;
        });
    };

    const load = useCallback(async (silent = false) => {
        if (!supabase) { setLoading(false); return; }
        if (silent) setRefreshing(true); else setLoading(true);
        const rpc = (name: string) => supabase!.rpc(name);
        const [s, c, vi, dt] = await Promise.allSettled([
            rpc('get_dashboard_stats'), rpc('get_period_comparison'),
            rpc('get_visitor_insights'),
            // Absent until the owner runs sql/2026-08-04_analytics_durable_rollups.sql;
            // allSettled means that just leaves the growth tile unrendered.
            rpc('get_daily_traffic'),
        ]);
        if (vi.status === 'fulfilled' && vi.value.data) setInsights(vi.value.data as Insights);
        if (dt.status === 'fulfilled' && Array.isArray(dt.value.data)) setDaily(dt.value.data as DailyPoint[]);
        if (s.status === 'fulfilled' && s.value.data) setStats(s.value.data as Stats);
        if (c.status === 'fulfilled' && c.value.data) setCmp(c.value.data as Comparison);
        setLoading(false);
        setRefreshing(false);
    }, []);

    // Only the live number changes fast. The previous version repeated all
    // analytics RPCs every 30 seconds even while details were closed.
    const loadLive = useCallback(async () => {
        if (!supabase || document.hidden) return;
        const { data } = await supabase.rpc('get_dashboard_stats');
        if (data) setStats(data as Stats);
    }, []);

    useEffect(() => {
        void load();
        const id = setInterval(() => { void loadLive(); }, 60_000);
        return () => clearInterval(id);
    }, [load, loadLive]);

    useEffect(() => {
        if (showDetails && !detailsLoaded) void loadDetails();
    }, [showDetails, detailsLoaded, loadDetails]);

    const growth = cmp?.visitors_change_pct;
    const growthUp = (growth ?? 0) >= 0;

    const cards = [
        { key: 'today', label: 'دخلوا اليوم', value: fmt(stats?.today_unique_visitors), sub: 'شخص مختلف', icon: Users, cls: 'from-blue-500 to-cyan-600' },
        { key: 'week', label: 'دخلوا آخر 7 أيام', value: fmt(insights?.week?.active_visitors), sub: 'شخص مختلف', icon: Users, cls: 'from-indigo-500 to-blue-600' },
        { key: 'growth', label: 'نموّ الزيارات', value: growth == null ? '—' : `${growthUp ? '+' : ''}${Math.round(growth)}%`, sub: 'مقابل الأسبوع الماضي', icon: growthUp ? TrendingUp : TrendingDown, cls: growthUp ? 'from-emerald-500 to-green-600' : 'from-rose-500 to-red-600' },
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 tracking-[0.2em] uppercase">
                    <span className="relative inline-flex items-center justify-center w-2 h-2">
                        <span className="absolute inline-flex w-2 h-2 rounded-full bg-emerald-500 opacity-75 animate-ping" />
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                    </span>
                    نبض الموقع — ما يجري الآن
                </h2>
                <button onClick={() => { void load(true); if (detailsLoaded) void loadDetails(); }} disabled={refreshing} className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1 disabled:opacity-50 transition-colors">
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> تحديث
                </button>
            </div>

            {/* KPI strip */}
            {loading ? (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {cards.map((c) => {
                        const Icon = c.icon;
                        return (
                            <div key={c.key} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm">
                                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${c.cls}`} />
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${c.cls} text-white shadow-sm`}>
                                        <Icon size={15} />
                                    </span>
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{c.value}</div>
                                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1">{c.label}</div>
                                <div className="text-[10px] text-slate-400">{c.sub}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* The first screen stays limited to decisions + three numbers.
                The chart and traffic breakdowns remain available on demand. */}
            {!loading && (
                <>
                    <button
                        onClick={toggleDetails}
                        className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        aria-expanded={showDetails}
                    >
                        <ChevronDown size={14} className={`transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                        {showDetails ? 'إخفاء تفاصيل الزيارات' : 'تفاصيل الزيارات'}
                    </button>
                    {showDetails && (
                        <div className="space-y-2 sm:space-y-3">
                            {daily.length > 0 && <GrowthChart data={daily} />}
                            {detailsLoading && !detailsLoaded ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                    <MiniPanel title="مصادر الزيارات" icon={Share2} accent="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" rows={sources} />
                                    <MiniPanel title="الدول" icon={MapPin} accent="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" rows={countries} prefix={(c) => flag(c)} />
                                    <MiniPanel title="الأجهزة" icon={Smartphone} accent="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" rows={devices} />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
