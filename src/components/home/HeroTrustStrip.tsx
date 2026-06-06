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
        <div
            className="
                relative z-[25] pointer-events-auto
                mt-5 sm:mt-6
                flex flex-wrap items-center justify-center
                gap-2 sm:gap-3
            "
            aria-label="ما يميّز هذا الدليل"
        >
            {SIGNALS.map(({ icon: Icon, label, detail }) => (
                <div
                    key={label}
                    className="
                        flex items-center gap-2
                        bg-white/[0.04] hover:bg-white/[0.08]
                        border border-white/10
                        backdrop-blur-sm
                        rounded-full
                        px-3 py-1.5 sm:px-4 sm:py-2
                        transition-colors
                        cursor-default
                    "
                    title={detail}
                >
                    <Icon size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-[11px] sm:text-xs font-bold text-slate-100 whitespace-nowrap">
                        {label}
                    </span>
                    <span className="hidden sm:inline text-[10px] text-slate-400 whitespace-nowrap">
                        {detail}
                    </span>
                </div>
            ))}
        </div>
    );
}
