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
        'bottom-right': 'bottom-20 right-4 md:bottom-8 md:right-8',
        'bottom-left': 'bottom-20 left-4 md:bottom-8 md:left-8',
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={scrollToTop}
            className={`
        fixed ${positionClasses[position]} z-40
        w-12 h-12
        bg-emerald-600 hover:bg-emerald-700
        text-white
        rounded-full
        shadow-lg hover:shadow-xl
        transition-all
        btn-hover-lift
        animate-fadeIn
      `}
            aria-label="العودة للأعلى"
        >
            <ArrowUp size={24} className="mx-auto" />
        </button>
    );
}
