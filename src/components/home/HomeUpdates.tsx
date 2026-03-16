'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useScrollReveal } from '@/lib/hooks/useScrollReveal';
import Link from 'next/link';
import Image from 'next/image';
import {
    Bell, ArrowLeft, Sparkles,
    ChevronLeft, ChevronRight, Flame, Clock, Eye, Newspaper
} from 'lucide-react';
import { isNewContent, getRelativeDate, getEventIcon } from '@/lib/updateUtils';
import { BREAKPOINTS } from '@/lib/breakpoints';

// === Types ===
interface Update {
    id: string;
    title: string;
    type: string;
    date: string;
    sortDate?: string;
    image?: string;
    href?: string;
    source?: string;
    event_type?: string;
}

function useCardsPerPage(): number {
    const [count, setCount] = useState(1);
    useEffect(() => {
        const update = () => {
            if (window.innerWidth >= BREAKPOINTS.lg) setCount(3);
            else if (window.innerWidth >= BREAKPOINTS.sm) setCount(2);
            else setCount(1);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    return count;
}

export default function HomeUpdates({ updates }: { updates: Update[] }) {
    const sectionRef = useScrollReveal<HTMLElement>();
    if (!updates || updates.length === 0) return null;

    const cardsPerPage = useCardsPerPage();
    const totalPages = Math.ceil(updates.length / cardsPerPage);

    const [currentPage, setCurrentPage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const touchStartRef = useRef(0);
    const autoplayRef = useRef<ReturnType<typeof setInterval>>();

    const newCount = updates.filter(u => isNewContent(u.sortDate || u.date)).length;

    useEffect(() => {
        if (currentPage >= totalPages) setCurrentPage(Math.max(0, totalPages - 1));
    }, [totalPages, currentPage]);

    // Auto-advance — only when visible
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), { threshold: 0.1 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (isHovered || totalPages <= 1 || !isVisible) return;
        autoplayRef.current = setInterval(() => {
            setCurrentPage(prev => (prev + 1) % totalPages);
        }, 6000);
        return () => clearInterval(autoplayRef.current);
    }, [isHovered, totalPages, isVisible]);

    const goTo = useCallback((page: number) => setCurrentPage(page), []);
    const goNext = useCallback(() => setCurrentPage(prev => (prev + 1) % totalPages), [totalPages]);
    const goPrev = useCallback(() => setCurrentPage(prev => (prev - 1 + totalPages) % totalPages), [totalPages]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartRef.current = e.changedTouches[0].clientX;
    }, []);
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const diff = e.changedTouches[0].clientX - touchStartRef.current;
        if (Math.abs(diff) > 50) { diff < 0 ? goNext() : goPrev(); }
    }, [goNext, goPrev]);
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') goPrev();
        else if (e.key === 'ArrowRight') goNext();
    }, [goNext, goPrev]);

    const cardWidthPercent = 100 / cardsPerPage;
    const gapPx = 12;

    return (
        <section ref={sectionRef} className="py-6 sm:py-8 border-b border-slate-100 dark:border-slate-800/50">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Bell size={16} className="text-amber-600" />
                        </div>
                        {newCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                                {newCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                            آخر التحديثات
                        </h2>
                        {newCount > 0 && (
                            <p className="text-[10px] text-slate-400 hidden sm:block">
                                {newCount} تحديث جديد هذا الأسبوع
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {totalPages > 1 && (
                        <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <button
                                onClick={goNext}
                                className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 transition-all"
                                aria-label="التالي"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <span className="text-[11px] text-slate-400 font-bold tabular-nums px-1">
                                {currentPage + 1}/{totalPages}
                            </span>
                            <button
                                onClick={goPrev}
                                className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 transition-all"
                                aria-label="السابق"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    )}
                    <Link
                        href="/updates"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    >
                        عرض الكل
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
                                        opacity: isActive ? 1 : 0.4,
                                    }}
                                >
                                    <UpdateCard update={update} index={index} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Progress dots */}
            {totalPages > 1 && (
                <div className="max-w-7xl mx-auto px-4 mt-3">
                    <div className="flex items-center justify-center gap-1" dir="ltr">
                        {totalPages <= 8 && Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                className="p-1.5"
                                aria-label={`الصفحة ${i + 1}`}
                            >
                                <span className={`block rounded-full transition-all duration-300 ${
                                    i === currentPage
                                        ? 'w-6 h-1.5 bg-emerald-500'
                                        : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                                }`} />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

function UpdateCard({ update, index = 0 }: { update: Update; index?: number }) {
    const isAuto = update.source === 'auto';
    const iconConfig = isAuto && update.event_type ? getEventIcon(update.event_type) : null;
    const href = update.href || `/updates/${update.id}`;
    const isUrgent = update.type === 'هام' || update.type === 'عاجل';
    const isNew = isNewContent(update.sortDate || update.date);

    return (
        <Link
            href={href}
            className={`block h-full rounded-xl p-3 sm:p-4 border hover:-translate-y-0.5 transition-all duration-300 group/card relative overflow-hidden ${
                isUrgent
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/10'
                    : 'bg-white dark:bg-white/[0.04] dark:backdrop-blur-md border-slate-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-400/30 hover:shadow-md'
            }`}
            dir="rtl"
        >
            {/* Urgent accent bar */}
            {isUrgent && (
                <div className="absolute top-0 right-0 w-1 h-full bg-red-500 rounded-r-full" />
            )}

            <div className="flex items-start gap-3 h-full relative">
                {/* Icon/Image — hidden on mobile for more title space */}
                <div className="hidden sm:block flex-shrink-0">
                    {isUrgent ? (
                        <div className="w-11 h-11 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <Flame size={20} className="text-red-500" />
                        </div>
                    ) : isAuto && iconConfig ? (
                        <div className={`w-11 h-11 rounded-lg ${iconConfig.bgLight} ${iconConfig.bgDark} flex items-center justify-center`}>
                            <iconConfig.icon size={20} className={`text-${iconConfig.color}-600`} />
                        </div>
                    ) : update.image ? (
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <Image
                                src={update.image}
                                alt={update.title || "صورة التحديث"}
                                fill
                                className="object-cover"
                                sizes="44px"
                                priority={index === 0}
                            />
                        </div>
                    ) : (
                        <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                            <Newspaper size={20} className="text-amber-600" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isUrgent
                                ? 'bg-red-500 text-white'
                                : isAuto
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                            {update.type}
                        </span>
                        {isNew && !isUrgent && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <Sparkles size={8} /> جديد
                            </span>
                        )}
                    </div>

                    <h3 className={`font-bold text-sm leading-snug line-clamp-2 transition-colors ${
                        isUrgent
                            ? 'text-red-800 dark:text-red-200 group-hover/card:text-red-600'
                            : 'text-slate-800 dark:text-slate-100 group-hover/card:text-emerald-600'
                    }`}>
                        {update.title}
                    </h3>

                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock size={10} />
                            {getRelativeDate(update.date, update.sortDate)}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <Eye size={10} />
                            اقرأ
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
