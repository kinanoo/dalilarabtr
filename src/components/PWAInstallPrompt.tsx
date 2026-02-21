'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isStandalone, setIsStandalone] = useState(true); // Default strictly true until checked

    useEffect(() => {
        // 1. Check if we're already installed (standalone mode)
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        setIsStandalone(checkStandalone);

        if (checkStandalone) return;

        // 2. Enforce 3-day wait period
        try {
            const lastPromptTime = localStorage.getItem('daleel_pwa_last_prompt');
            if (lastPromptTime) {
                const timeSinceLastPrompt = Date.now() - parseInt(lastPromptTime, 10);
                if (timeSinceLastPrompt < 3 * 24 * 60 * 60 * 1000) {
                    return; // 3 days haven't passed yet
                }
            }
        } catch (e) {
            // ignore localStorage errors (e.g., incognito mode)
        }

        // 3. Android / Desktop Support (listen for 'beforeinstallprompt')
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowInstallBanner(true);

            // Record that we showed the prompt today
            try {
                localStorage.setItem('daleel_pwa_last_prompt', Date.now().toString());
            } catch (e) { }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Hide banner if user installs it manually during the session
        window.addEventListener('appinstalled', () => {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    if (isStandalone || !showInstallBanner) return null;

    return (
        <AnimatePresence>
            {showInstallBanner && (
                <motion.div
                    initial={{ y: 150, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 150, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[9999] bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-4 flex flex-col gap-3"
                >
                    <button
                        onClick={() => setShowInstallBanner(false)}
                        className="absolute top-2 left-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 shrink-0 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600">
                            <Download size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">أضف التطبيق لهاتفك</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                ثبت دليل العرب للوصول السريع و تجربة أسرع بدون الحاجة للمتصفح.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleInstallClick}
                        className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                    >
                        تثبيت التطبيق مجاناً
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
