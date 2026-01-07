'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, ArrowLeft, Calendar, Sparkles } from 'lucide-react';

function isNewContent(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
}

export default function HomeUpdates({ updates }: { updates: any[] }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState(0);
    const [startX, setStartX] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const hasDraggedRef = useRef(false);

    if (!updates || updates.length === 0) return null;

    // Ensure enough items for infinite loop
    const minBaseCount = 10;
    let baseList = [...updates];
    while (baseList.length < minBaseCount) {
        baseList = [...baseList, ...updates];
    }

    // Animation Loop
    useEffect(() => {
        const animate = () => {
            if (!isHovered && !isDragging && contentRef.current) {
                setOffset(prev => {
                    const newOffset = prev - 0.5; // Speed
                    const halfWidth = contentRef.current!.scrollWidth / 2;
                    // Reset seamlessly when first set moves out of view
                    return newOffset <= -halfWidth ? 0 : newOffset;
                });
            }
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isHovered, isDragging]);

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - offset);
        hasDraggedRef.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        hasDraggedRef.current = true;
        const x = e.pageX - offset;
        // Limit dragging speed/bounds essentially handled by the loop logic visual reset roughly
        // But for simple "feel", just updating offset is enough. 
        // We might want to clamp or wrap logic here too?
        // Simple wrap for dragging:
        let newOffset = e.pageX - startX;
        if (contentRef.current) {
            const halfWidth = contentRef.current.scrollWidth / 2;
            if (newOffset > 0) newOffset = -halfWidth;
            if (newOffset < -halfWidth) newOffset = 0;
        }
        setOffset(newOffset);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setTimeout(() => { hasDraggedRef.current = false; }, 50);
    };
    const handleMouseLeave = () => {
        setIsDragging(false);
        setIsHovered(false);
    };

    // Touch Support
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartX(e.touches[0].pageX - offset);
        hasDraggedRef.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        hasDraggedRef.current = true;
        const currentX = e.touches[0].pageX;
        let newOffset = currentX - startX;

        if (contentRef.current) {
            const halfWidth = contentRef.current.scrollWidth / 2;
            // Wrap logic specifically for infinite illusion during drag
            if (newOffset > 0) newOffset -= halfWidth;
            if (newOffset < -halfWidth) newOffset += halfWidth;
        }
        setOffset(newOffset);
    };

    // Prevent click if dragged
    const handleCardClick = (e: React.MouseEvent) => {
        if (hasDraggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <section className="py-12 border-b border-slate-100 dark:border-slate-800/50 overflow-hidden select-none">
            <div className="max-w-7xl mx-auto px-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-600 animate-pulse-slow">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            شريط التحديثات
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            أحدث الأخبار والقوانين الصادرة في تركيا
                        </p>
                    </div>
                </div>

                <Link
                    href="/updates"
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-4 py-2 rounded-xl transition flex items-center gap-2 group"
                >
                    عرض السجل الكامل
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Marquee Wrapper */}
            <div className="max-w-7xl mx-auto px-4">
                <div
                    ref={containerRef}
                    className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 cursor-grab active:cursor-grabbing"
                    dir="ltr"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => setIsDragging(false)}
                >
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />

                    {/* Track */}
                    <div
                        ref={contentRef}
                        className="flex w-max py-4 transition-transform duration-0 ease-linear"
                        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
                    >
                        {/* List 1 */}
                        <div className="flex items-center gap-4 pr-4 shrink-0">
                            {baseList.map((update, index) => (
                                <UpdateCard key={`l1-${update.id}-${index}`} update={update} onClick={handleCardClick} />
                            ))}
                        </div>

                        {/* List 2 (Replica) */}
                        <div className="flex items-center gap-4 pr-4 shrink-0">
                            {baseList.map((update, index) => (
                                <UpdateCard key={`l2-${update.id}-${index}`} update={update} onClick={handleCardClick} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Subcomponent for cleaner code
function UpdateCard({ update, onClick }: { update: any, onClick: (e: React.MouseEvent) => void }) {
    return (
        <Link
            href={`/updates#upd-${update.id}`}
            draggable="false" // Prevent native drag link behavior
            onClick={onClick}
            className="block w-[280px] md:w-[350px] h-[120px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors group relative overflow-hidden"
            dir="rtl"
        >
            <div className="flex items-start gap-4 h-full">
                {update.image && (
                    <div className="relative w-24 h-full flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                            src={update.image}
                            alt={update.title || "صورة الخبر"}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500 select-none pointer-events-none"
                            sizes="80px"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${update.type === 'هام' || update.type === 'عاجل'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                {update.type}
                            </span>
                            {isNewContent(update.date) && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <Sparkles size={10} /> جديد
                                </span>
                            )}
                        </div>

                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
                            {update.title}
                        </h3>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar size={12} /> {update.date}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1">
                            اقرأ المزيد <ArrowLeft size={10} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
