'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'cookie_consent_accepted';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Don't show on admin pages
        if (pathname?.startsWith('/admin')) return;

        try {
            const accepted = localStorage.getItem(STORAGE_KEY);
            if (!accepted) {
                // Delay showing for better UX (let page load first)
                const timer = setTimeout(() => setIsVisible(true), 2000);
                return () => clearTimeout(timer);
            }
        } catch {
            // localStorage unavailable
        }
    }, [pathname]);

    const handleAccept = () => {
        try {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        } catch { /* ignore */ }
        setIsVisible(false);
    };

    const handleDismiss = () => {
        // Dismiss but don't save — will show again next visit
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] z-[9999]
                               bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                               rounded-2xl shadow-2xl p-5"
                    role="dialog"
                    aria-label="موافقة على الكوكيز"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-full">
                            <Cookie className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                                نستخدم ملفات تعريف الارتباط
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                نستخدم الكوكيز وأدوات التحليل لتحسين تجربتك. لا نجمع بيانات شخصية.
                                اطّلع على{' '}
                                <a href="/privacy" className="text-emerald-600 dark:text-emerald-400 underline hover:no-underline">
                                    سياسة الخصوصية
                                </a>
                            </p>

                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={handleAccept}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold
                                               px-4 py-2 rounded-lg transition-colors"
                                >
                                    موافق
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                                               px-3 py-2 transition-colors"
                                >
                                    لاحقاً
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 min-w-11 min-h-11 flex items-center justify-center"
                            aria-label="إغلاق"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
