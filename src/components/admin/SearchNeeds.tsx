'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';

type QueryRow = { query: string; searches: number; zeroResults: number; clicks: number };
type Payload = {
  days?: number;
  samples?: number;
  summary?: { searches: number; zeroResults: number; zeroRate: number; clicks: number; clickRate: number };
  needs?: QueryRow[];
};

export default function SearchNeeds() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/search-insights?days=30');
      if (!response.ok) throw new Error(String(response.status));
      setData(await response.json());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const summary = data?.summary;
  const needs = data?.needs || [];
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Search size={15} className="text-emerald-600" /> ما الذي لم يجدوه؟
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-1">الكلمات التي بحث عنها الزوار ولم يجدوا لها نتيجة خلال آخر 30 يوماً.</p>
        </div>
        <button onClick={load} aria-label="تحديث" className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {failed ? (
        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-amber-500" /> تعذّر تحميل احتياجات البحث.
        </p>
      ) : (data?.samples || 0) === 0 ? (
        <p className="text-xs font-bold text-slate-500 leading-6">يبدأ القياس بعد النشر. ستظهر هنا الكلمات التي يبحث عنها الزوار والفجوات التي لم يجدوا لها نتيجة.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 border-y border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span><strong className="text-slate-900 dark:text-white tabular-nums">{summary?.searches || 0}</strong> عملية بحث</span>
            <span><strong className={(summary?.zeroResults || 0) > 0 ? 'text-rose-600 dark:text-rose-400 tabular-nums' : 'text-emerald-600 dark:text-emerald-400 tabular-nums'}>{summary?.zeroResults || 0}</strong> بلا نتيجة</span>
          </div>

          <div className="mt-3">
            <h3 className="text-[11px] font-black text-slate-600 dark:text-slate-300 mb-2">أكثر ما بحث عنه الناس ولم يجدوه</h3>
            {needs.length === 0 ? (
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">لا توجد فجوات مسجلة في هذه المدة.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {needs.slice(0, 6).map((item) => (
                  <div key={item.query} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 truncate text-xs font-black text-slate-800 dark:text-slate-200">{item.query}</span>
                    <span className="shrink-0 text-[10px] font-black text-rose-600 dark:text-rose-400">{item.zeroResults} بلا نتيجة</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
