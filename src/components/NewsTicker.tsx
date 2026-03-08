'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface TickerItem {
    id: string;
    text: string;
    link?: string;
}

export default function NewsTicker() {
    const pathname = usePathname();
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
            const width = trackRef.current.scrollWidth / 2; // half because content is doubled
            setDuration(Math.max(8, width / 120)); // ~120px/sec
        }, 100);
        return () => clearTimeout(t);
    }, [items]);

    if (pathname !== '/') return null;

    return (
        <div className="bg-[#1a2744] text-white/90 overflow-hidden text-[11px] sm:text-xs min-h-[28px] flex items-center" dir="rtl">
            {items.length > 0 && (
                <div className="relative w-full overflow-hidden">
                    <div
                        ref={trackRef}
                        className="flex items-center whitespace-nowrap will-change-transform"
                        style={{
                            animation: `ticker-scroll ${duration}s linear infinite`,
                        }}
                    >
                        {/* Render items twice for seamless loop */}
                        {[...items, ...items].map((item, i) => (
                            <span key={`${item.id}-${i}`} className="inline-flex items-center">
                                {item.link ? (
                                    <Link
                                        href={item.link}
                                        className="hover:text-emerald-300 transition-colors px-4"
                                    >
                                        {item.text}
                                    </Link>
                                ) : (
                                    <span className="px-4">{item.text}</span>
                                )}
                                <span className="text-emerald-500/60 text-[8px]" aria-hidden="true">&#9670;</span>
                            </span>
                        ))}
                    </div>
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes ticker-scroll {
                            from { transform: translateX(0); }
                            to { transform: translateX(50%); }
                        }
                    `}} />
                </div>
            )}
        </div>
    );
}
