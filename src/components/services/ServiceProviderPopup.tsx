'use client';

import { useState, useEffect } from 'react';
import { X, Megaphone, ArrowRight } from 'lucide-react'; // Changed from 'Bullhorn' to 'Megaphone' as widely supported
import { SITE_CONFIG } from '@/lib/config';

export default function ServiceProviderPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Show popup after 15 seconds
        const timer = setTimeout(() => {
            // Check if previously dismissed in this session? 
            // User requested "Timed popup". Let's show it every visit for now, but respect 'dismissed' state in local component.
            setIsVisible(true);
        }, 15000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible || isDismissed) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-full animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md border border-emerald-500/30 p-5 rounded-2xl shadow-2xl relative overflow-hidden group">

                {/* Glow Effect */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all"></div>

                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute top-3 left-3 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0 mt-1">
                        <Megaphone size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg leading-tight mb-2">
                            هل تقدم خدمة؟
                        </h3>
                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                            هل تريد الوصول لآلاف العملاء في تركيا؟ انضم إلينا الآن.
                        </p>
                        <a
                            href={`https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent('مرحباً، أرغب في الانضمام كمزود خدمة في دليل العرب.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
                        >
                            <span>تواصل معنا</span>
                            <ArrowRight size={14} className="rtl:rotate-180" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
