'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useScrollReveal } from '@/lib/hooks/useScrollReveal';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, ArrowLeft, Calendar, Sparkles, FileText, AlertCircle, HelpCircle, Shield, MapPin, Newspaper, Briefcase, Wrench, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

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

function useCardsPerPage(): number {
    const [count, setCount] = useState(1);
    useEffect(() => {
        const update = () => {
            if (window.innerWidth >= 1024) setCount(3);
            else if (window.innerWidth >= 640) setCount(2);
            else setCount(1);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    return count;
}

export default function HomeUpdates({ updates }: { updates: any[] }) {
    const sectionRef = useScrollReveal<HTMLElement>();
    if (!updates || updates.length === 0) return null;

    const cardsPerPage = useCardsPerPage();
    const totalPages = Math.ceil(updates.length / cardsPerPage);

    const [currentPage, setCurrentPage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const touchStartRef = useRef(0);
    const autoplayRef = useRef<ReturnType<typeof setInterval>>();

    // Clamp currentPage when totalPages changes (e.g. resize)
    useEffect(() => {
        if (currentPage >= totalPages) setCurrentPage(Math.max(0, totalPages - 1));
    }, [totalPages, currentPage]);

    // Auto-advance every 6 seconds
    useEffect(() => {
        if (isHovered || totalPages <= 1) return;
        autoplayRef.current = setInterval(() => {
            setCurrentPage(prev => (prev + 1) % totalPages);
        }, 6000);
        return () => clearInterval(autoplayRef.current);
    }, [isHovered, totalPages]);

    const goTo = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const goNext = useCallback(() => {
        setCurrentPage(prev => (prev + 1) % totalPages);
    }, [totalPages]);

    const goPrev = useCallback(() => {
        setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
    }, [totalPages]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartRef.current = e.changedTouches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const diff = e.changedTouches[0].clientX - touchStartRef.current;
        if (Math.abs(diff) > 50) {
            if (diff < 0) goNext();
            else goPrev();
        }
    }, [goNext, goPrev]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') goPrev();
        else if (e.key === 'ArrowRight') goNext();
    }, [goNext, goPrev]);

    // Card width: percentage of the viewport container
    const cardWidthPercent = 100 / cardsPerPage;
    // Gap in px
    const gapPx = 12;

    return (
        <section ref={sectionRef} className="py-6 sm:py-8 border-b border-slate-100 dark:border-slate-800/50">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-amber-500" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                        آخر التحديثات
                        <span className="text-slate-400 text-sm font-normal mr-1">({updates.length})</span>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    {totalPages > 1 && (
                        <div className="hidden sm:flex items-center gap-1">
                            <button
                                onClick={goNext}
                                className="p-2.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                aria-label="التالي"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <button
                                onClick={goPrev}
                                className="p-2.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                aria-label="السابق"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                    )}
                    <Link
                        href="/updates"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                        الكل
                        <ArrowLeft size={14} />
                    </Link>
                </div>
            </div>

            {/* Carousel */}
            <div
                className="max-w-7xl mx-auto px-4 relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="region"
                aria-label="آخر التحديثات"
            >
                <div className="overflow-hidden rounded-xl">
                    <div
                        className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                        dir="ltr"
                        style={{
                            gap: `${gapPx}px`,
                            transform: `translateX(calc(-${currentPage * 100}% - ${currentPage * gapPx}px))`,
                        }}
                    >
                        {updates.map((update, index) => {
                            const pageOfCard = Math.floor(index / cardsPerPage);
                            const isActive = pageOfCard === currentPage;
                            return (
                                <div
                                    key={`${update.id}-${index}`}
                                    className="flex-shrink-0 transition-opacity duration-700"
                                    style={{
                                        width: `calc(${cardWidthPercent}% - ${((cardsPerPage - 1) * gapPx) / cardsPerPage}px)`,
                                        opacity: isActive ? 1 : 0.5,
                                    }}
                                >
                                    <UpdateCard update={update} index={index} />
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Dots + Counter */}
            {totalPages > 1 && (
                <div className="max-w-7xl mx-auto px-4 mt-3">
                    <div className="flex items-center justify-center gap-3" dir="ltr">
                        <div className="flex gap-0">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goTo(i)}
                                    className="p-3 flex items-center justify-center"
                                    aria-label={`الصفحة ${i + 1}`}
                                    aria-current={i === currentPage ? 'true' : undefined}
                                >
                                    <span className={`block h-1.5 rounded-full transition-all duration-300 ${
                                        i === currentPage
                                            ? 'w-6 bg-emerald-500'
                                            : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                                    }`} />
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold tabular-nums" dir="rtl">
                            {currentPage + 1} / {totalPages}
                        </span>
                    </div>
                </div>
            )}
        </section>
    );
}

function UpdateCard({ update, index = 0 }: { update: any; index?: number }) {
    const isAuto = update.source === 'auto';
    const iconConfig = isAuto ? AUTO_ICON_MAP[update.event_type] : null;
    const href = update.href || `/updates/${update.id}`;

    return (
        <Link
            href={href}
            className="block h-full bg-white dark:bg-white/[0.04] dark:backdrop-blur-md rounded-xl p-4 border border-slate-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-400/30 hover:shadow-lg dark:hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300 group/card relative overflow-hidden"
            dir="rtl"
        >
            <div className="flex items-start gap-3 h-full">
                {/* Icon or Image */}
                {isAuto && iconConfig ? (
                    <div className={`w-16 sm:w-20 h-16 sm:h-20 flex-shrink-0 rounded-lg ${iconConfig.bg} flex items-center justify-center`}>
                        <iconConfig.icon size={28} className={iconConfig.text} />
                    </div>
                ) : update.image ? (
                    <div className="relative w-16 sm:w-20 h-16 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                            src={update.image}
                            alt={update.title || "صورة الخبر"}
                            fill
                            className="object-cover select-none pointer-events-none"
                            sizes="64px"
                            priority={index === 0}
                        />
                    </div>
                ) : null}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            update.type === 'هام' || update.type === 'عاجل'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : isAuto
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                            {update.type}
                        </span>
                        {isNewContent(update.sortDate || update.date) && (
                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                <Sparkles size={8} /> جديد
                            </span>
                        )}
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-2 group-hover/card:text-emerald-600 transition-colors">
                        {update.title}
                    </h3>

                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-1.5">
                        <Calendar size={12} /> {update.date}
                    </span>
                </div>
            </div>
        </Link>
    );
}
