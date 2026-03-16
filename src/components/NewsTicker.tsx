'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Rss } from 'lucide-react';

interface TickerItem {
    id: string;
    text: string;
    link?: string;
}

export default function NewsTicker() {
    const [items, setItems] = useState<TickerItem[]>([]);
    const trackRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(30);
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

    // Calculate speed based on content width
    useEffect(() => {
        if (!trackRef.current || items.length === 0) return;
        const t = setTimeout(() => {
            if (!trackRef.current) return;
            const width = trackRef.current.scrollWidth / 2;
            setDuration(Math.max(12, width / 140));
        }, 100);
        return () => clearTimeout(t);
    }, [items]);

    if (items.length === 0) return null;

    return (
        <div
            className="relative overflow-hidden text-xs sm:text-sm font-medium select-none"
            dir="rtl"
            role="marquee"
            aria-label="شريط الأخبار"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-[#0f1d35] to-slate-900" />

            <div className="relative flex items-center min-h-[36px] sm:min-h-[40px]">
                {/* Badge — right side */}
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1 bg-emerald-600 text-white text-[11px] sm:text-xs font-bold z-10 h-full">
                    <Rss size={13} className="opacity-80" />
                    <span>آخر الأخبار</span>
                </div>

                {/* Edge fade — right side */}
                <div className="absolute right-[85px] sm:right-[100px] top-0 bottom-0 w-6 bg-gradient-to-l from-[#0f1d35] to-transparent z-[5]" />

                {/* Scrolling track */}
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
                                        className="text-slate-200 hover:text-emerald-300 transition-colors px-4 py-1"
                                    >
                                        {item.text}
                                    </Link>
                                ) : (
                                    <span className="text-slate-200 px-4 py-1">{item.text}</span>
                                )}
                                <span className="text-emerald-500/40 mx-1" aria-hidden="true">◆</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Edge fade — left side */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-[5]" />
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
