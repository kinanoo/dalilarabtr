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
        <section className="relative z-[15] bg-slate-900 text-white pt-4 pb-10 px-4 shadow-2xl" style={{ overflowX: 'clip' }}>

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
                    {/* USP Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 mb-6 hover:bg-white/10 transition-colors shadow-lg pointer-events-auto">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-100 text-xs md:text-sm font-bold">أول دليل ذكي بالعربية في تركيا</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight drop-shadow-2xl">
                        دليلك القانوني <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">الشامل</span>
                    </h1>

                    <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-3 leading-relaxed">
                        كل ما تحتاجه في تركيا: إقامات، قانون، أكواد أمنية، وخدمات ذكية.
                    </p>

                    <div className="mt-8 max-w-xl mx-auto relative z-[25] pointer-events-auto">
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
            <div
                className="absolute w-[400px] h-[400px] bg-emerald-500/[0.07] blur-[100px] rounded-full will-change-transform"
                style={{ animation: 'aurora-a 18s ease-in-out infinite alternate', top: '-20%', right: '-10%' }}
            />
            {/* Cyan orb — bottom left */}
            <div
                className="absolute w-[350px] h-[350px] bg-cyan-500/[0.06] blur-[100px] rounded-full will-change-transform"
                style={{ animation: 'aurora-b 22s ease-in-out infinite alternate', bottom: '-15%', left: '-5%' }}
            />
            {/* Teal orb — center */}
            <div
                className="absolute w-[300px] h-[300px] bg-teal-400/[0.05] blur-[120px] rounded-full will-change-transform"
                style={{ animation: 'aurora-c 20s ease-in-out infinite alternate', top: '30%', left: '40%' }}
            />
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes aurora-a { from{transform:translate(0,0) scale(1)}to{transform:translate(-60px,40px) scale(1.2)} }
                @keyframes aurora-b { from{transform:translate(0,0) scale(1)}to{transform:translate(50px,-30px) scale(1.15)} }
                @keyframes aurora-c { from{transform:translate(0,0) scale(0.9)}to{transform:translate(-40px,20px) scale(1.1)} }
            `}} />
        </div>
    );
}

const MobileBackground = () => {
    return (
        <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none z-10">
            <div className="absolute w-16 h-16 bg-emerald-500/20 blur-xl rounded-2xl will-change-transform" style={{ animation: 'mob-float-a 27s linear infinite alternate', top: '10%' }} />
            <div className="absolute w-16 h-16 bg-blue-500/20 blur-xl rounded-2xl will-change-transform" style={{ animation: 'mob-float-b 29s linear infinite alternate', top: '40%' }} />
            <div className="absolute w-16 h-16 bg-amber-500/20 blur-xl rounded-2xl will-change-transform" style={{ animation: 'mob-float-a 25s linear infinite alternate', top: '70%' }} />
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes mob-float-a { from{transform:translateX(-20px)}to{transform:translateX(calc(100vw + 20px))} }
                @keyframes mob-float-b { from{transform:translateX(calc(100vw + 20px))}to{transform:translateX(-20px)} }
            `}} />
        </div>
    );
}
