'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Clock3,
  FileText,
  MapPinned,
  Trash2,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  RECENT_ACTIVITY_EVENT,
  RECENT_ACTIVITY_KEY,
  type RecentActivityItem,
  type RecentActivityKind,
  parseRecentActivity,
} from '@/lib/recentActivity';

const KIND_META: Record<RecentActivityKind, { label: string; icon: LucideIcon; classes: string }> = {
  article: { label: 'مقال', icon: BookOpen, classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  update: { label: 'تحديث', icon: FileText, classes: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  service: { label: 'خدمة', icon: BriefcaseBusiness, classes: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  tool: { label: 'أداة', icon: Wrench, classes: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  zone: { label: 'منطقة', icon: MapPinned, classes: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
  guide: { label: 'دليل', icon: Building2, classes: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300' },
};

export default function RecentActivity() {
  const [items, setItems] = useState<RecentActivityItem[]>([]);

  const sync = useCallback(() => {
    try {
      setItems(parseRecentActivity(localStorage.getItem(RECENT_ACTIVITY_KEY)));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(sync);
    window.addEventListener(RECENT_ACTIVITY_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(RECENT_ACTIVITY_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  const clear = () => {
    try {
      localStorage.removeItem(RECENT_ACTIVITY_KEY);
    } catch {
      // The local list is optional; clearing failure must not affect the page.
    }
    setItems([]);
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-800" aria-label="آخر الصفحات التي فتحتها">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
            <Clock3 size={17} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            تابع من حيث توقفت
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">محفوظ على هذا الجهاز فقط</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900 dark:hover:bg-red-950/30"
          aria-label="مسح آخر الصفحات"
          title="مسح آخر الصفحات"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>

      <div dir="ltr" className="flex min-w-0 max-w-full snap-x gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {items.map((item) => {
          const meta = KIND_META[item.kind];
          const Icon = meta.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              dir="rtl"
              className="group flex min-h-20 w-[78vw] max-w-[280px] shrink-0 snap-start items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 sm:w-[260px]"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.classes}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold text-slate-400">{meta.label}</span>
                <span className="mt-0.5 line-clamp-2 block text-sm font-bold leading-relaxed text-slate-800 transition-colors group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
                  {item.title}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
