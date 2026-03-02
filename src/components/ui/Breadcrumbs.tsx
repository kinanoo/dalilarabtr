'use client';

import Link from 'next/link';
import { Home, ChevronLeft } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';

interface BreadcrumbItem {
    label: string;
    href: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    separator?: string;
    showHome?: boolean;
    className?: string;
}

export default function Breadcrumbs({
    items,
    separator = '/',
    showHome = true,
    className = '',
}: BreadcrumbsProps) {
    const allItems = showHome
        ? [{ label: 'الرئيسية', href: '/' }, ...items]
        : items;

    // Generate Schema.org structured data
    const schemaData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: allItems.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            item: `${SITE_CONFIG.siteUrl}${item.href}`,
        })),
    };

    return (
        <>
            {/* Schema.org structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />

            {/* Breadcrumbs UI */}
            <nav aria-label="Breadcrumb" className={className}>
                <ol className="flex flex-wrap items-center gap-2 text-sm">
                    {allItems.map((item, index) => {
                        const isLast = index === allItems.length - 1;
                        const isFirst = index === 0;

                        return (
                            <li key={item.href} className="flex items-center gap-2">
                                {isFirst && showHome ? (
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                    >
                                        <Home size={16} />
                                        <span>{item.label}</span>
                                    </Link>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`
                      transition-colors
                      ${isLast
                                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                                            }
                    `}
                                        aria-current={isLast ? 'page' : undefined}
                                    >
                                        {item.label}
                                    </Link>
                                )}

                                {!isLast && (
                                    <ChevronLeft
                                        size={16}
                                        className="text-slate-400 dark:text-slate-600"
                                        aria-hidden="true"
                                    />
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
}
