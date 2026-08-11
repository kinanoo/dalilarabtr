'use client';

import Link from 'next/link';
import { BriefcaseBusiness, MessageCircleQuestion, Search } from 'lucide-react';
import { useSearchDialog } from '@/components/search/SearchDialogProvider';

export default function HomePrimaryActions() {
  const { openSearch } = useSearchDialog();

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
          ابحث عن خدمة
        </Link>
      </div>

    </div>
  );
}
