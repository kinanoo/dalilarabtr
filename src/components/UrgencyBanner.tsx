'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, Bell, Megaphone, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabaseLazy';
import { usePathname } from 'next/navigation';

// Which storage remembers a dismissal.
//  • alert / info / warning = "read it once" news → permanent dismiss
//    (localStorage): once you've seen it, it stays gone.
//  • sponsor = PAID reach → the advertiser should recur, so its dismiss is
//    scoped to the CURRENT session (sessionStorage): it comes back on the
//    visitor's next visit instead of vanishing forever after a single ✕.
// Returns null when storage is unavailable (SSR / privacy mode) — caller
// then just shows the banner.
const dismissStore = (type?: string): Storage | null => {
    if (typeof window === 'undefined') return null;
    try {
        return type === 'sponsor' ? window.sessionStorage : window.localStorage;
    } catch {
        return null;
    }
};

export default function UrgencyBanner() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [bannerData, setBannerData] = useState<any>(null);

    useEffect(() => {
        async function fetchBanner() {
            // Lazy client — this banner mounts inside the fixed header on
            // every page; a static supabase import here was first-load weight.
            const supabase = await getSupabase();
            if (!supabase) return;

            const { data } = await supabase
                .from('site_banners')
                .select('id, content, link_url, link_text, type')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            if (data) {
                // Sponsor (paid) banners are NEVER dismissible — they always
                // show while active so the advertiser can rely on the placement
                // (the owner hides it by toggling it off in the panel). Only the
                // read-once alert/info/warning types honor a per-visitor dismiss.
                if (data.type !== 'sponsor') {
                    const store = dismissStore(data.type);
                    const dismissedId = store ? store.getItem('dismissed_banner_id') : null;
                    if (dismissedId === data.id.toString()) return;
                }
                setBannerData(data);
                setIsVisible(true);
            }
        }

        fetchBanner();
    }, []);

    if (pathname?.startsWith('/admin')) return null;

    const handleDismiss = () => {
        setIsExiting(true);
        const store = dismissStore(bannerData?.type);
        if (bannerData?.id && store) {
            store.setItem('dismissed_banner_id', bannerData.id.toString());
        }
        setTimeout(() => setIsVisible(false), 300);
    };

    if (!isVisible || !bannerData) return null;

    const isAlert = bannerData.type === 'alert';
    const isWarning = bannerData.type === 'warning';
    const isSponsor = bannerData.type === 'sponsor';

    const Icon = isSponsor ? Megaphone : isAlert ? Bell : isWarning ? AlertTriangle : Info;
    const label = isSponsor ? 'برعاية' : isAlert ? 'تنبيه هام' : isWarning ? 'تحذير' : 'معلومة';

    return (
        <div
            className={`relative z-[50] overflow-hidden shadow-lg font-cairo transition-all duration-300 ease-in-out ${
                isExiting ? 'max-h-0 opacity-0 py-0' : 'max-h-24 opacity-100'
            }`}
        >
            {/* Gradient background */}
            <div className={`absolute inset-0 ${
                isSponsor
                    ? 'bg-gradient-to-l from-[#3f4a22] via-[#5b6b30] to-[#2f3817]'
                    : isAlert
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
                            isSponsor ? 'bg-amber-300' : isAlert ? 'bg-red-300' : isWarning ? 'bg-amber-300' : 'bg-blue-300'
                        }`} />
                        <span className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${isSponsor ? 'bg-[#2f3817]/70 ring-1 ring-amber-300/60' : 'bg-white/20'}`}>
                            <Icon size={14} className={`sm:w-4 sm:h-4 ${isSponsor ? 'text-amber-300' : 'text-white'}`} />
                        </span>
                    </span>

                    <div className="text-xs sm:text-sm text-white flex-1 min-w-0 line-clamp-2">
                        <span className="font-extrabold ml-1 text-white/95">{label}:</span>
                        <span className="font-medium"> {bannerData.content}</span>
                    </div>

                    {bannerData.link_url && (
                        <Link
                            href={bannerData.link_url}
                            className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black transition-colors whitespace-nowrap shrink-0 ${isSponsor ? 'bg-gradient-to-l from-amber-300 to-yellow-500 text-[#2f3817] hover:from-amber-200 hover:to-yellow-400 shadow-sm' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                        >
                            {bannerData.link_text || 'اقرأ المزيد'} <ArrowRight size={12} className="rotate-180" />
                        </Link>
                    )}
                </div>

                {!isSponsor && (
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="text-white/70 hover:text-white transition-colors p-1.5 sm:p-2 flex items-center justify-center hover:bg-white/10 rounded-full flex-shrink-0"
                        aria-label="إغلاق التنبيه"
                    >
                        <X size={16} />
                    </button>
                )}
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
