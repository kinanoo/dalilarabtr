'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface TickerItem {
    id: string;
    text: string;
    link?: string;
}

export default function NewsTicker() {
    const [items, setItems] = useState<TickerItem[]>([]);
    const trackRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(20);
    const [isPaused, setIsPaused] = useState(false);

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

    // Fast speed
    useEffect(() => {
        if (!trackRef.current || items.length === 0) return;
        const t = setTimeout(() => {
            if (!trackRef.current) return;
            const width = trackRef.current.scrollWidth / 2;
            setDuration(Math.max(8, width / 220));
        }, 100);
        return () => clearTimeout(t);
    }, [items]);

    if (items.length === 0) return null;

    return (
        <div
            className="relative overflow-hidden text-[11px] sm:text-xs font-medium select-none"
            dir="rtl"
            role="marquee"
            aria-label="شريط الأخبار"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-[#0f1d35] to-slate-900" />

            <div className="relative flex items-center h-[28px] sm:h-[30px]">
                {/* Scrolling track — full width, no badge */}
                <div className="flex-1 overflow-hidden">
                    <div
                        ref={trackRef}
                        className="flex items-center whitespace-nowrap will-change-transform"
                        style={{
                            animation: `ticker-scroll ${duration}s linear infinite`,
                            animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                    >
                        {[...items, ...items].map((item, i) => (
                            <span key={`${item.id}-${i}`} className="inline-flex items-center">
                                {item.link ? (
                                    <Link
                                        href={item.link}
                                        className="text-slate-300 hover:text-emerald-300 transition-colors px-3"
                                    >
                                        {item.text}
                                    </Link>
                                ) : (
                                    <span className="text-slate-300 px-3">{item.text}</span>
                                )}
                                <span className="text-emerald-600/50 text-[8px]" aria-hidden="true">●</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Edge fades */}
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0f1d35] to-transparent z-[5]" />
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-900 to-transparent z-[5]" />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes ticker-scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(50%); }
                }
            `}} />
        </div>
    );
}
