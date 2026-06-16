/**
 * SectionDivider — reusable horizontal separator + label.
 *
 * Use it between groups in long lists (zones by city, services by
 * category, search results by section, etc.) to give the eye a
 * resting point. Audit found dense list pages with no visual breaks
 * between sub-groups felt like a "wall of cards" — readers lost the
 * grouping mental model.
 *
 *   <SectionDivider label="Şanlıurfa" count={146} />
 *
 * Defaults to a thin slate border-top + an inline label pill in
 * emerald. Optional `count` shows a tabular-nums badge next to the
 * label so the reader sees "Şanlıurfa · 146" without doing the math.
 */

import { type ReactNode } from 'react';

interface Props {
    /** The group title — appears in the label pill. */
    label: ReactNode;
    /** Optional item count rendered as a small badge next to the label. */
    count?: number;
    /** Tint variant. Defaults to emerald — the site's primary accent. */
    tone?: 'emerald' | 'rose' | 'amber' | 'slate';
    /** Extra Tailwind classes for the outer wrapper. */
    className?: string;
}

const TONE: Record<NonNullable<Props['tone']>, { pill: string; border: string; badge: string }> = {
    emerald: {
        pill: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        border: 'border-emerald-200/60 dark:border-emerald-900/40',
        badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200',
    },
    rose: {
        pill: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        border: 'border-rose-200/60 dark:border-rose-900/40',
        badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200',
    },
    amber: {
        pill: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        border: 'border-amber-200/60 dark:border-amber-900/40',
        badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200',
    },
    slate: {
        pill: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
        border: 'border-slate-200 dark:border-slate-800',
        badge: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
    },
};

export default function SectionDivider({
    label,
    count,
    tone = 'emerald',
    className = '',
}: Props) {
    const t = TONE[tone];
    return (
        <div className={`relative my-6 ${className}`} dir="rtl">
            <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 border-t ${t.border}`} aria-hidden="true" />
            <div className="relative flex items-center justify-end gap-2">
                {typeof count === 'number' && (
                    <span
                        dir="ltr"
                        className={`text-[11px] font-black tabular-nums px-2 py-0.5 rounded-full ${t.badge}`}
                    >
                        {count}
                    </span>
                )}
                <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full border ${t.pill}`}>
                    {label}
                </span>
            </div>
        </div>
    );
}
