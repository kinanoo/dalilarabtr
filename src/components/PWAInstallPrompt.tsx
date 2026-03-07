'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // Already installed — bail out
        if (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://')
        ) return;

        // Enforce dismissal policy
        try {
            const dismissedAt = localStorage.getItem('pwa_dismissed_at');
            const dismissCount = parseInt(localStorage.getItem('pwa_dismiss_count') || '0', 10);
            if (dismissedAt) {
                const elapsed = Date.now() - parseInt(dismissedAt, 10);
                const waitDays = dismissCount === 1 ? 3 : 5;
                if (elapsed < waitDays * 86_400_000) return;
            }
        } catch { /* ignore */ }

        let showTimer: ReturnType<typeof setTimeout>;
        let hideTimer: ReturnType<typeof setTimeout>;

        const handler = (e: Event) => {
            // Stash the event for later — no preventDefault() needed (Chrome 119+ removed mini-infobar)
            setDeferredPrompt(e);
            if (showTimer) clearTimeout(showTimer);

            showTimer = setTimeout(() => {
                setShowInstallBanner(true);
                hideTimer = setTimeout(() => setShowInstallBanner(false), 10_000);
            }, 60_000);
        };

        const onInstalled = () => {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', onInstalled);
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    const handleDismiss = useCallback(() => {
        setShowInstallBanner(false);
        try {
            const count = parseInt(localStorage.getItem('pwa_dismiss_count') || '0', 10);
            localStorage.setItem('pwa_dismissed_at', Date.now().toString());
            localStorage.setItem('pwa_dismiss_count', (count + 1).toString());
        } catch { /* ignore */ }
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setShowInstallBanner(false);
    }, [deferredPrompt]);

    if (!showInstallBanner) return null;

    return (
        <div
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[9999] bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-slideInUp"
        >
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="إغلاق"
                className="absolute top-1 left-1 p-2 min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
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
                type="button"
                onClick={handleInstall}
                className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
                تثبيت التطبيق مجاناً
            </button>
        </div>
    );
}
