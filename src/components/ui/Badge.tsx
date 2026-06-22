import React from 'react';

/**
 * Badge — the design-system's canonical pill.
 *
 * One component, one semantic colour map, used everywhere a status/label pill
 * appears (freshness, official source, severity, "most used", "soon"...). This
 * is what keeps the same concept the same colour across the whole site — e.g.
 * "محدّث" must read BLUE on a tool card, an article card, and anywhere else,
 * instead of each page inventing its own gradient pill.
 *
 * Tones map to the site's semantic tokens:
 *   brand   → emerald  (the brand / primary)
 *   danger  → rose     (severity, deport/ban codes)
 *   updated → blue     (content freshness)
 *   warning → amber    (cautions, "estimate")
 *   neutral → slate    (generic / inactive)
 */
type BadgeTone = 'brand' | 'danger' | 'updated' | 'warning' | 'neutral';

const TONES: Record<BadgeTone, string> = {
    brand: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    updated: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export default function Badge({
    tone = 'neutral',
    icon,
    children,
    className = '',
}: {
    tone?: BadgeTone;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${TONES[tone]} ${className}`}>
            {icon}
            {children}
        </span>
    );
}
