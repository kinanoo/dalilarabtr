'use client';

/**
 * 📰 صفحة الأخبار - تقرأ من لوحة التحكم
 */


import PageHero from '@/components/PageHero';
import { useAdminUpdates, isNewContent, formatDate } from '@/lib/useAdminData';
import Image from 'next/image';
import { Bell, Calendar, Sparkles, Loader2 } from 'lucide-react';

export default function UpdatesPage() {
  const { updates, loading } = useAdminUpdates();

  return (
    <main className="flex flex-col min-h-screen font-cairo">

      <PageHero
        title="آخر التحديثات"
        description="أهم الأخبار والتغييرات في قوانين تركيا"
        icon={<Bell className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <section className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-emerald-600" />
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p>لا توجد تحديثات حالياً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition"
                >
                  <div className="flex items-start gap-4">
                    {/* الصورة إذا وجدت */}
                    {update.image && (
                      <Image
                        src={update.image}
                        alt={update.title}
                        width={80}
                        height={80}
                        className="rounded-xl object-cover flex-shrink-0"
                      />
                    )}

                    <div className="flex-1">
                      {/* العنوان مع علامة جديد */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                          {update.title}
                        </h3>
                        {isNewContent(update.date) && (
                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                            <Sparkles size={10} /> جديد
                          </span>
                        )}
                      </div>

                      {/* النوع والتاريخ */}
                      <div className="flex items-center gap-3 text-sm mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${(update.type as any) === 'هام' || (update.type as any) === 'عاجل'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                          {update.type}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(update.date)}
                        </span>
                      </div>

                      {/* المحتوى */}
                      {update.content && (
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {update.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


    </main>
  );
}
