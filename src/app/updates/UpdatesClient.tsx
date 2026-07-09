'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Newspaper, AlertTriangle, Rss, Search, ChevronDown, Clock, ArrowLeft, Loader2,
} from 'lucide-react';
import { AUTO_EVENT_CONFIG } from '@/lib/updateUtils';
import { stripHtml } from '@/lib/stripHtml';
import { SITE_CONFIG } from '@/lib/config';
import { SchemaScript } from '@/lib/schemaOrg';

const TAGLINE = 'ما الذي تغيّر في تركيا؟ قرارات وتعديلات وأخبار موثّقة تهمّ العرب والسوريين.';

// ── Fixed UI categories (the value stored in updates.category) ──
const CATEGORIES = [
  { key: 'official', label: 'قرارات رسمية' },
  { key: 'residence', label: 'إقامات وجنسية' },
  { key: 'work', label: 'عمل واقتصاد' },
  { key: 'education', label: 'تعليم' },
  { key: 'health', label: 'صحة' },
  { key: 'security', label: 'أمن وتنبيهات' },
  { key: 'general', label: 'عام' },
] as const;

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.key, c.label])
);

/** Missing/unknown category → 'general' */
function categoryOf(row: any): string {
  return row?.category && CATEGORY_LABELS[row.category] ? row.category : 'general';
}

const TABS = [
  { key: 'news', label: 'أخبار تركيا', icon: Newspaper },
  { key: 'alerts', label: 'تنبيهات', icon: AlertTriangle },
  { key: 'site', label: 'جديد الموقع', icon: Rss },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ── Date helpers — deterministic Arabic names with LATIN digits only ──
const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const AR_WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function formatDateLatin(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Calendar-day difference between today and the given date (0 = today). */
function dayDiff(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfToday - startOfTarget) / 86400000);
}

