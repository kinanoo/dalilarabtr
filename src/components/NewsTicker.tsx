'use client';

import { useEffect, useState } from 'react';
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

    // Only show on homepage
    if (pathname !== '/' || items.length === 0) return null;

    // Build the ticker text — duplicate for seamless loop
    const renderItems = (key: string) => (
        <span key={key} className="inline-flex items-center gap-6 px-6 whitespace-nowrap">
            {items.map((item, i) => (
                <span key={`${key}-${item.id}`} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-blue-300/50 mx-2">◆</span>}
                    {item.link ? (
                        <Link
                            href={item.link}
                            className="hover:text-emerald-300 hover:underline underline-offset-2 transition-colors relative z-20"
                        >
                            {item.text}
                        </Link>
                    ) : (
                        <span>{item.text}</span>
                    )}
                </span>
            ))}
        </span>
    );

    return (
        <div className="bg-[#1a2744] text-white/90 overflow-hidden relative text-[11px] sm:text-xs" dir="rtl">
            {/* Leading icon */}
            <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center px-2.5 bg-gradient-to-l from-[#1a2744] via-[#1a2744] to-transparent pointer-events-none">
                <Newspaper size={12} className="text-emerald-400" />
            </div>

            {/* Scrolling content */}
            <div className="ticker-container py-1.5 pr-8">
                <div className="ticker-content inline-flex">
                    {renderItems('a')}
                    {renderItems('b')}
                </div>
            </div>

            {/* Left fade */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#1a2744] to-transparent z-10 pointer-events-none" />

            <style jsx>{`
                .ticker-container {
                    width: 100%;
                    overflow: hidden;
                }
                .ticker-content {
                    animation: ticker 35s linear infinite;
                    will-change: transform;
                }
                @keyframes ticker {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(50%);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .ticker-content { animation: none; }
                }
            `}</style>
        </div>
    );
}
