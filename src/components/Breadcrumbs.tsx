/**
 * 🧭 مكون Breadcrumbs محسّن
 * ===========================
 * 
 * مكون Breadcrumbs متوافق مع Schema.org
 * يظهر مسار التنقل في الصفحة
 */

'use client';

import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';

export type BreadcrumbItem = {
  name: string;
  href: string;
  isActive?: boolean;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      className={`inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 mb-6 font-medium overflow-x-auto whitespace-nowrap pb-2 ${className}`}
      aria-label="مسار التنقل"
    >
      {/* Home — small icon-only pill with subtle bg */}
      <Link
        href="/"
        className="group inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 transition-all duration-200 shrink-0 shadow-sm"
        aria-label="الرئيسية"
        title="الرئيسية"
      >
        <Home size={13} className="group-hover:scale-110 transition-transform" />
      </Link>

      {/* Middle items — lightweight links separated by tiny chevrons */}
      {items.slice(0, -1).map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 shrink-0">
          <ChevronLeft size={12} className="text-slate-300 dark:text-slate-600 shrink-0" aria-hidden="true" />
          <Link
            href={item.href}
            className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-bold text-xs sm:text-sm"
          >
            {item.name}
          </Link>
        </div>
      ))}

      {/* Last item — current page, premium pill with shadow */}
      {items.length > 0 && (
        <div className="flex items-center gap-1.5 shrink-0">
          <ChevronLeft size={12} className="text-slate-300 dark:text-slate-600 shrink-0" aria-hidden="true" />
          <span
            className="text-emerald-700 dark:text-emerald-200 font-black bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-1 rounded-full text-xs sm:text-sm shadow-sm"
            aria-current="page"
          >
            {items[items.length - 1].name}
          </span>
        </div>
      )}
    </nav>
  );
}

