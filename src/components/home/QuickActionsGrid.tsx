'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, BrainCircuit, FolderOpen, UserCheck, ShieldAlert, MapPin, Calculator, FileText, HeartPulse, Link as LinkIcon, Plane, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { QUICK_ACTIONS } from '@/lib/constants';

const ICONS: Record<string, any> = {
    Plane, FileText, ShieldAlert, Smartphone, BrainCircuit, FolderOpen, UserCheck, MapPin, Calculator, HeartPulse, LinkIcon, Sparkles
};

// e-ikamet-style colourful icon tints — the four official-site accent colours
// rotate across the shortcut cards so the row reads as a vivid toolbox, not a
// monochrome list. Light-mode tints + dark-mode equivalents.
const ICON_TINTS = [
    'bg-brand-magenta text-white shadow-sm',
    'bg-brand-lime text-white shadow-sm',
    'bg-brand-orange text-white shadow-sm',
    'bg-brand-blue text-white shadow-sm',
];

export default function QuickActionsGrid() {
    const storageKey = 'quickActions.clickCounts.v1';
    const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
    const [hasMounted, setHasMounted] = useState(false);
    const [actions, setActions] = useState<any[]>(QUICK_ACTIONS); // Initial with static
    const [isDbLoaded, setIsDbLoaded] = useState(false);

    // 1. Click Tracking — defer sort to avoid CLS on hydration
    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw) as Record<string, number>;
                if (parsed && typeof parsed === 'object') {
                    setClickCounts(parsed);
                }
            }
        } catch {
            // ignore
        }
        setHasMounted(true);
    }, []);

    // 2. Fetch Data from DB
    useEffect(() => {
        async function fetchActions() {
            // NOTE: Disabled because 'home_cards' table doesn't exist yet, causing 404 errors.
            // Re-enable this when the table is created. e.g:
            /*
            if (!supabase) return;
            const { data } = await supabase
                .from('home_cards')
                .select('*')
                .eq('section', 'quick_action')
                .order('sort_order');

            if (data && data.length > 0) {
                // Map DB fields to Component expected fields
                const mapped = data.map(item => ({
                    ...item,
                    desc: item.description, // DB uses description
                    icon: ICONS[item.icon_name] || FolderOpen // Resolve Icon
                }));
                setActions(mapped);
                setIsDbLoaded(true);
            }
            */
        }
        // fetchActions();
    }, []);

    const trackQuickActionClick = (href: string) => {
        setClickCounts((prev) => {
            const next = { ...prev, [href]: (prev[href] ?? 0) + 1 };
            try {
                localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    // 3. Sorting — only apply click-based sort after mount to prevent CLS
    const sortedQuickActions = useMemo(() => {
        if (!hasMounted) return actions;

        return [...actions].sort((a, b) => {
            const aCount = clickCounts[a.href] ?? 0;
            const bCount = clickCounts[b.href] ?? 0;
            if (bCount !== aCount) return bCount - aCount;
            return (a.sort_order || 0) - (b.sort_order || 0);
        });
    }, [clickCounts, actions, hasMounted]);

    return (
        <section className="px-4 py-12">
            <div className="max-w-7xl mx-auto">
                {/* Header is provided by the homepage section wrapper around
                    this grid (page.tsx «اختصارات سريعة»); the component renders
                    the grid only, to avoid a duplicate title. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {sortedQuickActions.map((action, index) => {
                        const IconComponent = action.icon || ICONS[action.icon_name] || FolderOpen;
                        const tint = ICON_TINTS[index % ICON_TINTS.length];
                        const clickCount = clickCounts[action.href] ?? 0;
                        const isPopular = hasMounted && clickCount >= 3;

                        return (
                            <Link
                                key={action.href + action.id}
                                href={action.href}
                                onClick={() => trackQuickActionClick(action.href)}
                                className="group relative flex items-center gap-3 px-3.5 py-3 bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 overflow-hidden"
                            >
                                {/* Thin emerald glow that shows only on hover — same
                                    family of treatment as category tiles, scaled
                                    down for the compact row layout */}
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

                                {/* Popular badge — shows for actions the user has
                                    clicked 3+ times. localStorage-only so it never
                                    appears on first visit; rewards return readers
                                    with a tiny "your favourite" cue without
                                    asking them to favourite anything. */}
                                {isPopular && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-1 left-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/90 text-white shadow-sm shadow-amber-500/40"
                                        title="من اختصاراتك المفضّلة"
                                    >
                                        <Sparkles size={9} />
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}
