'use client';

/**
 * SitePulse — the single, merged "what's happening on my site" panel.
 *
 * This replaces the old split (a KPI strip here + a long AnalyticsDashboard
 * below that repeated the same visitors/views/pages numbers). Everything the
 * owner needs to read the site at a glance now lives in ONE place at the top:
 *   • KPI strip: visitors now, today's visits + views, avg time on site,
 *     weekly growth, all-time reach.
 *   • Live mini-panels (top-5 + proportion bars): top pages, traffic sources,
 *     countries, devices.
 * Refreshes every 30s. Read-only; reuses existing RPCs with allSettled
 * fallbacks so a missing function degrades that one tile to "no data".
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Users, Eye, TrendingUp, TrendingDown, Activity, Globe, RefreshCw,
    FileText, Share2, MapPin, Clock, Smartphone, ChevronDown, UserPlus, Repeat,
} from 'lucide-react';

interface Stats {
    active_users_now?: number;
    today_unique_visitors?: number;
    today_page_views?: number;
    avg_session_duration?: number;
    total_visitors_all_time?: number;
}
interface Comparison { visitors_change_pct?: number }
interface Row { label: string; value: number }
interface PeriodInsight { new_visitors?: number; returning_visitors?: number; page_views?: number }
interface TopPage { page_path: string; views: number | string; uniques?: number | string }
interface Insights {
    week?: PeriodInsight;
    month?: PeriodInsight;
    top_pages_week?: TopPage[];
    top_pages_month?: TopPage[];
}

function fmt(n: number | undefined): string {
    if (n == null) return '—';
    return Number(n).toLocaleString('en-US');
}
function fmtDur(s?: number): string {
    if (!s || s <= 0) return '—';
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    if (m === 0) return `${sec}ث`;
    return `${m}:${String(sec).padStart(2, '0')}`;
}

// Small readable maps — fall back to the raw value when unknown.
const PAGE_LABELS: Record<string, string> = {
    '/': 'الرئيسية', '/services': 'الخدمات', '/articles': 'المقالات', '/updates': 'التحديثات',
    '/faq': 'الأسئلة الشائعة', '/residence': 'الإقامة', '/work': 'العمل', '/health': 'الصحة',
    '/education': 'التعليم', '/housing': 'السكن', '/codes': 'الأكواد', '/dashboard': 'لوحة الأعضاء',
};
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
const pageLabel = (p: string) => PAGE_LABELS[p] || p;
const sourceLabel = (s: string) => SOURCE_LABELS[s] || s;
const deviceLabel = (d: string) => DEVICE_LABELS[d] || d;
const flag = (c: string) => FLAGS[c] || '🌐';

function MiniPanel({ title, icon: Icon, accent, rows, prefix, action }: {
    title: string;
    icon: React.ElementType;
    accent: string;
    rows: Row[];
    prefix?: (label: string) => string;
    action?: React.ReactNode;
}) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    return (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${accent}`}>
                    <Icon size={14} />
                </span>
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-200">{title}</h3>
                {action && <div className="ms-auto">{action}</div>}
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
    const [pages, setPages] = useState<Row[]>([]);
    const [insights, setInsights] = useState<Insights | null>(null);
    const [pagesPeriod, setPagesPeriod] = useState<'week' | 'month'>('week');
    const [sources, setSources] = useState<Row[]>([]);
    const [countries, setCountries] = useState<Row[]>([]);
    const [devices, setDevices] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // The KPI strip answers "how's traffic?" at a glance and always shows. The
    // four breakdown panels (pages/sources/countries/devices) are detail — kept
    // collapsed by default so the dashboard stays short ("ملمومة"), expandable
    // when the owner wants to dig in. Preference persists per browser.
    const [showDetails, setShowDetails] = useState(false);
    useEffect(() => {
        try { setShowDetails(localStorage.getItem('sitepulse_details') === '1'); } catch { /* ignore */ }
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
        const [s, c, p, r, co, dv, vi] = await Promise.allSettled([
            rpc('get_dashboard_stats'), rpc('get_period_comparison'),
            rpc('get_top_pages'), rpc('get_referrer_stats'),
            rpc('get_country_stats'), rpc('get_device_stats'),
            rpc('get_visitor_insights'),
        ]);
        if (vi.status === 'fulfilled' && vi.value.data) setInsights(vi.value.data as Insights);
        if (s.status === 'fulfilled' && s.value.data) setStats(s.value.data as Stats);
        if (c.status === 'fulfilled' && c.value.data) setCmp(c.value.data as Comparison);
        if (p.status === 'fulfilled' && Array.isArray(p.value.data))
            setPages(p.value.data.map((x: { page_path: string; views: number | string }) => ({ label: pageLabel(x.page_path), value: Number(x.views) })));
        if (r.status === 'fulfilled' && Array.isArray(r.value.data))
            setSources(r.value.data.map((x: { source: string; count: number | string }) => ({ label: sourceLabel(x.source), value: Number(x.count) })));
        if (co.status === 'fulfilled' && Array.isArray(co.value.data))
            setCountries(co.value.data.map((x: { country: string; count: number | string }) => ({ label: x.country, value: Number(x.count) })));
        if (dv.status === 'fulfilled' && Array.isArray(dv.value.data))
            setDevices(dv.value.data.map((x: { device: string; count: number | string }) => ({ label: deviceLabel(x.device), value: Number(x.count) })));
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        void load();
        const id = setInterval(() => load(true), 30000);
        return () => clearInterval(id);
    }, [load]);

    const growth = cmp?.visitors_change_pct;
    const growthUp = (growth ?? 0) >= 0;

    // Week/month toggled top pages from get_visitor_insights; falls back to the
    // legacy 30-day get_top_pages list until the owner runs the new migration.
    const insightTop = pagesPeriod === 'week' ? insights?.top_pages_week : insights?.top_pages_month;
    const insightPages: Row[] | null = insightTop && insightTop.length
        ? insightTop.map((x) => ({ label: pageLabel(x.page_path), value: Number(x.views) }))
        : null;

    const cards = [
        { key: 'now', label: 'الزوار الآن', value: fmt(stats?.active_users_now), sub: 'نشط آخر 5 دقائق', icon: Activity, cls: 'from-emerald-500 to-teal-600', live: true },
        { key: 'today', label: 'زيارات اليوم', value: fmt(stats?.today_unique_visitors ?? stats?.today_page_views), sub: 'زائر فريد', icon: Users, cls: 'from-blue-500 to-cyan-600' },
        { key: 'views', label: 'مشاهدات اليوم', value: fmt(stats?.today_page_views), sub: 'صفحة', icon: Eye, cls: 'from-violet-500 to-purple-600' },
        { key: 'dwell', label: 'متوسط البقاء', value: fmtDur(stats?.avg_session_duration), sub: 'لكل جلسة', icon: Clock, cls: 'from-indigo-500 to-blue-600' },
        { key: 'growth', label: 'نموّ الزيارات', value: growth == null ? '—' : `${growthUp ? '+' : ''}${Math.round(growth)}%`, sub: 'مقابل الأسبوع الماضي', icon: growthUp ? TrendingUp : TrendingDown, cls: growthUp ? 'from-emerald-500 to-green-600' : 'from-rose-500 to-red-600' },
        { key: 'all', label: 'إجمالي الزوار', value: fmt(stats?.total_visitors_all_time), sub: 'منذ الإطلاق', icon: Globe, cls: 'from-amber-500 to-orange-600' },
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
                <button onClick={() => load(true)} disabled={refreshing} className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1 disabled:opacity-50 transition-colors">
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> تحديث
                </button>
            </div>

            {/* KPI strip */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
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

            {/* Live mini-panels — collapsible detail. Toggle keeps the dashboard
                compact by default; owner expands to see the full breakdown. */}
            {!loading && (
                <>
                    <button
                        onClick={toggleDetails}
                        className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        aria-expanded={showDetails}
                    >
                        <ChevronDown size={14} className={`transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                        {showDetails ? 'إخفاء تفاصيل الزوّار' : 'تفاصيل الزوّار (صفحات · مصادر · دول · أجهزة)'}
                    </button>
                    {showDetails && (
                        <div className="space-y-2 sm:space-y-3">
                            {/* New vs returning — one compact strip, week + month */}
                            {insights && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                    {[
                                        { label: 'زوار جدد', sub: 'آخر 7 أيام', value: insights.week?.new_visitors, icon: UserPlus, cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' },
                                        { label: 'زوار عائدون', sub: 'آخر 7 أيام', value: insights.week?.returning_visitors, icon: Repeat, cls: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
                                        { label: 'زوار جدد', sub: 'آخر 30 يوم', value: insights.month?.new_visitors, icon: UserPlus, cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' },
                                        { label: 'زوار عائدون', sub: 'آخر 30 يوم', value: insights.month?.returning_visitors, icon: Repeat, cls: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
                                    ].map((c, i) => {
                                        const Icon = c.icon;
                                        return (
                                            <div key={i} className="flex items-center gap-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 shadow-sm">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${c.cls}`}>
                                                    <Icon size={15} />
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums leading-none">{fmt(c.value)}</div>
                                                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{c.label} · {c.sub}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                <MiniPanel
                                    title="أكثر الصفحات زيارة"
                                    icon={FileText}
                                    accent="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                    rows={insightPages ?? pages}
                                    action={insights ? (
                                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[10px] font-black">
                                            {(['week', 'month'] as const).map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPagesPeriod(p)}
                                                    className={`px-2 py-0.5 transition-colors ${pagesPeriod === p ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-600'}`}
                                                >
                                                    {p === 'week' ? 'أسبوع' : 'شهر'}
                                                </button>
                                            ))}
                                        </div>
                                    ) : undefined}
                                />
                                <MiniPanel title="من أين أتى الزوار" icon={Share2} accent="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" rows={sources} />
                                <MiniPanel title="الدول" icon={MapPin} accent="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" rows={countries} prefix={(c) => flag(c)} />
                                <MiniPanel title="الأجهزة" icon={Smartphone} accent="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" rows={devices} />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
