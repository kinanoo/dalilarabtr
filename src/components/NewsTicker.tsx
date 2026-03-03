'use client';

import { useEffect, useState, useRef } from 'react';
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
    const textRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<Animation | null>(null);

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

    // Animate overflowing text using Web Animations API
    useEffect(() => {
        if (animRef.current) { animRef.current.cancel(); animRef.current = null; }

        const measure = () => {
            const text = textRef.current;
            const container = containerRef.current;
            if (!text || !container) return;

            const diff = text.scrollWidth - container.clientWidth;
            if (diff <= 0) return;

            animRef.current = text.animate(
                [
                    { transform: 'translateX(0)' },
                    { transform: `translateX(${diff}px)` },
                ],
                {
                    duration: Math.max(5000, diff * 40),
                    easing: 'ease-in-out',
                    direction: 'alternate',
                    iterations: Infinity,
                    delay: 800,
                }
            );
        };

        // Delay to ensure text is rendered
        const t = setTimeout(measure, 100);
        return () => { clearTimeout(t); animRef.current?.cancel(); };
    }, [currentIndex, items]);

    // Rotate news
    useEffect(() => {
        if (items.length <= 1) return;

        const timer = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % items.length);
                setIsVisible(true);
            }, 300);
        }, 7000);

        return () => clearInterval(timer);
    }, [items.length]);

    if (pathname !== '/' || items.length === 0) return null;

    const current = items[currentIndex];

    return (
        <div className="bg-[#1a2744] text-white/90 overflow-hidden text-[11px] sm:text-xs" dir="rtl">
            <div className="flex items-center gap-2 px-3 py-1.5 max-w-7xl mx-auto">
                <Newspaper size={11} className="text-emerald-400 flex-shrink-0" />

                <div ref={containerRef} className="flex-1 min-w-0 overflow-hidden">
                    <div
                        className="whitespace-nowrap text-center"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transition: 'opacity 0.3s',
                        }}
                    >
                        <span ref={textRef} className="inline-block">
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
