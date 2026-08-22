'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Gauge, LayoutDashboard, RefreshCw, SearchCheck } from 'lucide-react';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { ActionCenter } from '@/components/admin/ActionCenter';
import SitePulse from '@/components/admin/SitePulse';
import ContentPerformance from '@/components/admin/ContentPerformance';
import SitePerformance from '@/components/admin/SitePerformance';
import SearchNeeds from '@/components/admin/SearchNeeds';
import SearchConsoleOpportunities from '@/components/admin/SearchConsoleOpportunities';

export default function AdminDashboard() {
  type DashboardTab = 'overview' | 'content' | 'growth' | 'technical';
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('gsc')) setActiveTab('growth');
  }, []);

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

  const tabs: Array<{ id: DashboardTab; label: string; note: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'الآن', note: 'المهام وحركة الموقع', icon: LayoutDashboard },
    { id: 'content', label: 'المحتوى', note: 'ما يقرأه ويبحث عنه الزوار', icon: BarChart3 },
    { id: 'growth', label: 'نمو غوغل', note: 'Search Console الأسبوعي', icon: SearchCheck },
    { id: 'technical', label: 'الصحة التقنية', note: 'السرعة والأخطاء', icon: Gauge },
  ];

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

      <section aria-label="أقسام ملخص الموقع" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={selected}
                className={`flex min-h-16 items-center gap-3 rounded-xl px-3 text-start transition active:scale-[0.99] ${selected
                  ? 'bg-slate-900 text-white shadow-md dark:bg-emerald-600 dark:text-slate-950'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? 'bg-white/12' : 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300'}`}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm font-black">{tab.label}</strong>
                  <span className={`mt-0.5 block truncate text-[10px] font-bold ${selected ? 'text-white/70 dark:text-slate-950/65' : 'text-slate-400'}`}>{tab.note}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div role="region" aria-live="polite" className="space-y-4">
        {activeTab === 'overview' && (
          <>
            <ActionCenter />
            <SitePulse />
          </>
        )}

        {activeTab === 'content' && (
          <>
            <ContentPerformance />
            <SearchNeeds />
          </>
        )}

        {activeTab === 'growth' && <SearchConsoleOpportunities />}

        {activeTab === 'technical' && <SitePerformance />}
      </div>

    </div>
  );
}
