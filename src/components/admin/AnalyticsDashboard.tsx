'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    BarChart3, Users, Clock, MessageCircle, Eye, FileText,
    Briefcase, BrainCircuit, MapPin, Activity, CalendarDays,
    Smartphone, Monitor, Tablet, Globe, ArrowUpRight, TrendingUp,
    Share2
} from 'lucide-react';
import { motion } from 'framer-motion';

/** Format seconds into Arabic readable duration */
function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} ثانية`;
    if (s === 0) return `${m} دقيقة`;
    return `${m}:${String(s).padStart(2, '0')} دقيقة`;
}

/** Translate page path to readable Arabic label */
function pageLabel(path: string): string {
    const map: Record<string, string> = {
        '/': 'الرئيسية',
        '/services': 'الخدمات',
        '/articles': 'المقالات',
        '/faq': 'الأسئلة الشائعة',
        '/updates': 'التحديثات',
        '/dashboard': 'لوحة الأعضاء',
        '/login': 'تسجيل الدخول',
        '/join': 'انضم',
        '/codes': 'الأكواد الأمنية',
        '/residence': 'الإقامة',
        '/work': 'العمل',
        '/education': 'التعليم',
        '/health': 'الصحة',
        '/housing': 'السكن',
        '/consultant': 'المستشار الذكي',
        '/zones': 'مناطق محظورة',
        '/tools': 'أدوات',
        '/directory': 'الدليل',
    };
    if (map[path]) return map[path];
    if (path.startsWith('/article/')) return 'مقال: ' + path.replace('/article/', '').replace(/-/g, ' ').substring(0, 30);
    if (path.startsWith('/codes/')) return 'كود: ' + path.replace('/codes/', '');
    if (path.startsWith('/services/')) return 'خدمة';
    return path;
}

const countryArabic: Record<string, string> = {
    'Turkey': 'تركيا', 'Syria': 'سوريا', 'Lebanon': 'لبنان', 'Iraq': 'العراق',
    'Jordan': 'الأردن', 'Palestine': 'فلسطين', 'Egypt': 'مصر', 'Saudi Arabia': 'السعودية',
    'UAE': 'الإمارات', 'Kuwait': 'الكويت', 'Qatar': 'قطر', 'Bahrain': 'البحرين',
    'Oman': 'عُمان', 'Yemen': 'اليمن', 'Libya': 'ليبيا', 'Tunisia': 'تونس',
    'Algeria': 'الجزائر', 'Morocco': 'المغرب', 'Sudan': 'السودان', 'Germany': 'ألمانيا',
    'Netherlands': 'هولندا', 'Sweden': 'السويد', 'France': 'فرنسا', 'UK': 'بريطانيا',
    'USA': 'أمريكا', 'Canada': 'كندا', 'Austria': 'النمسا', 'Belgium': 'بلجيكا',
    'Denmark': 'الدنمارك', 'Norway': 'النرويج', 'Finland': 'فنلندا', 'Greece': 'اليونان',
    'Italy': 'إيطاليا', 'Spain': 'إسبانيا', 'Russia': 'روسيا',
};

const countryFlag: Record<string, string> = {
    'Turkey': '🇹🇷', 'Syria': '🇸🇾', 'Lebanon': '🇱🇧', 'Iraq': '🇮🇶',
    'Jordan': '🇯🇴', 'Palestine': '🇵🇸', 'Egypt': '🇪🇬', 'Saudi Arabia': '🇸🇦',
    'UAE': '🇦🇪', 'Kuwait': '🇰🇼', 'Qatar': '🇶🇦', 'Bahrain': '🇧🇭',
    'Oman': '🇴🇲', 'Yemen': '🇾🇪', 'Libya': '🇱🇾', 'Tunisia': '🇹🇳',
    'Algeria': '🇩🇿', 'Morocco': '🇲🇦', 'Sudan': '🇸🇩', 'Germany': '🇩🇪',
    'Netherlands': '🇳🇱', 'Sweden': '🇸🇪', 'France': '🇫🇷', 'UK': '🇬🇧',
    'USA': '🇺🇸', 'Canada': '🇨🇦', 'Austria': '🇦🇹', 'Belgium': '🇧🇪',
    'Denmark': '🇩🇰', 'Norway': '🇳🇴', 'Finland': '🇫🇮', 'Greece': '🇬🇷',
    'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Russia': '🇷🇺',
};

const sourceLabel: Record<string, string> = {
    'direct': 'مباشر', 'google': 'جوجل', 'bing': 'بينج', 'yandex': 'يانديكس',
    'facebook': 'فيسبوك', 'instagram': 'إنستغرام', 'twitter': 'تويتر/X',
    'whatsapp': 'واتساب', 'telegram': 'تليجرام', 'youtube': 'يوتيوب',
    'tiktok': 'تيك توك', 'reddit': 'ريديت', 'other': 'أخرى',
};

const sourceIcon: Record<string, string> = {
    'direct': '🔗', 'google': '🔍', 'bing': '🔎', 'yandex': '🔎',
    'facebook': '📘', 'instagram': '📷', 'twitter': '🐦',
    'whatsapp': '💬', 'telegram': '✈️', 'youtube': '▶️',
    'tiktok': '🎵', 'reddit': '🤖', 'other': '🌐',
};

const deviceArabic: Record<string, string> = {
    'mobile': 'جوال', 'tablet': 'تابلت', 'desktop': 'حاسب', 'unknown': 'غير محدد',
};

export function AnalyticsDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [dailyVisits, setDailyVisits] = useState<any[]>([]);
    const [topPages, setTopPages] = useState<any[]>([]);
    const [deviceStats, setDeviceStats] = useState<any[]>([]);
    const [countryStats, setCountryStats] = useState<any[]>([]);
    const [referrerStats, setReferrerStats] = useState<any[]>([]);
    const [browserStats, setBrowserStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rpcError, setRpcError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!supabase) return;
            setLoading(true);
            setRpcError(false);

            try {
                const [
                    { data: general, error: e1 },
                    { data: visits, error: e2 },
                    { data: pages, error: e3 },
                ] = await Promise.all([
                    supabase.rpc('get_dashboard_stats'),
                    supabase.rpc('get_daily_visits'),
                    supabase.rpc('get_top_pages'),
                ]);

                if (e1 || e2 || e3) throw (e1 || e2 || e3);

                // Fetch enhanced stats (may fail if SQL not run yet — graceful fallback)
                const safeRpc = async (name: string) => {
                    if (!supabase) return [];
                    const { data, error } = await supabase.rpc(name);
                    return error ? [] : (data || []);
                };
                const [devRes, countRes, refRes, browRes] = await Promise.all([
                    safeRpc('get_device_stats'),
                    safeRpc('get_country_stats'),
                    safeRpc('get_referrer_stats'),
                    safeRpc('get_browser_stats'),
                ]);

                // Override content counts with direct queries (more accurate)
                const [articles, updates, services, scenarios, zones] = await Promise.all([
                    supabase.from('articles').select('id', { count: 'exact', head: true }),
                    supabase.from('updates').select('id', { count: 'exact', head: true }),
                    supabase.from('service_providers').select('id', { count: 'exact', head: true }),
                    supabase.from('consultant_scenarios').select('id', { count: 'exact', head: true }),
                    supabase.from('zones').select('id', { count: 'exact', head: true }),
                ]);

                setStats({
                    ...general,
                    total_articles: (articles.count || 0) + (updates.count || 0),
                    total_services: services.count || general?.total_services || 0,
                    total_scenarios: scenarios.count || general?.total_scenarios || 0,
                    total_zones: zones.count || general?.total_zones || 0,
                });
                setDailyVisits(visits || []);
                setTopPages(pages || []);
                setDeviceStats(devRes);
                setCountryStats(countRes);
                setReferrerStats(refRes);
                setBrowserStats(browRes);
            } catch {
                setRpcError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />;

    if (rpcError || !stats) return (
        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl text-center text-amber-700 dark:text-amber-400">
            <p className="font-bold mb-1">لم يتم إعداد التحليلات بعد</p>
            <p className="text-sm">يرجى تشغيل ملف <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">analytics_enhanced.sql</code> في Supabase SQL Editor.</p>
        </div>
    );

    const maxVisits = Math.max(...dailyVisits.map((v: any) => Number(v.count)), 1);
    const avgDuration: number = stats.avg_session_duration || 0;
    const totalDevices = deviceStats.reduce((sum: number, d: any) => sum + Number(d.count), 0) || 1;

    return (
        <div className="space-y-8">
            {/* ── 1. Live Traffic Cards ─────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Users size={16} />
                        <span className="text-xs font-bold uppercase">الزوار الآن</span>
                    </div>
                    <div className="text-4xl font-black">{stats.active_users_now ?? 0}</div>
                    <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        نشط (آخر 5 دقائق)
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Eye size={16} />
                        <span className="text-xs font-bold uppercase">زوار اليوم</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white">
                        {(stats.today_unique_visitors ?? stats.today_page_views ?? 0).toLocaleString('ar')}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">زائر فريد اليوم</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <CalendarDays size={16} />
                        <span className="text-xs font-bold uppercase">مشاهدات اليوم</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white">
                        {(stats.today_page_views ?? 0).toLocaleString('ar')}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">صفحة شوهدت اليوم</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Clock size={16} />
                        <span className="text-xs font-bold uppercase">متوسط البقاء</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white">
                        {avgDuration > 0 ? formatDuration(avgDuration) : '—'}
                    </div>
                    <div className="text-xs mt-2">
                        {avgDuration > 0
                            ? <span className="text-emerald-600 font-bold">متوسط آخر 30 يوم</span>
                            : <span className="text-slate-400">يبدأ التتبع تلقائياً</span>
                        }
                    </div>
                </div>
            </div>

            {/* ── 2. Period Overview ─────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
                <PeriodCard label="هذا الأسبوع" count={stats.week_visitors ?? 0} icon={TrendingUp} color="blue" />
                <PeriodCard label="هذا الشهر" count={stats.month_visitors ?? 0} icon={CalendarDays} color="violet" />
                <PeriodCard label="الإجمالي" count={stats.total_visitors_all_time ?? 0} icon={Globe} color="emerald" />
            </div>

            {/* ── 3. Chart + Top Pages ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="text-slate-400" size={20} />
                        زوار فريدون — آخر 30 يوم
                    </h3>
                    {dailyVisits.some((d: any) => Number(d.count) > 0) ? (
                        <div className="flex items-end justify-between h-48 gap-[2px] sm:gap-1">
                            {dailyVisits.map((day: any, i: number) => (
                                <div key={day.date} className="flex-1 flex flex-col justify-end items-center group relative">
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                                        {day.count} — {day.date}
                                    </div>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(Number(day.count) / maxVisits) * 100}%` }}
                                        transition={{ duration: 0.4, delay: i * 0.02 }}
                                        className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 dark:from-blue-600 dark:to-cyan-500 rounded-t-sm min-h-[3px] opacity-80 hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 gap-2">
                            <BarChart3 size={32} className="opacity-20" />
                            <p className="text-sm">البيانات ستظهر بعد أول زيارات حقيقية</p>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                        <ArrowUpRight className="text-emerald-500" size={18} />
                        الأكثر زيارة
                    </h3>
                    <div className="space-y-4">
                        {topPages.length > 0 ? topPages.map((page: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold text-slate-400 w-5 shrink-0">#{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate" title={page.page_path}>
                                        {pageLabel(page.page_path)}
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                                        <div
                                            style={{ width: `${(Number(page.views) / Number(topPages[0]?.views || 1)) * 100}%` }}
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                        />
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-500 whitespace-nowrap shrink-0">{page.views}</span>
                            </div>
                        )) : (
                            <p className="text-slate-400 text-sm text-center py-6">جاري جمع البيانات...</p>
                        )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><MessageCircle size={13} /> {stats.total_comments ?? 0} تعليق</span>
                        <span>{stats.total_reviews ?? 0} تقييم خدمة</span>
                    </div>
                </div>
            </div>

            {/* ── 4. Devices + Countries + Sources ────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Device Breakdown */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                        <Smartphone className="text-blue-500" size={18} />
                        الأجهزة
                    </h3>
                    {deviceStats.length > 0 ? (
                        <div className="space-y-4">
                            {deviceStats.map((d: any) => {
                                const pct = Math.round((Number(d.count) / totalDevices) * 100);
                                const DeviceIcon = d.device === 'mobile' ? Smartphone : d.device === 'tablet' ? Tablet : Monitor;
                                return (
                                    <div key={d.device} className="flex items-center gap-3">
                                        <DeviceIcon size={18} className="text-slate-400 shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {deviceArabic[d.device] || d.device}
                                                </span>
                                                <span className="text-xs text-slate-500">{pct}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, delay: 0.2 }}
                                                    className="h-full bg-blue-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 shrink-0">{d.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState text="ستظهر بعد تشغيل analytics_enhanced.sql" />
                    )}
                    {browserStats.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-400 mb-3 uppercase">المتصفحات</p>
                            <div className="flex flex-wrap gap-2">
                                {browserStats.map((b: any) => (
                                    <span key={b.browser} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold">
                                        {b.browser} <span className="text-slate-400">({b.count})</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Country Breakdown */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                        <Globe className="text-violet-500" size={18} />
                        الدول
                    </h3>
                    {countryStats.length > 0 ? (
                        <div className="space-y-3">
                            {countryStats.map((c: any) => (
                                <div key={c.country} className="flex items-center gap-3">
                                    <span className="text-lg shrink-0">{countryFlag[c.country] || '🌍'}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                                            {countryArabic[c.country] || c.country}
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                                            <div
                                                style={{ width: `${(Number(c.count) / Number(countryStats[0]?.count || 1)) * 100}%` }}
                                                className="h-full bg-violet-500 rounded-full transition-all duration-700"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 shrink-0">{c.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="ستظهر بعد تشغيل analytics_enhanced.sql" />
                    )}
                </div>

                {/* Traffic Sources */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                        <Share2 className="text-amber-500" size={18} />
                        مصادر الزيارات
                    </h3>
                    {referrerStats.length > 0 ? (
                        <div className="space-y-3">
                            {referrerStats.map((r: any) => (
                                <div key={r.source} className="flex items-center gap-3">
                                    <span className="text-lg shrink-0">{sourceIcon[r.source] || '🌐'}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {sourceLabel[r.source] || r.source}
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                                            <div
                                                style={{ width: `${(Number(r.count) / Number(referrerStats[0]?.count || 1)) * 100}%` }}
                                                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 shrink-0">{r.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="ستظهر بعد تشغيل analytics_enhanced.sql" />
                    )}
                </div>
            </div>

            {/* ── 5. Content Stats ─────────────────────────────── */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="text-emerald-500" size={20} />
                    نظرة عامة على المحتوى
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <ContentStatCard title="المحتوى المنشور" count={stats.total_articles} icon={FileText} color="emerald" label="مقال وتحديث" />
                    <ContentStatCard title="الخدمات" count={stats.total_services} icon={Briefcase} color="blue" label="مزود خدمة" />
                    <ContentStatCard title="السيناريوهات" count={stats.total_scenarios} icon={BrainCircuit} color="violet" label="سيناريو ذكي" />
                    <ContentStatCard title="المناطق المحظورة" count={stats.total_zones} icon={MapPin} color="red" label="منطقة مسجلة" />
                </div>
            </div>
        </div>
    );
}

function PeriodCard({ label, count, icon: Icon, color }: {
    label: string; count: number; icon: any; color: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{count.toLocaleString('ar')}</p>
                <p className="text-[10px] text-slate-400">زائر فريد</p>
            </div>
        </div>
    );
}

function ContentStatCard({ title, count, icon: Icon, color, label }: {
    title: string; count: number; icon: any; color: string; label: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-lg transition-all duration-300 group">
            <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{count ?? 0}</h3>
                <p className="text-[10px] text-slate-400">{label}</p>
            </div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <BarChart3 size={28} className="opacity-20 mb-2" />
            <p className="text-sm text-center">{text}</p>
        </div>
    );
}
