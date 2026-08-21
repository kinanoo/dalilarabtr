'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { ActionCenter } from '@/components/admin/ActionCenter';
import SitePulse from '@/components/admin/SitePulse';
import ContentPerformance from '@/components/admin/ContentPerformance';
import SitePerformance from '@/components/admin/SitePerformance';
import SearchNeeds from '@/components/admin/SearchNeeds';
import SearchConsoleOpportunities from '@/components/admin/SearchConsoleOpportunities';

export default function AdminDashboard() {
  // One-click site-wide cache purge. Content published via SQL (the owner's
  // normal flow) bypasses the editors' auto-revalidate, so without this the
  // only site-scope purge was a side effect of saving settings — a button
  // the owner could never find because it didn't exist. States are honest:
  // success is only claimed when /api/admin/revalidate answered 200.
  const [purge, setPurge] = useState<'idle' | 'busy' | 'ok' | 'fail'>('idle');
  async function purgeSite() {
    if (purge === 'busy') return;
    setPurge('busy');
    let ok = false;
    try {
      const res = await fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'site' }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    setPurge(ok ? 'ok' : 'fail');
    setTimeout(() => setPurge('idle'), 5000);
  }

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4">

      {/* One global search; navigation already lives in the sidebar/bottom bar. */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="min-w-0 flex-1">
          <GlobalSearch />
        </div>
          <button
            onClick={purgeSite}
            disabled={purge === 'busy'}
            aria-label="إظهار آخر تعديلات الموقع"
            title="يمسح النسخ المؤقتة لكل صفحات الموقع فتظهر آخر التعديلات للزوار فوراً — استعمله بعد تشغيل أي ملف SQL"
            className={`h-11 shrink-0 flex items-center justify-center gap-1.5 px-3 rounded-xl border text-[11px] font-black transition-all active:scale-95 ${
              purge === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                : purge === 'fail'
                  ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400'
            }`}
          >
            <RefreshCw size={13} className={purge === 'busy' ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">
              {purge === 'idle' && 'إظهار آخر التعديلات'}
              {purge === 'busy' && 'جاري التحديث…'}
              {purge === 'ok' && 'تم التحديث'}
              {purge === 'fail' && 'فشل التحديث'}
            </span>
          </button>
      </div>

      {/* 1. Pending tasks — the reason to open the dashboard, so it leads. */}
      <ActionCenter />

      {/* 2. Site pulse — live traffic + growth. */}
      <SitePulse />

      {/* Which published items actually attracted people. */}
      <ContentPerformance />

      {/* What visitors ask for, especially the searches with no answer. */}
      <SearchNeeds />

      <SearchConsoleOpportunities />

      {/* Technical health stays compact until details are requested. */}
      <SitePerformance />

    </div>
  );
}
