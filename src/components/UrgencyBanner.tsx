'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ArrowRight, Bell, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { usePathname } from 'next/navigation';

export default function UrgencyBanner() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [bannerData, setBannerData] = useState<any>(null);

    useEffect(() => {
        async function fetchBanner() {
            if (!supabase) return;

            // Fetch active Banner from dedicated table
            const { data } = await supabase
                .from('site_banners')
                .select('*')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            if (data) {
                // Check dismissal (using ID persistence)
                const dismissedId = isLocalStorageAvailable() ? localStorage.getItem('dismissed_banner_id') : null;
                if (dismissedId === data.id.toString()) return;

                setBannerData(data);
                setIsVisible(true);
            }
        }

        fetchBanner();
    }, []);

    // Helper for safe localStorage
    const isLocalStorageAvailable = () => typeof window !== 'undefined' && window.localStorage;

    if (pathname?.startsWith('/admin')) return null;

    const handleDismiss = () => {
        setIsVisible(false);
        if (bannerData?.id && isLocalStorageAvailable()) {
            localStorage.setItem('dismissed_banner_id', bannerData.id.toString());
        }
    };

    // Auto-hide after 10 seconds (Visual only, persists on refresh unless manually dismissed)
    useEffect(() => {
        if (isVisible && bannerData) {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, bannerData]);

    if (!isVisible || !bannerData) return null;

    const isAlert = bannerData.type === 'alert';
    const isWarning = bannerData.type === 'warning';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`${isAlert ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-blue-600'} text-white relative z-50 overflow-hidden shadow-lg font-cairo`}
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3 flex-1">
                        <span className="bg-white/20 p-1.5 rounded-full animate-pulse shrink-0">
                            {isAlert ? <Bell size={16} /> : <Sparkles size={16} />}
                        </span>
                        <div className="text-sm font-medium flex-1">
                            <span className="font-bold ml-1">
                                {isAlert ? 'تنبيه هام:' : isWarning ? 'تحذير:' : 'معلومة:'}
                            </span>
                            {bannerData.content.length > 90 ? bannerData.content.slice(0, 90) + '...' : bannerData.content}
                        </div>

                        {bannerData.link_url && (
                            <Link
                                href={bannerData.link_url}
                                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                            >
                                {bannerData.link_text || 'اقرأ المزيد'} <ArrowRight size={12} className="rotate-180" />
                            </Link>
                        )}
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                        aria-label="إغلاق التنبيه"
                    >
                        <X size={18} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
