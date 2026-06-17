'use client';

/**
 * AdminCard — accent-stripe wrapper for admin section content.
 *
 * Pairs with AdminPageHeader so every admin sub-page lands on the same
 * family pattern (gradient surface + right-edge accent stripe in RTL).
 * Pass the same `theme` you used on the header to keep the page coherent.
 */

import type { ReactNode } from 'react';

export type AdminCardTheme = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet' | 'cyan' | 'indigo' | 'red' | 'slate';

const STRIPE: Record<AdminCardTheme, string> = {
    emerald: 'bg-gradient-to-b from-emerald-500 to-teal-500',
    blue: 'bg-gradient-to-b from-blue-500 to-blue-600',
    rose: 'bg-gradient-to-b from-rose-500 to-rose-600',
    amber: 'bg-gradient-to-b from-amber-400 to-amber-500',
    violet: 'bg-gradient-to-b from-violet-500 to-purple-500',
    cyan: 'bg-gradient-to-b from-cyan-500 to-blue-500',
    indigo: 'bg-gradient-to-b from-indigo-500 to-violet-500',
    red: 'bg-gradient-to-b from-red-500 to-rose-600',
    slate: 'bg-gradient-to-b from-slate-400 to-slate-500',
};

const SURFACE: Record<AdminCardTheme, string> = {
    emerald: 'from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20',
    blue: 'from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20',
    rose: 'from-white to-rose-50/40 dark:from-slate-900 dark:to-rose-950/20',
    amber: 'from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/20',
    violet: 'from-white to-violet-50/40 dark:from-slate-900 dark:to-violet-950/20',
    cyan: 'from-white to-cyan-50/40 dark:from-slate-900 dark:to-cyan-950/20',
    indigo: 'from-white to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20',
    red: 'from-white to-red-50/40 dark:from-slate-900 dark:to-red-950/20',
    slate: 'from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-800/40',
};

interface Props {
    children: ReactNode;
    theme: AdminCardTheme;
    className?: string;
}

export default function AdminCard({ children, theme, className = '' }: Props) {
    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${SURFACE[theme]} rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm ${className}`}>
            {/* Accent stripe — right edge in RTL */}
            <span className={`absolute top-0 right-0 h-full w-1 ${STRIPE[theme]} opacity-70 pointer-events-none`} />
            <div className="relative">{children}</div>
        </div>
    );
}
