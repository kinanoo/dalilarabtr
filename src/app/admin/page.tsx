'use client';

import { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  Zap,
  Newspaper,
  Megaphone,
  MessageCircle,
  Settings,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { ActionCenter } from '@/components/admin/ActionCenter';
import SitePulse from '@/components/admin/SitePulse';
import SitePerformance from '@/components/admin/SitePerformance';
import SearchNeeds from '@/components/admin/SearchNeeds';

const QUICK_LINKS = [
  { title: 'المقالات', icon: FileText, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', href: '/admin/articles' },
  { title: 'التحديثات', icon: Megaphone, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', href: '/admin/updates' },
  { title: 'شريط الأخبار', icon: Newspaper, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', href: '/admin/news-ticker' },
  { title: 'البنرات', icon: ShieldAlert, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', href: '/admin/banners' },
  { title: 'التعليقات', icon: MessageCircle, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', href: '/admin/community' },
  { title: 'الإعدادات', icon: Settings, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', href: '/admin/settings' },
];

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

      {/* Greeting + Search — slim header (compact, no decorative eyebrow) */}
      <div className="space-y-2.5 pt-0.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
            مرحباً <span className="bg-gradient-to-l from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">بك</span>
          </h1>
          <button
            onClick={purgeSite}
            disabled={purge === 'busy'}
            title="يمسح النسخ المؤقتة لكل صفحات الموقع فتظهر آخر التعديلات للزوار فوراً — استعمله بعد تشغيل أي ملف SQL"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-black transition-all active:scale-95 ${
              purge === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                : purge === 'fail'
                  ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400'
            }`}
          >
            <RefreshCw size={13} className={purge === 'busy' ? 'animate-spin' : ''} />
            {purge === 'idle' && 'تحديث نسخة الموقع'}
            {purge === 'busy' && 'جاري التحديث…'}
            {purge === 'ok' && 'تم — التعديلات ظاهرة خلال ثوانٍ'}
            {purge === 'fail' && 'فشل — جرّب حفظ الإعدادات'}
          </button>
        </div>
        <GlobalSearch />
      </div>

      {/* 1. Pending tasks — the reason to open the dashboard, so it leads. */}
      <ActionCenter />

      {/* 2. Site pulse — live traffic + growth. */}
      <SitePulse />

      {/* What visitors ask for, especially the searches with no answer. */}
      <SearchNeeds />

      {/* 4. Real-user performance — measured on our own visitors (no CrUX, no
             consent gate), naming the exact pages to fix. */}
      <SitePerformance />

      {/* 3. Quick Actions — compact nav grid to the busiest managers. */}
      <div>
        <h2 className="text-[11px] font-black text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5 tracking-[0.2em] uppercase">
          <Zap size={12} />
          وصول سريع
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_LINKS.map(({ title, icon: Icon, color, href }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col items-center gap-1.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-95 transition-all duration-200"
            >
              <div className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={17} />
              </div>
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 text-center leading-tight">{title}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
