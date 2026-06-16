'use client';

import {
  FileText,
  ShieldAlert,
  Zap,
  Newspaper,
  Megaphone,
  BarChart3,
  MessageCircle,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { ActionCenter } from '@/components/admin/ActionCenter';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

const QUICK_LINKS = [
  { title: 'المقالات', icon: FileText, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', href: '/admin/articles' },
  { title: 'التحديثات', icon: Megaphone, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', href: '/admin/updates' },
  { title: 'شريط الأخبار', icon: Newspaper, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', href: '/admin/news-ticker' },
  { title: 'البنرات', icon: ShieldAlert, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', href: '/admin/banners' },
  { title: 'التعليقات', icon: MessageCircle, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', href: '/admin/community' },
  { title: 'الإعدادات', icon: Settings, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', href: '/admin/settings' },
];

export default function AdminDashboard() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-24">

      {/* 1. Greeting + Search — magazine-style header with eyebrow */}
      <div className="text-center space-y-4 pt-2 sm:pt-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full mb-3">
            <span className="relative inline-flex items-center justify-center w-1.5 h-1.5">
              <span className="absolute inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-700 dark:text-emerald-300">
              ADMIN · لوحة التحكم
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            مرحباً <span className="bg-gradient-to-l from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">بك</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">ابحث أو اختر من الأقسام أدناه</p>
        </div>
        <GlobalSearch />
      </div>

      {/* 2. Quick Actions — premium grid with accent stripes */}
      <div>
        <h2 className="text-[11px] font-black text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5 tracking-[0.2em] uppercase">
          <Zap size={12} />
          وصول سريع
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {QUICK_LINKS.map(({ title, icon: Icon, color, href }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-1 active:scale-95 transition-all duration-300 overflow-hidden"
            >
              {/* Top accent stripe — neutral until hover, then emerald */}
              <div
                aria-hidden="true"
                className="absolute top-0 inset-x-0 h-1 bg-slate-200/70 dark:bg-slate-700/40 group-hover:bg-gradient-to-l group-hover:from-emerald-400 group-hover:to-teal-500 transition-all duration-300"
              />
              <div className={`relative p-2.5 rounded-lg ${color} group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300 shadow-sm`}>
                <Icon size={18} />
              </div>
              <span className="relative text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-300 text-center leading-tight">{title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Pending Tasks */}
      <ActionCenter />

      {/* 4. Analytics */}
      <div>
        <h2 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5 tracking-[0.2em] uppercase">
          <BarChart3 size={12} />
          التحليلات
        </h2>
        <AnalyticsDashboard />
      </div>

    </div>
  );
}
