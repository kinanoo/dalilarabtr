'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    trigger?: 'hover' | 'click';
    delay?: number;
    arrow?: boolean;
    className?: string;
}

export default function Tooltip({
    content,
    children,
    position = 'top',
    trigger = 'hover',
    delay = 200,
    arrow = true,
    className = '',
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [actualPosition, setActualPosition] = useState(position);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Auto-position tooltip to avoid screen edges
    useEffect(() => {
        if (isVisible && tooltipRef.current && triggerRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const triggerRect = triggerRef.current.getBoundingClientRect();

            // Check if tooltip goes off screen and adjust position
            if (position === 'top' && tooltipRect.top < 0) {
                setActualPosition('bottom');
            } else if (position === 'bottom' && tooltipRect.bottom > window.innerHeight) {
                setActualPosition('top');
            } else if (position === 'left' && tooltipRect.left < 0) {
                setActualPosition('right');
            } else if (position === 'right' && tooltipRect.right > window.innerWidth) {
                setActualPosition('left');
            } else {
                setActualPosition(position);
            }
        }
    }, [isVisible, position]);

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    const toggleTooltip = () => {
        if (isVisible) {
            hideTooltip();
        } else {
            setIsVisible(true);
        }
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-700',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-700',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-slate-700',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-slate-700',
    };

    return (
        <div className="relative inline-block">
            <div
                ref={triggerRef}
                onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
                onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
                onClick={trigger === 'click' ? toggleTooltip : undefined}
            >
                {children}
            </div>

            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`
            absolute  z-50
            ${positionClasses[actualPosition]}
            px-3 py-2
            bg-slate-800 dark:bg-slate-700
            text-white text-sm
            rounded-lg shadow-lg
            whitespace-nowrap
            animate-fadeIn
            ${className}
          `}
                    role="tooltip"
                >
                    {content}

                    {arrow && (
                        <div
                            className={`
                absolute w-0 h-0
                border-4 border-transparent
                ${arrowClasses[actualPosition]}
              `}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
