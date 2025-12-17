'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { LATEST_UPDATES } from '@/lib/data';
import { fetchRemoteUpdates, type RuntimeUpdate } from '@/lib/remoteData';
import { Bell } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function UpdatesPage() {
  const [remote, setRemote] = useState<RuntimeUpdate[] | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchRemoteUpdates()
      .then((r) => {
        if (!mounted) return;
        setRemote(r);
      })
      .catch(() => {
        if (!mounted) return;
        setRemote(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const updates = useMemo(() => {
    const base = remote?.length
      ? remote
      : (LATEST_UPDATES as Array<{ id: number | string; type: string; title: string; date: string; content?: string }>);

    return [...base].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [remote]);

  return (
    <main className="flex flex-col min-h-screen font-cairo">
      <Navbar />

      <PageHero
        title="آخر التحديثات"
        description="أهم الأخبار والتغييرات التي نحدّثها داخل الموقع."
        icon={<Bell className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
        titleClassName="md:text-5xl"
      />

      <section className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {updates.length ? (
            <div className="space-y-3">
              {updates.map((u) => (
                <div
                  key={u.id}
                  id={`upd-${u.id}`}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {u.type}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{u.date}</span>
                      </div>
                      <h2 className="mt-2 text-lg md:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                        {u.title}
                      </h2>
                    </div>
                  </div>

                  {u.content && (
                    <p className="mt-3 text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {u.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 dark:text-slate-300">
              لا توجد تحديثات منشورة حالياً.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
