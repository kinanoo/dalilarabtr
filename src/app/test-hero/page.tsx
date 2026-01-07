'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Calculator, Wallet, Map, Stethoscope, GraduationCap, Building2, Scale, FileText, Plane, Shield, Activity, Home, HeartHandshake, Flag, AlertTriangle } from 'lucide-react';

// --- DATA PAYLOAD (VERIFIED LINKS) ---
const SIDE_ITEMS_LEFT = [
    { id: 't1', title: 'حاسبة الحظر', icon: Calculator, color: 'emerald', link: '/ban-calculator' },
    { id: 't2', title: 'تكلفة الإقامة', icon: Wallet, color: 'blue', link: '/residence' }, // Mapping to residence for now or calculator if exists
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

const SideColumn = ({ items, direction = 'up', className }: any) => {
    const loopItems = [...items, ...items, ...items, ...items]; // More items for smoother loop

    return (
        <div className={`absolute top-0 bottom-0 w-[140px] md:w-[180px] overflow-hidden ${className} mask-gradient-y hidden md:flex flex-col items-center justify-center`}>
            {/* The Moving Track */}
            <motion.div
                className="flex flex-col gap-8 py-8"
                animate={{
                    y: direction === 'up' ? [0, -1500] : [-1500, 0]
                }}
                transition={{
                    duration: 60, // Very slow and elegant
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {loopItems.map((item, i) => (
                    <DiamondItem key={`${item.id}-${i}`} data={item} />
                ))}
            </motion.div>
        </div>
    );
};

// Mobile Background
const MobileBackground = ({ items }: any) => {
    return (
        <div className="absolute inset-0 md:hidden overflow-hidden pointer-events-none">
            {items.slice(0, 8).map((item: any, i: number) => (
                <motion.div
                    key={`mob-${i}`}
                    className="absolute opacity-10"
                    initial={{
                        x: i % 2 === 0 ? -20 : 300,
                        y: (i * 120) % 800
                    }}
                    animate={{
                        x: i % 2 === 0 ? 350 : -50,
                    }}
                    transition={{
                        duration: 30 + (i * 2),
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "linear"
                    }}
                >
                    <div className={`w-24 h-24 rotate-45 bg-${item.color}-500/30 blur-xl rounded-3xl`}></div>
                </motion.div>
            ))}
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
                    initial={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    exit={{ scale: 2, opacity: 0, filter: 'blur(12px)' }}
                    transition={{ duration: 0.3, ease: "backIn" }}
                    onClick={handleClick}
                    className="group relative cursor-pointer"
                >
                    {/* The Diamond Container */}
                    <div className={`
                        w-20 h-20 md:w-24 md:h-24 rotate-45 rounded-3xl
                        bg-slate-900/60 backdrop-blur-xl border border-white/10
                        shadow-2xl flex items-center justify-center
                        group-hover:border-${data.color}-500/60 group-hover:bg-slate-800/80
                        transition-all duration-300 ring-1 ring-white/5 group-hover:ring-${data.color}-500/30
                        group-hover:shadow-${data.color}-500/20
                    `}>
                        {/* Inner Content - Counter Rotated to keep straight */}
                        <div className="-rotate-45 flex flex-col items-center justify-center gap-1.5">
                            <Icon size={28} className={`text-${data.color}-400 group-hover:text-white transition-colors drop-shadow-lg`} />

                            {/* Visible Label */}
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors whitespace-nowrap bg-black/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                                {data.title}
                            </span>
                        </div>
                    </div>

                    {/* Reflection/Glow effect */}
                    <div className={`absolute -inset-4 bg-${data.color}-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 pointer-events-none`} />

                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function BubbleHeroDiamond() {
    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-950 flex items-center justify-center font-cairo">

            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0" />

            {/* Grid - Hexagon Pattern for Techno feel */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            </div>

            {/* --- SIDE PILLARS (Desktop) --- */}
            <SideColumn items={SIDE_ITEMS_LEFT} direction="up" className="left-8 md:left-16" />
            <SideColumn items={SIDE_ITEMS_RIGHT} direction="down" className="right-8 md:right-16" />

            {/* --- MOBILE BACKGROUND --- */}
            <MobileBackground items={[...SIDE_ITEMS_LEFT, ...SIDE_ITEMS_RIGHT]} />

            {/* --- CENTER CONTENT --- */}
            <div className="relative z-20 w-full max-w-2xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-xs font-bold text-emerald-400 mb-2 cursor-default select-none shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        دليلك الرقمي في تركيا
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tight leading-[1.1]">
                        بوابتك <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">العربية</span> <br />
                        في تركيا
                    </h1>

                    <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                        اكتشف القوانين، احسب التكاليف، وتعرف على حقوقك بلمسة واحدة.
                    </p>

                    {/* Search Bar - Glassmorphism v2 */}
                    <div className="relative group mx-auto max-w-lg mt-10">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center shadow-2xl">
                            <div className="pl-4 pr-3 text-slate-400 pointer-events-none">
                                <Search size={22} />
                            </div>
                            <input
                                type="text"
                                placeholder="ماذا تريد أن تعرف اليوم؟"
                                className="bg-transparent border-none outline-none text-white placeholder-slate-500 flex-1 py-3 text-lg"
                            />
                            <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-6 py-2.5 rounded-full font-bold shadow-lg transform active:scale-95 transition-all">
                                بحث
                            </button>
                        </div>
                    </div>

                    {/* Quick Links for Mobile */}
                    <div className="md:hidden grid grid-cols-2 gap-3 mt-8 px-4">
                        <Link href="/residence" className="bg-slate-800/50 border border-white/5 p-3 rounded-xl text-slate-300 text-sm flex items-center justify-center gap-2">
                            <Home size={16} className="text-indigo-400" /> الإقامة
                        </Link>
                        <Link href="/ban-calculator" className="bg-slate-800/50 border border-white/5 p-3 rounded-xl text-slate-300 text-sm flex items-center justify-center gap-2">
                            <Calculator size={16} className="text-emerald-400" /> الحاسبة
                        </Link>
                        <Link href="/work" className="bg-slate-800/50 border border-white/5 p-3 rounded-xl text-slate-300 text-sm flex items-center justify-center gap-2">
                            <Building2 size={16} className="text-cyan-400" /> العمل
                        </Link>
                        <Link href="/codes" className="bg-slate-800/50 border border-white/5 p-3 rounded-xl text-slate-300 text-sm flex items-center justify-center gap-2">
                            <Shield size={16} className="text-slate-400" /> الأكواد
                        </Link>
                    </div>

                </motion.div>
            </div>

        </div>
    );
}
