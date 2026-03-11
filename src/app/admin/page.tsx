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

      {/* 1. Greeting + Search */}
      <div className="text-center space-y-4 pt-2 sm:pt-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">مرحباً بك</h1>
          <p className="text-slate-500 text-sm mt-1">ابحث أو اختر من الأقسام أدناه</p>
        </div>
        <GlobalSearch />
      </div>

      {/* 2. Quick Actions — compact grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <Zap size={14} className="text-yellow-500" />
          وصول سريع
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {QUICK_LINKS.map(({ title, icon: Icon, color, href }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1.5 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md active:scale-95 transition-all"
            >
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">{title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Pending Tasks */}
      <ActionCenter />

      {/* 4. Analytics */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <BarChart3 size={14} className="text-emerald-500" />
          التحليلات
        </h2>
        <AnalyticsDashboard />
      </div>

    </div>
  );
}
