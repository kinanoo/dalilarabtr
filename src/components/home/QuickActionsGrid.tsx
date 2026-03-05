'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, BrainCircuit, FolderOpen, UserCheck, ShieldAlert, MapPin, Calculator, FileText, HeartPulse, Link as LinkIcon, Plane, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { QUICK_ACTIONS } from '@/lib/constants';

const ICONS: Record<string, any> = {
    Plane, FileText, ShieldAlert, Smartphone, BrainCircuit, FolderOpen, UserCheck, MapPin, Calculator, HeartPulse, LinkIcon, Sparkles
};

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
        <section className="px-4 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Sparkles className="text-amber-500" size={24} />
                        اختصارات سريعة
                    </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {sortedQuickActions.map((action) => {
                        const IconComponent = action.icon || ICONS[action.icon_name] || FolderOpen;

                        return (
                            <Link
                                key={action.href + action.id}
                                href={action.href}
                                onClick={() => trackQuickActionClick(action.href)}
                                className="group flex items-center gap-3 px-3.5 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700"
                            >
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                                    <IconComponent size={18} />
                                </div>
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                                    {action.title}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}
