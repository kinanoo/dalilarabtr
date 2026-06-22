'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';

const InteractiveParticles = dynamic(() => import('./InteractiveParticles'), {
    ssr: false,
    loading: () => (
        <div
            className="absolute inset-0 z-[1] opacity-[0.15]"
            style={{
                backgroundImage: 'radial-gradient(circle, rgb(52 211 153) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
            }}
        />
    ),
});

export default function HeroSection({ children }: { children?: ReactNode }) {
    return (
        <section className="relative z-[15] bg-slate-900 text-white pt-6 sm:pt-8 pb-8 sm:pb-10 px-4 shadow-2xl" style={{ overflowX: 'clip' }}>

            {/* Top accent stripe — same family pattern as UpdateCard,
                ToolCard, CategoryTile, article hero. Gives the hero
                section a branded "magazine cover" frame at the very
                first pixel a reader sees. */}
            <div
                aria-hidden="true"
                className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-emerald-400 via-teal-400 to-cyan-400 z-30"
            />

            {/* Background */}
            <div className="absolute inset-0 overflow-hidden -z-10 border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-emerald-950 to-slate-950 z-0" />

                {/* Interactive Dot Grid — dots flee from cursor */}
                <InteractiveParticles />

                {/* Aurora Orbs */}
                <AuroraBackground />

                {/* Mobile floating blurs (kept for small screens) */}
                <MobileBackground />

                {/* Top sheen — subtle highlight bleeding from the top
                    edge so the dark gradient reads as "lit from above"
                    instead of a flat slab. Same treatment as the
                    article hero. */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
            </div>

            {/* Center Content */}
            <div className="max-w-4xl mx-auto text-center relative z-[25] pointer-events-none">
                <div className="animate-hero-entrance pointer-events-none">
                    {/* Eyebrow — pulsing emerald dot inside a bordered
                        pill with a "LIVE · 2026" label. Frames the
                        whole hero as breaking, current, alive. Same
                        eyebrow pattern as section headers across the
                        site (HomeUpdates, QuickActionsGrid, zones list,
                        consultant steps). */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] border border-emerald-500/30 rounded-full backdrop-blur-sm mb-5 pointer-events-auto">
                        <span className="relative inline-flex items-center justify-center w-1.5 h-1.5">
                            <span className="absolute inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </span>
                        <Sparkles size={11} className="text-emerald-300" />
                        <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-emerald-200">
                            LIVE · مباشر · 2026
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-0 leading-[1.4] drop-shadow-2xl">
                        دليلك{' '}
                        <span className="relative inline-block">
                            <span
                                className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-300 via-teal-300 to-cyan-300 drop-shadow-[0_0_30px_rgba(45,212,191,0.45)]"
                                style={{ fontSize: 'calc(1em + 2px)' }}
                            >الشامل والموثوق</span>
                            {/* Soft glow ring behind the gradient word so
                                it feels like a beacon, not just coloured text */}
                            <span aria-hidden="true" className="absolute inset-0 -z-10 blur-2xl bg-gradient-to-l from-emerald-400/30 via-teal-400/30 to-cyan-400/30 rounded-full" />
                        </span>
                    </h1>
                    <div className="mb-2 mt-3 md:mt-4" />

                    <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-2 leading-relaxed font-medium">
                        كل ما تحتاجه في تركيا:{' '}
                        <span className="text-emerald-300 font-bold">إقامات</span>،{' '}
                        <span className="text-cyan-300 font-bold">قانون</span>،{' '}
                        <span className="text-amber-300 font-bold">أكواد أمنية</span>،{' '}
                        و<span className="text-violet-300 font-bold">خدمات موثوقة</span>.
                    </p>

                    <p className="text-sm md:text-base text-emerald-200/90 max-w-2xl mx-auto mb-2 font-bold">
                        المعلومة الرسمية الأحدث — لا الإشاعات.
                    </p>

                    <div className="mt-6 max-w-xl mx-auto relative z-[25] pointer-events-auto">
                        {children}
                    </div>

                    {/* NOTE: HeroTrustStrip used to render here, but that
                        placed it in the same stacking context as the search
                        dropdown overlay — the dropdown's results visually
                        appeared underneath the trust chips because the chips
                        sat in normal flow between the search input and the
                        dropdown's anchor point. We moved the strip out of the
                        hero (into the homepage flow below) so the dropdown
                        can open cleanly without competing for space. */}

                </div>
            </div>
        </section>
    );
}

/* Aurora — large blurred orbs that drift slowly (visible on all screens) */
const AuroraBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
            {/* Large emerald orb — top right */}
            <div className="absolute w-[400px] h-[400px] bg-emerald-500/[0.07] blur-[100px] rounded-full will-change-transform animate-aurora-a -top-[20%] -right-[10%]" />
            {/* Cyan orb — bottom left */}
            <div className="absolute w-[350px] h-[350px] bg-cyan-500/[0.06] blur-[100px] rounded-full will-change-transform animate-aurora-b -bottom-[15%] -left-[5%]" />
            {/* Teal orb — center */}
            <div className="absolute w-[300px] h-[300px] bg-teal-400/[0.05] blur-[120px] rounded-full will-change-transform animate-aurora-c top-[30%] left-[40%]" />
        </div>
    );
}

const MobileBackground = () => {
    return (
        <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none z-10">
            <div className="absolute w-16 h-16 bg-emerald-500/20 blur-xl rounded-2xl will-change-transform animate-mob-float-a top-[10%]" />
            <div className="absolute w-16 h-16 bg-blue-500/20 blur-xl rounded-2xl will-change-transform animate-mob-float-b top-[40%]" />
            <div className="absolute w-16 h-16 bg-amber-500/20 blur-xl rounded-2xl will-change-transform animate-mob-float-a-slow top-[70%]" />
        </div>
    );
}
