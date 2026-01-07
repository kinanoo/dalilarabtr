'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI to notify the user they can add to home screen
            setShow(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Hide the app provided install promotion
        setShow(false);

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:bottom-8 md:right-8 animate-in slide-in-from-bottom duration-500">
            <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-slate-700 max-w-sm ml-auto">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-xl">
                        <Download size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">تثبيت التطبيق</h3>
                        <p className="text-xs text-slate-300">أضف الدليل لشاشتك الرئيسية</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShow(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition"
                    >
                        <X size={18} />
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition"
                    >
                        تثبيت
                    </button>
                </div>
            </div>
        </div>
    );
}
