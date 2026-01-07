'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SwipeHandlerProps {
    children: ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
}

export default function SwipeHandler({
    children,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
}: SwipeHandlerProps) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    };

    const handleSwipe = () => {
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);

        // Determine if horizontal or vertical swipe
        if (absDiffX > absDiffY && absDiffX > threshold) {
            // Horizontal swipe
            if (diffX > 0) {
                // Swipe right
                onSwipeRight?.();
                if ('vibrate' in navigator) navigator.vibrate(10);
            } else {
                // Swipe left
                onSwipeLeft?.();
                if ('vibrate' in navigator) navigator.vibrate(10);
            }
        } else if (absDiffY > absDiffX && absDiffY > threshold) {
            // Vertical swipe
            if (diffY > 0) {
                // Swipe down
                onSwipeDown?.();
                if ('vibrate' in navigator) navigator.vibrate(10);
            } else {
                // Swipe up
                onSwipeUp?.();
                if ('vibrate' in navigator) navigator.vibrate(10);
            }
        }
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="w-full h-full"
        >
            {children}
        </div>
    );
}
