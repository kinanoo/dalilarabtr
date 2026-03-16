'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useScrollReveal } from '@/lib/hooks/useScrollReveal';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, ArrowLeft, Calendar, Sparkles, FileText, AlertCircle, HelpCircle, Shield, MapPin, Newspaper, Briefcase, Wrench, ExternalLink, ChevronLeft, ChevronRight, Flame, Clock } from 'lucide-react';

// === Type Definitions ===
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

function isNewContent(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
}

function getRelativeDate(dateStr: string, sortDate?: string): string {
    const raw = sortDate || dateStr;
    if (!raw) return dateStr;
    const date = new Date(raw);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'قبل يومين';
    if (diffDays <= 7) return `قبل ${diffDays} أيام`;
    return dateStr;
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

export default function HomeUpdates({ updates }: { updates: Update[] }) {
    const sectionRef = useScrollReveal<HTMLElement>();
    if (!updates || updates.length === 0) return null;

    const cardsPerPage = useCardsPerPage();
    const totalPages = Math.ceil(updates.length / cardsPerPage);

    const [currentPage, setCurrentPage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const touchStartRef = useRef(0);
    const autoplayRef = useRef<ReturnType<typeof setInterval>>();

    // Count new items
    const newCount = updates.filter(u => isNewContent(u.sortDate || u.date)).length;

    // Clamp currentPage when totalPages changes (e.g. resize)
    useEffect(() => {
        if (currentPage >= totalPages) setCurrentPage(Math.max(0, totalPages - 1));
    }, [totalPages, currentPage]);

    // Auto-advance every 6 seconds — only when visible on screen
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
            <div className="max-w-7xl mx-auto px-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <Bell size={20} className="text-amber-500" />
                        {newCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                                {newCount}
                            </span>
                        )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                        آخر التحديثات
                    </h2>
                    {newCount > 0 && (
                        <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                            <Sparkles size={10} />
                            {newCount} جديد
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {totalPages > 1 && (
                        <div className="hidden sm:flex items-center gap-1">
                            <button
                                onClick={goNext}
                                className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                aria-label="التالي"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <button
                                onClick={goPrev}
                                className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                aria-label="السابق"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                    )}
                    <Link
                        href="/updates"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
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
                        {totalPages <= 8 && (
                            <div className="flex gap-0">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goTo(i)}
                                        className="p-1.5 sm:p-3 flex items-center justify-center"
                                        aria-label={`الصفحة ${i + 1}`}
                                        aria-current={i === currentPage ? 'true' : undefined}
                                    >
                                        <span className={`block h-1.5 rounded-full transition-all duration-300 ${
                                            i === currentPage
                                                ? 'w-5 sm:w-6 bg-emerald-500'
                                                : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                                        }`} />
                                    </button>
                                ))}
                            </div>
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold tabular-nums" dir="rtl">
                            {currentPage + 1} / {totalPages}
                        </span>
                    </div>
                </div>
            )}
        </section>
    );
}

function UpdateCard({ update, index = 0 }: { update: Update; index?: number }) {
    const isAuto = update.source === 'auto';
    const iconConfig = isAuto && update.event_type ? AUTO_ICON_MAP[update.event_type] : null;
    const href = update.href || `/updates/${update.id}`;
    const isUrgent = update.type === 'هام' || update.type === 'عاجل';
    const isNew = isNewContent(update.sortDate || update.date);

    return (
        <Link
            href={href}
            className={`block h-full rounded-xl p-4 border hover:-translate-y-1 transition-all duration-300 group/card relative overflow-hidden ${
                isUrgent
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 hover:border-red-400 dark:hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10'
                    : 'bg-white dark:bg-white/[0.04] dark:backdrop-blur-md border-slate-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-400/30 hover:shadow-lg dark:hover:shadow-emerald-500/5'
            }`}
            dir="rtl"
        >
            {/* Urgent pulse border effect */}
            {isUrgent && (
                <div className="absolute inset-0 rounded-xl border-2 border-red-400/50 animate-pulse pointer-events-none" />
            )}

            <div className="flex items-start gap-3 h-full relative">
                {/* Icon or Image */}
                {isUrgent ? (
                    <div className="w-14 sm:w-16 h-14 sm:h-16 flex-shrink-0 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                        <Flame size={26} className="text-red-500" />
                    </div>
                ) : isAuto && iconConfig ? (
                    <div className={`w-14 sm:w-16 h-14 sm:h-16 flex-shrink-0 rounded-lg ${iconConfig.bg} flex items-center justify-center`}>
                        <iconConfig.icon size={26} className={iconConfig.text} />
                    </div>
                ) : update.image ? (
                    <div className="relative w-14 sm:w-16 h-14 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
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
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isUrgent
                                ? 'bg-red-500 text-white dark:bg-red-600 animate-pulse'
                                : isAuto
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                            {isUrgent && <Flame size={10} />}
                            {update.type}
                        </span>
                        {isNew && !isUrgent && (
                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                <Sparkles size={8} /> جديد
                            </span>
                        )}
                    </div>

                    <h3 className={`font-bold text-sm sm:text-base leading-snug line-clamp-2 transition-colors ${
                        isUrgent
                            ? 'text-red-800 dark:text-red-200 group-hover/card:text-red-600'
                            : 'text-slate-800 dark:text-slate-100 group-hover/card:text-emerald-600'
                    }`}>
                        {update.title}
                    </h3>

                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-1.5">
                        <Clock size={11} />
                        {getRelativeDate(update.date, update.sortDate)}
                    </span>
                </div>
            </div>
        </Link>
    );
}
