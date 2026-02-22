'use client';

import PageHero from '@/components/PageHero';
import { useAdminUpdates, isNewContent } from '@/lib/useAdminData';
import { Bell, Sparkles, Loader2, Calendar, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import UniversalComments from '@/components/community/UniversalComments';
import ContentHelpfulWidget from '@/components/community/ContentHelpfulWidget';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';

export default function UpdatesPage() {
  // 🆕 استخدام الـ hook الجديد بدلاً من fetchRemoteUpdates
  const { updates: dbUpdates, loading } = useAdminUpdates();

  // Use only DB updates (Filtered for News only)
  const allUpdates = dbUpdates.filter(u => u.type === 'news');

  return (
    <main className="flex flex-col min-h-screen font-cairo bg-slate-50 dark:bg-slate-950">


      <PageHero
        title="آخر التحديثات"
        description="أهم الأخبار والتغييرات التي نحدّثها داخل الموقع."
        icon={<Bell className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
        titleClassName="md:text-5xl"
      />

      <section className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {/* حالة التحميل */}
          {loading && allUpdates.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-emerald-600" />
            </div>
          ) : allUpdates.length ? (
            <div className="space-y-3">
              {allUpdates.map((u: any) => (
                <article
                  key={u.id}
                  id={`upd-${u.id}`}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Fix: Check for image safely */}
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
                          {/* نوع الخبر */}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.type === 'هام' || u.type === 'عاجل'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}>
                            {u.type}
                          </span>

                          {/* 🆕 علامة "جديد" للأخبار الحديثة */}
                          {isNewContent(u.date) && (
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                              <Sparkles size={10} /> جديد
                            </span>
                          )}

                          {/* التاريخ */}
                          <time dateTime={u.date} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar size={12} />
                            {u.date}
                          </time>

                          {/* زر المشاركة */}
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
