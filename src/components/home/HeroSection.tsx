'use client';

import { ReactNode } from 'react';
import TurkeyMap from './TurkeyMap';

export default function HeroSection({ children }: { children?: ReactNode }) {
    return (
        <section className="relative z-[15] bg-slate-900 text-white pt-4 pb-10 px-4 shadow-2xl" style={{ overflowX: 'clip' }}>

            {/* Background */}
            <div className="absolute inset-0 overflow-hidden -z-10 border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-emerald-950 to-slate-950 z-0" />
                <MobileBackground />
            </div>

            {/* Turkey Map — decorative background */}
            <TurkeyMap />

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