function relativeOrAbsolute(dateStr?: string | null): string {
  const diff = dayDiff(dateStr);
  if (diff === null) return '';
  if (diff <= 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  if (diff === 2) return 'قبل يومين';
  if (diff <= 7) return `قبل ${diff} أيام`;
  return formatDateLatin(dateStr);
}

/** Count-aware Arabic plural for remaining items (Latin digits) */
function remainingLabel(n: number): string {
  if (n === 1) return 'خبر واحد متبقٍ';
  if (n === 2) return 'خبران متبقيان';
  if (n >= 3 && n <= 10) return `${n} أخبار متبقية`;
  return `${n} خبراً متبقياً`;
}

/** Summary if present, else a plain-text excerpt of the HTML content. */
function excerptOf(row: any, max = 160): string {
  const text = row?.summary ? String(row.summary).trim() : stripHtml(row?.content || '');
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function hostnameOf(url?: string | null): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function sourceLabel(row: any): string {
  return row?.source_name || hostnameOf(row?.source_url);
}

function hrefOf(row: any): string {
  return row?.link || `/updates/${row?.id}`;
}

function groupByDate(items: any[]): { label: string; items: any[] }[] {
  const groups: { label: string; items: any[] }[] = [
    { label: 'اليوم', items: [] },
    { label: 'أمس', items: [] },
    { label: 'هذا الأسبوع', items: [] },
    { label: 'سابقاً', items: [] },
  ];
  items.forEach(item => {
    const diff = dayDiff(item.sortDate);
    if (diff !== null && diff <= 0) groups[0].items.push(item);
    else if (diff === 1) groups[1].items.push(item);
    else if (diff !== null && diff <= 7) groups[2].items.push(item);
    else groups[3].items.push(item);
  });
  return groups.filter(g => g.items.length > 0);
}

export default function UpdatesClient({ initialUpdates }: { initialUpdates?: any[] } = {}) {
  const [activeTab, setActiveTab] = useState<TabKey>('news');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [autoEvents, setAutoEvents] = useState<any[]>([]);
  const [autoLoading, setAutoLoading] = useState(true);
  const [todayLine, setTodayLine] = useState('');

  // Live date line — computed client-side to match the reader's clock.
  useEffect(() => {
    const now = new Date();
    setTodayLine(`${AR_WEEKDAYS[now.getDay()]} ${now.getDate()} ${AR_MONTHS[now.getMonth()]} ${now.getFullYear()}`);
  }, []);

  // Auto site events (published articles, codes, ...) — only for «جديد الموقع».
  useEffect(() => {
    let cancelled = false;
    fetch('/api/public-events')
      .then(res => res.json())
      .then(json => {
        if (!cancelled) setAutoEvents(json.events || []);
      })
      .catch(() => {
        if (!cancelled) setAutoEvents([]);
      })
      .finally(() => {
        if (!cancelled) setAutoLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Server rows normalized once (new columns may be undefined — tolerated).
  const rows = useMemo(() =>
    (initialUpdates || []).map(u => ({
      ...u,
      category: categoryOf(u),
      sortDate: u.date || (u.created_at ? String(u.created_at).split('T')[0] : ''),
    })),
  [initialUpdates]);

  const newsRows = useMemo(() => rows.filter(r => r.type === 'news'), [rows]);
  const alertRows = useMemo(() => rows.filter(r => r.type === 'alert'), [rows]);
  const featureRows = useMemo(() => rows.filter(r => r.type === 'feature'), [rows]);

  // Alerts band: only alerts from the last 14 days (-1 tolerates timezone skew).
  const freshAlerts = useMemo(() => alertRows.filter(r => {
    const diff = dayDiff(r.sortDate);
    return diff !== null && diff >= -1 && diff <= 14;
  }), [alertRows]);

  // «جديد الموقع» = feature rows + the auto-events feed.
  const siteItems = useMemo(() => {
    const features = featureRows.map(r => ({
      id: `feature-${r.id}`,
      title: r.title,
      detail: excerptOf(r, 140),
      sortDate: r.sortDate,
      typeLabel: 'ميزة جديدة',
      href: hrefOf(r),
    }));
    const autos = autoEvents.map(e => {
      const cfg = AUTO_EVENT_CONFIG[e.event_type];
      return {
        id: `auto-${e.id}`,
        title: e.title,
        detail: e.detail || '',
        sortDate: e.created_at ? String(e.created_at).split('T')[0] : '',
        typeLabel: cfg?.type || 'تحديث',
        href: cfg ? cfg.href(e.entity_id || '') : '/updates',
      };
    });
    return [...features, ...autos]
      .sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
  }, [featureRows, autoEvents]);

  // Category counts over all news rows (news tab chips).
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: newsRows.length };
    newsRows.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return counts;
  }, [newsRows]);

  const tabCounts: Record<TabKey, number> = {
    news: newsRows.length,
    alerts: alertRows.length,
    site: siteItems.length,
  };

  // Lead story: newest pinned news row, else newest news row.
  const leadStory = useMemo(() => {
    if (!newsRows.length) return null;
    return newsRows.find(r => r.pinned === true) || newsRows[0];
  }, [newsRows]);

  const q = searchQuery.trim().toLowerCase();

  const tabItems = useMemo(() => {
    let items: any[];
    if (activeTab === 'news') {
      items = activeCategory === 'all'
        ? newsRows
        : newsRows.filter(r => r.category === activeCategory);
    } else if (activeTab === 'alerts') {
      items = alertRows;
    } else {
      items = siteItems;
    }
    if (q) {
      items = items.filter(item =>
        [item.title, item.summary, item.content, item.detail]
          .some(v => v && String(v).toLowerCase().includes(q))
      );
    }
    return items;
  }, [activeTab, activeCategory, newsRows, alertRows, siteItems, q]);

  const showLead = activeTab === 'news' && !q && activeCategory === 'all' && !!leadStory;
  const feedItems = showLead && leadStory
    ? tabItems.filter(r => r.id !== leadStory.id)
    : tabItems;
  const visibleItems = feedItems.slice(0, visibleCount);
  const newsGroups = activeTab === 'news' ? groupByDate(visibleItems) : [];
  const siteLoading = activeTab === 'site' && autoLoading && siteItems.length === 0;

  // JSON-LD: CollectionPage + ItemList of the latest 10 news.
  const schema = useMemo(() => {
    const collectionPage = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'أخبار تركيا',
      description: TAGLINE,
      url: `${SITE_CONFIG.siteUrl}/updates`,
      inLanguage: 'ar',
    };
    const itemList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: newsRows.slice(0, 10).map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_CONFIG.siteUrl}/updates/${r.id}`,
        name: r.title,
      })),
    };
    return [collectionPage, itemList];
  }, [newsRows]);

  const selectTab = (key: TabKey) => {
    setActiveTab(key);
    setVisibleCount(20);
  };

  const emptyMessage = q
    ? `لا توجد نتائج لـ «${searchQuery.trim()}»`
    : activeTab === 'news'
      ? (activeCategory !== 'all' ? 'لا توجد أخبار في هذا التصنيف حالياً.' : 'لا توجد أخبار منشورة حالياً.')
      : activeTab === 'alerts'
        ? 'لا توجد تنبيهات حالياً.'
        : 'لا يوجد جديد على الموقع حالياً.';

  const EmptyIcon = activeTab === 'alerts' ? AlertTriangle : activeTab === 'site' ? Rss : Newspaper;

  return (
    <section className="px-4 py-8 sm:py-10">
      <SchemaScript schema={schema} />
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <header className="mb-6 pb-5 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            أخبار تركيا
          </h1>
          <p className="mt-2 min-h-[1.25rem] text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            {todayLine && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" aria-hidden />
                {todayLine}
              </>
            )}
          </p>
          <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            {TAGLINE}
          </p>
        </header>

        {/* Fresh alerts band (alerts from the last 14 days) */}
        {freshAlerts.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
              <span className="text-sm font-black text-amber-800 dark:text-amber-200">تنبيهات مهمة</span>
            </div>
            <ul className="space-y-1.5">
              {freshAlerts.slice(0, 4).map(a => (
                <li key={a.id}>
                  <Link
                    href={hrefOf(a)}
                    className="text-sm font-bold text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-300 hover:underline leading-snug"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
            {freshAlerts.length > 4 && (
              <button
                type="button"
                onClick={() => selectTab('alerts')}
                className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
              >
                عرض كل التنبيهات ({freshAlerts.length})
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="أقسام الأخبار">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span className={`text-[10px] font-bold ${active ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category chips — news tab only */}
        {activeTab === 'news' && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {[{ key: 'all', label: 'الكل' }, ...CATEGORIES].map(cat => {
              const count = categoryCounts[cat.key] || 0;
              const active = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setActiveCategory(cat.key); setVisibleCount(20); }}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold transition-all ${
                    active
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                  {count > 0 && (
                    <span className={`text-[10px] ${active ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث في الأخبار..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(20); }}
            className="w-full ps-9 pe-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Lead story */}
        {showLead && leadStory && (
          <Link href={hrefOf(leadStory)} className="block mb-8 group">
            <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
              {leadStory.image && (
                <div className="relative w-full h-52 sm:h-72">
                  <Image
                    src={leadStory.image}
                    alt={leadStory.title || 'صورة الخبر'}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              )}
              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    {CATEGORY_LABELS[leadStory.category] || CATEGORY_LABELS.general}
                  </span>
                  {leadStory.pinned === true && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      خبر مثبّت
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-[1.6] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {leadStory.title}
                </h2>
                {excerptOf(leadStory, 200) && (
                  <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {excerptOf(leadStory, 200)}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <time dateTime={leadStory.sortDate} className="flex items-center gap-1">
                    <Clock size={12} />
                    {relativeOrAbsolute(leadStory.sortDate)}
                  </time>
                  {sourceLabel(leadStory) && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                      {sourceLabel(leadStory)}
                    </span>
                  )}
                  <span className="ms-auto inline-flex items-center gap-1 text-emerald-600 font-bold">
                    اقرأ الخبر كاملاً
                    <ArrowLeft size={13} />
                  </span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Feed */}
        {siteLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={36} className="animate-spin text-emerald-600" />
            <p className="text-sm text-slate-500">جاري تحميل جديد الموقع...</p>
          </div>
        ) : visibleItems.length ? (
          <>
            {activeTab === 'news' ? (
              newsGroups.map(group => (
                <section key={group.label} className="mb-8 last:mb-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {group.label}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-bold">{group.items.length}</span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" aria-hidden />
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {group.items.map((item: any) => (
                      <NewsRow key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {visibleItems.map((item: any) => (
                  activeTab === 'alerts'
                    ? <AlertRow key={item.id} item={item} />
                    : <SiteRow key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Load more */}
            {visibleCount < feedItems.length && (
              <div className="text-center mt-8">
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-400 hover:text-emerald-600 transition-all shadow-sm"
                >
                  <ChevronDown size={16} />
                  عرض المزيد ({remainingLabel(feedItems.length - visibleCount)})
                </button>
              </div>
            )}
          </>
        ) : showLead ? null : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <EmptyIcon size={24} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-300 font-bold">{emptyMessage}</p>
            {(q || activeCategory !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); setVisibleCount(20); }}
                className="mt-3 text-sm text-emerald-600 font-bold hover:underline"
              >
                عرض كل الأخبار
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Feed row: real news (editorial list row, no timeline line) ──
function NewsRow({ item }: { item: any }) {
  const excerpt = excerptOf(item, 140);
  return (
    <Link
      href={hrefOf(item)}
      className="flex items-start gap-4 py-4 px-2 -mx-2 rounded-xl hover:bg-white dark:hover:bg-slate-900/60 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {CATEGORY_LABELS[item.category] || CATEGORY_LABELS.general}
          </span>
          <time dateTime={item.sortDate} className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock size={10} />
            {relativeOrAbsolute(item.sortDate)}
          </time>
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {item.title}
        </h3>
        {excerpt && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}
      </div>
      {item.image && (
        <div className="relative w-24 h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          <Image
            src={item.image}
            alt={item.title || 'صورة الخبر'}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
      )}
    </Link>
  );
}

// ── Feed row: alert ──
function AlertRow({ item }: { item: any }) {
  const excerpt = excerptOf(item, 140);
  return (
    <Link
      href={hrefOf(item)}
      className="flex items-start gap-3 py-4 px-2 -mx-2 rounded-xl hover:bg-rose-50/60 dark:hover:bg-rose-950/20 transition-colors group"
    >
      <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mt-0.5">
        <AlertTriangle size={16} className="text-rose-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
            تنبيه
          </span>
          <time dateTime={item.sortDate} className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock size={10} />
            {relativeOrAbsolute(item.sortDate)}
          </time>
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
          {item.title}
        </h3>
        {excerpt && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Feed row: site news (features + auto-events) ──
function SiteRow({ item }: { item: any }) {
  return (
    <Link
      href={item.href}
      className="block py-4 px-2 -mx-2 rounded-xl hover:bg-white dark:hover:bg-slate-900/60 transition-colors group"
    >
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {item.typeLabel}
        </span>
        <time dateTime={item.sortDate} className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock size={10} />
          {relativeOrAbsolute(item.sortDate)}
        </time>
      </div>
      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
        {item.title}
      </h3>
      {item.detail && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {item.detail}
        </p>
      )}
    </Link>
  );
}
