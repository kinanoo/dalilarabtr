'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

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
        <section className="relative z-[15] bg-slate-900 text-white pt-2 pb-6 px-4 shadow-2xl" style={{ overflowX: 'clip' }}>

            {/* Background */}
            <div className="absolute inset-0 overflow-hidden -z-10 border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-emerald-950 to-slate-950 z-0" />

                {/* Interactive Dot Grid — dots flee from cursor */}
                <InteractiveParticles />

                {/* Aurora Orbs */}
                <AuroraBackground />

                {/* Mobile floating blurs (kept for small screens) */}
                <MobileBackground />
            </div>

            {/* Center Content */}
            <div className="max-w-4xl mx-auto text-center relative z-[25] pointer-events-none">
                <div className="animate-hero-entrance pointer-events-none">
                    <h1 className="text-4xl md:text-6xl font-black mb-0 leading-tight drop-shadow-2xl">
                        دليلك القانوني{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">الشامل</span>
                    </h1>
                    <div className="mb-2 mt-3 md:mt-4" />

                    <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto mb-2 leading-relaxed">
                        كل ما تحتاجه في تركيا: إقامات، قانون، أكواد أمنية، وخدمات ذكية.
                    </p>

                    <div className="mt-6 max-w-xl mx-auto relative z-[25] pointer-events-auto">
                        {children}
                    </div>

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
