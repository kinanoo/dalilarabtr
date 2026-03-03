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
    const [panOffset, setPanOffset] = useState(0);
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
            setPanOffset(0);
        }
    }, []);

    useEffect(() => {
        // Delay measure to ensure text is rendered
        const t = setTimeout(measure, 50);
        window.addEventListener('resize', measure);
        return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
    }, [currentIndex, items, measure]);

    // Pan back and forth for overflowing text
    useEffect(() => {
        if (overflow <= 0) return;
        const timer = setInterval(() => {
            setPanOffset(prev => prev === 0 ? overflow : 0);
        }, 3000);
        return () => clearInterval(timer);
    }, [overflow]);

    // Rotate news
    useEffect(() => {
        if (items.length <= 1) return;
        const delay = overflow > 0 ? 9000 : 5000;

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
                        className={`whitespace-nowrap ${overflow > 0 ? '' : 'text-center'}`}
                        style={{
                            transform: `translateX(${panOffset}px)`,
                            transition: panOffset > 0 ? 'transform 2.5s ease-in-out' : 'transform 2.5s ease-in-out',
                            opacity: isVisible ? 1 : 0,
                        }}
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
        </div>
    );
}
