'use client';

import { useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
    items: ReactNode[];
    autoPlay?: boolean;
    interval?: number;
    showDots?: boolean;
    showArrows?: boolean;
    loop?: boolean;
    className?: string;
}

export default function Carousel({
    items,
    autoPlay = false,
    interval = 3000,
    showDots = true,
    showArrows = true,
    loop = true,
    className = '',
}: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-play logic
    useEffect(() => {
        if (!autoPlay || isPaused) return;

        const timer = setInterval(() => {
            goToNext();
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, autoPlay, isPaused, interval]);

    const goToNext = () => {
        if (currentIndex === items.length - 1) {
            if (loop) {
                setCurrentIndex(0);
            }
        } else {
            setCurrentIndex((prev) => prev + 1);
        }

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const goToPrevious = () => {
        if (currentIndex === 0) {
            if (loop) {
                setCurrentIndex(items.length - 1);
            }
        } else {
            setCurrentIndex((prev) => prev - 1);
        }

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const goToIndex = (index: number) => {
        setCurrentIndex(index);

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            goToPrevious();
        } else if (e.key === 'ArrowRight') {
            goToNext();
        }
    };

    return (
        <div
            className={`relative group ${className}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Carousel Items */}
            <div className="relative overflow-hidden rounded-xl">
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="min-w-full"
                            aria-hidden={currentIndex !== index}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* Previous/Next Arrows */}
            {showArrows && (
                <>
                    <button
                        onClick={goToPrevious}
                        disabled={!loop && currentIndex === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 btn-hover-lift"
                        aria-label="Previous slide"
                    >
                        <ChevronRight size={24} className="text-slate-800 dark:text-slate-100" />
                    </button>

                    <button
                        onClick={goToNext}
                        disabled={!loop && currentIndex === items.length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 btn-hover-lift"
                        aria-label="Next slide"
                    >
                        <ChevronLeft size={24} className="text-slate-800 dark:text-slate-100" />
                    </button>
                </>
            )}

            {/* Dots */}
            {showDots && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${currentIndex === index
                                    ? 'bg-emerald-600 dark:bg-emerald-400 w-8'
                                    : 'bg-white/60 dark:bg-slate-400/60 hover:bg-white dark:hover:bg-slate-300'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={currentIndex === index}
                        />
                    ))}
                </div>
            )}

            {/* Slide Counter */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} / {items.length}
            </div>
        </div>
    );
}
