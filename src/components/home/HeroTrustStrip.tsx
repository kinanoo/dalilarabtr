'use client';

/**
 * HeroTrustStrip — three trust-signaling chips below the homepage search.
 *
 * Why: first-time visitors land on a fairly generic Arabic guide site and
 * have ~3 seconds to decide whether to stay. We give them three concrete,
 * checkable signals: who we serve (Syrians/Arabs in Turkey specifically),
 * where our facts come from (official sources), and how fresh we keep
 * them. Each chip is a single short claim, not marketing fluff, so
 * skeptical readers can verify them at a glance.
 *
 * Renders client-only so the underlying icons hydrate; the section as a
 * whole is purely presentational and adds no client JS beyond Lucide
 * icons that are already in the bundle.
 */

import { ShieldCheck, RadioTower, MessageSquareText, type LucideIcon } from 'lucide-react';

const SIGNALS: Array<{
    icon: LucideIcon;
    label: string;
    detail: string;
}> = [
    {
        icon: ShieldCheck,
        label: 'مصادر رسمية',
        detail: 'Göç İdaresi • UCSO • e-Devlet',
    },
    {
        icon: RadioTower,
        label: 'تحديث مباشر',
        detail: 'أخبار يومية موثّقة',
    },
    {
        icon: MessageSquareText,
        label: 'بالعربية للسوريين والعرب',
        detail: 'إقامات • صحّة • تعليم • قانون',
    },
];

export default function HeroTrustStrip() {
    return (
        <section
            className="
                w-full bg-white dark:bg-slate-950
                border-b border-slate-100 dark:border-slate-900
                py-3 sm:py-4
            "
            aria-label="ما يميّز هذا الدليل"
        >
            <div className="max-w-5xl mx-auto px-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {SIGNALS.map(({ icon: Icon, label, detail }) => (
                    <div
                        key={label}
                        className="
                            flex items-center gap-2
                            bg-slate-50 hover:bg-slate-100
                            dark:bg-slate-900/60 dark:hover:bg-slate-900
                            border border-slate-200 dark:border-slate-800
                            rounded-full
                            px-3 py-1.5 sm:px-4 sm:py-2
                            transition-colors
                            cursor-default
                        "
                        title={detail}
                    >
                        <Icon size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            {label}
                        </span>
                        <span className="hidden sm:inline text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {detail}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
