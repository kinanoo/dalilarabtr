'use client';

import { useState, useEffect } from 'react';
import PageHero from '@/components/PageHero';
import { useAdminUpdates, isNewContent } from '@/lib/useAdminData';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Sparkles, Loader2, Calendar, MessageSquare, FileText, AlertCircle, HelpCircle, Shield, MapPin, Newspaper, ArrowLeft, Briefcase, Wrench, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import UniversalComments from '@/components/community/UniversalComments';
import ContentHelpfulWidget from '@/components/community/ContentHelpfulWidget';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';

const PUBLIC_EVENT_TYPES = ['new_article', 'new_scenario', 'new_faq', 'new_code', 'new_zone', 'new_update', 'new_service', 'new_tool', 'new_source'];

const AUTO_EVENT_CONFIG: Record<string, { type: string; icon: typeof FileText; bg: string; text: string; href: (id: string) => string }> = {
  new_article:  { type: 'مقال',      icon: FileText,     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', href: (id) => `/article/${id}` },
  new_scenario: { type: 'سيناريو',   icon: AlertCircle,  bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-600',    href: (id) => `/consultant?scenario=${id}` },
  new_faq:      { type: 'سؤال',      icon: HelpCircle,   bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-600',  href: () => `/faq` },
  new_code:     { type: 'كود أمني',   icon: Shield,       bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-600',     href: () => `/security-codes` },
  new_zone:     { type: 'منطقة',     icon: MapPin,       bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-600',  href: () => `/zones` },
  new_update:   { type: 'خبر',       icon: Newspaper,    bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600',   href: (id) => `/updates#upd-${id}` },
  new_service:  { type: 'خدمة',      icon: Briefcase,    bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-600',    href: (id) => `/services/${id}` },
  new_tool:     { type: 'أداة',      icon: Wrench,       bg: 'bg-pink-100 dark:bg-pink-900/30',       text: 'text-pink-600',    href: () => `/tools` },
  new_source:   { type: 'مصدر رسمي', icon: ExternalLink, bg: 'bg-teal-100 dark:bg-teal-900/30',       text: 'text-teal-600',    href: () => `/sources` },
};

export default function UpdatesPage() {
  const { updates: dbUpdates, loading: updatesLoading } = useAdminUpdates();
  const [autoEvents, setAutoEvents] = useState<any[]>([]);
  const [autoLoading, setAutoLoading] = useState(true);

  // Fetch auto events from admin_activity_log
  useEffect(() => {
    async function fetchAutoEvents() {
      if (!supabase) { setAutoLoading(false); return; }
      const { data } = await supabase
        .from('admin_activity_log')
        .select('id, event_type, title, detail, entity_id, created_at')
        .in('event_type', PUBLIC_EVENT_TYPES)
        .order('created_at', { ascending: false })
        .limit(50);

      setAutoEvents(data || []);
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
    .sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));

  const loading = updatesLoading && autoLoading;

  return (
    <main className="flex flex-col min-h-screen font-cairo bg-slate-50 dark:bg-slate-950">
      <PageHero
        title="آخر التحديثات"
        description="كل ما يُضاف للموقع من مقالات وسيناريوهات وأخبار — تلقائياً."
        icon={<Bell className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
        titleClassName="md:text-5xl"
      />

      <section className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {loading && allItems.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-emerald-600" />
            </div>
          ) : allItems.length ? (
            <div className="space-y-3">
              {allItems.map((item: any) => (
                item.source === 'auto'
                  ? <AutoEventCard key={`auto-${item.id}`} item={item} />
                  : <ManualUpdateCard key={`manual-${item.id}`} u={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Bell size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-300">
                لا توجد تحديثات منشورة حالياً.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

// Auto event card (no comments/helpful widget)
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

// Manual update card (with comments + helpful widget)
function ManualUpdateCard({ u }: { u: any }) {
  return (
    <article
      id={`upd-${u.id}`}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow"
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
          <header>
            <div className="flex flex-wrap items-center gap-2">
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

              <div className="mr-auto">
                <ShareMenu
                  mini
                  variant="subtle"
                  title={u.title}
                  text={u.content?.slice(0, 200)}
                  url={`${SITE_CONFIG.siteUrl}/updates#upd-${u.id}`}
                />
              </div>
            </div>

            <h2 className="mt-2 text-lg md:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {u.title}
            </h2>
          </header>

          {u.content && (
            <p className="mt-3 text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {u.content}
            </p>
          )}

          {/* Community Interaction */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-4">
              <ContentHelpfulWidget entityType="update" entityId={u.id} className="bg-slate-50 dark:bg-slate-800/50" />

              <details className="group">
                <summary className="cursor-pointer list-none font-bold text-sm text-emerald-600 flex items-center gap-2 select-none">
                  <MessageSquare size={16} />
                  التعليقات والمناقشة
                </summary>
                <div className="mt-4 animate-in slide-in-from-top-2">
                  <UniversalComments entityType="update" entityId={u.id} title="نقاش التحديث" className="shadow-none border-none bg-slate-50 dark:bg-slate-800/30" />
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
