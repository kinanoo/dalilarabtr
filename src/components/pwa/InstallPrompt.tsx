'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isDoNotShow, setIsDoNotShow] = useState(false);

    useEffect(() => {
        // Check if user dismissed it previously
        if (localStorage.getItem('pwa_dismissed')) {
            setIsDoNotShow(true);
            return;
        }

        // Android / Desktop Chrome
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

        if (isIOS && !isStandalone) {
            // Show iOS prompt after a delay
            setTimeout(() => setShowIOSPrompt(true), 10000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setDeferredPrompt(null);
        setShowIOSPrompt(false);
        localStorage.setItem('pwa_dismissed', 'true');
    };

    // Android / Chrome Prompt
    if (deferredPrompt) {
        return (
            <div className="fixed bottom-4 left-4 right-4 z-[9999] flex justify-center pointer-events-none">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 w-full max-w-sm pointer-events-auto border border-slate-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                            <Download className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">تثبيت التطبيق</h3>
                            <p className="text-xs text-slate-400">وصول أسرع وتصفح بدون إنترنت</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDismiss} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <X size={18} />
                        </button>
                        <button
                            onClick={handleInstallClick}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                            تثبيت
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // iOS Prompt
    if (showIOSPrompt) {
        return (
            <div className="fixed bottom-4 left-4 right-4 z-[9999] flex justify-center pointer-events-none">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto border border-slate-200 dark:border-slate-800"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                <Share className="text-emerald-500" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">تثبيت على الآيفون</h3>
                                <p className="text-xs text-slate-500">لأفضل تجربة تصفح</p>
                            </div>
                        </div>
                        <button onClick={handleDismiss} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                    </div>

                    <div className="text-sm space-y-2 mb-2">
                        <p className="flex items-center gap-2">
                            1. اضغط على زر المشاركة <Share size={16} className="text-blue-500 inline" />
                        </p>
                        <p className="flex items-center gap-2">
                            2. اختر <strong>"إضافة إلى الصفحة الرئيسية"</strong>
                        </p>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 10 }}
                            className="h-full bg-emerald-500"
                            onAnimationComplete={() => setShowIOSPrompt(false)}
                        />
                    </div>
                </motion.div>
            </div>
        )
    }

    return null;
}
