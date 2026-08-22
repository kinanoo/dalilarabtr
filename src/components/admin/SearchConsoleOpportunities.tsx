'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, RefreshCw, TrendingUp } from 'lucide-react';

type Opportunity = { query: string; page: string; impressions: number; clicks: number; ctr: number; position: number };
type Payload = { configured?: boolean; period?: { start: string; end: string }; totals?: { clicks: number; impressions: number }; opportunities?: Opportunity[]; required?: string[] };

export default function SearchConsoleOpportunities() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/admin/search-console', { cache: 'no-store' });
      if (!response.ok) throw new Error('search-console-request-failed');
      setData(await response.json());
    } catch {
      setData(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><TrendingUp size={16} className="text-emerald-600" /> فرص غوغل الأسبوعية</h2>
          <p className="mt-1 text-[10px] font-bold text-slate-400">صفحات تظهر للناس ويمكن رفع نقراتها أو ترتيبها بتحسين موجّه.</p>
        </div>
        <button onClick={() => void load()} aria-label="تحديث" className="p-2 text-slate-400 hover:text-emerald-600"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {loading && <div className="mt-3 h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}

      {!loading && failed && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">
          <p>تعذّر جلب بيانات غوغل الآن. اتصال الموقع ما زال سليماً ويمكنك المحاولة مجدداً.</p>
          <button type="button" onClick={() => void load()} className="mt-2 min-h-9 rounded-lg bg-red-800 px-4 text-white">إعادة المحاولة</button>
        </div>
      )}

      {!loading && data?.configured === false && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <p>امنح الموقع إذن قراءة Search Console مرة واحدة. سيبقى دخول الأدمن الحالي كما هو، ولن يتحول حساب Google إلى عضو في الموقع.</p>
          <Link prefetch={false} href="/api/auth/google?next=/admin&mode=search-console" className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-amber-900 px-4 text-white">منح إذن غوغل</Link>
        </div>
      )}
      {!loading && data?.configured && (
        <>
          <div className="mt-3 flex gap-4 border-y border-slate-100 py-2 text-xs font-bold text-slate-500 dark:border-slate-800">
            <span><strong className="text-slate-900 dark:text-white">{data.totals?.clicks || 0}</strong> نقرة</span>
            <span><strong className="text-slate-900 dark:text-white">{data.totals?.impressions || 0}</strong> ظهور</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(data.opportunities || []).slice(0, 8).map(item => (
              <div key={`${item.query}:${item.page}`} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-800 dark:text-slate-100">{item.query}</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-400">ظهور {item.impressions} · ترتيب {item.position.toFixed(1)} · نقر {item.clicks}</p>
                </div>
                <Link href={item.page} target="_blank" className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300">فتح الصفحة <ExternalLink size={12} /></Link>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
