'use client';

import { useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, ArrowLeft, Calendar, Sparkles, FileText, AlertCircle, HelpCircle, Shield, MapPin, Newspaper, Briefcase, Wrench, ExternalLink } from 'lucide-react';

function isNewContent(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
}

const AUTO_ICON_MAP: Record<string, { icon: typeof FileText; bg: string; text: string }> = {
    new_article:  { icon: FileText,     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600' },
    new_scenario: { icon: AlertCircle,  bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-600' },
    new_faq:      { icon: HelpCircle,   bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-600' },
    new_code:     { icon: Shield,       bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-600' },
    new_zone:     { icon: MapPin,       bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-600' },
    new_update:   { icon: Newspaper,    bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600' },
    new_service:  { icon: Briefcase,    bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-600' },
    new_tool:     { icon: Wrench,       bg: 'bg-pink-100 dark:bg-pink-900/30',       text: 'text-pink-600' },
    new_source:   { icon: ExternalLink, bg: 'bg-teal-100 dark:bg-teal-900/30',       text: 'text-teal-600' },
};

export default function HomeUpdates({ updates }: { updates: any[] }) {
    if (!updates || updates.length === 0) return null;

    const minBaseCount = 5;
    let baseList = [...updates];
    while (baseList.length < minBaseCount) {
        baseList = [...baseList, ...updates];
    }

    const [isPaused, setIsPaused] = useState(false);
    const isDraggingRef = useRef(false);
    const hasDraggedRef = useRef(false);
    const startXRef = useRef(0);
    const resumeTimer = useRef<ReturnType<typeof setTimeout>>();

    // ~4 seconds per card for comfortable reading speed
    const durationSeconds = baseList.length * 4;

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        isDraggingRef.current = true;
        hasDraggedRef.current = false;
        startXRef.current = e.clientX;
        setIsPaused(true);
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDraggingRef.current) return;
        if (Math.abs(e.clientX - startXRef.current) > 5) {
            hasDraggedRef.current = true;
        }
    }, []);

    const handlePointerUp = useCallback(() => {
        isDraggingRef.current = false;
        resumeTimer.current = setTimeout(() => setIsPaused(false), 3000);
    }, []);

    return (
        <section className="py-6 sm:py-8 border-b border-slate-100 dark:border-slate-800/50 overflow-hidden">
            {/* Compact Header */}
            <div className="max-w-7xl mx-auto px-4 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-amber-500" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                        آخر التحديثات
                    </h2>
                </div>

                <Link
                    href="/updates"
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                    الكل
                    <ArrowLeft size={14} />
                </Link>
            </div>

            {/* Scrollable Track — GPU-accelerated CSS animation (no JavaScript per frame) */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="relative w-full overflow-hidden rounded-xl">
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-slate-100 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-slate-100 dark:from-slate-950 to-transparent z-10 pointer-events-none" />

                    <div
                        className="updates-track flex gap-3 py-2 cursor-grab active:cursor-grabbing select-none"
                        dir="ltr"
                        style={{
                            animationDuration: `${durationSeconds}s`,
                            animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => { if (!isDraggingRef.current) setIsPaused(false); }}
                    >
                        {/* List 1 */}
                        {baseList.map((update, index) => (
                            <UpdateCard key={`l1-${update.id}-${index}`} update={update} hasDraggedRef={hasDraggedRef} />
                        ))}
                        {/* List 2 (seamless loop) */}
                        <div aria-hidden="true" className="contents">
                            {baseList.map((update, index) => (
                                <UpdateCard key={`l2-${update.id}-${index}`} update={update} hasDraggedRef={hasDraggedRef} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pure CSS animation — runs entirely on GPU compositor thread */}
            <style jsx>{`
                .updates-track {
                    animation: scroll-updates linear infinite;
                    will-change: transform;
                }
                @keyframes scroll-updates {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-50%); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .updates-track { animation: none; }
                }
            `}</style>
        </section>
    );
}

function UpdateCard({ update, hasDraggedRef }: { update: any; hasDraggedRef: React.RefObject<boolean> }) {
    const isAuto = update.source === 'auto';
    const iconConfig = isAuto ? AUTO_ICON_MAP[update.event_type] : null;
    const href = update.href || `/updates/${update.id}`;

    return (
        <Link
            href={href}
            draggable="false"
            className="block w-[220px] sm:w-[280px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors group/card relative overflow-hidden"
            dir="rtl"
            onClick={(e) => {
                if (hasDraggedRef.current) {
                    e.preventDefault();
                }
            }}
        >
            <div className="flex items-start gap-3 h-full">
                {/* Icon or Image */}
                {isAuto && iconConfig ? (
                    <div className={`w-14 sm:w-16 h-14 sm:h-16 flex-shrink-0 rounded-lg ${iconConfig.bg} flex items-center justify-center`}>
                        <iconConfig.icon size={24} className={iconConfig.text} />
                    </div>
                ) : update.image ? (
                    <div className="relative w-14 sm:w-16 h-14 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                            src={update.image}
                            alt={update.title || "صورة الخبر"}
                            fill
                            className="object-cover select-none pointer-events-none"
                            sizes="64px"
                        />
                    </div>
                ) : null}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            update.type === 'هام' || update.type === 'عاجل'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : isAuto
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                            {update.type}
                        </span>
                        {isNewContent(update.sortDate || update.date) && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                                <Sparkles size={8} /> جديد
                            </span>
                        )}
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2 group-hover/card:text-emerald-600 transition-colors">
                        {update.title}
                    </h3>

                    <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-1.5">
                        <Calendar size={10} /> {update.date}
                    </span>
                </div>
            </div>
        </Link>
    );
}
