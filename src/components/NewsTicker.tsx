'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Newspaper } from 'lucide-react';

interface TickerItem {
    id: string;
    text: string;
    link?: string;
}

export default function NewsTicker() {
    const pathname = usePathname();
    const [items, setItems] = useState<TickerItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [overflow, setOverflow] = useState(0);
    const textRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchTicker() {
            if (!supabase) return;
            const { data } = await supabase
                .from('news_ticker')
                .select('id, text, link')
                .eq('is_active', true)
                .order('priority', { ascending: true });

            if (data && data.length > 0) setItems(data);
        }
        fetchTicker();
    }, []);

    // Measure overflow after each index change
    const measure = useCallback(() => {
        if (textRef.current && containerRef.current) {
            const diff = textRef.current.scrollWidth - containerRef.current.clientWidth;
            setOverflow(diff > 0 ? diff : 0);
        }
    }, []);

    useEffect(() => {
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [currentIndex, items, measure]);

    // Rotate news every 5s (or 8s for long overflowing text)
    useEffect(() => {
        if (items.length <= 1) return;
        const delay = overflow > 0 ? 8000 : 5000;

        const timer = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % items.length);
                setIsVisible(true);
            }, 300);
        }, delay);

        return () => clearInterval(timer);
    }, [items.length, overflow]);

    if (pathname !== '/' || items.length === 0) return null;

    const current = items[currentIndex];

    return (
        <div className="bg-[#1a2744] text-white/90 overflow-hidden text-[11px] sm:text-xs" dir="rtl">
            <div className="flex items-center gap-2 px-3 py-1.5 max-w-7xl mx-auto">
                <Newspaper size={11} className="text-emerald-400 flex-shrink-0" />

                <div ref={containerRef} className="flex-1 min-w-0 overflow-hidden">
                    <div
                        className={`whitespace-nowrap transition-opacity duration-300 ${
                            isVisible ? 'opacity-100' : 'opacity-0'
                        } ${overflow > 0 ? '' : 'text-center'}`}
                        style={overflow > 0 ? {
                            animation: `ticker-pan 6s ease-in-out infinite alternate`,
                        } as React.CSSProperties : undefined}
                    >
                        <span ref={textRef}>
                            {current.link ? (
                                <Link
                                    href={current.link}
                                    className="hover:text-emerald-300 hover:underline underline-offset-2 transition-colors"
                                >
                                    {current.text}
                                </Link>
                            ) : (
                                current.text
                            )}
                        </span>
                    </div>
                </div>

                {items.length > 1 && (
                    <span className="text-[9px] text-white/40 flex-shrink-0 tabular-nums">
                        {currentIndex + 1}/{items.length}
                    </span>
                )}
            </div>

            {overflow > 0 && (
                <style jsx>{`
                    @keyframes ticker-pan {
                        0%, 15%  { transform: translateX(0); }
                        85%, 100% { transform: translateX(${overflow}px); }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        div { animation: none !important; }
                    }
                `}</style>
            )}
        </div>
    );
}
