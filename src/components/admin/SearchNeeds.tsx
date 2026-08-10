'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, MousePointerClick, RefreshCw, Search, Smartphone } from 'lucide-react';

type QueryRow = { query: string; searches: number; zeroResults: number; clicks: number };
type Payload = {
  days?: number;
  samples?: number;
  summary?: { searches: number; zeroResults: number; zeroRate: number; clicks: number; clickRate: number };
  needs?: QueryRow[];
  pwa?: { shown: number; dismissed: number; accepted: number; declined: number; installed: number };
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
  const installRate = data?.pwa?.shown
    ? Math.round(((data.pwa.installed || 0) / data.pwa.shown) * 1000) / 10
    : 0;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Search size={15} className="text-emerald-600" /> ماذا يحتاج الزوار؟
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-1">بحث الموقع خلال آخر 30 يوماً، مع حجب أرقام الاتصال والبيانات الشخصية.</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 py-3 border-y border-slate-100 dark:border-slate-800">
            <Metric icon={Search} label="عمليات البحث" value={summary?.searches || 0} />
            <Metric icon={AlertTriangle} label="بلا نتيجة" value={`${summary?.zeroRate || 0}%`} danger={(summary?.zeroRate || 0) > 20} />
            <Metric icon={MousePointerClick} label="فتح نتيجة" value={`${summary?.clickRate || 0}%`} />
            <Metric icon={Smartphone} label="تثبيت التطبيق" value={`${installRate}%`} />
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

function Metric({ icon: Icon, label, value, danger = false }: {
  icon: typeof Search;
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon size={14} className={danger ? 'text-rose-500' : 'text-emerald-600'} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 truncate">{label}</p>
        <p className={`text-base font-black tabular-nums ${danger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{value}</p>
      </div>
    </div>
  );
}
