'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabaseClient';
import {
    Users, X, Smartphone, Monitor, Tablet, Globe, Radio, RefreshCw, Eye,
    ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Helpers ─────────────────────────────────────────── */

function pageLabel(path: string): string {
    const map: Record<string, string> = {
        '/': 'الرئيسية', '/services': 'الخدمات', '/articles': 'المقالات',
        '/faq': 'الأسئلة الشائعة', '/updates': 'التحديثات', '/dashboard': 'لوحة الأعضاء',
        '/login': 'تسجيل الدخول', '/join': 'انضم', '/codes': 'الأكواد الأمنية',
        '/residence': 'الإقامة', '/work': 'العمل', '/education': 'التعليم',
        '/health': 'الصحة', '/housing': 'السكن', '/consultant': 'المستشار الذكي',
        '/zones': 'مناطق محظورة', '/tools': 'أدوات', '/directory': 'الدليل',
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

const deviceIconMap: Record<string, React.ElementType> = {
    'mobile': Smartphone, 'tablet': Tablet, 'desktop': Monitor,
};

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'الآن';
    const m = Math.floor(diff / 60);
    if (m === 1) return 'منذ دقيقة';
    if (m === 2) return 'منذ دقيقتين';
    if (m <= 10) return `منذ ${m} دقائق`;
    if (m < 60) return `منذ ${m} دقيقة`;
    const h = Math.floor(m / 60);
    if (h === 1) return 'منذ ساعة';
    if (h === 2) return 'منذ ساعتين';
    if (h <= 10) return `منذ ${h} ساعات`;
    return `منذ ${h} ساعة`;
}

function timeShort(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function referrerSource(ref: string | null): string {
    if (!ref) return 'direct';
    const r = ref.toLowerCase();
    if (r.includes('google')) return 'google';
    if (r.includes('facebook') || r.includes('fb.')) return 'facebook';
    if (r.includes('instagram')) return 'instagram';
    if (r.includes('twitter') || r.includes('t.co')) return 'twitter';
    if (r.includes('whatsapp')) return 'whatsapp';
    if (r.includes('telegram') || r.includes('t.me')) return 'telegram';
    if (r.includes('youtube')) return 'youtube';
    if (r.includes('tiktok')) return 'tiktok';
    if (r.includes('bing')) return 'bing';
    return 'other';
}

function pagesArabic(count: number): string {
    if (count === 1) return 'صفحة';
    if (count === 2) return 'صفحتان';
    if (count <= 10) return `${count} صفحات`;
    return `${count} صفحة`;
}

/* ── Types ────────────────────────────────────────────── */

interface Visitor {
    visitor_id: string;
    page_path: string;
    ip_country: string | null;
    ip_city: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    referrer: string | null;
    last_seen: string;
    page_views: number;
}

interface JourneyPage {
    page_path: string;
    visited_at: string;
}

type Tab = 'active' | 'recent';

/* ── Component ───────────────────────────────────────── */

export function ActiveVisitorsBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState<Tab>('active');
    const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([]);
    const [recentVisitors, setRecentVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const bellBtnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Expandable journey state
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [journeyPages, setJourneyPages] = useState<JourneyPage[]>([]);
    const [journeyLoading, setJourneyLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const fetchVisitors = useCallback(async () => {
        if (!supabase) { setLoading(false); return; }
        setLoading(true);

        const [activeRes, recentRes] = await Promise.all([
            supabase.rpc('get_active_visitors'),
            supabase.rpc('get_recent_visitors'),
        ]);

        if (activeRes.data) setActiveVisitors(activeRes.data);
        if (recentRes.data) setRecentVisitors(recentRes.data);

        setLoading(false);
    }, []);

    const fetchJourney = useCallback(async (visitorId: string) => {
        if (!supabase) return;
        setJourneyLoading(true);
        const { data } = await supabase.rpc('get_visitor_journey', { p_visitor_id: visitorId });
        setJourneyPages(data || []);
        setJourneyLoading(false);
    }, []);

    const toggleExpand = useCallback((visitorId: string) => {
        if (expandedId === visitorId) {
            setExpandedId(null);
            setJourneyPages([]);
        } else {
            setExpandedId(visitorId);
            fetchJourney(visitorId);
        }
    }, [expandedId, fetchJourney]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        fetchVisitors();
        intervalRef.current = setInterval(fetchVisitors, 30000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [fetchVisitors]);

    // Close expanded when tab changes
    useEffect(() => {
        setExpandedId(null);
        setJourneyPages([]);
    }, [tab]);

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (
                bellBtnRef.current && !bellBtnRef.current.contains(target) &&
                (!panelRef.current || !panelRef.current.contains(target))
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsOpen(false);
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    const getPanelStyle = useCallback((): React.CSSProperties => {
        if (!bellBtnRef.current) return { position: 'fixed', top: 64, left: 16, right: 16 };
        const rect = bellBtnRef.current.getBoundingClientRect();
        const isDesktop = window.innerWidth >= 1280;
        if (isDesktop) {
            return {
                position: 'fixed',
                top: rect.bottom + 8,
                right: Math.max(window.innerWidth - rect.right, 16),
                width: 420,
            };
        }
        return { position: 'fixed', top: 64, left: 12, right: 12 };
    }, []);

    const visitors = tab === 'active' ? activeVisitors : recentVisitors;
    const activeCount = activeVisitors.length;

    const dropdown = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Mobile backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9998] xl:hidden bg-black/30 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{
                            opacity: 1, scale: 1, y: 0,
                            transition: { type: 'spring', stiffness: 300, damping: 25 },
                        }}
                        exit={{
                            opacity: 0, scale: 0.95, y: -8,
                            transition: { duration: 0.15 },
                        }}
                        className="z-[9999] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[75vh] xl:max-h-[80vh] flex flex-col overflow-hidden"
                        style={{ ...getPanelStyle(), transformOrigin: 'top right' }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <Radio size={18} className="text-emerald-500" />
                                    الزوار
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { fetchVisitors(); }}
                                        disabled={loading}
                                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="تحديث"
                                        aria-label="تحديث الزوار"
                                    >
                                        <RefreshCw size={14} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        aria-label="إغلاق"
                                    >
                                        <X size={16} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                <button
                                    onClick={() => setTab('active')}
                                    className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                        tab === 'active'
                                            ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    النشطون الآن
                                    <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                        {activeCount}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setTab('recent')}
                                    className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                        tab === 'recent'
                                            ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Eye size={13} />
                                    آخر 50 زائر
                                </button>
                            </div>
                        </div>

                        {/* Visitor List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <span className="text-sm text-slate-500">جاري التحميل...</span>
                                </div>
                            ) : visitors.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Users size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        {tab === 'active' ? 'لا يوجد زوار نشطون حالياً' : 'لا توجد بيانات بعد'}
                                    </p>
                                    {tab === 'active' && (
                                        <p className="text-xs text-slate-400 mt-1">يتحدث تلقائياً كل 30 ثانية</p>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {visitors.map((v, index) => {
                                        const DevIcon = deviceIconMap[v.device || ''] || Globe;
                                        const src = referrerSource(v.referrer);
                                        const isActive = tab === 'active';
                                        const isExpanded = expandedId === v.visitor_id;
                                        const hasMultiplePages = Number(v.page_views) > 1;
                                        return (
                                            <motion.div
                                                key={`${v.visitor_id}-${index}`}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{
                                                    opacity: 1, x: 0,
                                                    transition: { delay: Math.min(index * 0.02, 0.4) },
                                                }}
                                            >
                                                {/* Visitor Row */}
                                                <div
                                                    onClick={() => hasMultiplePages && toggleExpand(v.visitor_id)}
                                                    className={`px-4 py-3 transition-colors ${
                                                        hasMultiplePages ? 'cursor-pointer' : ''
                                                    } ${
                                                        isExpanded
                                                            ? 'bg-slate-50 dark:bg-slate-800/50'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        {/* Device Icon */}
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                                            isActive
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                                                : 'bg-slate-100 dark:bg-slate-800'
                                                        }`}>
                                                            <DevIcon size={14} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'} />
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={v.page_path}>
                                                                    {pageLabel(v.page_path)}
                                                                </p>
                                                                {isActive && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-400">
                                                                {(v.ip_city || v.ip_country) && (
                                                                    <span className="flex items-center gap-0.5">
                                                                        <span className="text-[10px]">{countryFlag[v.ip_country || ''] || '🌍'}</span>
                                                                        {v.ip_city && <span>{v.ip_city}</span>}
                                                                        {v.ip_city && v.ip_country && <span className="text-slate-300 dark:text-slate-600">·</span>}
                                                                        {v.ip_country && <span>{countryArabic[v.ip_country] || v.ip_country}</span>}
                                                                    </span>
                                                                )}
                                                                {v.device && (
                                                                    <span>{deviceArabic[v.device] || v.device}</span>
                                                                )}
                                                                {v.browser && (
                                                                    <span className="text-slate-300 dark:text-slate-600">·</span>
                                                                )}
                                                                {v.browser && <span>{v.browser}</span>}
                                                            </div>
                                                        </div>

                                                        {/* Right side */}
                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                            <span className={`text-[10px] font-bold ${
                                                                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                                            }`}>
                                                                {timeAgo(v.last_seen)}
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                                                                    {sourceIcon[src] || '🔗'} {sourceLabel[src] || src}
                                                                </span>
                                                                {hasMultiplePages && (
                                                                    <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                                                        {pagesArabic(Number(v.page_views))}
                                                                        <ChevronDown size={10} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Journey Expansion */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-4 pb-3 pr-[3.25rem]">
                                                                {journeyLoading ? (
                                                                    <div className="flex items-center gap-2 py-2">
                                                                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                                        <span className="text-[11px] text-slate-400">جاري التحميل...</span>
                                                                    </div>
                                                                ) : journeyPages.length === 0 ? (
                                                                    <p className="text-[11px] text-slate-400 py-1">لا توجد بيانات</p>
                                                                ) : (
                                                                    <div className="relative border-r-2 border-slate-200 dark:border-slate-700 pr-3 space-y-1.5">
                                                                        {journeyPages.map((page, i) => (
                                                                            <div key={i} className="flex items-center gap-2 relative">
                                                                                {/* Timeline dot */}
                                                                                <div className={`absolute -right-[0.4375rem] w-2.5 h-2.5 rounded-full border-2 ${
                                                                                    i === 0
                                                                                        ? 'bg-emerald-500 border-emerald-300 dark:border-emerald-700'
                                                                                        : 'bg-slate-300 dark:bg-slate-600 border-slate-200 dark:border-slate-700'
                                                                                }`} />
                                                                                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                                                                    <span className={`text-[11px] truncate ${
                                                                                        i === 0 ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-slate-500'
                                                                                    }`}>
                                                                                        {pageLabel(page.page_path)}
                                                                                    </span>
                                                                                    <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                                                                                        {timeShort(page.visited_at)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {visitors.length > 0 && (
                            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/30 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span>يتحدث كل 30 ثانية</span>
                                <span>{visitors.length} زائر</span>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div className="relative">
                <button
                    ref={bellBtnRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    aria-label="الزوار النشطون"
                    title="الزوار النشطون"
                >
                    <Users size={18} />

                    <AnimatePresence>
                        {activeCount > 0 && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-[#0f172a]"
                            >
                                {activeCount > 9 ? '9+' : activeCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>

            {mounted && createPortal(dropdown, document.body)}
        </>
    );
}
