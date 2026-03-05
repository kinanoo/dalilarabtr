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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sortedQuickActions.map((action) => {
                        const IconComponent = action.icon || ICONS[action.icon_name] || FolderOpen;

                        return (
                            <Link
                                key={action.href + action.id} // Ensure unique key
                                href={action.href}
                                onClick={() => trackQuickActionClick(action.href)}
                                className="group relative flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-emerald-300 dark:hover:border-emerald-700 overflow-hidden"
                            >

                                {/* الخلفية المتدرجة عند التحويم */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative z-10 p-3 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 mb-3 shadow-sm group-hover:shadow-md">
                                    <IconComponent size={28} />
                                </div>

                                <h3 className="relative z-10 font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 text-center mb-1">
                                    {action.title}
                                </h3>

                                {action.desc && (
                                    <p className="relative z-10 text-xs text-slate-500 dark:text-slate-400 text-center line-clamp-2">
                                        {action.desc}
                                    </p>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}
