'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAdminUpdates } from '@/lib/useAdminData';
import {
    Bell, Sparkles, Loader2, Calendar,
    Newspaper, ArrowLeft,
    Search, Filter, Clock, TrendingUp, ChevronDown, Flame, Eye,
    FileText, AlertCircle, Shield, HelpCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { isNewContent, formatDate, AUTO_EVENT_CONFIG } from '@/lib/updateUtils';

const FILTER_TABS = [
    { key: 'all', label: 'الكل', icon: Filter },
    { key: 'news', label: 'أخبار', icon: Newspaper },
    { key: 'new_article', label: 'مقالات', icon: FileText },
    { key: 'new_scenario', label: 'سيناريوهات', icon: AlertCircle },
    { key: 'new_code', label: 'أكواد', icon: Shield },
    { key: 'new_faq', label: 'أسئلة', icon: HelpCircle },
];

function groupByDate(items: any[]): { label: string; date: string; items: any[] }[] {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const groups: Record<string, { date: string; items: any[] }> = {
        'اليوم': { date: today, items: [] },
        'هذا الأسبوع': { date: weekAgo, items: [] },
        'هذا الشهر': { date: monthAgo, items: [] },
        'أقدم': { date: '', items: [] },
    };

    items.forEach(item => {
        const date = item.sortDate || '';
        if (date === today) groups['اليوم'].items.push(item);
        else if (date >= weekAgo) groups['هذا الأسبوع'].items.push(item);
        else if (date >= monthAgo) groups['هذا الشهر'].items.push(item);
        else groups['أقدم'].items.push(item);
    });

    return Object.entries(groups)
        .filter(([, g]) => g.items.length > 0)
        .map(([label, g]) => ({ label, date: g.date, items: g.items }));
}

export default function UpdatesClient() {
    const { updates: dbUpdates, loading: updatesLoading } = useAdminUpdates();
    const [autoEvents, setAutoEvents] = useState<any[]>([]);
    const [autoLoading, setAutoLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(20);

    useEffect(() => {
        async function fetchAutoEvents() {
            try {
                const res = await fetch('/api/public-events');
                const json = await res.json();
                setAutoEvents(json.events || []);
            } catch {
                setAutoEvents([]);
            }
            setAutoLoading(false);
        }
        fetchAutoEvents();
    }, []);

    const manualUpdates = dbUpdates
        .filter(u => u.type === 'news')
        .map(u => ({ ...u, source: 'manual' as const, sortDate: u.date || u.created_at }));

    const autoItems = autoEvents.map(e => {
        const cfg = AUTO_EVENT_CONFIG[e.event_type];
        return {
            id: e.id,
            title: e.title,
            detail: e.detail,
            date: e.created_at?.split('T')[0],
            sortDate: e.created_at?.split('T')[0],
            type: cfg?.type || 'تحديث',
            source: 'auto' as const,
            event_type: e.event_type,
            entity_id: e.entity_id,
            href: cfg?.href(e.entity_id || '') || '/updates',
        };
    });

    const allItems = useMemo(() =>
        [...manualUpdates, ...autoItems]
            .sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''))
    , [manualUpdates.length, autoItems.length]);

    // Filter + search
    const filteredItems = useMemo(() => {
        let result = activeFilter === 'all'
            ? allItems
            : allItems.filter(item =>
                item.source === 'manual'
                    ? activeFilter === 'news'
                    : item.event_type === activeFilter
            );

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(item =>
                (item.title || '').toLowerCase().includes(q) ||
                ('detail' in item && item.detail ? String(item.detail).toLowerCase().includes(q) : false) ||
                ('content' in item && item.content ? String(item.content).toLowerCase().includes(q) : false)
            );
        }

        return result;
    }, [allItems, activeFilter, searchQuery]);

    const visibleItems = filteredItems.slice(0, visibleCount);
    const groups = groupByDate(visibleItems);
    const loading = updatesLoading && autoLoading;

    // Stats
    const todayCount = allItems.filter(i => i.sortDate === new Date().toISOString().split('T')[0]).length;
    const weekCount = allItems.filter(i => isNewContent(i.sortDate || '')).length;

    // Filter counts
    const filterCounts = useMemo(() => {
        const counts: Record<string, number> = { all: allItems.length, news: manualUpdates.length };
        autoItems.forEach(item => {
            if (item.event_type) {
                counts[item.event_type] = (counts[item.event_type] || 0) + 1;
            }
        });
        return counts;
    }, [allItems.length]);

    return (
        <section className="px-4 py-8 sm:py-10">
            <div className="max-w-4xl mx-auto">

                {/* Stats bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <TrendingUp size={18} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{allItems.length}</p>
                            <p className="text-xs text-slate-500">إجمالي التحديثات</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Clock size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{todayCount}</p>
                            <p className="text-xs text-slate-500">تحديثات اليوم</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Sparkles size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{weekCount}</p>
                            <p className="text-xs text-slate-500">جديد هذا الأسبوع</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-5">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="ابحث في التحديثات..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(20); }}
                        className="w-full pr-10 pl-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-6 -mx-1 px-1">
                    {FILTER_TABS.map(tab => {
                        const count = filterCounts[tab.key] || 0;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => { setActiveFilter(tab.key); setVisibleCount(20); }}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    activeFilter === tab.key
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                                }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        activeFilter === tab.key
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                {loading && allItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={40} className="animate-spin text-emerald-600" />
                        <p className="text-sm text-slate-500">جاري تحميل التحديثات...</p>
                    </div>
                ) : filteredItems.length ? (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute right-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-emerald-300 via-slate-200 to-transparent dark:from-emerald-700 dark:via-slate-800" />

                        {groups.map(group => (
                            <div key={group.label} className="mb-10 last:mb-0">
                                {/* Group header */}
                                <div className="flex items-center gap-3 mb-5 relative">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-500 flex items-center justify-center z-10 flex-shrink-0 shadow-sm">
                                        <Calendar size={16} className="text-emerald-600" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                                            {group.label}
                                        </h3>
                                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                                            {group.items.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="space-y-3 pr-5">
                                    {group.items.map((item: any, index: number) => (
                                        <TimelineItem key={`${item.source}-${item.id}`} item={item} index={index} />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Load more */}
                        {visibleCount < filteredItems.length && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 20)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-400 hover:text-emerald-600 transition-all shadow-sm"
                                >
                                    <ChevronDown size={16} />
                                    عرض المزيد ({filteredItems.length - visibleCount} تحديث متبقي)
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                            <Bell size={28} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-300 font-bold">
                            {searchQuery
                                ? `لا توجد نتائج لـ "${searchQuery}"`
                                : activeFilter === 'all'
                                    ? 'لا توجد تحديثات منشورة حالياً.'
                                    : 'لا توجد نتائج لهذا التصنيف.'}
                        </p>
                        {(searchQuery || activeFilter !== 'all') && (
                            <button
                                onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                                className="mt-3 text-sm text-emerald-600 font-bold hover:underline"
                            >
                                عرض كل التحديثات
                            </button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

// Timeline item with fade-in
function TimelineItem({ item, index }: { item: any; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`relative transition-all duration-500 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
            style={{ transitionDelay: `${Math.min(index * 60, 300)}ms` }}
        >
            {/* Timeline dot */}
            <div className={`absolute -right-[15px] top-6 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 z-10 ${
                isNewContent(item.sortDate || item.date)
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                    : 'bg-slate-300 dark:bg-slate-700'
            }`} />

            {item.source === 'auto'
                ? <AutoEventCard item={item} />
                : <ManualUpdateCard u={item} />
            }
        </div>
    );
}

// Auto event card
function AutoEventCard({ item }: { item: any }) {
    const cfg = AUTO_EVENT_CONFIG[item.event_type];
    if (!cfg) return null;
    const Icon = cfg.icon;
    const isNew = isNewContent(item.date);

    return (
        <Link
            href={item.href}
            className={`block rounded-2xl border bg-white dark:bg-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all group ${
                isNew
                    ? 'border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 flex-shrink-0 rounded-xl ${cfg.bgLight} ${cfg.bgDark} flex items-center justify-center`}>
                    <Icon size={22} className={`text-${cfg.color}-600`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${cfg.bgLight} ${cfg.bgDark} text-${cfg.color}-700 dark:text-${cfg.color}-300`}>
                            {cfg.type}
                        </span>
                        {isNew && (
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                <Sparkles size={9} /> جديد
                            </span>
                        )}
                        <time dateTime={item.date} className="text-[11px] text-slate-400 flex items-center gap-1 mr-auto">
                            <Clock size={11} />
                            {formatDate(item.date)}
                        </time>
                    </div>

                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors leading-snug">
                        {item.title}
                    </h2>

                    {item.detail && (
                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.detail}
                        </p>
                    )}

                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-[-4px] transition-transform">
                        <Eye size={12} />
                        عرض المحتوى
                        <ArrowLeft size={12} />
                    </span>
                </div>
            </div>
        </Link>
    );
}

// Manual update card
function ManualUpdateCard({ u }: { u: any }) {
    const isUrgent = u.type === 'هام' || u.type === 'عاجل' || u.type === 'alert';
    const isNew = isNewContent(u.date);

    return (
        <Link
            href={u.link || `/updates/${u.id}`}
            className={`block rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${
                isUrgent
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 hover:border-red-400'
                    : isNew
                        ? 'bg-white dark:bg-slate-900/80 border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400'
                        : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
        >
            {/* Urgent accent */}
            {isUrgent && (
                <div className="absolute top-0 right-0 w-1 h-full bg-red-500 rounded-r-full" />
            )}

            <div className="flex items-start gap-4">
                {u.image && (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 hidden sm:block">
                        <Image
                            src={u.image}
                            alt={u.title || "صورة التحديث"}
                            fill
                            className="rounded-xl object-cover"
                            sizes="80px"
                        />
                    </div>
                )}

                {!u.image && (
                    <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center ${
                        isUrgent
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                        {isUrgent
                            ? <Flame size={22} className="text-red-500" />
                            : <Newspaper size={22} className="text-amber-600" />
                        }
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${
                            isUrgent
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                            {isUrgent ? '⚠️ هام' : u.type === 'news' ? 'خبر' : u.type}
                        </span>

                        {isNew && !isUrgent && (
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                <Sparkles size={9} /> جديد
                            </span>
                        )}

                        <time dateTime={u.date} className="text-[11px] text-slate-400 flex items-center gap-1 mr-auto">
                            <Clock size={11} />
                            {formatDate(u.date)}
                        </time>
                    </div>

                    <h2 className={`text-base sm:text-lg font-extrabold leading-snug transition-colors ${
                        isUrgent
                            ? 'text-red-800 dark:text-red-200 group-hover:text-red-600'
                            : 'text-slate-900 dark:text-slate-100 group-hover:text-emerald-600'
                    }`}>
                        {u.title}
                    </h2>

                    {u.content && (
                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {u.content.replace(/<[^>]*>/g, '')}
                        </p>
                    )}

                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-[-4px] transition-transform">
                        <Eye size={12} />
                        قراءة التفاصيل
                        <ArrowLeft size={12} />
                    </span>
                </div>
            </div>
        </Link>
    );
}
