'use client';

import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 py-3 px-1 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="flex items-center gap-1 hover:text-emerald-600 transition-colors shrink-0">
                <Home size={13} />
                <span>الرئيسية</span>
            </Link>
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1 shrink-0">
                    <ChevronLeft size={12} className="text-slate-300 dark:text-slate-600" />
                    {item.href ? (
                        <Link href={item.href} className="hover:text-emerald-600 transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
