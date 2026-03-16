'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, Bell, Sparkles, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { usePathname } from 'next/navigation';

export default function UrgencyBanner() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [bannerData, setBannerData] = useState<any>(null);

    useEffect(() => {
        async function fetchBanner() {
            if (!supabase) return;

            const { data } = await supabase
                .from('site_banners')
                .select('id, content, link_url, link_text, type')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            if (data) {
                const dismissedId = isLocalStorageAvailable() ? localStorage.getItem('dismissed_banner_id') : null;
                if (dismissedId === data.id.toString()) return;

                setBannerData(data);
                setIsVisible(true);
            }
        }

        fetchBanner();
    }, []);

    const isLocalStorageAvailable = () => typeof window !== 'undefined' && window.localStorage;

    if (pathname?.startsWith('/admin')) return null;

    const handleDismiss = () => {
        setIsExiting(true);
        if (bannerData?.id && isLocalStorageAvailable()) {
            localStorage.setItem('dismissed_banner_id', bannerData.id.toString());
        }
        setTimeout(() => setIsVisible(false), 300);
    };

    if (!isVisible || !bannerData) return null;

    const isAlert = bannerData.type === 'alert';
    const isWarning = bannerData.type === 'warning';

    const Icon = isAlert ? Bell : isWarning ? AlertTriangle : Info;
    const label = isAlert ? 'تنبيه هام' : isWarning ? 'تحذير' : 'معلومة';

    return (
        <div
            className={`relative z-[50] overflow-hidden shadow-lg font-cairo transition-all duration-300 ease-in-out ${
                isExiting ? 'max-h-0 opacity-0 py-0' : 'max-h-24 opacity-100'
            }`}
        >
            {/* Gradient background */}
            <div className={`absolute inset-0 ${
                isAlert
                    ? 'bg-gradient-to-l from-red-700 via-red-600 to-red-700'
                    : isWarning
                        ? 'bg-gradient-to-l from-amber-600 via-amber-500 to-amber-600'
                        : 'bg-gradient-to-l from-blue-700 via-blue-600 to-blue-700'
            }`} />

            {/* Animated stripe overlay for alerts */}
            {isAlert && (
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 20px)',
                        animation: 'stripe-move 1s linear infinite',
                    }}
                />
            )}

            <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {/* Icon — no pulse ring on mobile to save space */}
                    <span className="relative flex-shrink-0">
                        <span className={`absolute inset-0 rounded-full animate-ping opacity-30 hidden sm:block ${
                            isAlert ? 'bg-red-300' : isWarning ? 'bg-amber-300' : 'bg-blue-300'
                        }`} />
                        <span className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full">
                            <Icon size={14} className="text-white sm:w-4 sm:h-4" />
                        </span>
                    </span>

                    <div className="text-xs sm:text-sm text-white flex-1 min-w-0 line-clamp-2">
                        <span className="font-extrabold ml-1 text-white/95">{label}:</span>
                        <span className="font-medium"> {bannerData.content}</span>
                    </div>

                    {bannerData.link_url && (
                        <Link
                            href={bannerData.link_url}
                            className="hidden sm:flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors whitespace-nowrap shrink-0"
                        >
                            {bannerData.link_text || 'اقرأ المزيد'} <ArrowRight size={12} className="rotate-180" />
                        </Link>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-white/70 hover:text-white transition-colors p-1.5 sm:p-2 flex items-center justify-center hover:bg-white/10 rounded-full flex-shrink-0"
                    aria-label="إغلاق التنبيه"
                >
                    <X size={16} />
                </button>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes stripe-move {
                    from { background-position: 0 0; }
                    to { background-position: 28px 0; }
                }
            `}} />
        </div>
    );
}
