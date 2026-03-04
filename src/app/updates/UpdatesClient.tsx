'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminUpdates, isNewContent } from '@/lib/useAdminData';
import { Bell, Sparkles, Loader2, Calendar, FileText, AlertCircle, HelpCircle, Shield, MapPin, Newspaper, ArrowLeft, Briefcase, Wrench, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const PUBLIC_EVENT_TYPES = ['new_article', 'new_scenario', 'new_faq', 'new_code', 'new_zone', 'new_update', 'new_service', 'new_tool', 'new_source'];

const AUTO_EVENT_CONFIG: Record<string, { type: string; icon: typeof FileText; bg: string; text: string; href: (id: string) => string }> = {
  new_article:  { type: 'مقال',      icon: FileText,     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', href: (id) => `/article/${id}` },
  new_scenario: { type: 'سيناريو',   icon: AlertCircle,  bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-600',    href: (id) => `/consultant?scenario=${id}` },
  new_faq:      { type: 'سؤال',      icon: HelpCircle,   bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-600',  href: () => `/faq` },
  new_code:     { type: 'كود أمني',   icon: Shield,       bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-600',     href: () => `/security-codes` },
  new_zone:     { type: 'منطقة',     icon: MapPin,       bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-600',  href: () => `/zones` },
  new_update:   { type: 'خبر',       icon: Newspaper,    bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600',   href: (id) => `/updates/${id}` },
  new_service:  { type: 'خدمة',      icon: Briefcase,    bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-600',    href: (id) => `/services/${id}` },
  new_tool:     { type: 'أداة',      icon: Wrench,       bg: 'bg-pink-100 dark:bg-pink-900/30',       text: 'text-pink-600',    href: () => `/tools` },
  new_source:   { type: 'مصدر رسمي', icon: ExternalLink, bg: 'bg-teal-100 dark:bg-teal-900/30',       text: 'text-teal-600',    href: () => `/sources` },
};

const FILTER_TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'news', label: 'أخبار' },
  { key: 'new_article', label: 'مقالات' },
  { key: 'new_scenario', label: 'سيناريوهات' },
  { key: 'new_code', label: 'أكواد أمنية' },
  { key: 'new_faq', label: 'أسئلة' },
];

function groupByDate(items: any[]): { label: string; items: any[] }[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const groups: Record<string, any[]> = {
    'اليوم': [],
    'هذا الأسبوع': [],
    'هذا الشهر': [],
    'أقدم': [],
  };

  items.forEach(item => {
    const date = item.sortDate || '';
    if (date === today) groups['اليوم'].push(item);
    else if (date >= weekAgo) groups['هذا الأسبوع'].push(item);
    else if (date >= monthAgo) groups['هذا الشهر'].push(item);
    else groups['أقدم'].push(item);
  });

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export default function UpdatesClient() {
  const { updates: dbUpdates, loading: updatesLoading } = useAdminUpdates();
  const [autoEvents, setAutoEvents] = useState<any[]>([]);
  const [autoLoading, setAutoLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch auto events via public API (bypasses admin-only RLS)
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

  // Merge manual news + auto events
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

  const allItems = [...manualUpdates, ...autoItems]
    .sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''))
    .slice(0, 30);

  // Apply filter
  const filteredItems = activeFilter === 'all'
    ? allItems
    : allItems.filter(item =>
        item.source === 'manual'
          ? activeFilter === 'news'
          : item.event_type === activeFilter
      );

  const groups = groupByDate(filteredItems);
  const loading = updatesLoading && autoLoading;

  return (
    <section className="px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-6 -mx-1 px-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && allItems.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-emerald-600" />
          </div>
        ) : filteredItems.length ? (
          <div className="relative">
            {/* Timeline vertical line */}
            <div className="absolute right-[19px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />

            {groups.map(group => (
              <div key={group.label} className="mb-8 last:mb-0">
                {/* Group header */}
                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 flex items-center justify-center z-10 flex-shrink-0">
                    <Calendar size={16} className="text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {group.label}
                  </h3>
                </div>

                {/* Items */}
                <div className="space-y-3 pr-5">
                  {group.items.map((item: any, index: number) => (
                    <TimelineItem key={`${item.source}-${item.id}`} item={item} index={index} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-300">
              {activeFilter === 'all'
                ? 'لا توجد تحديثات منشورة حالياً.'
                : 'لا توجد نتائج لهذا الفلتر.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// Timeline item with IntersectionObserver fade-in
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
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${Math.min(index * 80, 400)}ms` }}
    >
      {/* Timeline dot */}
      <div className="absolute -right-[15px] top-6 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-950 z-10" />

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

  return (
    <Link
      href={item.href}
      className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 flex-shrink-0 rounded-xl ${cfg.bg} flex items-center justify-center`}>
          <Icon size={24} className={cfg.text} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
              {cfg.type}
            </span>
            {isNewContent(item.date) && (
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <Sparkles size={10} /> جديد
              </span>
            )}
            <time dateTime={item.date} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar size={12} />
              {item.date}
            </time>
          </div>

          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
            {item.title}
          </h2>

          {item.detail && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {item.detail}
            </p>
          )}

          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
            عرض المحتوى <ArrowLeft size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// Manual update card
function ManualUpdateCard({ u }: { u: any }) {
  return (
    <Link
      href={`/updates/${u.id}`}
      className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all group"
    >
      <div className="flex items-start gap-4">
        {u.image && (
          <div className="relative w-20 h-20 flex-shrink-0 hidden sm:block">
            <Image
              src={u.image}
              alt={u.title || "صورة التحديث"}
              fill
              className="rounded-xl object-cover"
              sizes="80px"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.type === 'هام' || u.type === 'عاجل'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}>
              {u.type}
            </span>

            {isNewContent(u.date) && (
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <Sparkles size={10} /> جديد
              </span>
            )}

            <time dateTime={u.date} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar size={12} />
              {u.date}
            </time>
          </div>

          <h2 className="mt-1 text-lg md:text-xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
            {u.title}
          </h2>

          {u.content && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
              {u.content}
            </p>
          )}

          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
            قراءة التفاصيل <ArrowLeft size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}
