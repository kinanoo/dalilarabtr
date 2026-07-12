'use client';

/**
 * AdminPageHeader — shared header used by every /admin/<section> page.
 *
 * Why it exists: every admin sub-page reimplemented the same three-row
 * layout (back-link → icon tile + title → subtitle) with subtle drift
 * (font-bold vs font-black, p-3 vs p-2, slate-500 vs slate-400, etc).
 * One missing icon container shadow and the page felt "off" without an
 * obvious reason. Centralizing it gives every section the same family
 * treatment: gradient icon tile, eyebrow pill, font-black title, and an
 * optional right-side actions/stats slot for context.
 *
 * The `theme` prop picks the color family. JIT-safe — all class strings
 * are literal so the Tailwind scanner can see them.
 */

import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type AdminTheme = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet' | 'cyan' | 'indigo' | 'red' | 'slate';

const THEME: Record<AdminTheme, {
    iconBg: string;        // gradient surface for the icon tile
    iconText: string;      // icon color
    eyebrowBg: string;     // eyebrow pill bg
    eyebrowText: string;   // eyebrow pill text
}> = {
    emerald: {
        iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/30',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        eyebrowBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        eyebrowText: 'text-emerald-700 dark:text-emerald-300',
    },
    blue: {
        iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200/60 dark:from-blue-900/40 dark:to-blue-800/30',
        iconText: 'text-blue-600 dark:text-blue-400',
        eyebrowBg: 'bg-blue-100 dark:bg-blue-900/30',
        eyebrowText: 'text-blue-700 dark:text-blue-300',
    },
    rose: {
        iconBg: 'bg-gradient-to-br from-rose-100 to-rose-200/60 dark:from-rose-900/40 dark:to-rose-800/30',
        iconText: 'text-rose-600 dark:text-rose-400',
        eyebrowBg: 'bg-rose-100 dark:bg-rose-900/30',
        eyebrowText: 'text-rose-700 dark:text-rose-300',
    },
    amber: {
        iconBg: 'bg-gradient-to-br from-amber-100 to-amber-200/60 dark:from-amber-900/40 dark:to-amber-800/30',
        iconText: 'text-amber-600 dark:text-amber-400',
        eyebrowBg: 'bg-amber-100 dark:bg-amber-900/30',
        eyebrowText: 'text-amber-700 dark:text-amber-300',
    },
    violet: {
        iconBg: 'bg-gradient-to-br from-violet-100 to-violet-200/60 dark:from-violet-900/40 dark:to-violet-800/30',
        iconText: 'text-violet-600 dark:text-violet-400',
        eyebrowBg: 'bg-violet-100 dark:bg-violet-900/30',
        eyebrowText: 'text-violet-700 dark:text-violet-300',
    },
    cyan: {
        iconBg: 'bg-gradient-to-br from-cyan-100 to-cyan-200/60 dark:from-cyan-900/40 dark:to-cyan-800/30',
        iconText: 'text-cyan-600 dark:text-cyan-400',
        eyebrowBg: 'bg-cyan-100 dark:bg-cyan-900/30',
        eyebrowText: 'text-cyan-700 dark:text-cyan-300',
    },
    indigo: {
        iconBg: 'bg-gradient-to-br from-indigo-100 to-indigo-200/60 dark:from-indigo-900/40 dark:to-indigo-800/30',
        iconText: 'text-indigo-600 dark:text-indigo-400',
        eyebrowBg: 'bg-indigo-100 dark:bg-indigo-900/30',
        eyebrowText: 'text-indigo-700 dark:text-indigo-300',
    },
    red: {
        iconBg: 'bg-gradient-to-br from-red-100 to-red-200/60 dark:from-red-900/40 dark:to-red-800/30',
        iconText: 'text-red-600 dark:text-red-400',
        eyebrowBg: 'bg-red-100 dark:bg-red-900/30',
        eyebrowText: 'text-red-700 dark:text-red-300',
    },
    slate: {
        iconBg: 'bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-800 dark:to-slate-700/40',
        iconText: 'text-slate-600 dark:text-slate-400',
        eyebrowBg: 'bg-slate-100 dark:bg-slate-800',
        eyebrowText: 'text-slate-700 dark:text-slate-300',
    },
};

interface Props {
    /** Section title. */
    title: string;
    /** One-line subtitle describing what this section manages. */
    subtitle?: string;
    /** Eyebrow label — defaults to "إدارة". */
    eyebrow?: string;
    /** Icon component from lucide-react. */
    icon: LucideIcon;
    /** Color family. */
    theme: AdminTheme;
    /** Optional slot rendered on the right side of the heading row —
        good for live counts, refresh buttons, primary actions, etc. */
    actions?: ReactNode;
    /** Hide the back link (used when the page is rendered inside a layout
        that already has nav). */
    hideBack?: boolean;
}

export default function AdminPageHeader({
    title,
    subtitle,
    eyebrow = 'إدارة',
    icon: Icon,
    theme,
    actions,
    hideBack,
}: Props) {
    const t = THEME[theme];

    return (
        <div className="mb-5">
            {!hideBack && (
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-3 group"
                >
                    <ArrowRight size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="font-bold">العودة للوحة</span>
                </Link>
            )}

            <div className="grid min-w-0 gap-4 sm:flex sm:flex-wrap sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className={`p-2.5 ${t.iconBg} ${t.iconText} rounded-xl shadow-sm shrink-0`}>
                        <Icon size={22} />
                    </div>
                    <div className="min-w-0">
                        {eyebrow && (
                            <span className={`inline-flex items-center px-2 py-0.5 ${t.eyebrowBg} ${t.eyebrowText} rounded-full text-[10px] font-black tracking-wider uppercase mb-0.5`}>
                                {eyebrow}
                            </span>
                        )}
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {actions && <div className="w-full min-w-0 max-w-full sm:w-auto">{actions}</div>}
            </div>
        </div>
    );
}
