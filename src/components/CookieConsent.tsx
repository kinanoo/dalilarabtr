'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/lib/consent';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (pathname.startsWith('/admin')) {
            setIsVisible(false);
            return;
        }

        setIsVisible(getAnalyticsConsent() === 'unknown');
    }, [pathname]);

    const choose = (choice: 'granted' | 'denied') => {
        setAnalyticsConsent(choice);
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-3 left-3 right-3 z-[9999] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:left-auto sm:right-4 sm:w-[410px]"
                    role="dialog"
                    aria-modal="true"
                    aria-label="إعدادات الخصوصية"
                >
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/40">
                            <Cookie className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">خصوصيتك أولاً</h3>
                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                نستخدم ملفات ضرورية لتشغيل الموقع. لن نفعّل أدوات قياس الزيارات إلا بعد موافقتك.{' '}
                                <Link href="/privacy#privacy-controls" className="font-bold text-emerald-700 underline dark:text-emerald-400">
                                    سياسة الخصوصية
                                </Link>
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => choose('granted')}
                                    className="min-h-11 bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                                >
                                    السماح بالتحليلات
                                </button>
                                <button
                                    type="button"
                                    onClick={() => choose('denied')}
                                    className="min-h-11 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    الضرورية فقط
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => choose('denied')}
                            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            aria-label="استخدام الملفات الضرورية فقط وإغلاق الرسالة"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
