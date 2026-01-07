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

            // Calculate date 3 days ago
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const dateStr = threeDaysAgo.toISOString().split('T')[0];

            // Fetch active Alerts or Features
            const { data } = await supabase
                .from('updates')
                .select('*')
                .eq('active', true)
                .in('type', ['alert', 'feature'])
                .gte('date', dateStr) // Only recent
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                // Check dismissal
                const dismissedId = isLocalStorageAvailable() ? localStorage.getItem('dismissed_alert_id') : null;
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
            localStorage.setItem('dismissed_alert_id', bannerData.id.toString());
        }
    };

    if (!isVisible || !bannerData) return null;

    const isFeature = bannerData.type === 'feature';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`${isFeature ? 'bg-indigo-600' : 'bg-red-600'} text-white relative z-50 overflow-hidden shadow-lg font-cairo`}
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3 flex-1">
                        <span className="bg-white/20 p-1.5 rounded-full animate-pulse shrink-0">
                            {isFeature ? <Sparkles size={16} /> : <Bell size={16} />}
                        </span>
                        <div className="text-sm font-medium">
                            <span className="font-bold ml-1">{isFeature ? 'ميزة جديدة:' : 'تنبيه:'}</span>
                            {bannerData.title}
                            <span className="hidden md:inline mx-1">- {bannerData.content.substring(0, 50)}...</span>

                            <Link href={bannerData.link || '/updates'} className="underline decoration-white/50 hover:decoration-white ml-2 inline-flex items-center gap-1 group">
                                التفاصيل
                                <ArrowRight size={14} className="group-hover:-translate-x-1 transition-transform" />
                            </Link>
                        </div>
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
