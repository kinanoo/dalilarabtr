'use client';

/**
 * HomeStats — animated counter strip that turns the site's catalog into a
 * trust signal at a glance.
 *
 * Four counts pulled from real production data:
 *   - Articles (active + approved)
 *   - Service providers (active + approved)
 *   - FAQs
 *   - "Updated daily" — qualitative, not a count
 *
 * Counts are passed in as props from the page server component so we don't
 * make per-visit Supabase calls. Numbers animate from 0 to target on mount
 * using requestAnimationFrame — feels alive without library cost.
 */

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Building2, MessageCircleQuestion, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
    articles: number;
    services: number;
    faqs: number;
}

interface Counter {
    icon: LucideIcon;
    value: number | null; // null = qualitative
    label: string;
    suffix?: string;
    qualitative?: string;
    accent: string;
}

const ANIMATION_DURATION_MS = 1400;

export default function HomeStats({ articles, services, faqs }: Props) {
    const items: Counter[] = [
        {
            icon: BookOpen,
            value: articles,
            label: 'مقال موثّق',
            suffix: '+',
            accent: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            icon: Building2,
            value: services,
            label: 'خدمة معتمدة',
            accent: 'text-blue-600 dark:text-blue-400',
        },
        {
            icon: MessageCircleQuestion,
            value: faqs,
            label: 'سؤال شائع مُجاب',
            suffix: '+',
            accent: 'text-purple-600 dark:text-purple-400',
        },
        {
            icon: Sparkles,
            value: null,
            qualitative: 'يومياً',
            label: 'تحديث مباشر',
            accent: 'text-amber-600 dark:text-amber-400',
        },
    ];

    return (
        <section
            className="w-full bg-slate-50 dark:bg-slate-950 py-6 sm:py-8"
            aria-label="إحصاءات الموقع"
        >
            <div className="max-w-5xl mx-auto px-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {items.map((it, i) => (
                        <StatCard key={i} {...it} delayMs={i * 120} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatCard({ icon: Icon, value, label, suffix, qualitative, accent, delayMs }: Counter & { delayMs: number }) {
    const [display, setDisplay] = useState(0);
    const startRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (value === null || value === undefined) return;
        const target = value;
        // Respect users who prefer reduced motion — snap to final value.
        const reduce = typeof window !== 'undefined'
            && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
            setDisplay(target);
            return;
        }

        const tick = (now: number) => {
            if (startRef.current === null) startRef.current = now;
            const elapsed = now - startRef.current - delayMs;
            if (elapsed < 0) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }
            const progress = Math.min(1, elapsed / ANIMATION_DURATION_MS);
            // ease-out-cubic — fast start, gentle finish (feels less mechanical)
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(target * eased));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [value, delayMs]);

    return (
        <div className="
            relative overflow-hidden
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            rounded-2xl p-4 sm:p-5
            shadow-sm hover:shadow-md
            transition-shadow
        ">
            <Icon size={20} className={`${accent} mb-2`} />
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tabular-nums leading-none">
                {value === null
                    ? <span className={accent}>{qualitative}</span>
                    : <>{display.toLocaleString('ar-EG')}{suffix && <span className={`${accent} text-lg sm:text-xl`}>{suffix}</span>}</>
                }
            </div>
            <div className="mt-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                {label}
            </div>
        </div>
    );
}
