'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Radio } from 'lucide-react';

interface TickerItem {
    id: string;
    text: string;
    link?: string;
}

export default function NewsTicker() {
    const [items, setItems] = useState<TickerItem[]>([]);
    const trackRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(30);

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
            setDuration(Math.max(8, width / 180));
        }, 100);
        return () => clearTimeout(t);
    }, [items]);

    if (items.length === 0) return null;

    return (
        <div
            className="relative overflow-hidden text-xs sm:text-sm font-medium"
            dir="rtl"
            role="marquee"
            aria-label="شريط الأخبار"
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-[#1a2744] to-slate-900" />

            <div className="relative flex items-center min-h-[38px] sm:min-h-[42px]">
                {/* Live badge — fixed on right */}
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1 bg-red-600 text-white text-[11px] sm:text-xs font-bold z-10 h-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-100" />
                    </span>
                    <Radio size={13} className="hidden sm:block" />
                    <span>عاجل</span>
                </div>

                {/* Edge fade — right side */}
                <div className="absolute right-[72px] sm:right-[88px] top-0 bottom-0 w-8 bg-gradient-to-l from-[#1a2744] to-transparent z-[5]" />

                {/* Scrolling track */}
                <div className="flex-1 overflow-hidden">
                    <div
                        ref={trackRef}
                        className="flex items-center whitespace-nowrap will-change-transform"
                        style={{
                            animation: `ticker-scroll ${duration}s linear infinite`,
                        }}
                    >
                        {[...items, ...items].map((item, i) => (
                            <span key={`${item.id}-${i}`} className="inline-flex items-center">
                                {item.link ? (
                                    <Link
                                        href={item.link}
                                        className="text-slate-100 hover:text-emerald-300 transition-colors px-4 py-1"
                                    >
                                        {item.text}
                                    </Link>
                                ) : (
                                    <span className="text-slate-100 px-4 py-1">{item.text}</span>
                                )}
                                <span className="text-emerald-500/50 mx-1" aria-hidden="true">|</span>
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
