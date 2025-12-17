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
      className={`flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300 mb-6 font-medium overflow-x-auto whitespace-nowrap pb-2 ${className}`}
      aria-label="مسار التنقل"
    >
      {/* العنصر الأول - الرئيسية */}
      <Link 
        href="/" 
        className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        aria-label="الرئيسية"
      >
        <Home size={14} className="flex-shrink-0" />
        <span>الرئيسية</span>
      </Link>

      {/* العناصر الوسطى */}
      {items.slice(0, -1).map((item, index) => (
        <div key={index} className="flex items-center gap-2 flex-shrink-0">
          <ChevronLeft size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
          <Link 
            href={item.href}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {item.name}
          </Link>
        </div>
      ))}

      {/* العنصر الأخير - الصفحة الحالية */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <ChevronLeft size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
          <span 
            className="text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-md"
            aria-current="page"
          >
            {items[items.length - 1].name}
          </span>
        </div>
      )}
    </nav>
  );
}

