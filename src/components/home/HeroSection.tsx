'use client';

import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * HeroSection — light, airy, colourful hero (government-portal inspired:
 * e-ikamet / randevu). LIGHT MODE is a soft brand-tinted gradient with dark
 * text and vivid accent words; DARK MODE keeps the deep emerald gradient.
 * The old interactive particle canvas + aurora orbs were removed — they were
 * heavy (and only suited the dark slab); soft blurred blobs give depth now.
 */
export default function HeroSection({ children }: { children?: ReactNode }) {
    return (
        <section
            className="relative z-[15] bg-gradient-to-b from-emerald-50 via-surface-light to-sky-50 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-950 text-slate-900 dark:text-white pt-8 sm:pt-10 pb-10 sm:pb-12 px-4"
            style={{ overflowX: 'clip' }}
        >
            {/* Top accent stripe — the official-site colour quartet */}
            <div
                aria-hidden="true"
                className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-brand-magenta via-brand-orange to-brand-blue z-30"
            />

            {/* Soft decorative blobs — gentle brand colour, no animation */}
            <div aria-hidden="true" className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute w-72 h-72 rounded-full bg-emerald-300/25 dark:bg-emerald-500/10 blur-3xl -top-12 -right-10" />
                <div className="absolute w-72 h-72 rounded-full bg-sky-300/25 dark:bg-cyan-500/10 blur-3xl -bottom-12 -left-10" />
                <div className="absolute w-56 h-56 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-3xl top-1/3 left-1/3" />
            </div>

            <div className="max-w-4xl mx-auto text-center relative z-[25]">
                <div className="animate-hero-entrance">
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/70 dark:bg-white/[0.06] border border-emerald-300 dark:border-emerald-500/30 rounded-full backdrop-blur-sm mb-5 shadow-sm">
                        <span className="relative inline-flex items-center justify-center w-1.5 h-1.5">
                            <span className="absolute inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-75 animate-ping" />
                            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </span>
                        <Sparkles size={11} className="text-emerald-600 dark:text-emerald-300" />
                        <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-emerald-700 dark:text-emerald-200">
                            LIVE · مباشر · 2026
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-0 leading-[1.4] text-slate-900 dark:text-white">
                        دليلك{' '}
                        <span
                            className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300"
                            style={{ fontSize: 'calc(1em + 2px)' }}
                        >
                            الشامل والموثوق
                        </span>
                    </h1>

                    <div className="mb-2 mt-3 md:mt-4" />

                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-2 leading-relaxed font-medium">
                        كل ما تحتاجه في تركيا:{' '}
                        <span className="text-emerald-600 dark:text-emerald-300 font-bold">إقامات</span>،{' '}
                        <span className="text-sky-600 dark:text-cyan-300 font-bold">قانون</span>،{' '}
                        <span className="text-orange-600 dark:text-amber-300 font-bold">أكواد أمنية</span>،{' '}
                        و<span className="text-fuchsia-600 dark:text-violet-300 font-bold">خدمات موثوقة</span>.
                    </p>

                    <p className="text-sm md:text-base text-emerald-700 dark:text-emerald-200/90 max-w-2xl mx-auto mb-2 font-bold">
                        المعلومة الرسمية الأحدث — لا الإشاعات.
                    </p>

                    <div className="mt-6 max-w-xl mx-auto relative z-[25]">
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}
