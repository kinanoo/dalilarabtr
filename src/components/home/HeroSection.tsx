'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, Wallet, Map, Stethoscope, GraduationCap, Building2, Scale, FileText, Plane, Shield, Activity, Home, HeartHandshake, Flag, Search, ArrowLeft } from 'lucide-react';

// --- DATA PAYLOAD (VERIFIED LINKS) ---
const SIDE_ITEMS_LEFT = [
    { id: 't1', title: 'حاسبة الحظر', icon: Calculator, color: 'emerald', link: '/ban-calculator' },
    { id: 't2', title: 'تكلفة الإقامة', icon: Wallet, color: 'blue', link: '/residence' },
    { id: 't3', title: 'الصيدليات', icon: Activity, color: 'red', link: '/tools/pharmacy' },
    { id: 't4', title: 'مناطق محظورة', icon: Map, color: 'amber', link: '/zones' },
    { id: 't5', title: 'أكواد الأمن', icon: Shield, color: 'slate', link: '/codes' },
];

const SIDE_ITEMS_RIGHT = [
    { id: 'g1', title: 'الإقامة', icon: Home, color: 'indigo', link: '/residence' },
    { id: 'g2', title: 'أذن العمل', icon: Building2, color: 'cyan', link: '/work' },
    { id: 'g3', title: 'الدراسة', icon: GraduationCap, color: 'violet', link: '/education' },
    { id: 'g4', title: 'الصحة', icon: Stethoscope, color: 'teal', link: '/health' },
    { id: 'g5', title: 'المعاملات', icon: FileText, color: 'orange', link: '/e-devlet-services' },
    { id: 'g6', title: 'السكن', icon: Home, color: 'lime', link: '/housing' },
];

const fadeInUp = {
    hidden: { opacity: 0, y: 28 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.75, ease: 'easeOut' },
    },
} as const;

export default function HeroSection({ children }: { children?: ReactNode }) {
    return (
        <section className="relative z-[15] bg-slate-900 text-white pt-4 pb-10 px-4 shadow-2xl" style={{ overflowX: 'clip' }}>

            {/* Inner Wrapper for Background/Overflow Clipping */}
            <div className="absolute inset-0 overflow-hidden -z-10 border-b border-white/5">
                {/* Background Gradient - Richer Emerald/Slate */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-emerald-950 to-slate-950 z-0" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                </div>





                {/* --- MOBILE BACKGROUND --- */}
                <MobileBackground />
            </div>

            {/* --- SIDE PILLARS (Moved to Top Level for Interaction) --- */}
            <SideColumn items={SIDE_ITEMS_LEFT} direction="up" className="left-4 xl:left-16 z-[20]" />
            <SideColumn items={SIDE_ITEMS_RIGHT} direction="down" className="right-4 xl:right-16 z-[20]" />

            {/* --- CENTER CONTENT --- */}
            <div className="max-w-4xl mx-auto text-center relative z-[25] pointer-events-none">
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="pointer-events-none">
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

                </motion.div>
            </div>
        </section>
    );
}

// --- SUB COMPONENTS ---

const SideColumn = ({ items, direction = 'up', className }: any) => {
    const loopItems = [...items, ...items, ...items];

    // Item (80px) + Gap (24px) = 104px (Desktop)
    const scrollDistance = items.length * 104;
    const duration = items.length * 5;

    // Unique keyframe name per column to avoid CSS conflicts
    const animName = `col-scroll-${direction}-${scrollDistance}`;
    const fromY = direction === 'up' ? '0px' : `-${scrollDistance}px`;
    const toY = direction === 'up' ? `-${scrollDistance}px` : '0px';

    return (
        <div className={`absolute top-0 bottom-0 w-[80px] md:w-[160px] overflow-hidden ${className} mask-gradient-y flex flex-col items-center justify-center opacity-30 md:opacity-100 pointer-events-none`}>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes ${animName} {
                    from { transform: translateY(${fromY}); }
                    to   { transform: translateY(${toY}); }
                }
            `}} />
            <div
                className="flex flex-col gap-6 py-6 pointer-events-auto will-change-transform"
                style={{ animation: `${animName} ${duration}s linear infinite` }}
            >
                {loopItems.map((item: any, i: number) => (
                    <DiamondItem key={`${item.id}-${i}`} data={item} />
                ))}
            </div>
        </div>
    );
};

const MobileBackground = () => {
    // Pure CSS blobs — zero JavaScript overhead, GPU-composited
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

function DiamondItem({ data }: any) {
    const Icon = data.icon;
    const router = useRouter();
    const [isPopped, setIsPopped] = useState(false);

    const handleClick = () => {
        setIsPopped(true);
        setTimeout(() => {
            if (data.link) router.push(data.link);
        }, 300);
    };

    return (
        <AnimatePresence>
            {!isPopped && (
                <motion.div
                    layout
                    initial={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    exit={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 0.3 }}
                    onClick={handleClick}
                    className="group relative cursor-pointer"
                >
                    <div className={`
                        w-12 h-12 md:w-20 md:h-20 rotate-45 rounded-xl md:rounded-2xl
                        bg-slate-800/40 md:backdrop-blur-md border border-white/5
                        md:shadow-xl flex items-center justify-center
                        group-hover:border-${data.color}-500/50 group-hover:bg-slate-800/80
                        transition-all duration-300 ring-1 ring-white/5 group-hover:ring-${data.color}-500/30
                    `}>
                        <div className="-rotate-45 flex flex-col items-center justify-center gap-0.5">
                            <Icon size={16} className={`text-${data.color}-400 group-hover:text-white transition-colors md:w-[22px] md:h-[22px]`} />
                            <span className="text-[8px] md:text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors whitespace-nowrap px-1">
                                {data.title}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
