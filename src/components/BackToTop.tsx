'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface BackToTopProps {
    showAfter?: number;
    smooth?: boolean;
    position?: 'bottom-right' | 'bottom-left';
}

export default function BackToTop({
    showAfter = 300,
    smooth = true,
    position = 'bottom-right',
}: BackToTopProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > showAfter) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [showAfter]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto',
        });

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const positionClasses = {
        'bottom-right': 'bottom-1 right-4 md:bottom-2 md:right-8',
        'bottom-left': 'bottom-1 left-4 md:bottom-2 md:left-8',
    };

    if (!isVisible) return null;

    return (
        <button
            type="button"
            onClick={scrollToTop}
            className={`
        fixed ${positionClasses[position]} z-40
        w-10 h-10 flex items-center justify-center
        text-emerald-600 dark:text-emerald-400
        transition-all
        opacity-70 hover:opacity-100 hover:-translate-y-1
        animate-fadeIn
      `}
            aria-label="العودة للأعلى"
        >
            <ArrowUp size={32} className="mx-auto drop-shadow-sm" strokeWidth={3} />
        </button>
    );
}
