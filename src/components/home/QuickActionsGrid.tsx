import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { QUICK_ACTIONS } from '@/lib/constants';

/**
 * QuickActionsGrid — Server Component (zero client JS).
 *
 * Was a `'use client'` island only for a localStorage "popular" re-sort +
 * click-count badge — a returning-visitor nicety that is invisible to the
 * first-time majority and not worth a hydrated 12-icon grid on the homepage's
 * critical path (the DB fetch it also carried was already dead-commented). The
 * shortcut links + icons are now pure server HTML: same look, same SEO, no
 * hydration. Icons come straight from each action's `icon` component.
 */

// e-ikamet-style colourful icon tints — the four official-site accent colours
// rotate across the shortcut cards so the row reads as a vivid toolbox.
const ICON_TINTS = [
    'bg-brand-magenta text-white shadow-sm',
    'bg-brand-lime text-white shadow-sm',
    'bg-brand-orange text-white shadow-sm',
    'bg-brand-blue text-white shadow-sm',
];

export default function QuickActionsGrid() {
    return (
        <section className="px-4 py-12">
            <div className="max-w-7xl mx-auto">
                {/* Header is provided by the homepage section wrapper (page.tsx
                    «اختصارات سريعة»); this renders the grid only. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {QUICK_ACTIONS.map((action, index) => {
                        const IconComponent = action.icon || FolderOpen;
                        const tint = ICON_TINTS[index % ICON_TINTS.length];
                        return (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="group relative flex items-center gap-3 px-3.5 py-3 bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 overflow-hidden"
                            >
                                {/* Thin emerald glow on hover */}
                                <span
                                    aria-hidden="true"
                                    className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                />
                                <div className={`relative p-2 rounded-lg ${tint} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                                    <IconComponent size={18} />
                                </div>
                                <span className="relative flex-1 font-black text-sm text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                                    {action.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
