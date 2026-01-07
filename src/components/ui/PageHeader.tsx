'use client';

import { ReactNode } from 'react';
import Breadcrumbs from './Breadcrumbs';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    breadcrumbs?: { label: string; href: string }[];
    actions?: ReactNode;
    gradient?: boolean;
    className?: string;
}

export default function PageHeader({
    title,
    description,
    icon,
    breadcrumbs,
    actions,
    gradient = true,
    className = '',
}: PageHeaderProps) {
    return (
        <div
            className={`
        relative overflow-hidden
        ${gradient ? 'bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800' : 'bg-white dark:bg-slate-900'}
        border-b border-slate-200 dark:border-slate-800
        ${className}
      `}
        >
            {/* Background Pattern */}
            {gradient && (
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
                </div>
            )}

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <div className="mb-4">
                        <Breadcrumbs items={breadcrumbs} />
                    </div>
                )}

                {/* Header Content */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        {icon && (
                            <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 icon-hover-bounce">
                                {icon}
                            </div>
                        )}

                        {/* Text */}
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-2 animate-fadeInUp">
                                {title}
                            </h1>

                            {description && (
                                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex flex-wrap gap-3 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
