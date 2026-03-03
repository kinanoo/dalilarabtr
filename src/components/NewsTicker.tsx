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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

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

    // Rotate news every 5 seconds with fade transition
    useEffect(() => {
        if (items.length <= 1) return;

        const timer = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % items.length);
                setIsVisible(true);
            }, 300);
        }, 5000);

        return () => clearInterval(timer);
    }, [items.length]);

    // Only show on homepage
    if (pathname !== '/' || items.length === 0) return null;

    const current = items[currentIndex];

    return (
        <div className="bg-[#1a2744] text-white/90 overflow-hidden relative text-[11px] sm:text-xs" dir="rtl">
            <div className="flex items-center gap-2 px-3 py-1.5 max-w-7xl mx-auto">
                {/* Icon */}
                <Newspaper size={12} className="text-emerald-400 flex-shrink-0" />

                {/* Current news item */}
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div
                        className={`transition-all duration-300 ease-in-out truncate ${
                            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                        }`}
                    >
                        {current.link ? (
                            <Link
                                href={current.link}
                                className="hover:text-emerald-300 hover:underline underline-offset-2 transition-colors"
                            >
                                {current.text}
                            </Link>
                        ) : (
                            <span>{current.text}</span>
                        )}
                    </div>
                </div>

                {/* Counter */}
                {items.length > 1 && (
                    <span className="text-[9px] text-white/40 flex-shrink-0 tabular-nums">
                        {currentIndex + 1}/{items.length}
                    </span>
                )}
            </div>
        </div>
    );
}
