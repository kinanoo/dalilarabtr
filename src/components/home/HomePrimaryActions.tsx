'use client';

import Link from 'next/link';
import { BriefcaseBusiness, MessageCircleQuestion, Search } from 'lucide-react';
import { useSearchDialog } from '@/components/search/SearchDialogProvider';

export type HomeCoverageStats = {
  articles: number | null;
  services: number | null;
  zones: number | null;
};

export default function HomePrimaryActions({ stats }: { stats: HomeCoverageStats | null }) {
  const { openSearch } = useSearchDialog();

  const coverage = [
    stats?.articles ? `${stats.articles} مقالاً ودليلاً` : null,
    stats?.services ? `${stats.services} مقدم خدمة` : null,
    stats?.zones ? `${stats.zones} منطقة وحياً` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={openSearch}
          className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 active:translate-y-0 active:scale-[0.99] sm:col-span-1"
        >
          <Search size={18} aria-hidden="true" />
          ابحث في الدليل
        </button>
        <Link
          href="/consultant"
          prefetch={false}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/85 px-3 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-800 active:translate-y-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-emerald-600 dark:hover:text-emerald-300"
        >
          <MessageCircleQuestion size={18} aria-hidden="true" />
          اسأل دليل المواقف
        </Link>
        <Link
          href="/services"
          prefetch={false}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/85 px-3 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:text-cyan-800 active:translate-y-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-cyan-600 dark:hover:text-cyan-300"
        >
          <BriefcaseBusiness size={18} aria-hidden="true" />
          مقدمو الخدمات
        </Link>
      </div>

      {coverage.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs" aria-label="حجم محتوى الدليل الحالي">
          {coverage.map((item, index) => (
            <span key={item} className="inline-flex items-center gap-3">
              {index > 0 && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-emerald-500" />}
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
